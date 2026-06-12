# Skills

Repeatable workflows for this prototype, each tuned to its conventions
(`CLAUDE.md` for stack/conventions · `docs/code_map.md` as the navigation layer
· the `docs/output/*` + `verified_against` doc discipline). The skills
**reference** those canonical sources rather than copying facts out of them, so
they don't drift. Invoke with `/<name>`. Five are `disable-model-invocation`
(manual only): `start`, `wrap`, `kickoff`, `design-handover`, `doc-compact`.

## Two conductors (the everyday entry points)

Most sessions only need these two — each routes among the individual skills below
**by reference**, running only what applies.

| Skill | When | Routes through |
|---|---|---|
| `/start` | Opening a feature, before any code | Always orients on `code_map.md` + conventions (greenfield included) → deep `explore` only if it touches existing behaviour → `kickoff` (questions + plan, stops) → flags `design-handover` if warranted. Read-only. |
| `/wrap` | Closing a session | Assesses the diff → `closeout` *or* `doc-update` → `freshness` sweep → surfaces `doc-compact` if a rollup is overdue. Plans first, runs on one go-ahead. |

The individual skills below stay callable on their own when you want just one.

## A feature, end to end (the individual steps)

| Stage | Skill | Does |
|---|---|---|
| Understand existing code | `/explore` | Forked Explore agent; reads `code_map.md` first, returns a summary only — no file dumps. |
| Plan before building | `/kickoff` | Asks clarifying questions, then a step-by-step plan with **blast radius** from the coupling tables. Stops for approval. |
| (build the feature) | — | Normal editing. |
| Wrap up after it works | `/closeout` | Updates the one matching `docs/output/*` doc + `code_map.md` + `CHANGELOG.md` via the triage table. |

## Docs & map hygiene (any time)

| Skill | Use when |
|---|---|
| `/freshness` | Weekly/ad-hoc. Runs `npm run freshness` to detect drift, then re-verifies & re-markers only the flagged docs and fixes any broken skill references. |
| `/doc-update` | Code and docs diverged outside a feature wrap-up — routes a change to the exact docs it affects. |
| `/codemap` | After a structural change (new/moved/renamed file or export, changed imports) — regenerates the generated half of `code_map.md`. |
| `/doc-compact` | CHANGELOG grew unwieldy / freshness flags a rollup overdue — uses `git blame` to roll committed entries out of `## Unreleased` into dated sections and archives old history. Manual-only. |

How the doc skills differ: **closeout** = end-of-feature ceremony for *this
session's* changes · **doc-update** = ad-hoc routing of an arbitrary change ·
**freshness** = marker-driven detection of drift across *all* docs.

## Design

| Skill | Use when |
|---|---|
| `/design-handover` | Hand a visual/UX task to a focused design agent — authors the `docs/handoff/<slug>/` brief pair (`context.md` + `system_prompt.md`), then stops. The agent's design pass writes `design.md`. |

## Conventions for editing these skills

- Each skill is `<name>/SKILL.md` with `name` + `description` frontmatter.
  Optional: `disable-model-invocation: true` (manual `/name` only),
  `context: fork` (separate context, returns a summary), `agent: <type>`,
  `allowed-tools: …`.
- **Reference, don't copy.** Skills cite canonical sources (`CLAUDE.md` for the
  triage table / conventions / gotchas, `code_map.md` for file·line and reuse
  candidates) instead of embedding their own copies — that's what keeps them
  from drifting. If you find yourself pasting a table or a fact a canonical doc
  already owns, link to it instead.
- **`npm run freshness` guards these.** It validates every SKILL.md reference
  (cited paths, `npm run` scripts, the `CLAUDE.md`/`code_map.md` anchors) and
  hard-fails on a broken one, and warns if a skill has re-embedded the triage
  table. Run it after editing a skill; fix anything it flags.
- **Adding a skill? Decide its place in the conductors.** Wire it into `/start`
  or `/wrap` if it belongs in the open/close flow, or leave it standalone (like
  `/codemap`, deliberately folded into closeout/freshness rather than routed).
  When a conductor *does* name a member, cite it by its `SKILL.md` **path**, not
  just `/name` — only the path form is validated by `npm run freshness`, so
  path-citing is what catches a later rename/removal of that member.
- Never have a skill edit `src/data/notifications/*` (owner-only copy).
