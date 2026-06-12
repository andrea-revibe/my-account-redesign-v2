---
name: freshness
description: Detect and resolve doc + skill drift. Runs `npm run freshness`,
  walks each flagged docs/output/* doc through a re-verification playbook and
  bumps its verified_against marker, and fixes any broken skill references the
  run reports. Use weekly or ad-hoc.
allowed-tools: Read, Edit, Grep, Glob, Bash
---
Detect which docs have drifted from the code they cover, then resolve only the
flagged ones. `npm run freshness` is **report-only** — it never edits docs or
bumps markers; that's this skill's job, doc by doc.

How freshness works: each `docs/output/*` doc carries frontmatter `status`,
`verified_against: <commit>` (the commit it was last aligned to), and
`covers: [<paths>]`. The script regenerates `code_map.md`, then for each `live`
doc runs `git log <verified_against>..HEAD -- <covers>` and flags the ones whose
covered source changed since they were last verified.

**Step 1 — Detect.**
Run `npm run freshness`. Read its stdout summary (and
`docs/process/freshness-report.md` if you need detail). Note: (a) whether
`code_map.md` was regenerated/stale, (b) the list of flagged docs, (c) any
`covers` path warnings (a covered file moved or was deleted), (d) the
**CHANGELOG rollup** line, (e) the **skill references** line. If nothing is
flagged, the map was current, and skill references resolve, report that and
stop — **do not audit docs that aren't flagged.**

The **CHANGELOG rollup** warning means committed bullets are lingering under
`## Unreleased` (a rollup is overdue) — this is a nudge to run `/doc-compact`,
not something to fix here. Mention it; don't act on it in this skill.

**Step 1b — Fix broken skill references (if any).** The run validates that every
`.claude/skills/*/SKILL.md` reference resolves; a broken one is a hard fail
(exit 1). If flagged: a **dead path** or **unknown script** → fix the citation
in that SKILL.md (or restore the file); a **missing anchor** → the canonical
section moved (e.g. CLAUDE.md "## Doc update protocol") — point the skill at its
new location, don't re-embed; a **re-embedded triage table** warning → delete
the copy and reference `CLAUDE.md § Doc update protocol`. Re-run to confirm green.

**Step 2 — Resolve each flagged doc (the playbook).**
For each flagged doc, in turn:
1. Find what changed: `git log --oneline <verified_against>..HEAD -- <its covers paths>`,
   then `git diff <verified_against>..HEAD -- <the specific source file>` for
   the relevant slices. Read the changed code, not the whole doc's worth of files.
2. Re-verify the doc's claims **only against that diff** — does the doc still
   describe the code accurately? Look for: renamed/added states or
   sub-statuses, changed precedence/routing, new props, changed copy/tone
   resolution, new fields.
3. Fix the prose where it's now wrong. Keep edits minimal and in the doc's
   existing voice — you're re-aligning, not rewriting.
4. If a `covers` path moved/was deleted, update the `covers` frontmatter to the
   new path(s).
5. Bump `verified_against` to current HEAD (`git rev-parse --short HEAD`) — but
   **only for docs you actually re-verified.** A bumped marker is a promise the
   doc matches that commit.
6. If a fix is a material, user-visible behaviour change (not just a doc
   correction), add a one-line bullet to `CHANGELOG.md`'s top `## Unreleased`.

**Step 3 — Report.**
List: docs re-verified + their new marker, docs left flagged (and why, if you
couldn't resolve one), and whether `code_map.md` needed regenerating.

Never edit `src/data/notifications/*` (owner-only). Re-verify only what the
script flagged — freshness is targeted, not a blind sweep.
