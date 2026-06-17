# Vitest Test Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Vitest (+ RTL where applicable) as the test runner for `apps/kb`, `apps/editor`, `packages/ui`, `packages/mdx-engine`, and `apps/api`, per `docs/superpowers/specs/2026-06-17-vitest-test-tooling-design.md`.

**Architecture:** A new private, unbuilt `packages/config/vitest-base` package (mirroring the existing `packages/config/tsconfig-base` convention) exports a shared `defineConfig` (`./base`) and an RTL setup file (`./setup`) via package.json `exports` subpaths. `apps/kb`, `apps/editor`, and `packages/ui` merge this base config with `jsdom` + `@vitejs/plugin-react` and get an inline RTL smoke test. `packages/mdx-engine` merges the same base config with a `node` environment and gets a real XSS-sanitization test against `isomorphic-dompurify`. `apps/api` is fully independent (uses `@cloudflare/vitest-pool-workers`'s `cloudflareTest` Vite plugin, not `vitest-base`) and gets only config + a placeholder `DocRoom` Durable Object class — no test file, no `test` script (deferred to Day 1/6). Five workspaces each get a minimal `tsconfig.json` extending `packages/config/tsconfig-base/base.json` **via a relative path** (see the note after the dependency table — a bare `@collab-docs/tsconfig-base/base.json` package-specifier `extends` does not resolve under Vite 8's default transform).

> **Note (discovered during Task 1 execution, applies to every task below):** `tsconfig.json`'s `extends` must be a relative filesystem path to `packages/config/tsconfig-base/base.json`, never the `@collab-docs/tsconfig-base/base.json` package specifier. Vite 8's default Oxc/Rolldown transform has its own Rust-based tsconfig resolver that does not support `extends` via a bare npm package specifier (only relative paths) — it throws `[TSCONFIG_ERROR] Tsconfig not found`, even though `tsc` itself resolves the package-specifier form fine. The documented escape hatch (`oxc: false`, falling back to the esbuild transform) does **not** reliably work either: `@vitejs/plugin-react@6.0.2`'s `config()` hook unconditionally returns its own `oxc` object on every build, and Vite's plugin config-merge pipeline lets that object silently clobber a user's `oxc: false` because the merge only special-cases two objects, not `false` vs. an object. A relative-path `extends` sidesteps both problems and resolves identically under either transform — every code block below already uses the relative-path form; do not "simplify" it back to the package specifier.

**Tech Stack:** Vitest 4.1.x, `@testing-library/react` 16.x + `@testing-library/jest-dom` 6.x, jsdom 29.x, `@vitejs/plugin-react` 6.x, `isomorphic-dompurify` 3.x, `@cloudflare/vitest-pool-workers` 0.16.x, `@cloudflare/workers-types` 4.x.

## Global Constraints

- Vitest is the runner for every in-scope workspace — no Jest anywhere (design decision, see spec "Decision" section).
- `test.globals = true` everywhere a Vitest config is added, matching `.oxlintrc.json`'s existing `"env": { "vitest": true }` test-file override (`apps/kb/**`, `apps/editor/**`, `packages/ui/**`, `packages/mdx-engine/**` files matching `**/*.test.*`).
- `apps/api` does **not** consume `packages/config/vitest-base` — it stays fully independent (different plugin API, different coverage constraints).
- `packages/db`, `packages/api-contracts` are out of scope — do not add tsconfig.json, vitest config, or dependencies to either.
- `apps/api` gets **no** `"test"` script in `package.json` in this plan — config and devDependencies only; the script is added alongside the real Worker entry point in Day 1/Day 6.
- No root `vitest.workspace.ts` — the repo aggregates per-workspace scripts via `pnpm -r <script>` only (`lint`, `typecheck`, `build` already follow this pattern).
- Any rendering of user-supplied MDX must go through `isomorphic-dompurify`, no exceptions (root `CLAUDE.md` hard rule).
- Do not commit `wrangler.toml` secrets; do not change the existing `database_id` / KV `id` / `compatibility_date` values in `apps/api/wrangler.toml` (root `CLAUDE.md` hard rule + out of scope for this plan).
- Linting/formatting stays on the single root `.oxlintrc.json` / `.oxfmtrc.json` config — do not add any per-workspace lint or format config (`docs/instructions/coding-conventions.md`).
- TypeScript strict — every new `tsconfig.json` extends `packages/config/tsconfig-base/base.json` via a relative path (which extends root `tsconfig.base.json`), per existing convention. Use a relative path, not the `@collab-docs/tsconfig-base/base.json` package specifier — see the note under Architecture above.
- Commit format: `type: short description` using only `feat`/`fix`/`docs`/`chore`/`refactor`/`ci`; explain _why_, never list files/functions in the body (`.claude/rules/commit-style.md`).
- `engines.node: ">=24"`, `packageManager: pnpm@9.15.0` (root `package.json`) — all added packages must be compatible (verified below).

## Pinned dependency versions (verified against npm registry + peer constraints)

| Package                             | Version                | Note                                                                                                                                                                                                                 |
| ----------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest`                            | `^4.1.9`               | peer `vite: ^6\|\|^7\|\|^8` — satisfied by vitest's own bundled `vite` dep, no explicit `vite` devDependency needed                                                                                                  |
| `@vitest/coverage-v8`               | `^4.1.9`               | vitest's peer pins this to exact `4.1.9`                                                                                                                                                                             |
| `@testing-library/react`            | `^16.3.2`              | peers `react`, `react-dom`, `@testing-library/dom`, `@types/react`, `@types/react-dom` — none are bundled, all added explicitly                                                                                      |
| `@testing-library/jest-dom`         | `^6.9.1`               | no peers                                                                                                                                                                                                             |
| `@testing-library/dom`              | `^10.4.1`              | peer of `@testing-library/react`                                                                                                                                                                                     |
| `react` / `react-dom`               | `^19.2.7`              |                                                                                                                                                                                                                      |
| `@types/react` / `@types/react-dom` | `^19.2.17` / `^19.2.3` |                                                                                                                                                                                                                      |
| `jsdom`                             | `^29.1.1`              | matches `isomorphic-dompurify`'s own `jsdom` dependency version                                                                                                                                                      |
| `@vitejs/plugin-react`              | `^6.0.2`               | peer `vite: ^8.0.0`, satisfied transitively via vitest's bundled `vite`                                                                                                                                              |
| `isomorphic-dompurify`              | `^3.17.0`              | real `dependencies` entry for `packages/mdx-engine`, not a devDependency                                                                                                                                             |
| `@cloudflare/vitest-pool-workers`   | `^0.16.16`             | peer `vitest: ^4.1.0` — exports `cloudflareTest`/`cloudflarePool`; **does not export `defineWorkersConfig`** (that's the older v3 API, removed in this version — the package even ships a `vitest-v3-to-v4` codemod) |
| `@cloudflare/workers-types`         | `^4.20260617.1`        | use the `/latest` subpath in `tsconfig.json` `types` (no dated snapshot exists for `compatibility_date = "2026-06-17"` yet)                                                                                          |

## File Structure

```
packages/config/vitest-base/
  package.json       # @collab-docs/vitest-base, exports "./base" and "./setup"
  base.ts             # shared defineConfig: globals, v8 coverage
  setup.ts            # imports jest-dom matchers, afterEach(cleanup)
apps/kb/{tsconfig.json,vitest.config.ts,test/smoke.test.tsx}
apps/editor/{tsconfig.json,vitest.config.ts,test/smoke.test.tsx}
packages/ui/{tsconfig.json,vitest.config.ts,test/smoke.test.tsx}
packages/mdx-engine/{tsconfig.json,vitest.config.ts,test/sanitize.test.ts}
apps/api/{tsconfig.json,vitest.config.mts,src/index.ts,wrangler.toml (placeholder IDs fixed)}
```

---

### Task 1: Shared `vitest-base` package + `apps/kb` wiring

**Files:**

- Create: `packages/config/vitest-base/package.json`
- Create: `packages/config/vitest-base/base.ts`
- Create: `packages/config/vitest-base/setup.ts`
- Modify: `apps/kb/package.json`
- Create: `apps/kb/tsconfig.json`
- Create: `apps/kb/vitest.config.ts`
- Create: `apps/kb/test/smoke.test.tsx`

**Interfaces:**

- Produces: `@collab-docs/vitest-base` package, importable as `@collab-docs/vitest-base/base` (named export `baseConfig: UserConfig`, from `defineConfig`) and `@collab-docs/vitest-base/setup` (side-effecting module — imports jest-dom matchers and registers an `afterEach` RTL cleanup; no exports). Tasks 2-4 consume both subpaths the same way.

- [ ] **Step 1: Create the shared config package**

`packages/config/vitest-base/package.json`:

```json
{
  "name": "@collab-docs/vitest-base",
  "version": "0.1.0",
  "private": true,
  "exports": {
    "./base": "./base.ts",
    "./setup": "./setup.ts"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "vitest": "^4.1.9"
  }
}
```

`packages/config/vitest-base/base.ts`:

```ts
import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
```

`packages/config/vitest-base/setup.ts`:

```ts
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 2: Wire up `apps/kb`**

`apps/kb/package.json`:

```json
{
  "name": "@collab-docs/kb",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@collab-docs/tsconfig-base": "workspace:*",
    "@collab-docs/vitest-base": "workspace:*",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "@vitest/coverage-v8": "^4.1.9",
    "jsdom": "^29.1.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "vitest": "^4.1.9"
  }
}
```

`apps/kb/tsconfig.json`:

```json
{
  "extends": "../../packages/config/tsconfig-base/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

`apps/kb/vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["@collab-docs/vitest-base/setup"],
    },
  }),
);
```

`apps/kb/test/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

it("renders into jsdom", () => {
  render(<div data-testid="probe">ok</div>);
  expect(screen.getByTestId("probe")).toHaveTextContent("ok");
});
```

- [ ] **Step 3: Install and run**

Run: `pnpm install`
Expected: resolves cleanly, no `ERR_PNPM_*` failures.

Run: `pnpm --filter @collab-docs/kb test`
Expected: `Test Files  1 passed (1)` / `Tests  1 passed (1)`, exit code 0.

- [ ] **Step 4: Format and lint**

Run: `pnpm fmt && pnpm fmt:check && pnpm lint`
Expected: `fmt` rewrites nothing unexpected (or auto-fixes new-file style), `fmt:check` and `lint` both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/config/vitest-base apps/kb/package.json apps/kb/tsconfig.json apps/kb/vitest.config.ts apps/kb/test/smoke.test.tsx pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add Vitest tooling and shared vitest-base config, starting with apps/kb

Day 2's MDX core work requires working unit-test tooling before it starts;
apps/kb is the first consumer of the shared packages/config/vitest-base
preset (mirrors the existing tsconfig-base convention).
EOF
)"
```

---

### Task 2: Wire up `apps/editor`

**Files:**

- Modify: `apps/editor/package.json`
- Create: `apps/editor/tsconfig.json`
- Create: `apps/editor/vitest.config.ts`
- Create: `apps/editor/test/smoke.test.tsx`

**Interfaces:**

- Consumes: `@collab-docs/vitest-base/base` (`baseConfig`), `@collab-docs/vitest-base/setup` (Task 1).

- [ ] **Step 1: Wire up the workspace**

`apps/editor/package.json`:

```json
{
  "name": "@collab-docs/editor",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@collab-docs/tsconfig-base": "workspace:*",
    "@collab-docs/vitest-base": "workspace:*",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "@vitest/coverage-v8": "^4.1.9",
    "jsdom": "^29.1.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "vitest": "^4.1.9"
  }
}
```

`apps/editor/tsconfig.json` (identical shape to `apps/kb/tsconfig.json`):

```json
{
  "extends": "../../packages/config/tsconfig-base/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

`apps/editor/vitest.config.ts` (identical shape to `apps/kb/vitest.config.ts`):

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["@collab-docs/vitest-base/setup"],
    },
  }),
);
```

`apps/editor/test/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

it("renders into jsdom", () => {
  render(<div data-testid="probe">ok</div>);
  expect(screen.getByTestId("probe")).toHaveTextContent("ok");
});
```

- [ ] **Step 2: Install and run**

Run: `pnpm install`
Expected: resolves cleanly.

Run: `pnpm --filter @collab-docs/editor test`
Expected: `Test Files  1 passed (1)`, exit code 0.

- [ ] **Step 3: Format and lint**

Run: `pnpm fmt && pnpm fmt:check && pnpm lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/editor/package.json apps/editor/tsconfig.json apps/editor/vitest.config.ts apps/editor/test/smoke.test.tsx pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add Vitest + RTL smoke test for apps/editor

apps/editor has no vite.config.ts yet (Module Federation lands Day 4), so
it gets its own standalone vitest.config.ts reusing the shared vitest-base
preset, same as apps/kb.
EOF
)"
```

---

### Task 3: Wire up `packages/ui`

**Files:**

- Modify: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/test/smoke.test.tsx`

**Interfaces:**

- Consumes: `@collab-docs/vitest-base/base` (`baseConfig`), `@collab-docs/vitest-base/setup` (Task 1).

- [ ] **Step 1: Wire up the workspace**

`packages/ui/package.json`:

```json
{
  "name": "@collab-docs/ui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@collab-docs/tsconfig-base": "workspace:*",
    "@collab-docs/vitest-base": "workspace:*",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "@vitest/coverage-v8": "^4.1.9",
    "jsdom": "^29.1.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "vitest": "^4.1.9"
  }
}
```

`packages/ui/tsconfig.json` (identical shape, note the shallower relative path — `packages/ui` is one level closer to `packages/config` than `apps/kb` is):

```json
{
  "extends": "../config/tsconfig-base/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

`packages/ui/vitest.config.ts` (identical shape):

```ts
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["@collab-docs/vitest-base/setup"],
    },
  }),
);
```

`packages/ui/test/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

it("renders into jsdom", () => {
  render(<div data-testid="probe">ok</div>);
  expect(screen.getByTestId("probe")).toHaveTextContent("ok");
});
```

- [ ] **Step 2: Install and run**

Run: `pnpm install`
Expected: resolves cleanly.

Run: `pnpm --filter @collab-docs/ui test`
Expected: `Test Files  1 passed (1)`, exit code 0.

- [ ] **Step 3: Format and lint**

Run: `pnpm fmt && pnpm fmt:check && pnpm lint`
Expected: both exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/package.json packages/ui/tsconfig.json packages/ui/vitest.config.ts packages/ui/test/smoke.test.tsx pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add Vitest + RTL smoke test for packages/ui

Same shared vitest-base preset as apps/kb and apps/editor, proving the
package builds out a working jsdom + RTL pipeline before any real
component lands in it.
EOF
)"
```

---

### Task 4: Wire up `packages/mdx-engine` (real XSS sanitization test)

**Files:**

- Modify: `packages/mdx-engine/package.json`
- Create: `packages/mdx-engine/tsconfig.json`
- Create: `packages/mdx-engine/vitest.config.ts`
- Create: `packages/mdx-engine/test/sanitize.test.ts`

**Interfaces:**

- Consumes: `@collab-docs/vitest-base/base` (`baseConfig`) — no `setupFiles`, no RTL (no React rendering yet, per spec).

This is the one test in this plan that exercises real behavior (`isomorphic-dompurify` actually stripping a script tag), not just tooling wiring — `.claude/rules/testing.md` calls this test mandatory.

- [ ] **Step 1: Write the test first**

`packages/mdx-engine/test/sanitize.test.ts`:

```ts
import DOMPurify from "isomorphic-dompurify";

it("strips script tags from untrusted MDX-rendered HTML", () => {
  const dirty = '<p>hello</p><script>alert("xss")</script>';
  const clean = DOMPurify.sanitize(dirty);

  expect(clean).not.toContain("<script>");
  expect(clean).toContain("<p>hello</p>");
});
```

- [ ] **Step 2: Add the workspace config and dependency**

`packages/mdx-engine/package.json`:

```json
{
  "name": "@collab-docs/mdx-engine",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test": "vitest run"
  },
  "dependencies": {
    "isomorphic-dompurify": "^3.17.0"
  },
  "devDependencies": {
    "@collab-docs/tsconfig-base": "workspace:*",
    "@collab-docs/vitest-base": "workspace:*",
    "@vitest/coverage-v8": "^4.1.9",
    "vitest": "^4.1.9"
  }
}
```

`packages/mdx-engine/tsconfig.json` (same depth as `packages/ui`, see its note above):

```json
{
  "extends": "../config/tsconfig-base/base.json",
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

`packages/mdx-engine/vitest.config.ts`:

```ts
import { defineConfig, mergeConfig } from "vitest/config";
import { baseConfig } from "@collab-docs/vitest-base/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
);
```

- [ ] **Step 3: Run and verify the test passes**

Run: `pnpm install && pnpm --filter @collab-docs/mdx-engine test`
Expected: `Test Files  1 passed (1)`, exit code 0. (`isomorphic-dompurify` is a correct, already-working library — this confirms the dependency and node-environment wiring are correct, not custom sanitization logic.)

- [ ] **Step 4: Format and lint**

Run: `pnpm fmt && pnpm fmt:check && pnpm lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/mdx-engine/package.json packages/mdx-engine/tsconfig.json packages/mdx-engine/vitest.config.ts packages/mdx-engine/test/sanitize.test.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add real XSS-sanitization test for packages/mdx-engine

testing.md requires a mandatory XSS-payload test via isomorphic-dompurify
ahead of Day 2's MDX core work, not as an optional edge case — adding the
real dependency and test now instead of a throwaway smoke test.
EOF
)"
```

---

### Task 5: Wire up `apps/api` (config + placeholder `DocRoom`, no test script)

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/wrangler.toml` (placeholder IDs only — see note below; do not touch `compatibility_date`)
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.mts` (note: `.mts`, not `.ts` — see note below)
- Create: `apps/api/src/index.ts`

> **Note (discovered during Task 5 execution):** two more pre-existing/upstream issues, both confirmed and resolved — apply both, they are not optional:
>
> 1. **Config file must be `.mts`, not `.ts`.** `@cloudflare/vitest-pool-workers` is ESM-only (no CJS export). Vite 8's config loader decides ESM vs. CJS bundling for `vitest.config.ts` by checking the nearest `package.json`'s `"type"` field; since no `package.json` in this repo sets `"type": "module"`, Vite bundles the config as CJS, and `require()`-ing an ESM-only package crashes config loading (`Error: Failed to resolve "@cloudflare/vitest-pool-workers". This package is ESM only but it was tried to load by require.`). Naming the file `vitest.config.mts` forces ESM loading via Vite's filename fast path, with zero change to file content. (This is unrelated to the `oxc`/tsconfig-extends issue from Task 1 — `apps/kb`/`apps/editor`/`packages/ui` don't hit this because `@vitejs/plugin-react` ships a CJS build; `@cloudflare/vitest-pool-workers` does not.)
> 2. **`apps/api/wrangler.toml`'s placeholder `database_id = ""` and `kv_namespaces[0].id = ""` are invalid, not just unprovisioned.** Wrangler's own config validator rejects an empty string for these fields (`"kv_namespaces[0]" bindings should have a string "id" field but got {"binding":"CACHE","id":""}`) — this blocks Miniflare from starting at all, before any test runs. The human approved changing both to the placeholder string `"local"` (confirmed sufficient to pass validation for local/Miniflare-simulated D1 and KV — it does not provision or reference any real Cloudflare resource). `compatibility_date` is untouched — only these two `id`/`database_id` fields change.

**Interfaces:**

- Produces: `DocRoom` class (placeholder, satisfies the `durable_objects.bindings` entry in `apps/api/wrangler.toml` — `class_name = "DocRoom"`) and a default `fetch` handler. Both are throwaway placeholders; the real implementation (WebSocket Hibernation API, presence) is Day 1/Day 6 work per ADR-0002 — do not add behavior beyond what's needed to make the Worker entry module load.
- Does **not** consume `@collab-docs/vitest-base` (independent config, per spec).

`@cloudflare/vitest-pool-workers` loads the _real_ Worker entry (`apps/api/wrangler.toml`'s `main = "src/index.ts"`) for every test file in this workspace, even ones that don't touch bindings — so the entry must exist and export a class matching the `DOC_ROOM` binding's `class_name` before any test (even an empty one) can run.

- [ ] **Step 1: Add the placeholder Worker entry**

`apps/api/src/index.ts`:

```ts
export class DocRoom implements DurableObject {
  fetch(): Response | Promise<Response> {
    return new Response("Not implemented", { status: 501 });
  }
}

export default {
  fetch(): Response | Promise<Response> {
    return new Response("Not implemented", { status: 501 });
  },
};
```

- [ ] **Step 2: Add config and dependencies**

`apps/api/package.json`:

```json
{
  "name": "@collab-docs/api",
  "version": "0.1.0",
  "private": true,
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.16.16",
    "@cloudflare/workers-types": "^4.20260617.1",
    "@collab-docs/tsconfig-base": "workspace:*",
    "vitest": "^4.1.9"
  }
}
```

Note: no `"test"` script — deferred to Day 1/Day 6 alongside the real entry point, per spec. `pnpm -r test` silently skips workspaces with no `test` script, so this does not regress CI.

`apps/api/tsconfig.json` (same depth as `apps/kb`, see the relative-path note under Architecture):

```json
{
  "extends": "../../packages/config/tsconfig-base/base.json",
  "compilerOptions": {
    "types": [
      "@cloudflare/workers-types/latest",
      "@cloudflare/vitest-pool-workers/types",
      "vitest/globals"
    ]
  }
}
```

`apps/api/vitest.config.mts` (note the `.mts` extension — see note above):

```ts
import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
    }),
  ],
  test: {
    globals: true,
  },
});
```

`apps/api/wrangler.toml` (2-line change, see note above):

```diff
 [[d1_databases]]
 binding = "DB"
 database_name = "collab-docs-db"
-database_id = ""
+database_id = "local"

 [[durable_objects.bindings]]
 name = "DOC_ROOM"
 class_name = "DocRoom"

 [[kv_namespaces]]
 binding = "CACHE"
-id = ""
+id = "local"
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`
Expected: resolves cleanly.

- [ ] **Step 4: Ad-hoc verify the config actually loads the Worker + binding (throwaway test, not committed)**

Create a temporary file `apps/api/src/verify.test.ts`:

```ts
import { env } from "cloudflare:test";

it("loads the worker entry and the DOC_ROOM binding", () => {
  expect(env.DOC_ROOM).toBeDefined();
});
```

Run: `pnpm --filter @collab-docs/api exec vitest run`
Expected: `Test Files  1 passed (1)`, exit code 0 — this confirms Miniflare successfully loaded `src/index.ts`, resolved the `DocRoom` binding, and ran inside the Workers runtime. (Confirmed working with the `.mts` rename and the `wrangler.toml` placeholder-ID fix above already applied — `Duration  1.21s`, no errors.)

If this fails with a `compatibility_date` error (the bundled Miniflare/workerd version may lag behind `wrangler.toml`'s `compatibility_date = "2026-06-17"`), **do not edit `compatibility_date`** — that value is out of scope for this plan (root `CLAUDE.md` only allows touching `wrangler.toml` for non-secret values, but changing `compatibility_date` is a product decision, not test-tooling). Stop and report the exact error instead.

- [ ] **Step 5: Delete the throwaway test**

Run: `rm apps/api/src/verify.test.ts`

This file must not be committed — the spec defers any committed `apps/api` test (and the `test` script) to Day 1/Day 6.

- [ ] **Step 6: Format and lint**

Run: `pnpm fmt && pnpm fmt:check && pnpm lint`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/api/package.json apps/api/wrangler.toml apps/api/tsconfig.json apps/api/vitest.config.mts apps/api/src/index.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add Vitest config and placeholder DocRoom for apps/api

@cloudflare/vitest-pool-workers needs to load a real Worker entry that
satisfies the DOC_ROOM durable_objects binding before any test can run.
The placeholder unblocks test-tooling setup now; the real Durable Object
(WebSocket Hibernation API, presence) is Day 1/Day 6 work per ADR-0002, so
no test script is wired up yet. wrangler.toml's database_id/KV id also
needed real (if placeholder) values since wrangler's own config validator
rejects empty strings, blocking Miniflare before any test could even start.
EOF
)"
```

---

### Task 6: Full-repo verification gate

**Files:** none (verification only).

- [ ] **Step 1: Clean install from the lockfile**

Run: `pnpm install --frozen-lockfile`
Expected: exit 0, no lockfile drift.

- [ ] **Step 2: Format check**

Run: `pnpm fmt:check`
Expected: exit 0.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: exit 0 (no `error`-level findings; `warn`-level `suspicious`/`perf` findings are acceptable per `.oxlintrc.json`).

- [ ] **Step 4: Typecheck (confirm this stays a no-op, as before)**

Run: `pnpm -r typecheck`
Expected: exit 0 — no workspace has a `typecheck` script yet anywhere in the repo (pre-existing gap, out of scope for this plan), so this is unaffected by the new files.

- [ ] **Step 5: Run all tests**

Run: `pnpm -r test`
Expected: exit 0. `apps/kb`, `apps/editor`, `packages/ui`, `packages/mdx-engine` each report `1 passed`; `apps/api`, `packages/db`, `packages/api-contracts` are silently skipped (no `test` script).

- [ ] **Step 6: Build (confirm this stays a no-op, as before)**

Run: `pnpm -r build`
Expected: exit 0 — no workspace has a `build` script yet either (pre-existing, out of scope), unaffected by this plan.

- [ ] **Step 7: Confirm working tree is clean**

Run: `git status`
Expected: nothing to commit (all 5 task commits already made; no leftover throwaway files from Task 5 Step 4).
