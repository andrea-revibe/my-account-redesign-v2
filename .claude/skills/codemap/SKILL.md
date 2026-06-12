---
name: codemap
description: Regenerate docs/code_map.md after a structural change, and add a
  curated row if the change introduced a new concept or string contract. Use
  after adding/moving/renaming a file or export, or changing imports.
allowed-tools: Read, Edit, Grep, Glob, Bash
---
Keep `docs/code_map.md` — the navigation + impact layer agents read before
exploring — in sync with the source.

The doc has two halves split by a generator marker: a **curated** half above
(the _Where is X_ concept→module table, the _Coupling the import graph can't
see_ string-contract table, the "why" pointers) and a **generated** half below
(_Module index_ with every export + line + LOC, the dependency/_Shared-core
consumers_ blast-radius tables). The generated half is rebuilt by the script;
the curated half is hand-maintained.

**Step 1 — Regenerate.** Run `npm run codemap` (`node scripts/codemap.mjs`). It
rewrites only the generated block below the marker. Never hand-edit that block.

**Step 2 — Curate, only if warranted.** A regeneration alone covers
moved/renamed/added files and changed imports. Add or adjust a row in the
curated half ONLY when the change introduced something the generator can't see:
- a **new concept/feature** a future agent would look up → add a _Where is X_
  row (concept → module(s) → why-doc).
- a **new string contract** — a literal value written in `data/`/flow code and
  switched on elsewhere with no import edge between them (e.g. a new `statusId`,
  `subStatusId`, claim `state`, country tag, journey `event`) → add a row to the
  coupling table listing where it's written, where it's switched on, and what
  to touch when adding/renaming a value.

If the change was purely mechanical (a rename the generator already reflects),
stop after Step 1 — don't pad the curated half.

**Step 3 — Report.** Confirm the map regenerated and name any curated row you
added or changed (or that none was needed).
