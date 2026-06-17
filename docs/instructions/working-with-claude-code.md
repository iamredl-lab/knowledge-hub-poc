# Working with Claude Code in this repository

## What's in `.claude/`

- `settings.json` — team permissions (allow/deny lists for tools), committed.
- `settings.local.json` — personal overrides, in `.gitignore`, not committed.
- `skills/` — reusable project commands, invoked as `/folder-name`.
- `rules/` — additional rules (commit style, testing), loaded together with the
  root `CLAUDE.md`.

## `@import` in CLAUDE.md

The root `CLAUDE.md` holds only what needs to be known in every session (structure,
commands, hard rules). Details are linked via `@docs/...` references to specific files,
so the main file doesn't bloat. If `apps/kb` or `packages/mdx-engine` accumulate
specific details — create a local `CLAUDE.md` right in that folder: Claude Code
walks up the directory tree and takes all found `CLAUDE.md` files into account
cumulatively.

## If the agent "forgot" context

Most likely — a new session didn't pick up the needed `docs/` file. First check
[onboarding.md](onboarding.md): the agent should read the active POC spec and the
current task from `docs/tasks/` at the start of the session, rather than rebuilding
context from scratch by guessing.

## Project skills

- `/new-task` — creates a file in `docs/tasks/` following the template (context →
  definition of done → affected packages).
- `/new-adr` — copies `docs/adr/TEMPLATE.md` to `docs/adr/000N-slug.md` with the next
  sequential number.
- `/scaffold-package` — creates the scaffold for a new package in `packages/` following
  `packages/config` conventions.

## skills.sh

Stack-specific skills worth installing from the [skills.sh](https://www.skills.sh)
marketplace (Cloudflare Workers/D1/Durable Objects, Drizzle, Next.js, security,
testing) — see [recommended-skills.md](recommended-skills.md).
