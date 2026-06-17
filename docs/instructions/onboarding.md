# Onboarding — what to read first

1. [README.md](../../README.md) — the human-oriented entry point into the repository.
2. [docs/concept/01-uni-verse-architecture.md](../concept/01-uni-verse-architecture.md) —
   where we're heading long-term (Uni.Verse product vision).
3. Active POC: [docs/poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md) —
   what we're doing right now and why this particular domain.
4. [docs/tasks/](../tasks/) — the current work breakdown by day, the starting point for
   Claude Code at the beginning of each session.
5. If you need context on a non-trivial technical decision —
   [docs/adr/](../adr/).

## Running locally

```bash
nvm use            # Node version — see .nvmrc
corepack enable     # activates pnpm from packageManager in package.json
pnpm install
pnpm -r dev          # apps/kb + apps/editor + apps/api locally
```

## If you need more context

- How to work with Claude Code in this repo —
  [working-with-claude-code.md](working-with-claude-code.md).
- Code and commit style — [coding-conventions.md](coding-conventions.md).
