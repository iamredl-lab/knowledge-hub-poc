# What and How to Test

- Logic with branching (MDX parsing, sanitization, RBAC checks, CRDT delta merging) —
  via TDD: test before implementation.
- Plain configs and package skeletons without logic — don't require tests.
- Worker routes (`apps/api`) — via `wrangler`'s `unstable_dev`/Miniflare, not manual
  mocks of Cloudflare bindings: otherwise a test can pass green while the D1/DO
  binding is actually broken.
- MDX rendering (`packages/mdx-engine`) — a mandatory test for an XSS payload via
  `isomorphic-dompurify` is required; this is not an optional edge case, but the main
  reason sanitization exists.
