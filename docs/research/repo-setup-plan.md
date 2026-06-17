# Repo Setup Plan — Collaborative Docs POC

> A detailed plan for setting up the monorepo before starting "Day 1" of the
> 7-day development plan (see `03-collab-docs-poc-spec.md`). A particular focus
> is the `docs/` folder: a single place for all the markdown documents we
> generate (concept, POC specs, task breakdown, ADRs, instructions), designed
> primarily for working with Claude Code, but also readable by humans.

---

## 1. Organizational principles

- **Documentation is a first-class citizen of the repository**, not a
  byproduct. Everything we've already generated in chat (concept, POC specs,
  gap analysis) moves into `docs/` from the very first commit — it's both
  context for Claude Code and an artifact for the CV.
- **`CLAUDE.md` is the entry point for the agent**, but not a knowledge
  warehouse. It contains what needs to be known _in every session_ (structure,
  commands, conventions), while details are referenced (`@import`) to specific
  files in `docs/`. This prevents the main file from bloating.
- **The monorepo is split by responsibility**: `apps/` — what gets deployed
  separately; `packages/` — what's reused between `apps/`; `docs/` — what isn't
  deployed but defines how and why everything else is structured.
- **Claude Code configuration (`.claude/`) is committed to the repository** —
  it's a team asset (rules, custom commands), not a personal setting of one
  developer.

---

## 2. File and folder layout

```
collab-docs/
├── .claude/                            # Claude Code configuration (team-shared, committed)
│   ├── settings.json                   # permissions: allow/deny lists for tools
│   ├── settings.local.json             # personal overrides (in .gitignore)
│   ├── skills/                         # reusable project commands/skills
│   │   ├── new-task/SKILL.md           #   /new-task — create a file in docs/tasks from a template
│   │   ├── new-adr/SKILL.md            #   /new-adr — start an Architecture Decision Record
│   │   └── scaffold-package/SKILL.md   #   /scaffold-package — scaffold a new package in packages/
│   └── rules/                          # additional rules, loaded together with CLAUDE.md
│       ├── commit-style.md
│       └── testing.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # lint → typecheck → test → build (all workspaces)
│       └── deploy.yml                  # deploy apps/kb, apps/editor, apps/api
│
├── apps/
│   ├── kb/                             # Host App (Next.js App Router) — Knowledge Base UI
│   │   ├── src/
│   │   │   ├── app/                    # routes, layout.tsx, RSC document pages
│   │   │   ├── components/
│   │   │   └── lib/                    # TanStack Query client, MF remote loader
│   │   ├── CLAUDE.md                   # local context specifically for apps/kb (optional)
│   │   ├── next.config.js              # Module Federation host configuration
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── editor/                         # Remote MFE (Vite) — document editor, Chart.js
│   │   ├── src/
│   │   ├── vite.config.ts              # @originjs/vite-plugin-federation
│   │   └── package.json
│   │
│   └── api/                            # Cloudflare Worker — backend
│       ├── src/
│       │   ├── routes/                 # chanfana/OpenAPI handlers
│       │   ├── durable-objects/
│       │   │   └── doc-room.ts         # DO: realtime coordination for a single document
│       │   ├── auth/                   # GitHub OAuth2, sessions
│       │   └── index.ts
│       ├── wrangler.toml               # bindings: D1, Durable Objects, KV
│       └── package.json
│
├── packages/
│   ├── mdx-engine/                     # MDX parser/renderer (read / edit / share contexts)
│   │   ├── src/
│   │   └── package.json
│   ├── api-contracts/                  # zod schemas + generated TS client from OpenAPI
│   ├── db/                             # D1 schema (Drizzle), migrations, seeds
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── ui/                             # shared UI components / design tokens
│   └── config/                         # shared base configs
│       ├── eslint-preset/
│       └── tsconfig-base/
│
├── docs/                               # ⭐ all the project's "paper" documentation
│   ├── README.md                       # index: what lives where and how to use it
│   │
│   ├── concept/                        # product vision — "why" and "where we're headed"
│   │   └── 01-uni-verse-architecture.md
│   │
│   ├── poc-specs/                      # functionality + user flow of a specific POC
│   │   └── 01-collab-docs-poc-spec.md  # renamed from 04-collab-docs-poc-spec.md
│   │
│   ├── adr/                            # Architecture Decision Records
│   │   ├── TEMPLATE.md
│   │   ├── 0001-cloudflare-d1-as-source-of-truth.md
│   │   └── 0002-durable-objects-for-realtime.md
│   │
│   ├── tasks/                          # task breakdown for Claude Code and for myself
│   │   ├── day-01-data-layer.md
│   │   ├── day-02-mdx-core.md
│   │   ├── day-03-host-app-cicd.md
│   │   ├── day-04-module-federation.md
│   │   ├── day-05-data-layer-frontend.md
│   │   ├── day-06-realtime-auth-security.md
│   │   └── day-07-versions-readme-release.md
│   │
│   ├── research/                       # research and comparisons that led to decisions
│   │   ├── cv-gap-analysis.md
│   │   └── poc-domain-options.md
│   │
│   ├── api/                            # API notes beyond what's in Swagger UI
│   │   └── openapi-notes.md
│   │
│   └── instructions/                   # how to work with the repository
│       ├── working-with-claude-code.md
│       ├── coding-conventions.md
│       └── onboarding.md
│
├── .editorconfig
├── .gitignore
├── .npmrc
├── .nvmrc
├── CLAUDE.md                            # ⭐ the main project memory file for Claude Code
├── CONTRIBUTING.md
├── LICENSE
├── README.md                            # human-oriented entry point to the repository
├── package.json                         # root: scripts, workspaces, devDependencies
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json                           # optional: cache and build pipelines across packages
```

---

## 3. Step-by-step setup plan (before "Day 1")

### Step 0.1 — Initialization

- `git init`, choose a branching scheme (`main` + feature branches, without
  excessive gitflow for a POC).
- Create `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  ```
- Root `package.json` with aggregator scripts (`pnpm -r build`, `pnpm -r lint`,
  `pnpm -r typecheck`, `pnpm -r test`).

### Step 0.2 — Base configs

- `tsconfig.base.json` at the root; each `apps/*`/`packages/*` inherits via
  `extends`.
- `packages/config/eslint-preset` and `packages/config/tsconfig-base` — so
  rules aren't copied into every workspace.
- `.editorconfig`, `.nvmrc` (pin the Node version), `.npmrc`
  (`engine-strict=true`), `.gitignore` (entries: `node_modules`, `.wrangler`,
  `.next`, `dist`, `.env*`, `.claude/settings.local.json`).

### Step 0.3 — Scaffolds for apps/ and packages/

- Each directory gets a minimal `package.json` with a name (`@collab-docs/kb`,
  `@collab-docs/mdx-engine`, etc.), so the pnpm workspace picks them up
  immediately.
- `apps/api/wrangler.toml` with binding stubs (D1, Durable Objects, KV) — even
  empty ones, so the configuration structure is visible from day one.

### Step 0.4 — CI skeleton

- `.github/workflows/ci.yml`: `pnpm install` → `lint` → `typecheck` → `test` →
  `build` on every PR. The actual deployment (`deploy.yml`) gets wired up on
  Day 3/6 per the plan.

### Step 0.5 — Migrating the documentation

- Create the entire `docs/` structure (see §2).
- Move the already-prepared files:
  - `01-uni-verse-architecture.md` → `docs/concept/01-uni-verse-architecture.md`
    (unchanged — this is the product vision).
  - `04-collab-docs-poc-spec.md` → `docs/poc-specs/01-collab-docs-poc-spec.md`
    (the current, active POC).
  - `02-poc-cv-gaps.md` and `03-poc-functional-spec.md` (the algorithm trainer) →
    `docs/research/alternatives/` — this is a researched but not chosen option;
    we don't throw it away, we mark it as archived with a one-line `> status:
rejected in favor of Collaborative Docs, see poc-domain-options.md`.
- Write `docs/research/poc-domain-options.md` — record the comparison of
  options itself (algorithm trainer / blog engine / dashboard / RAG assistant /
  collab-docs) and the reason for the choice. This has already been partly
  discussed in chat — worth nailing down in writing.
- Write `docs/README.md` — a short index/navigator for the subfolders (see §4).

### Step 0.6 — Setting up Claude Code

- Create the root `CLAUDE.md` (contents — see §5).
- Create `.claude/settings.json` with basic permissions (see §6).
- Set up 2–3 custom skills for real recurring actions (see §6) — no more than
  that; the rest will be added as development progresses.

### Step 0.7 — First commit

- `docs: bootstrap repository structure and documentation`.
- Optional: protect the `main` branch (require PRs even when working solo —
  it's both process practice and material for the README/resume).

---

## 4. `docs/` in detail

| Subfolder       | What goes in it                                                                                                                | Naming convention                                                                     |
| :-------------- | :----------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `concept/`      | Product vision, the long-term architecture of Uni.Verse — what changes rarely                                                  | `NN-slug.md`                                                                          |
| `poc-specs/`    | Functionality, user flow, and technical details of the specific POC currently in progress                                      | `NN-slug.md`, the active spec is always without a `-draft` suffix                     |
| `adr/`          | Recorded architectural decisions with alternatives and the reason for the choice                                               | `NNNN-slug.md` (4 digits, classic ADR format), a single `TEMPLATE.md`                 |
| `tasks/`        | Breakdown of the development plan into executable units — the starting point for Claude Code at the beginning of every session | `day-NN-slug.md`; if a day needs to be split further — `day-02-mdx-core/01-parser.md` |
| `research/`     | Gap analysis, comparison of options, everything that led to a decision but isn't a decision itself                             | free-form names, no numbering                                                         |
| `api/`          | API notes that don't fit in Swagger UI (request examples, authorization nuances)                                               | free-form names                                                                       |
| `instructions/` | How to work with the repository — for both humans and the agent                                                                | a fixed set of files (see below)                                                      |

### `docs/instructions/` — fixed set

- `working-with-claude-code.md` — what's in `.claude/`, how to use skills, how
  `@import` works in `CLAUDE.md`, what to do if the agent "forgets" context.
- `coding-conventions.md` — code style, commit structure, when to create an ADR.
- `onboarding.md` — what to read first (order: `README.md` →
  `docs/concept/` → the active `docs/poc-specs/`).

### ADR — why a separate folder

Every non-trivial decision ("why Durable Objects instead of Pusher/Liveblocks,"
"why a generic `content_nodes` instead of separate tables per content type") is
recorded in a separate file following a template: context → considered
alternatives → decision → consequences. This isn't bureaucracy for its own
sake: for the Senior narrative on a resume, "I documented architectural
decisions with alternatives" sounds far more concrete than just "designed the
architecture," and Claude Code in a new session reads _why_, not just _what_.

---

## 5. `CLAUDE.md` — contents of the root file

The file is read by the agent at the start of every session, so it contains a
compact set of facts that would otherwise have to be explained again, not the
entire documentation. Details are offloaded via `@import`.

```markdown
# Collaborative Docs POC

A collaborative document editor on an MDX core. A POC for closing CV gaps
(see @docs/poc-specs/01-collab-docs-poc-spec.md), and at the same time a
precursor to the KB module of the Uni.Verse ecosystem (see @docs/concept/01-uni-verse-architecture.md).

## Repository structure

- `apps/kb` — Next.js App Router host (reading/editing documents, RSC)
- `apps/editor` — Vite remote (editor, Chart.js), connected via Module Federation
- `apps/api` — Cloudflare Worker (chanfana/OpenAPI, D1, Durable Objects)
- `packages/mdx-engine` — MDX rendering, read/edit/share contexts
- `packages/db` — D1 schema (Drizzle) and migrations
- `packages/api-contracts` — shared types and generated client

## Commands

- `pnpm install` — install all workspaces
- `pnpm -r dev` — run apps/kb + apps/editor + apps/api locally
- `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r test`
- `pnpm --filter @collab-docs/api wrangler:dev` — Worker locally with D1/DO

## Where to look for context before a task

- Current work breakdown: @docs/tasks/
- Architectural decisions and why: @docs/adr/
- If you're changing the data model — first check @packages/db/schema.ts and
  create an ADR if deviating from the generic content_nodes schema

## Hard rules

- `content_nodes` stays generic (a `type` field), don't proliferate tables per
  content type — that contradicts @docs/concept/01-uni-verse-architecture.md
- Any rendering of user-generated MDX goes through `isomorphic-dompurify`, no exceptions
- Don't commit `wrangler.toml` secrets — they go through `wrangler secret`
```

> Tip: if details specific to `apps/kb` or `packages/mdx-engine` come up during
> work, create a local `CLAUDE.md` right in that folder. Claude Code walks up
> the directory tree and takes all found `CLAUDE.md` files into account
> together, so the root file doesn't bloat with the details of a single
> package.

---

## 6. `.claude/` — skills, rules, settings

### Skills (current format, replaces the old `commands/`)

Each is a markdown file with a `description` plus instruction text, invoked as
`/folder-name`.

- **`new-task`** — given an argument (`$ARGUMENTS` = topic), creates a file in
  `docs/tasks/` following a unified template (context → definition of done →
  affected packages).
- **`new-adr`** — copies `docs/adr/TEMPLATE.md` to `docs/adr/000N-slug.md` with
  the next sequential number, filling in the date.
- **`scaffold-package`** — creates the scaffold for a new package in
  `packages/` (package.json, tsconfig, src/index.ts) following the
  `packages/config` conventions.

### `rules/`

Files like `commit-style.md` (commit message format) and `testing.md` (what and
how to test) are loaded together with `CLAUDE.md` — convenient to keep them
separate once there are many rules, so the main file doesn't get bloated.

### `settings.json` (example, illustrative)

```json
{
  "permissions": {
    "allow": ["Bash(pnpm *)", "Bash(git diff:*)", "Bash(git status:*)"],
    "deny": ["Bash(rm -rf *)", "Bash(git push --force*)"]
  }
}
```

Personal overrides go in `settings.local.json`, which is in `.gitignore` and
not committed. The exact permissions syntax should be checked against the
current Claude Code documentation at setup time — the format may differ from
version to version.

---

## 7. Checklist: "repository ready for Day 1"

- [ ] `pnpm install` runs without errors, all `apps/*` and `packages/*` are visible in the workspace
- [ ] CI is green on empty stubs (lint/typecheck/test/build pass on the skeleton)
- [ ] `docs/` contains the migrated `concept/`, `poc-specs/`, and at least one `adr/`
- [ ] The root `CLAUDE.md` exists and references the current POC spec via `@import`
- [ ] `.claude/settings.json` defines basic permissions
- [ ] `wrangler.toml` in `apps/api` exists (even with binding stubs)
- [ ] The first commit is made, the `main` branch is protected (if that was chosen)

After this point — move on to `docs/tasks/day-01-data-layer.md` from the main
7-day plan.
