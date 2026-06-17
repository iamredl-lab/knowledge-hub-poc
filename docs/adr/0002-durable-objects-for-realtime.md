# 0002 — Durable Objects + WebSocket for collaborative editing

> Status: accepted
> Date: 2026-06-17

## Context

Collaborative Docs requires simultaneous editing of a single document by multiple
users with visibility of each other's cursors and edits (presence + live changes),
see [poc-spec](../poc-specs/01-collab-docs-poc-spec.md) §2.2 and §5. D1
([0001](0001-cloudflare-d1-as-source-of-truth.md)) provides instant _asynchronous_
synchronization (a change is visible on the next read), but is not sufficient for
_synchronous_ coordination of multiple active connections to a single document.

## Options considered

1. **Third-party realtime service** (Pusher, Liveblocks, Ably) — pro: ready-made
   solution, fast start; con: dependency on an external hosted service, separate
   billing, doesn't fit the principle of "all infrastructure on free Cloudflare";
   weaker for the CV narrative ("plugged in a SaaS" instead of "designed a realtime
   layer").
2. **Plain WebSocket server outside Cloudflare** (Node + ws/socket.io on separate
   hosting) — pro: familiar stack; con: separate infrastructure outside
   Workers/D1, complicates POC deployment, loses the edge advantage (single
   platform, low latency).
3. **Cloudflare Durable Objects + WebSocket**, one DO instance per document
   (`doc:<id>`) — pro: document-state coordination naturally fits the DO model
   (one object = one authoritative source for one document), the WebSocket
   Hibernation API removes charges for idle connections; con: a more low-level
   programming model (manual connection lifecycle management) than a ready-made
   SaaS.

## Decision

We use a Durable Object `doc:<id>` as the realtime-session coordinator for a single
document: it holds active WebSocket connections, and broadcasts presence (cursors,
who's online) and text changes to all connected clients. For conflict-free merging
of edits — CRDT (Yjs) on top of ready-made WebSocket providers on Durable Objects,
as a second stage after single-writer + presence (see flow 3.2 in `poc-spec`).

## Consequences

- The WebSocket Hibernation API is used to avoid paying for idle connections — this
  must be taken into account when designing DO handlers (state between
  "wake-ups" is not retained in memory, only what is explicitly serialized).
- The document state is periodically snapshotted into D1 (and/or R2), and partial
  updates in DO storage are cleared out — DO must not be treated as permanent
  storage for version history, only as live realtime coordination.
- The boundary is clean: the editor widget doesn't know about the specific
  transport; the realtime provider is injected through an interface — this
  requirement holds for any future transport replacement.
- For the POC it's fine to start without CRDT (single-writer + presence); adding
  Yjs later should not require changes to the userflow or UI — if it does, that's a
  signal that the abstraction boundary was violated.
