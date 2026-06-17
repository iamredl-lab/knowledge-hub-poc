# Contributing

Workflow: `main` + feature branches, changes go through a PR (even when working
solo — it's practice for the process and material for the README/resume).

1. Create a branch from `main`.
2. `pnpm install && pnpm fmt:check && pnpm lint && pnpm -r typecheck && pnpm -r test && pnpm -r build`
   must pass locally before a PR — this is exactly what CI checks.
3. Commit format and when to create an ADR — [docs/instructions/coding-conventions.md](docs/instructions/coding-conventions.md).
4. Non-trivial architectural decisions — via an ADR (`docs/adr/`, template in `TEMPLATE.md`).
