# Day 7 — Version History, Senior-Level README, and Release

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §9 (Senior Impact Statement).

## Context

Final day: document version snapshots with the ability to view and restore them, and a
README that tells the architectural story of the POC (edge realtime via Durable
Objects, Module Federation, configurable MDX core) for the CV narrative.

## Definition of Done

- [ ] Periodic `body_mdx` snapshots into `doc_versions`, history endpoints, and
      `POST /docs/:id/versions/:vid/restore` are working
- [ ] The version history and diff viewer UI is wired up in `apps/kb`
- [ ] The root `README.md` contains an architectural overview, the rationale for the edge
      infrastructure, a breakdown of the MF approach, and links to the Swagger UI and the live demo
- [ ] The demo environment is deployed and reachable via a public link
- [ ] All items in the repository readiness checklist (`docs/research/repo-setup-plan.md` §7)
      pass with no regressions

## Affected packages

`apps/api`, `apps/kb`, root `README.md`
