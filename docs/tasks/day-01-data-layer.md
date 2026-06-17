# Day 1 — OpenAPI and Data Layer (Workers + D1)

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §4 (data model), §7 (API).
> The repository is already bootstrapped (see [repo-setup-plan](../research/repo-setup-plan.md)) —
> the pnpm workspace, CI skeleton, and package stubs already exist; this day fills them in.

## Context

We need a working backend on Cloudflare Workers + D1: data schema, migrations, CRUD for
documents and the tree, with API contracts documented via chanfana/OpenAPI.

## Definition of Done

- [ ] D1 tables created and migrated: `workspaces`, `content_nodes`, `doc_versions`,
      `comments`, `memberships`, `users`, `sessions` (schema — POC spec §4)
- [ ] `content_nodes` is a generic schema (with a `type` field), with no separate tables per content type
- [ ] CRUD endpoints for documents and the tree (`GET /workspaces/:id/tree`, `POST /docs`,
      `GET /docs/:id`, `PATCH /docs/:id`) work locally via `wrangler dev`
- [ ] The schema is documented via chanfana, Swagger UI comes up and reflects the real
      endpoints
- [ ] `pnpm --filter @collab-docs/api typecheck` and `build` are green

## Affected packages

`apps/api`, `packages/db`, `packages/api-contracts`
