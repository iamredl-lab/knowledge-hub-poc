---
name: new-adr
description: Creates a new Architecture Decision Record in docs/adr/ from a template with the next sequential number. Use when a non-trivial architectural decision with alternatives has been made.
---

The `$ARGUMENTS` argument is the decision slug (e.g.: "yjs-vs-automerge").

1. Look at the existing `docs/adr/NNNN-*.md` files and find the highest `NNNN` number.
2. Copy `docs/adr/TEMPLATE.md` to `docs/adr/<next number, 4 digits>-$ARGUMENTS.md`.
3. Fill in today's date in the `Date:` field and leave `Status: proposed` unless the
   user has explicitly said the decision has already been accepted.
4. Don't fill in the "Alternatives Considered" and "Decision" sections with made-up
   content — gather the real alternatives and arguments from the current conversation
   with the user; if there isn't enough, ask instead of inventing plausible-looking
   content.
