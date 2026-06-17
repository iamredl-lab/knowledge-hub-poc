---
name: scaffold-package
description: Creates the scaffold for a new package in packages/ (package.json, tsconfig.json, src/index.ts) following packages/config conventions. Use when adding a new reusable package to the monorepo.
---

The `$ARGUMENTS` argument is the package name without scope (e.g.: "realtime-client").

1. Create `packages/$ARGUMENTS/package.json`:

   ```json
   {
     "name": "@collab-docs/$ARGUMENTS",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "main": "src/index.ts",
     "devDependencies": {
       "@collab-docs/tsconfig-base": "workspace:*",
       "@collab-docs/eslint-preset": "workspace:*",
       "typescript": "^5.7.0"
     }
   }
   ```

2. Create `packages/$ARGUMENTS/tsconfig.json`:

   ```json
   {
     "extends": "@collab-docs/tsconfig-base/base.json",
     "include": ["src"]
   }
   ```

3. Create `packages/$ARGUMENTS/src/index.ts` with a minimal placeholder export.
4. Run `pnpm install` so pnpm picks up the new workspace and links the
   `workspace:*` dependencies.
5. Don't add build/test tooling beyond what the user asked for — this is a scaffold,
   not a finished implementation.
