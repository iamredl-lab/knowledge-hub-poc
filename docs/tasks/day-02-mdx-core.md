# Day 2 — MDX Core (read / edit contexts)

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §5.2 (the realtime provider boundary applies here too — the engine doesn't know about the transport).

## Context

`packages/mdx-engine` is an isolated MDX rendering package with two contexts:
`read` (for RSC and public share pages) and `edit` (live preview in the editor).
The boundary must be clean: the engine has no knowledge of the specific application (KB now, LMS
in the ecosystem's future perspective — see [uni-verse-architecture](../concept/01-uni-verse-architecture.md)
§2).

## Definition of Done

- [ ] `packages/mdx-engine` parses standard Markdown/MDX
- [ ] The `read` and `edit` execution contexts are supported (at least as two explicit
      render modes, not necessarily with the full set of custom widgets)
- [ ] Any rendering of user-supplied MDX goes through `isomorphic-dompurify` —
      with no exceptions (hard rule from the root `CLAUDE.md`)
- [ ] Unit tests for read/edit mode rendering and for XSS payload sanitization
- [ ] `pnpm --filter @collab-docs/mdx-engine test` and `typecheck` are green

## Affected packages

`packages/mdx-engine`
