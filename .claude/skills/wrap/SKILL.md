---
name: wrap
description: Close a work session — assess what changed, route to the right doc
  path (closeout for a finished feature, doc-update for an ad-hoc change), then
  run freshness and surface doc-compact only if a CHANGELOG rollup is overdue.
  Plans the routing, then runs on one go-ahead.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---
Conductor for the session-**close** group. It routes among the member skills
**by reference** (each member's procedure lives in its own `SKILL.md` — follow
it, don't duplicate it) and runs **only what applies**. Two phases: PLAN (assess
+ propose routing, then stop), then RUN (on one go-ahead, execute and report).

**Phase 1 — Assess & plan (this turn).**
Inspect the session's changes: `git status --short` and `git diff --stat`. Decide
the routing:
- **A feature was completed** (a coherent user-facing change) → the doc step is
  `/closeout` — it already runs `npm run codemap` + the triage-matched
  `docs/output/*` doc + the `CHANGELOG.md` bullet, so don't also run those
  standalone.
- **Ad-hoc divergence only** (a refactor or copy tweak that touched docs, with no
  clean feature boundary) → the doc step is `/doc-update` instead.
- **No UX or structural change** → no doc step; say so.
Then state the routed plan in 2–4 lines — which steps will run, and which are
folded-in or skipped and why. **STOP for one go-ahead.**

**Phase 2 — Run (after go-ahead), in order:**
1. **Doc step** — follow `.claude/skills/closeout/SKILL.md` or
   `.claude/skills/doc-update/SKILL.md`, whichever you routed to.
2. **Freshness** — always, as the final sweep. Follow
   `.claude/skills/freshness/SKILL.md`: run `npm run freshness`, re-verify the
   flagged docs and bump their markers, and fix any broken skill references.
3. **Doc-compact** (`.claude/skills/doc-compact/SKILL.md`) — only if freshness
   reports a CHANGELOG rollup is overdue. `/doc-compact` is manual-only and
   rewrites `CHANGELOG.md`, so don't run it silently: tell me it's warranted and
   let me trigger `/doc-compact` myself.

Report what ran, what was skipped, and the files changed. Never edit
`src/data/notifications/*` (owner-only).
