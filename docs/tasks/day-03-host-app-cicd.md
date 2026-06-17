# Day 3 — Next.js Core (Host) & CI/CD

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §3.1 (read userflow), §6 (RSC).
> The CI skeleton (`lint → typecheck → test → build`) already exists —
> [.github/workflows/ci.yml](../../.github/workflows/ci.yml). This day adds
> a real deployment in `deploy.yml`.

## Context

`apps/kb` becomes a real Next.js App Router application: a shared Dashboard Layout,
a document tree in the sidebar, RSC for reading documents (instant TTFB/LCP).
In parallel — auto-deploy to Cloudflare Pages and strict CSP headers.

## Definition of Done

- [ ] App Router is initialized, the shared Dashboard Layout and Tailwind are wired up
- [ ] The document tree in the sidebar reads data via the API from Day 1
- [ ] The document page renders as an RSC
- [ ] `.github/workflows/deploy.yml` deploys `apps/kb` to Cloudflare Pages on push to `main`
- [ ] Strict CSP headers are configured in `next.config.js`
- [ ] `pnpm --filter @collab-docs/kb build` is green

## Affected packages

`apps/kb`, `.github/workflows/`
