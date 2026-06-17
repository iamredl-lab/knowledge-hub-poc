# Day 4 — Editor as a Remote (Module Federation)

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §6 (gap table), [uni-verse-architecture](../concept/01-uni-verse-architecture.md) §4
> (Module Federation as a capability registry).

## Context

The document editor and heavy panels are extracted into `apps/editor` (a Vite remote) and
connected to `apps/kb` via `@module-federation/nextjs-mf`. The remotes registry
is designed to be extensible from the start — even though only one
remote is actually needed right now.

## Definition of Done

- [ ] `apps/editor` builds via Vite with `@originjs/vite-plugin-federation`
- [ ] `apps/kb` loads the editor as a remote via a manifest, not a static import
- [ ] The remotes manifest allows adding new remotes without rewriting the host config
- [ ] Graceful degradation: if the remote is unavailable, the content degrades to text instead of
      breaking the page
- [ ] `pnpm --filter @collab-docs/editor build` is green, the host loads the remote in dev mode

## Affected packages

`apps/editor`, `apps/kb`
