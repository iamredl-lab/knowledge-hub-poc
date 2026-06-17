# Comparison of POC domains and rationale for the choice

> Recorded based on the chat discussion before starting the 7-day plan. The
> purpose of this document is to not lose track of _why_ the Collaborative Docs
> domain was chosen over one of the considered alternatives.

---

## 1. Considered options

| Domain                                             | Status                     | Why                                                                                                                                                                                                                                                        |
| :------------------------------------------------- | :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Interactive algorithm trainer** (LeetCode-style) | Fully worked out, rejected | See §2 — the main alternative option, taken all the way to a separate spec ([cv-gap-analysis](alternatives/02-poc-cv-gaps.md))                                                                                                                             |
| **Blog engine**                                    | Dropped early              | Doesn't naturally require a realtime layer or Module Federation — closes fewer CV gaps without artificially stretching features to fit                                                                                                                     |
| **Dashboard (analytics/BI)**                       | Dropped early              | Naturally covers Chart.js and the Data Layer, but gives no reason for Durable Objects/WebSocket or for serious RBAC — lopsided gap coverage                                                                                                                |
| **RAG assistant**                                  | Dropped early              | Strong AI narrative, but weak coverage of realtime/MF gaps; pushed into the ecosystem's long-term direction ([uni-verse-architecture](../concept/01-uni-verse-architecture.md) §6) as a future layer over the same MDX core, rather than as a separate POC |
| **Collaborative Docs (Notion-lite)**               | **Chosen**                 | See §3                                                                                                                                                                                                                                                     |

The blog engine, dashboard, and RAG assistant did not get separate detailed
specs — they were dropped during the comparison stage as soon as it became
clear that they cover a smaller part of the gap table (§4 below) or require
artificially shoehorned features just to cover a technology.

---

## 2. The algorithm trainer — why not this one

Fully described in [cv-gap-analysis.md](alternatives/02-poc-cv-gaps.md).
Strengths: covers the entire gap list, gives a vivid LeetCode-style narrative.
The decisive downside — **sandbox risk**: executing someone else's/a student's
code on the server requires serious isolation (a separate Worker sandbox,
resource limits, protection against sandbox escape), which for a 7-day POC is
an unnecessary risk with no direct payoff for the resume (sandboxing isn't the
gap we're closing).

---

## 3. Collaborative Docs — why this one

Fully described in [poc-spec](../poc-specs/01-collab-docs-poc-spec.md) §1. Key reasons:

- **Natural coverage of all gaps**, without artificially shoehorned features:
  document tree → Optimistic Updates, heavy editor → Module Federation,
  collaborative editing → realtime, rendering someone else's MDX → security.
- **No sandbox risk** — unlike the algorithm trainer, there's no need to execute
  someone else's code.
- **Direct reuse in Uni.Verse** — this is the future KB module itself
  ([uni-verse-architecture](../concept/01-uni-verse-architecture.md) §1, §3), meaning the POC
  isn't thrown away after the demo but becomes the foundation of the real
  system.

---

## 4. CV gap coverage — summary

Both finalist options (the algorithm trainer and collab-docs) close the same
list of technologies (Next.js RSC, Module Federation, TanStack Query, Zustand,
SSE, Security, OpenAPI, CI/CD) — a detailed table for each option is in the
corresponding documents. The deciding factor was not the technology list (it's
the same for both), but the **risk/reward profile** (sandbox) and the
**reusability of the result** (KB module vs. an isolated educational product).
