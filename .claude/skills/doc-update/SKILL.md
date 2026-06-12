---
name: doc-update
description: Route a change to the exact docs it affects and update only those.
  Use ad-hoc when code and docs have diverged outside a feature wrap-up — "I
  changed X, which docs need updating?"
allowed-tools: Read, Edit, Grep, Glob, Bash
---
Route a change to the right docs and update **only those** — the discipline is
"touch the matching row, nothing else." This is the standalone version of the
doc-update protocol for when there's no clean feature boundary (a refactor that
leaked UX, a copy tweak, a drift you noticed). For end-of-feature wrap-up use
`closeout`; for marker-driven drift detection use `freshness`.

Change to document: $ARGUMENTS
(If empty, infer it from this session's diff: `git diff --stat` / `git status`.)

**Step 1 — Classify the change.** Read `CLAUDE.md` **§ Doc update protocol** and
apply its **triage table** — that table is the canonical source (kept in
`CLAUDE.md`, not copied here, so the two can't drift). Match the change to its
row(s). A change can hit more than one row — update each that genuinely applies,
but resist updating docs the change doesn't touch. Internal refactor with no UX
change → neither; stop.

**Step 2 — Update the matched doc(s).** Edit the prose to match the current
code (read the relevant slice to confirm). If you re-verified its claims against
the live code, bump its `verified_against` frontmatter to current HEAD
(`git rev-parse --short HEAD`).

**Step 3 — Code map.** If files/exports/imports changed, run `npm run codemap`;
add a curated row above the marker only for a new concept or string contract.

**Step 4 — Changelog.** If the change is user-visible, prepend one flat bullet
to `CHANGELOG.md`'s top `## Unreleased` block.

Never edit `src/data/notifications/*` (owner-only). Report the files you changed.
