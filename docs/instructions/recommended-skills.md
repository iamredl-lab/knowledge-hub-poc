# Recommended skills.sh skills

Skills already in place: the full `obra/superpowers` set (TDD, debugging, planning,
code review, etc.) and the project-local skills in `.claude/skills/` (`new-adr`,
`new-task`, `scaffold-package`). The list below adds stack-specific skills from the
[skills.sh](https://www.skills.sh) marketplace — install with
`npx skills add <owner/repo> --skill <name>`, which configures the skill for whichever
supported agent (Claude Code, Cursor, Copilot CLI, ...) is present in the repo.

## `apps/api` — Cloudflare Worker, chanfana, D1, Durable Objects

| Skill                    | Repo                  | Install                                                                              |
| :----------------------- | :-------------------- | :----------------------------------------------------------------------------------- |
| `cloudflare`             | `cloudflare/skills`   | `npx skills add https://github.com/cloudflare/skills --skill cloudflare`             |
| `wrangler`               | `cloudflare/skills`   | `npx skills add https://github.com/cloudflare/skills --skill wrangler`               |
| `workers-best-practices` | `cloudflare/skills`   | `npx skills add https://github.com/cloudflare/skills --skill workers-best-practices` |
| `durable-objects`        | `cloudflare/skills`   | `npx skills add https://github.com/cloudflare/skills --skill durable-objects`        |
| `write-endpoints`        | `cloudflare/chanfana` | `npx skills add https://github.com/cloudflare/chanfana --skill write-endpoints`      |

## `packages/db` — Drizzle on D1

| Skill         | Repo                          | Install                                                                             |
| :------------ | :---------------------------- | :---------------------------------------------------------------------------------- |
| `drizzle-orm` | `bobmatnyc/claude-mpm-skills` | `npx skills add https://github.com/bobmatnyc/claude-mpm-skills --skill drizzle-orm` |

## `apps/kb` (Next.js App Router) / `apps/editor` (Vite + Module Federation)

| Skill                         | Repo                       | Install                                                                                          |
| :---------------------------- | :------------------------- | :----------------------------------------------------------------------------------------------- |
| `next-best-practices`         | `vercel-labs/next-skills`  | `npx skills add https://github.com/vercel-labs/next-skills --skill next-best-practices`          |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices` |

## Security

| Skill           | Repo             | Install                                                                  |
| :-------------- | :--------------- | :----------------------------------------------------------------------- |
| `code-security` | `semgrep/skills` | `npx skills add https://github.com/semgrep/skills --skill code-security` |

OWASP Top 10 review across 15+ languages. Complements, not replaces, the hard rule
that user-supplied MDX must go through `isomorphic-dompurify`
([CLAUDE.md](../../CLAUDE.md)).

## Testing

| Skill            | Repo                | Install                                                                      |
| :--------------- | :------------------ | :--------------------------------------------------------------------------- |
| `webapp-testing` | `anthropics/skills` | `npx skills add https://github.com/anthropics/skills --skill webapp-testing` |

Playwright-based e2e testing with server lifecycle management — for exercising
`apps/kb`/`apps/editor` live. Operates at the e2e level; unit/TDD discipline is
already covered by `superpowers:test-driven-development`.

## Meta — finding more skills later

| Skill         | Repo                 | Install                                                                    |
| :------------ | :------------------- | :------------------------------------------------------------------------- |
| `find-skills` | `vercel-labs/skills` | `npx skills add https://github.com/vercel-labs/skills --skill find-skills` |

Lets the agent search and install further skills.sh skills on demand from within a
session.

## Deliberately skipped

- Rest of `cloudflare/skills` (`cloudflare-email-service`, `turnstile-spin`,
  `agents-sdk`, `sandbox-sdk`, `building-ai-agent-on-cloudflare`, ...) — not used by
  this POC.
- All of `cloudflare/workerd` — skills for developing the workerd runtime itself, not
  for building on top of Workers.
- Document-generation skills from `anthropics/skills` (`pptx`, `docx`, `pdf`,
  `frontend-design`, ...) — off-topic for this project.
