# Collaborative Docs POC

A collaborative document editor built on an MDX core. POC for closing CV gaps
(see @docs/poc-specs/01-collab-docs-poc-spec.md), while also serving as a
foundation for the KB module of the Uni.Verse ecosystem (see @docs/concept/01-uni-verse-architecture.md).

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
- `pnpm -r typecheck` / `pnpm -r test` — per-workspace
- `pnpm lint` / `pnpm lint:fix` / `pnpm fmt` / `pnpm fmt:check` — repo-wide via oxlint/oxfmt
- `pnpm --filter @collab-docs/api wrangler:dev` — Worker locally with D1/DO

## Where to look for context before starting a task

- Current breakdown of work: @docs/tasks/
- Architectural decisions and rationale: @docs/adr/
- If you're changing the data model — first check @packages/db/schema.ts and
  create an ADR if deviating from the generic content_nodes schema

## Hard rules

- `content_nodes` stays generic (a `type` field), do not multiply tables for each
  content type — this contradicts @docs/concept/01-uni-verse-architecture.md
- Any rendering of user-supplied MDX must go through `isomorphic-dompurify`, no exceptions
- Do not commit `wrangler.toml` secrets — they go through `wrangler secret`
