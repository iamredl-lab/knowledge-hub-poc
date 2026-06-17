# API — notes beyond the Swagger UI

> At the time of the repo setup, the API is not yet implemented (this is Day 1's work, see
> [tasks/day-01-data-layer.md](../tasks/day-01-data-layer.md)). This file is for nuances
> that don't fit into the OpenAPI schema itself: request examples, authorization
> quirks, gotchas with specific endpoints. The canonical list of endpoints and auth requirements —
> in [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md) §7.

## Where to find the current schema

The Swagger UI is served from `apps/api` (chanfana) — a link to the local/deployed
instance will appear here after Day 1.

## Conventions

- The schema is the single source of truth for contracts; the TS client in
  `packages/api-contracts` is generated from it, not written by hand.
- Any discrepancy between this file and the actual OpenAPI schema is a documentation bug —
  the schema wins.
