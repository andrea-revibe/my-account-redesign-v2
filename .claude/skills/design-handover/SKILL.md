---
name: design-handover
description: Author a design-agent brief for a component or surface — the
  context.md + system_prompt.md pair under docs/handoff/<slug>/ — then stop for
  review. Use when you want to hand a visual/UX design task to a focused design
  agent. Does NOT do the design itself.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Write
---
Author a **design-agent brief** for: $ARGUMENTS
(If empty, use the component/surface I described in my previous message.)

This brief is the proven pattern in `docs/handoff/*` — every folder holds a
`context.md` (the self-contained *what + where*) and a `system_prompt.md` (the
design agent's *how*); the agent later writes `design.md`. Read
`docs/handoff/timeline/context.md` + `system_prompt.md` and
`docs/handoff/revibe-cancellation/` as your structural templates — match their
shape and rigour.

**Your job is to produce the pair, then STOP.** You do NOT design, mock, build,
or edit any source/`docs/output/*` file. Authoring the brief ≠ doing the work.

Work in two phases.

**Phase 1 — Ground, then interview (this turn):**
1. Read `docs/code_map.md` first — use _Where is X_ + the _Module index_ to
   find the exact `file·line` for every renderer/component/data source the
   design touches. The brief must cite **real** files, lines, and tokens; never
   invent. Read the cited slices to confirm.
2. Read `CLAUDE.md` (conventions, gotchas, reuse precedents) +
   `tailwind.config.js` / `brief/design-system.md` (the token authority) so the
   brief can point the agent at real primitives.
3. Then ask me 3–6 questions whose answers can't be inferred from code — the
   ones that decide the brief's contract:
   - What's the **problem/goal** and the success criterion?
   - Which decisions are **already settled** (the agent must not re-litigate)?
   - What is the **one genuinely open decision** the agent must settle with a
     recommendation?
   - What is the **hand-back boundary** — exactly what the agent may NOT touch
     (which `lib/`/`data/` files, `docs/output/*`, codemap, CHANGELOG)?
   - Does it produce a spec only, or may it build **one throwaway mock** (at the
     mobile-frame viewport `CLAUDE.md` specifies)?
   Then STOP and wait.

**Phase 2 — Write the pair (after I answer):**
Create `docs/handoff/<slug>/` (kebab-case slug from the component name) with:

- **`context.md`** — the self-contained map: a 10-second picture (ASCII if it
  helps), every relevant `file·line` and data source from the code map, what
  differs/drifts today, the settled decisions, the one open decision, the
  visual primitives to build *from* (real tokens), and the hard hand-back
  boundary. Self-contained — the agent has zero prior context and reads only
  this + the files it names.
- **`system_prompt.md`** — the agent's operating instructions: its remit
  (design only), the settled decisions ("do not re-litigate"), a propose-the-
  direction-then-**pause**-for-approval protocol, a pointer to the reuse + token
  rules in `CLAUDE.md` (§ Conventions / Gotchas — the shared components, tokens
  over arbitrary values, and the `page`-token trap; cite, don't restate), the
  deliverable (`design.md`), and a first-message protocol that proves it read
  `context.md`.

Reference only what exists; flag anything net-new as net-new. Do NOT author or
touch `design.md`, source, or `docs/output/*` — that's the design agent's pass.

Then return the two file paths and STOP for my review.
