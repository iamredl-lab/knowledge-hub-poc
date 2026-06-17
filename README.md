# Collaborative Docs POC

A collaborative document/wiki editor built on a configurable MDX core, with realtime
co-editing on Cloudflare Durable Objects. An architectural POC that simultaneously
closes technology gaps on the resume and lays the foundation for the KB module of the
Uni.Verse ecosystem — more details in [docs/concept/01-uni-verse-architecture.md](docs/concept/01-uni-verse-architecture.md).

> The repository is under active development. A full architectural description,
> the rationale for the Edge infrastructure, and a link to a live demo will appear
> here following Day 7
> (see [docs/tasks/day-07-versions-readme-release.md](docs/tasks/day-07-versions-readme-release.md)).

## What this is

Functionality, user flow, and the technical model are in
[docs/poc-specs/01-collab-docs-poc-spec.md](docs/poc-specs/01-collab-docs-poc-spec.md).

## Repository structure

- `apps/kb` — Next.js App Router host (reading/editing documents, RSC)
- `apps/editor` — Vite remote (editor), connected via Module Federation
- `apps/api` — Cloudflare Worker (chanfana/OpenAPI, D1, Durable Objects)
- `packages/` — reusable packages (`mdx-engine`, `db`, `api-contracts`, `ui`, `config`)
- `docs/` — all project documentation, see [docs/README.md](docs/README.md)

## Local setup

```bash
nvm use
corepack enable
pnpm install
pnpm -r dev
```

## Documentation

Full index — [docs/README.md](docs/README.md). Where to start — [docs/instructions/onboarding.md](docs/instructions/onboarding.md).
