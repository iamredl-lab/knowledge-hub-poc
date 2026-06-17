# Day 5 — Data Layer (TanStack Query + Zustand)

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §3.1 (userflow with Optimistic Update), §6.

## Context

The frontend gets a typed TS client generated from the Day 1 OpenAPI schema.
TanStack Query handles server state (tree, documents), Zustand handles local UI state
(drafts, panels). Tree drag-and-drop and rename work via Optimistic Updates.

## Definition of Done

- [ ] The TS client is generated from the `apps/api` OpenAPI schema into `packages/api-contracts`
- [ ] The document tree uses Optimistic Updates for drag-and-drop/rename, with rollback
      on request failure
- [ ] Document autosave is a debounced `PATCH /docs/:id`
- [ ] Zustand stores drafts and UI panel state without duplicating the server cache
- [ ] `pnpm --filter @collab-docs/kb typecheck` is green after client integration

## Affected packages

`apps/kb`, `packages/api-contracts`
