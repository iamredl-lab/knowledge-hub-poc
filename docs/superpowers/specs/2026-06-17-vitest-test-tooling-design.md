# Unit Test Tooling (Vitest + RTL) — Design

> Status: approved
> Date: 2026-06-17

## Context

The repo is fully bootstrapped (docs, CI skeleton, pnpm workspace, package
stubs) but no workspace has a test runner wired up yet. `apps/*` and
`packages/*` are still bare `package.json` stubs with no `src/`. Day 1
(data layer) and Day 2 (MDX core) are about to start, and Day 2's definition
of done explicitly requires unit tests (read/edit rendering, XSS
sanitization via `isomorphic-dompurify`) — so test tooling needs to exist
before that work begins.

`.claude/rules/testing.md` already constrains the approach for one
workspace: Worker routes in `apps/api` must be tested via `wrangler`'s
`unstable_dev`/Miniflare, not manual mocks of D1/Durable Object bindings.
`.oxlintrc.json` already has a lint override for test files with
`"env": { "vitest": true }` — Vitest was the anticipated runner before this
task started.

## Decision: Vitest everywhere, not Jest

Although the request named "RTL, Jest, etc.", we're standardizing on
**Vitest** (with React Testing Library, which is runner-agnostic) across all
in-scope workspaces instead of mixing Jest and Vitest:

- `apps/editor` is Vite-based — Vitest reuses Vite's transform pipeline
  natively.
- `apps/api` needs Vitest regardless, via `@cloudflare/vitest-pool-workers`,
  to satisfy the existing testing.md rule (Jest cannot drive the Workers
  runtime).
- RTL behaves identically under either runner.
- `.oxlintrc.json` already assumes Vitest globals in test files.
- One runner monorepo-wide means one shared preset and one mental model
  instead of two test ecosystems for a 5-workspace POC.

## Scope matrix

| Workspace                               | Runner                                     | Smoke test                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/kb`                               | Vitest + jsdom + RTL                       | inline RTL render test                                    | Next.js's own build/bundler is untouched; Vitest is test-only tooling, the same pattern Next.js's own docs use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `apps/editor`                           | Vitest + jsdom + RTL                       | inline RTL render test                                    | No `vite.config.ts` exists yet (that's Day 4/Module Federation work) — gets its own standalone `vitest.config.ts` for now; can be merged into `vite.config.ts` later if desired                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `packages/ui`                           | Vitest + jsdom + RTL                       | inline RTL render test                                    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `packages/mdx-engine`                   | Vitest, node environment                   | **real** XSS-sanitization test via `isomorphic-dompurify` | Not throwaway — this is the exact "mandatory XSS test" testing.md already requires, so `isomorphic-dompurify` is added as a real dependency now, ahead of Day 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `apps/api`                              | Vitest + `@cloudflare/vitest-pool-workers` | none (config only, no `test` script)                      | `@cloudflare/vitest-pool-workers` loads the real Worker entry for _every_ test file in the workspace — even ones that don't touch bindings — so it needs a placeholder `DocRoom` Durable Object class to satisfy the binding declared in `wrangler.toml` before any test, even an empty one, can run. ADR-0002 makes clear that class is real Day 1/Day 6 design work (WebSocket Hibernation API, presence), not test scaffolding. So `vitest.config.ts` + devDependencies are added now (saves Day 1 setup work), but no `"test"` script is wired into `package.json` yet — `pnpm -r test` simply skips workspaces with no `test` script, so this doesn't break CI. The script gets added alongside the real entry point in Day 1/Day 6. |
| `packages/db`, `packages/api-contracts` | — (deferred)                               | —                                                         | Pure schema/type stubs with no branching logic yet; testing.md says plain configs don't need tests. Add Vitest config later when real logic (e.g. zod validation) lands                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Inline RTL smoke tests render a bare probe element directly in the test
file (no invented component API), e.g.:

```tsx
render(<div data-testid="probe">ok</div>);
expect(screen.getByTestId("probe")).toHaveTextContent("ok");
```

This proves jsdom + RTL + jest-dom matchers + JSX transform work for that
workspace without inventing fake package source files ahead of when the
real components are designed.

## Shared config package: `packages/config/vitest-base`

Mirrors the existing `packages/config/tsconfig-base` convention (a small,
private, unbuilt package consumed via `exports` subpaths):

```
packages/config/vitest-base/
  package.json     # @collab-docs/vitest-base, private, exports "./setup" and "./base"
  setup.ts          # import "@testing-library/jest-dom"; afterEach(() => cleanup())
  base.ts           # shared defineConfig: coverage (v8 provider, text+html reporters), test.globals = true
```

- `test.globals = true` makes `describe/it/expect` ambient, matching
  `.oxlintrc.json`'s existing `"env": { "vitest": true }` test-file
  override.
- `apps/kb`, `apps/editor`, `packages/ui` each have a `vitest.config.ts`
  that does:
  ```ts
  export default mergeConfig(
    baseConfig,
    defineConfig({
      plugins: [react()],
      test: { environment: "jsdom", setupFiles: ["@collab-docs/vitest-base/setup"] },
    }),
  );
  ```
- `packages/mdx-engine` merges the same `baseConfig` but with
  `environment: "node"` and no RTL setup file (no React rendering yet).
- `apps/api` does **not** use `vitest-base` — `@cloudflare/vitest-pool-workers`
  uses its own `defineWorkersConfig` shape and different coverage
  constraints (istanbul, not v8), so it stays fully independent. This is
  consistent with testing.md already singling out `apps/api` as a special
  case.

## Adjacent fix: missing `tsconfig.json` per workspace

None of `apps/kb`, `apps/editor`, `packages/ui`, `packages/mdx-engine`, or
`apps/api` have their own `tsconfig.json` yet — only the shared
`packages/config/tsconfig-base` package exists. The new `.test.tsx` files
need `"jsx": "react-jsx"` and `"types": ["vitest/globals"]` to type-check
and lint cleanly, so each of these 5 workspaces gets a minimal
`tsconfig.json` extending `@collab-docs/tsconfig-base/base.json` as part of
this task. `packages/db` and `packages/api-contracts` are intentionally not
touched (out of scope, see above).

## Out of scope / deferred

- `packages/db`, `packages/api-contracts` test wiring — no logic to test
  yet.
- `apps/api` smoke test — needs a real `DocRoom` stub, which is Day 1/6
  implementation work, not test tooling.
- Wiring tests into `husky` pre-commit/pre-push hooks — not requested;
  pre-commit currently only runs `lint-staged` (formatting/linting), and
  `pnpm -r test` already runs in CI via `.github/workflows/ci.yml` with no
  changes needed there.
- A root `vitest.workspace.ts` aggregator — the repo already aggregates
  per-workspace scripts via `pnpm -r <script>` (see `lint`, `typecheck`,
  `build`); introducing a second aggregation pattern just for tests would be
  inconsistent with that.

## Verification

- `pnpm install` resolves cleanly.
- `pnpm -r test` (root) runs all 4 smoke tests (kb, editor, ui, mdx-engine)
  and they pass; `apps/api` and `packages/db`/`api-contracts` are silently
  skipped (no `test` script), so this doesn't regress CI.
- `pnpm -r typecheck` and `pnpm lint` stay green with the new
  `tsconfig.json` files and test files in place.
