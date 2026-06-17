# Knowledge Hub POC — closing CV gaps

> status: rejected in favor of Collaborative Docs, see [poc-domain-options.md](../poc-domain-options.md)

> A grounded, limited-scope POC. The goal is to **close technology gaps in the
> resume** in ~7 days, not to build the entire Uni.Verse ecosystem. We build an
> MVP version of MDX Core and one demo application on top of it: an interactive
> algorithm trainer (LeetCode-style). Down the line, MDX rendering is abstracted
> so that interactive elements can be used directly in the browser.

---

## 1. POC scope: what we do and do NOT do

**We do:**

- `mdx-engine` — an MVP version of the configurable MDX rendering core.
- One application on top of the core — an **interactive algorithm trainer**: a
  problem list, a problem page with the statement in MDX and an embedded code
  editor, progress, and analytics.
- The full set of technologies from the gap list (see §4), packaged into this
  single domain.

**We do NOT do (deliberately, to avoid scope creep):**

- A full-fledged KB/Confluence part — that's the goal of the architecture
  document, not the POC.
- A dual application (KB + LMS) in production. In the POC, the LMS lens is the
  only one.
- A real multi-user permission system. Basic RBAC for the auth demo is enough.

Important: don't confuse the POC codebase with the future ecosystem. From the
POC we reuse **patterns** (generic content schema, MF registry, MDX engine), not
the repository as-is.

---

## 2. MDX Core (MVP) — the foundation

`packages/mdx-engine` — an isolated package that can:

- Parse standard Markdown/MDX.
- Turn custom tags into interactive widgets: the main one for the POC is
  `<CodeTask />` (an algorithmic problem with an editor and test execution).
- Support **execution contexts**: `preview` (static block preview) and
  `interactive` (working widget). This lays the groundwork for context-dependent
  rendering, even though only `interactive` is actually used in the POC.

A minimal generic schema in D1 — universal from the start, so it doesn't need to
be rewritten later:

```sql
content_nodes (
  id          TEXT PRIMARY KEY,
  type        TEXT,        -- in the POC: 'problem', but the field exists from the start
  tags        TEXT,        -- JSON: difficulty, topic
  body_mdx    TEXT,
  ...
)
user_progress ( user_id, node_id, status, ... )
```

Even though `type` is always `problem` in the POC, the field and structure
themselves remain such that `lesson` / `note` will fit in tomorrow without an
architecture migration.

---

## 3. Algorithm trainer — the application on top of the core

A demo domain that gives the maximum amount of material for showcasing
Senior-level state management and performance skills:

- **Problem list** — server-side pagination and filtering (difficulty, topic) via
  TanStack Query + Zustand for UI filters.
- **Problem page** — the statement is rendered from MDX (RSC for instant LCP),
  the code editor is isolated in a client block with Suspense loading and/or
  extracted into a Remote MFE.
- **Test execution** — a Worker executes the solution, real-time logs are
  streamed via SSE.
- **Progress dashboard** — Chart.js: coverage by difficulty, distribution by
  topic, streaks.

### Outlook: browser-side abstraction

A key note for the future — **MDX interactive elements need to be abstracted so
that they can be mounted directly in the browser**, independent of the specific
application. That is, `<CodeTask />` and its runtime (editor + execution
sandbox) are designed as a self-contained browser component/remote, the same
one used both in the POC trainer and later in the Uni.Verse LMS. For now it's
enough to keep the boundary clean: the MDX engine doesn't know about the
specific application, and the widgets don't know about the specific execution
backend (it's injected through an interface).

---

## 4. Coverage of technology gaps (CV Gaps)

| Technology                   | Where and how it's closed in the POC                                                                                                                                                                                                                      |
| :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js App Router & RSC** | `app/(dashboard)/layout.tsx` structure. Problem statement pages are Server Components for instant TTFB/LCP; the code editor is isolated in a client block with Suspense.                                                                                  |
| **Module Federation**        | The code editor and analytics charts (Chart.js) are extracted into an independent Remote (Vite), offloading the host's content bundle. Configured via `@module-federation/nextjs-mf`. Laid down as an extensible registry, not a hardcoded single remote. |
| **TanStack Query**           | The backbone of the Data Layer: pagination and filtering of the problem list, lazy metadata fetching, cache invalidation on progress save, Optimistic Updates.                                                                                            |
| **Zustand**                  | UI state: filters (difficulty, tags), editor themes, local unsaved drafts, compiler state.                                                                                                                                                                |
| **SSE / Streaming**          | Server-Sent Events stream real-time logs of unit-test runs on a student's solution (and/or AI hint tokens) from a Cloudflare Worker.                                                                                                                      |
| **Security**                 | XSS sanitization of rendered MDX via `isomorphic-dompurify` (the critical case — rendering someone else's/a student's content), strict CSP in `next.config.js`, sessions on HttpOnly cookies via GitHub OAuth2.                                           |
| **OpenAPI / Swagger**        | The serverless API on Workers is documented via chanfana; a typed TS client is generated from the schema. Link to Swagger UI in the README.                                                                                                               |
| **CI/CD**                    | GitHub Actions: `lint → type-check → test → build`, auto-deploy of the frontend to Cloudflare Pages and the backend via `wrangler deploy`.                                                                                                                |

The infrastructure runs entirely on the free Cloudflare tier (Pages + Workers + D1 + KV).

---

## 5. Step-by-step 7-day plan for Claude Code

- **Day 1 — OpenAPI and the data layer (Workers + D1).** Initialize the pnpm
  monorepo. Describe API contracts. Generic tables (`content_nodes`,
  `user_progress`). Basic CRUD. Launch Swagger UI.
- **Day 2 — MDX Core MVP (`packages/mdx-engine`).** Isolated rendering package.
  Parsing standard tags + custom `<CodeTask />` with `preview` / `interactive`
  contexts. Clean boundary: the engine doesn't know about the application.
- **Day 3 — Next.js core (Host) & CI/CD.** App Router, shared Dashboard Layout,
  Tailwind. RSC for reading problem statements. GitHub Actions → Cloudflare
  Pages. Strict CSP headers.
- **Day 4 — Trainer + Module Federation.** Problem list, problem page.
  Extracting the code editor and the Chart.js dashboard into a Remote (Vite) via
  MF — as an extensible registry of remotes.
- **Day 5 — Data Layer (TanStack Query + Zustand).** TS client generation from
  OpenAPI. Server-side filtering/pagination of the list. Optimistic Updates when
  saving progress. Zustand for UI filters and compiler state.
- **Day 6 — SSE, GitHub OAuth2, and security.** SSE endpoint in the Worker for
  streaming test-run logs; stream handling on the frontend. OAuth2 + HttpOnly
  sessions. DOMPurify integration in the MDX renderer.
- **Day 7 — Senior-level README and release.** Architectural description,
  rationale for the Edge infrastructure, breakdown of the MF approach, links to
  Swagger UI and a live demo deployment.

---

## 6. Resume presentation (Senior Impact Statement)

**Architectural POC: Configurable MDX Engine & Interactive Algorithm Trainer (2026)**

Built a fault-tolerant real-time interactive learning platform on an Edge-native
architecture with a configurable MDX rendering core.

- **Configurable MDX Core:** Designed an isolated MDX rendering engine with
  execution contexts (preview / interactive) and abstracted interactive
  widgets, reusable across applications.
- **Robust Data Layer (TanStack Query & Zustand):** Implemented caching and
  server state synchronization for paginated problem lists and user progress,
  with Optimistic Updates and invalidation of dependent queries.
- **Edge-Native Serverless:** Deployed the backend on Cloudflare Workers + D1
  (SQLite), with automated test execution for student solutions on the Worker
  side.
- **Runtime Micro-frontends:** Extracted the code editor and analytics
  dashboards (Chart.js) into an isolated Remote via Module Federation, keeping
  the content pages' bundle minimal and Performance (LCP/FCP) high.
- **Real-time Streaming:** Implemented streaming of automated code-testing logs
  via Server-Sent Events with optimized stream handling in React.
- **Enterprise Security:** Protected rendering of third-party MDX content from
  XSS via DOMPurify and strict CSP, implemented HttpOnly sessions via GitHub
  OAuth2.
