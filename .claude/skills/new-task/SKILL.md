---
name: new-task
description: Creates a task file in docs/tasks/ following a unified template (context → definition of done → affected packages). Use when a new development task needs to be created.
---

The `$ARGUMENTS` argument is the task topic (e.g.: "day-08-rag-export" or
"fix-flaky-realtime-test").

1. Turn `$ARGUMENTS` into a kebab-case slug for the file name. If the slug already
   looks like `day-NN-...`, leave it as is.
2. Create `docs/tasks/<slug>.md` with the following structure:

   ```markdown
   # <Human-readable title>

   ## Context

   <why this task exists, what depends on it, or what it unblocks>

   ## Definition of Done

   - [ ] ...

   ## Affected Packages

   `apps/...`, `packages/...`
   ```

3. Don't invent the definition of done in the abstract — base it on real context from
   `docs/poc-specs/` and `docs/adr/` if the task is related to them.
4. If a file with that name already exists — ask the user whether to update it or
   choose another name; don't silently overwrite it.
