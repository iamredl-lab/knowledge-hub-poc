# Code and commit conventions

## Code style

- TypeScript strict — every `apps/*`/`packages/*` inherits
  [tsconfig.base.json](../../tsconfig.base.json) via `extends`.
- Linting and formatting — single root config (`.oxlintrc.json`, `.oxfmtrc.json`) via
  `oxlint`/`oxfmt`, do not add per-workspace configs.
- The generic `content_nodes` schema (`type` field) is not split into separate tables per
  content type — this would contradict the Uni.Verse architecture
  ([concept/01-uni-verse-architecture.md](../concept/01-uni-verse-architecture.md) §3).
- Any rendering of user-provided MDX — only through `isomorphic-dompurify`, no
  exceptions.

## Commits

Format — `type: short description` (`feat`, `fix`, `docs`, `chore`, `refactor`, `ci`).
The commit message should explain _why_, not restate the diff.

## When to create an ADR

Create `docs/adr/NNNN-slug.md` (from the [TEMPLATE.md](../adr/TEMPLATE.md) template) when
a decision is non-trivial and real alternatives were considered for it — for example,
choosing a technology for the realtime layer or deviating from the generic `content_nodes`
schema. Do not create an ADR for ordinary implementation details that have no meaningful
alternative.
