---
name: doc-compact
description: Compact CHANGELOG.md using git as the source of truth — roll
  committed entries out of the Unreleased block into dated sections, and archive
  old history to a sibling file. Use when freshness flags a rollup is overdue,
  or ad-hoc to shrink the file.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---
Compact `CHANGELOG.md`. **Git is the source of truth** for what's released — the
`## Unreleased` heading is not reliable on its own, because changes are committed
and merged via git *outside* this loop, so committed entries linger under
"Unreleased" forever. This skill reclassifies them from git. It **moves and
compacts; it never deletes information** — every material bullet survives,
relocated or merged, and the file is git-tracked so any rewrite is reversible.

**Step 1 — Classify the Unreleased block by git.**
Find the `## Unreleased` block (heading → next `## `). Run
`git blame -L <first>,<last> -- CHANGELOG.md` over its lines. For each `- ` bullet:
- **Real commit hash** → it's been committed (= shipped, given the merge-via-git
  workflow). Note its commit **date**.
- **All-zero hash / "Not Committed Yet"** → genuinely still pending; it stays.

**Step 2 — Roll committed bullets into dated sections.**
Group the committed bullets by their commit date into `## YYYY-MM-DD` sections,
inserted **newest-first directly below `## Unreleased`** (merge into an existing
dated section if one already exists for that date). Leave only the genuinely-
uncommitted bullets under `## Unreleased` (often none). Don't invent a date —
use the one git blame reports.

**Step 3 — Light, conservative compaction.**
Within the bullets you're moving: merge exact or near-duplicate bullets, and
enforce one line per bullet. **Do not paraphrase away detail** — if two bullets
describe genuinely different changes, keep both. When unsure, keep both.

**Step 4 — Archive old history.**
Keep the **most recent 12 sections** (dated or `## Phase N`) in `CHANGELOG.md`;
move older ones, in order, to `CHANGELOG-archive.md` (create it with a
`# Changelog archive` header if absent). Leave a one-line pointer at the bottom
of `CHANGELOG.md` (`> Older history: see CHANGELOG-archive.md`). Move, don't
delete — the archive is the full tail.

**Step 5 — Report.**
State: how many bullets were rolled up and into which dated sections, how many
remained genuinely unreleased, how many sections were archived, and the
before/after line+byte size of `CHANGELOG.md`. Tell me to review with
`git diff CHANGELOG.md` (the rewrite is reversible).

Don't touch `docs/output/*`, `docs/input/*`, or `src/data/notifications/*`. The
keep-window (12) and the classification are the only policy — everything else is
a faithful move.
