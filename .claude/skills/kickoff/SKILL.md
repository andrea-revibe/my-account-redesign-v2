---
name: kickoff
description: Ask clarifying questions for a new feature, then (after I answer)
  produce a detailed implementation plan and stop for approval. Use at the
  start of a feature, before any code is written.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---
You are planning a feature for the Revibe My Account → Orders prototype (stack
and conventions: see `CLAUDE.md`) that will be handed to a dev team to spec for
production. This is a PLANNING step only — do not create or edit any files, do
not run commands.

Feature to plan: $ARGUMENTS
(If that is empty, plan the feature I described in my previous message.)

Context discipline:
- If an `explore` summary already exists earlier in this conversation, build on
  it. Do NOT re-scan the codebase.
- Otherwise read `docs/code_map.md` first (the _Where is X_ table + _Module
  index_), then read only the few slices needed to ground your questions and
  plan. Prefer Glob/Grep over whole-file reads.

Work in two phases.

**Phase 1 — Questions (this turn):**
Ask 3 to 6 clarifying questions, ranked by how much the answer would change
what you'd build (data shape, edge cases, UX behaviour, scope). Ask only
questions whose answers change the plan — for anything you can reasonably
assume, state the assumption instead of asking. Then STOP and wait.

**Phase 2 — Plan (after I answer):**
Produce an ordered list of build steps. For each, name the file(s) to create
or modify and, in one line, what it does. Order so each step is testable on its
own. Then:
- **State the blast radius.** Look every target up in `code_map.md`'s
  _Shared-core consumers_ + _Coupling the import graph can't see_ tables and
  list the affected files. A change to a `lib/` or `data/` signature, or to a
  string-contract value (`statusId`, `subStatusId`, claim `state`, etc.),
  touches every consumer listed there — name them.
- Respect the routing + status models in `CLAUDE.md` (§ Mental models) and the
  card-routing tree in `docs/output/diagrams.md#card-routing` — don't re-derive
  them. (Reminder: a new status/sub-status/state is a `src/lib/statuses.js`
  edit; the timeline/banner/chips are data-driven from there.)
- Note which `docs/output/*` doc and `CHANGELOG.md` entry the change will need
  (per `CLAUDE.md` § Doc update protocol), so closeout has a target.
- Add a short "Out of scope" note for anything you're deliberately not building.

Then STOP and wait for my approval before implementing.
