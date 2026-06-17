# Collaborative Docs POC — functionality, user flow, and technical details

> POC built on MDX Core: a collaborative document editor / wiki (Notion-lite).
> This is a direct precursor to the KB core of the Uni.Verse ecosystem — the code
> isn't "thrown away," it becomes the foundation of the future knowledge base. The
> document closes the same CV gaps as the algorithm trainer, but without the
> dangerous sandbox needed to execute someone else's code, and with a stronger
> narrative of "designed a collaborative editor on the edge."

---

## 1. Why this domain specifically

- **Naturally requires all the gaps.** A document tree with drag-and-drop →
  Optimistic Updates (TanStack Query). A heavy editor → extraction into a Remote
  (Module Federation). Collaborative presence and live edits → realtime
  (WebSocket / SSE). Rendering user-generated MDX → security (DOMPurify, CSP).
- **Reusable in Uni.Verse.** This is the KB module itself: pages, access rights,
  tree structure. The POC turns into the MVP of the real system.
- **No sandbox risk.** Unlike the algorithm trainer, there's no need to execute
  someone else's code.

---

## 2. Functionality (what can be done)

### 2.1. Guest / via public link

- Open a document via a share link and read it (MDX rendering, RSC).
- See the table of contents and tree navigation (public branch only).
- Cannot edit, cannot see private documents.

### 2.2. Authenticated user (GitHub OAuth2)

- Create workspaces and documents.
- Tree structure: nested pages, drag-and-drop, renaming.
- Edit a document in the MDX editor with live preview.
- **Real-time collaborative editing** — multiple people in the same document,
  seeing each other's cursors and edits (presence + live changes).
- Comments on fragments and/or threaded discussions.
- Document version history (snapshots), viewing and rollback.
- Search across workspace documents.
- Manage access to a document/workspace (roles: owner / editor / viewer).

### 2.3. Workspace owner (`owner` role)

- Invite members, assign roles.
- Configure the visibility of individual documents (share link).
- Delete/archive documents and workspaces.

> A full-fledged enterprise permission system is a task for the Uni.Verse
> ecosystem. For the POC, three roles and basic RBAC for the auth demo are
> sufficient.

---

## 3. User flow

### 3.1. Main flow: create and edit a document

```
Workspace (document tree on the left)
   │  "New document" / drag into a folder
   ▼
Optimistic Update: the node appears in the tree immediately (TanStack Query)
   │   POST /docs → D1; on error — UI rollback
   ▼
Opening a document
   │  reading: MDX → RSC (instant LCP)
   │  switch to edit mode → editor (Remote MFE, Suspense loading)
   ▼
Editing
   ├─► local edits → Zustand (draft, panel state)
   ├─► autosave → debounced PATCH /docs/:id → D1
   └─► (if the document is open by someone else) → realtime session (see 3.2)
   ▼
Version history
   │  periodic body_mdx snapshot → doc_versions
   └─► diff viewing / rollback to a version
```

### 3.2. Collaborative editing flow (realtime)

```
User A opens the document                   User B opens the same document
        │                                            │
        └──── WebSocket ──► [ Durable Object: doc:<id> ] ◄──── WebSocket ────┘
                                   │
                one instance per document coordinates all clients
                                   │
        ┌──────────────────────────┴───────────────────────────┐
        │                                                        │
   presence:                                              text changes:
   "who's in the document", cursor positions                CRDT updates (Yjs),
   broadcast to everyone connected                         conflict-free merge,
                                                          broadcast to others
                                   │
                          periodically: state snapshot to D1/R2
                          (persistence + cleanup of partial updates)
```

### 3.3. Share-link access flow (guest)

```
Opening the share link /share/:token
   │
   ▼
Worker validates the token and the document's visibility
   │
   ├─ public ──► read-only render (RSC), no WebSocket session
   └─ private/invalid token ──► 404 / login prompt
```

### 3.4. Authorization flow — same as the previous POC

```
action requiring permissions → not authenticated → GitHub OAuth2
   → Worker exchanges code for token → HttpOnly session → return to the action
```

---

## 4. Data model (D1 / SQLite)

```sql
-- Workspaces
workspaces (
  id TEXT PRIMARY KEY, name TEXT, owner_id TEXT, created_at INTEGER
)

-- Documents as universal content_nodes (one model for all of Uni.Verse)
content_nodes (
  id           TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id    TEXT,                 -- tree: NULL = root
  type         TEXT NOT NULL,        -- 'doc' in the POC
  title        TEXT NOT NULL,
  body_mdx     TEXT NOT NULL,
  position     INTEGER,              -- order among siblings (for drag-and-drop)
  visibility   TEXT NOT NULL,        -- private | workspace | public
  share_token  TEXT,                 -- for the public link
  created_by   TEXT,
  created_at   INTEGER, updated_at INTEGER
)

-- Version snapshots
doc_versions (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL,
  body_mdx TEXT NOT NULL, created_by TEXT, created_at INTEGER
)

-- Comments on fragments
comments (
  id TEXT PRIMARY KEY, node_id TEXT NOT NULL,
  anchor TEXT,                       -- binding to a fragment (range)
  body TEXT, author_id TEXT, created_at INTEGER, resolved INTEGER
)

-- Members and roles
memberships (
  workspace_id TEXT, user_id TEXT, role TEXT,  -- owner | editor | viewer
  PRIMARY KEY (workspace_id, user_id)
)

users    ( id TEXT PRIMARY KEY, gh_login TEXT )
sessions ( id TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER )
```

`content_nodes` is deliberately generic — tomorrow `lesson` / `note` will fit in
without an architecture migration, and the same editor will work in the Uni.Verse
LMS.

---

## 5. Realtime technical details (key point)

### 5.1. Two levels of synchronization — don't confuse them

- **Instant Edge synchronization via D1 (asynchronous).** A saved change is
  available on the next document read everywhere, without a rebuild. This is
  enough for navigation, the tree, and reading. An SSE channel can push a
  "document changed" event, and TanStack Query will fetch the fresh version via
  `invalidateQueries`.
- **Real-time collaborative editing (synchronous).** D1 is not enough for
  simultaneous editing of the same document — a realtime layer is needed. On
  Cloudflare this is a Durable Object + WebSocket: one instance per document
  coordinates all clients and broadcasts presence and changes. CRDT (Yjs) is used
  for conflict-free merging of edits — there are ready-made WebSocket providers
  for Cloudflare built on Durable Objects.

### 5.2. Realtime session lifecycle

- A client opens a document in edit mode → WebSocket upgrade to the Worker →
  routed to the Durable Object `doc:<id>`.
- The DO holds active connections, broadcasts presence (cursors, who's online),
  and CRDT deltas.
- The WebSocket Hibernation API lets the instance "sleep" during idle periods
  without dropping connections — so you don't pay for idle time.
- Periodically (or on a timer) the document state is snapshotted to D1 (and/or
  R2), and partial updates in DO storage are cleaned up.

> The boundary is clean: the editor widget doesn't know about the specific
> transport. The realtime provider is injected through an interface — the same
> abstraction laid down in MDX Core. For the POC you can start without CRDT
> (single-writer + presence), and add Yjs as a second stage — the user flow and
> UI don't change because of this.

---

## 6. Which gap is closed where

| Product feature                                | Technology                                          |
| :--------------------------------------------- | :-------------------------------------------------- |
| Document reading, share page                   | Next.js RSC, instant LCP                            |
| Document tree, drag-and-drop, renaming         | TanStack Query + Optimistic Updates; Zustand for UI |
| MDX editor, live preview                       | configurable MDX engine (read / edit contexts)      |
| Extracting the editor and heavy panels         | Module Federation (Remote, Vite)                    |
| Presence + collaborative editing               | Durable Objects + WebSocket (+ Yjs CRDT)            |
| "Document changed" notification, live comments | SSE / streaming                                     |
| Rendering user-generated MDX                   | DOMPurify, strict CSP                               |
| Login, roles, share tokens                     | GitHub OAuth2, HttpOnly sessions, RBAC              |
| API contracts                                  | OpenAPI / Swagger, TS client generation             |
| Deployment                                     | GitHub Actions, Cloudflare Pages + Workers + D1     |

---

## 7. API (OpenAPI, key endpoints)

| Method  | Path                              | Purpose                            | Auth          |
| :------ | :-------------------------------- | :--------------------------------- | :------------ |
| `GET`   | `/workspaces`                     | list of the user's workspaces      | session       |
| `GET`   | `/workspaces/:id/tree`            | document tree                      | session       |
| `POST`  | `/docs`                           | create a document                  | editor        |
| `GET`   | `/docs/:id`                       | document (+ permissions)           | by visibility |
| `PATCH` | `/docs/:id`                       | save / move / rename               | editor        |
| `GET`   | `/docs/:id/versions`              | version history                    | editor        |
| `POST`  | `/docs/:id/versions/:vid/restore` | restore a version                  | editor        |
| `GET`   | `/docs/:id/ws`                    | WebSocket upgrade → Durable Object | editor        |
| `GET`   | `/docs/:id/events`                | SSE: changes, comments             | by visibility |
| `POST`  | `/docs/:id/comments`              | comment on a fragment              | editor        |
| `GET`   | `/share/:token`                   | public read-only access            | —             |
| `POST`  | `/workspaces/:id/members`         | invite / assign a role             | owner         |
| `GET`   | `/auth/github` / `/auth/callback` | OAuth2                             | —             |

The whole schema is documented via chanfana; a typed TS client for the frontend
is generated from it.

---

## 8. Step-by-step 7-day plan for Claude Code

- **Day 1 — OpenAPI and the data layer (Workers + D1).** pnpm monorepo. API
  contracts. Tables (`workspaces`, `content_nodes`, `doc_versions`, `comments`,
  `memberships`). CRUD for documents and the tree. Swagger UI.
- **Day 2 — MDX Core (read / edit contexts).** Isolated `mdx-engine`: read-only
  rendering (for RSC and share) and edit mode. DOMPurify sanitization.
- **Day 3 — Next.js core (Host) & CI/CD.** App Router, Dashboard Layout, document
  tree in the sidebar, RSC for reading. GitHub Actions → Cloudflare Pages. CSP.
- **Day 4 — Editor as a Remote (Module Federation).** Extracting the editor and
  heavy panels into a Vite remote via `@module-federation/nextjs-mf`, an
  extensible registry.
- **Day 5 — Data Layer (TanStack Query + Zustand).** TS client from OpenAPI.
  Optimistic Updates on the tree (drag-and-drop, rename), autosave, tree cache.
  Zustand for UI and drafts.
- **Day 6 — Realtime + OAuth2 + security.** Durable Object `doc:<id>` +
  WebSocket: presence and collaborative editing (stage 1 — presence +
  single-writer; CRDT — optional). SSE for notifications/comments. GitHub OAuth2
  - HttpOnly sessions.
- **Day 7 — Version history, Senior-level README, and release.** Snapshots and
  rollback. Architectural description (edge realtime via Durable Objects, MF,
  MDX Core), links to Swagger UI and a live demo deployment.

---

## 9. Resume presentation (Senior Impact Statement)

**Architectural POC: Edge-Native Collaborative Docs & Knowledge Base (2026)**

Built a fault-tolerant real-time collaborative document editing platform on an
edge architecture with a configurable MDX core.

- **Real-time Collaboration on the Edge:** Implemented collaborative editing with
  presence and conflict-free merging of edits (CRDT) on Cloudflare Durable
  Objects + WebSocket with hibernation for cost efficiency, with no dependency on
  hosted realtime services.
- **Robust Data Layer (TanStack Query & Zustand):** Designed caching and server
  state synchronization for a hierarchical document tree with Optimistic Updates
  on drag-and-drop and lazy invalidation of dependent queries.
- **Configurable MDX Core:** Isolated MDX rendering engine with execution
  contexts (read / edit / share), reusable across applications.
- **Runtime Micro-frontends:** Extracted the resource-intensive editor into an
  independent Remote via Module Federation, keeping the content pages' bundle
  minimal and LCP/FCP high.
- **Enterprise Security & Contracts:** Protected the rendering of user-generated
  MDX from XSS via DOMPurify and strict CSP; developed using a contract-first
  approach on OpenAPI.
