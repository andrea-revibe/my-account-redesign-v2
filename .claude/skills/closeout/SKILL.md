---
name: closeout
description: Update the code map, the right per-feature doc, and the changelog
  after a feature is verified. Use when I say the feature works and we are
  wrapping up.
context: fork
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---
Update the project docs for the feature just completed. Work from what changed
in this session — do not re-read implementation files you don't need.

**Read `CLAUDE.md` first** (you're forked, so it isn't auto-loaded). Its
**§ Doc update protocol** holds the canonical change→doc **triage table** — that
table is the source of truth, not a copy in this skill. Match the change to its
row and update ONLY that doc + `CHANGELOG.md`. Don't blanket-update everything;
an internal refactor with no UX change updates neither.

Then, in order:

1. **Code map** — if you added/moved/renamed a file or export or changed
   imports, run `npm run codemap` (regenerates the generated half of
   `docs/code_map.md`). If the change introduced a new concept or string
   contract, add a curated row above the generator marker (_Where is X_ or the
   coupling table). Never hand-edit below the marker.
2. **The one per-feature doc** the triage table points to — update its prose,
   and bump its `verified_against` frontmatter to the new HEAD commit
   (`git rev-parse --short HEAD`); you re-verified its claims against the code
   you just changed.
3. **`CHANGELOG.md`** — prepend a one-line flat bullet to the top
   `## Unreleased` block (no Added/Changed/Removed buckets). The bullet names
   the change; the diff and the doc carry the detail.

Notification copy (`src/data/notifications/*`) is owner-only — never edit it.

Return ONLY:
- the list of files you changed
- a 3-line summary of what was documented
