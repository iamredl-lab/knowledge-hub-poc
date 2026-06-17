# Day 6 — Realtime + OAuth2 + Security

> Full spec: [poc-specs/01-collab-docs-poc-spec.md](../poc-specs/01-collab-docs-poc-spec.md)
> §3.2, §3.4, §5. Architectural decision:
> [adr/0002-durable-objects-for-realtime](../adr/0002-durable-objects-for-realtime.md).

## Context

Collaborative editing of a single document via a Durable Object `doc:<id>` + WebSocket
(stage 1 — presence + single-writer; CRDT/Yjs optional as a second stage). SSE for
"document changed" notifications and comments. Sign-in via GitHub OAuth2 with HttpOnly sessions.

## Definition of Done

- [ ] The `doc:<id>` Durable Object accepts WebSocket connections and broadcasts presence
      to all connected clients
- [ ] The WebSocket Hibernation API is used so idle connections aren't billed
- [ ] The `/docs/:id/events` SSE endpoint pushes a change event, and `invalidateQueries`
      on the frontend pulls in the fresh version
- [ ] GitHub OAuth2: `/auth/github` → `/auth/callback` → HttpOnly session
- [ ] Basic RBAC (owner/editor/viewer) is checked on mutating endpoints

## Affected packages

`apps/api`, `apps/kb`
