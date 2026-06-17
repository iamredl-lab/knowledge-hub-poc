# 0001 — Cloudflare D1 as the single source of truth

> Status: accepted
> Date: 2026-06-17

## Context

Content (documents, notes, future lessons) must be accessible simultaneously from
different "lenses" — Knowledge Base now, LMS and RAG export in the future of the
Uni.Verse ecosystem (see [uni-verse-architecture](../concept/01-uni-verse-architecture.md)
§1). We need to decide where content is physically stored and how different
applications access it without causing desynchronization between copies.

## Options considered

1. **Separate DB/data copy per application** (KB keeps its own copy, LMS keeps its
   own) — pro: full isolation; con: synchronization turns into a constant pain
   (webhooks, version conflicts, background jobs).
2. **External managed DB** (e.g., Postgres on Neon/Supabase) with Workers as the
   client — pro: familiar SQL stack; con: extra network latency from Worker →
   external DB on every request, separate billing, doesn't fit the Cloudflare-only
   infrastructure of the POC.
3. **Cloudflare D1 as the single source of truth**, shared by all applications
   through a unified API gateway — pro: data physically lives in one place, no
   copies and no synchronization; con: D1 is SQLite under the hood, with
   constraints on concurrent writes and DB size (acceptable for the POC and for
   Uni.Verse's current scale).

## Decision

We use Cloudflare D1 as the single source of truth for `content_nodes` and related
tables. Knowledge Base, and in the future LMS/RAG export, are different ways of
reading and rendering the same D1, through a shared OpenAPI gateway with different
`type` filters and different RBAC scopes, rather than separate data copies.

## Consequences

- There is nothing to synchronize: any change is visible to all consumers on the
  next read, with no webhooks or background jobs.
- KV is used only as a caching layer on top of D1, not as a separate data source.
- The `content_nodes` table must remain generic (`type` field) — otherwise the
  benefit of a single source is lost as soon as a new content type is added (see
  the hard rule in the root `CLAUDE.md`).
- D1's SQLite-engine constraint on concurrent writes means D1 is not sufficient for
  realtime collaborative editing of a single document — that requires a separate
  synchronous layer, see
  [0002-durable-objects-for-realtime](0002-durable-objects-for-realtime.md).
