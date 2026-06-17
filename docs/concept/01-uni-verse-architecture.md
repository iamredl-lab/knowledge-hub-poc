# Uni.Verse Knowledge Hub — Architectural Vision

> A product-architecture document. Describes the target system: a single content
> core on MDX, on top of which two functionally different applications operate —
> Knowledge Base (Confluence-style) and LMS (interactive learning). This is the "north"
> we're heading toward; the specific POC for boosting a CV is moved out into a separate document.

---

## 1. The main idea: one core, multiple lenses

The key architectural principle is **one content core, several lenses on top of it**.
There is physically one version of the data (MDX + metadata in Cloudflare D1), and Knowledge Base,
LMS, and the future RAG export are not copies of the data, but different ways of reading and
rendering it through a single API gateway.

Why this matters: if content exists in two copies (one in KB, another
copied into LMS), synchronization always turns into pain — webhooks, conflicts,
drift. With a single source, there's nothing to synchronize: LMS simply queries the
same D1 through the same OpenAPI client, just with a different content-type filter and a different
RBAC scope.

```
                    ┌──────────────────────────────┐
                    │       MDX Core (core)         │
                    │   MDX + metadata in D1/KV      │
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    │   API gateway + RBAC + types  │
                    └───┬───────────┬───────────┬──┘
                        │           │           │
              ┌─────────▼──┐  ┌─────▼─────┐  ┌──▼─────────┐
              │ Knowledge  │  │   LMS     │  │  RAG / AI  │
              │   Base     │  │ (courses, │  │  (export,  │
              │ (Confluence│  │ exercises)│  │  index)    │
              │  -style)   │  │           │  │            │
              └────────────┘  └───────────┘  └────────────┘
```

---

## 2. Conceptual foundations

### MDX-as-a-Service & RAG Ready

All documents — knowledge base, regulations, lecture materials — are stored in
Markdown/MDX format. This enables easy export for AI search (RAG) and for training/feeding
local LLM assistants: text naturally splits into semantic chunks by headings
(`##` / `###`), and metadata from the frontmatter (`type`, `course_id`, `tags`, `visibility`)
carries over onto each chunk.

### Context-dependent rendering (a configuration-based approach)

The shared content-management package renders the same MDX file differently
depending on the application:

- **Knowledge Base mode** — the document is available for editing and access-rights
  configuration, custom blocks are shown in preview mode.
- **LMS mode** — the same document turns into an interactive textbook: embedded
  blocks (`<CodeEditor />`, `<Quiz />`, `<CodeTask />`) become working
  widgets with the ability to complete tasks (LeetCode-style).

This is exactly analogous to package configuration at build time: the same content
under a different application configuration gets access to a different set of features.

### Instant edge synchronization

Thanks to the single distributed Cloudflare D1 database and a KV caching layer, any changes
made by an instructor in the KB module are instantly available to students in LMS — without rebuilds and
background parsing. An SSE channel additionally pushes a "content changed" event, and
TanStack Query pulls in the fresh version via `invalidateQueries` into the open
course player.

---

## 3. Monorepo structure

End-to-end typing and maximum DX via a pnpm workspace:

```
apps/
  ├── kb/             # Host App (Next.js App Router)
  │                   #   knowledge base management, workspaces, access rights
  └── lms/            # Second application (or Remote MFE)
                      #   interactive learning, student progress
packages/
  ├── mdx-engine/     # Shared MDX parser. Knows how to turn the tag
  │                   #   <CodeEditor /> into an interactive widget
  └── api-contracts/  # Data schemas and end-to-end contracts
                      #   (workspace fields, lectures, algorithmic problems)
```

Principle: everything reused between `kb` and `lms` lives in `packages/`. The
applications themselves are thin app-shells that configure which capabilities they
mount.

### Generic content schema (important from the very start)

The content table in D1 is designed to be **universal**, not "tailored" to a single
type of material:

```sql
content_nodes (
  id          TEXT PRIMARY KEY,
  type        TEXT,        -- note | doc | lesson | problem | ...
  course_id   TEXT,        -- nullable
  tags        TEXT,        -- JSON
  visibility  TEXT,        -- rbac scope
  body_mdx    TEXT,
  ...
)
```

Both a university note, an algorithmic problem, and a future lesson fit into the same
model — only the `type` differs. Then extending the system means adding new
`type` values and UI on top of the existing API, rather than rewriting the backend.

---

## 4. Runtime architecture and Data Layer

A diagram of component interaction, state distribution (server / client), and
microfrontend integration on the Cloudflare edge platform:

```
[ Cloudflare Pages: Next.js App Router (Host App) ]
       │
       ├──► [ Module Federation (Runtime) ] ──► [ Vite + Chart.js (Remote App) ]
       │
       ├──► Zustand (UI State: Sidebar, Editor Themes, Local Drafts)
       │
       └──► TanStack Query (Server State)
                 │
                 ├── (REST / OpenAPI) ──► [ Cloudflare Workers (Serverless Auth & CRUD) ]
                 └── (SSE / Streaming) ◄── [ Server-Sent Events (AI Suggestions / Test Logs) ]
```

### Module Federation as a capability registry

Module Federation is designed not as "one Host loads one Remote editor," but as an
extensible **registry of reusable remotes**:

- Markdown/MDX Editor
- Code Judge / Sandbox
- Quiz Widget
- Analytics Dashboard (Chart.js)
- Course Player

Each app-shell has its own manifest of which remotes it mounts. The KB shell doesn't load
Code Judge; the LMS shell loads everything. This is exactly "a package with access to features under a
specific configuration." Even though right now only one remote is actually needed, the registration
mechanism itself (remotes manifest + mounting condition) is laid out as extensible from
the very start — it's a few lines of difference in the MF config, but it saves rewriting the
architecture later.

### Graceful degradation for custom MDX blocks

Content in MDX contains declarative blocks (`<CodeTask />`, `<Quiz />`). Where a
remote is available, they render as an interactive widget; where it's not available (e.g.,
in KB preview mode or in a RAG export) — they degrade to plain text or a
link. A classic headless-CMS pattern with custom blocks.

---

## 5. Technology stack and why it's here

| Technology                   | Role in the system                                                                                                                                                                                                           |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js App Router & RSC** | The frontend core. Lecture and document pages render as Server Components for instant TTFB/LCP; interactive editors are isolated into client blocks with Suspense loading.                                                   |
| **Module Federation**        | Heavy elements (Chart.js charts, code sandbox) are extracted into independent remotes, offloading the host's content bundle. Configured via `@module-federation/nextjs-mf`.                                                  |
| **TanStack Query**           | The backbone of the Data Layer: caching, pagination of course/task lists, lazy metadata fetching, cache invalidation on save, Optimistic Updates for changing the folder tree.                                               |
| **Zustand**                  | Local UI state: sidebar, editor themes, unsaved drafts, code-compiler state. Synergizes with TanStack Query.                                                                                                                 |
| **SSE / Streaming**          | Token-by-token streaming of AI assistant responses and real-time logs of unit-test runs when checking student solutions on the Worker side.                                                                                  |
| **Cloudflare D1 + KV**       | A single distributed database (SQLite) and cache — a shared data source for KB and LMS with no synchronization delays.                                                                                                       |
| **OpenAPI / Swagger**        | The entire serverless API is documented via a spec (through chanfana); a typed TypeScript client is generated from the schema.                                                                                               |
| **Security**                 | XSS sanitization of MDX via `isomorphic-dompurify`, strict CSP headers in `next.config.js`, sessions on HttpOnly cookies via GitHub OAuth2. RBAC built for KB naturally extends to the RAG layer through metadata filtering. |

---

## 6. Long-term vector

Uni.Verse is a future university ecosystem, where the KB module covers the
need for a Confluence equivalent (regulations, documentation, lectures with access rights),
and the LMS module covers interactive learning (courses, tasks, exercises, progress). A shared
MDX core makes both modules different lenses onto the same content while also preparing
the ground for AI assistants on top of the same knowledge base via RAG. Commercialization — as an
EdTech SaaS on top of this same architecture.
