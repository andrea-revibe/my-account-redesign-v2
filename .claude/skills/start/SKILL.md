---
name: start
description: Open a work session — run the read-only planning group in order
  (explore if the task touches existing code, then kickoff's questions + plan)
  and flag whether a design handover is warranted. Use before writing any code.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Agent
---
Conductor for the session-**open** group. Read-only — this sets the work up; it
does not write code or docs. It runs the member skills **in order, by
reference** (each member's procedure lives in its own `SKILL.md` — follow it,
don't duplicate it) and **skips steps that don't apply**, saying why.

Feature/task: $ARGUMENTS

**Step 0 — Intake (only if the task isn't already clear).** If `$ARGUMENTS` or my
previous message already says what to build, skip straight to orientation. If I
invoked `/start` bare, ask me what I want to work on this session — and steer me
toward the few facts that make the rest go well, without turning it into a form:
- the surface it touches (which card / flow / screen), or that it's a new one;
- the user-facing outcome I'm after;
- any hard constraint — country scope (AE / ZA / SA / Others), a component I must
  reuse, a demo or deadline;
- if it's visual, a design reference (screenshot, Figma, an existing card to match).
Then STOP for my answer before orienting.

Then assess and route. Orientation is two-tier — always orient, deep-dive only
when needed:

1. **Orient — always, proportional to the task.** Read `docs/code_map.md` (the
   _Where is X_ + _Module index_ to place the work; the coupling / _Shared-core
   consumers_ tables for constraints) and the relevant `CLAUDE.md` Conventions,
   Gotchas, and Mental-models sections. **Greenfield is not exempt** — even a new
   card plugs into the routing, shared-component reuse rules, design tokens, and
   country-split / `lib/`-`data/` structure those sections document; the point is
   to pick an approach that *fits the current architecture* and surface any
   limitation before planning. Keep it a targeted skim (inline), not a deep scan.
2. **Deep-explore — only if the task touches *existing* behaviour.** Spawn an
   Explore agent following `.claude/skills/explore/SKILL.md` (forked, reads
   `docs/code_map.md` first, returns a summary only) to map the specific surface
   and its couplings. Skip for greenfield — step 1's orientation already grounds
   it; say you skipped the deep dive and why.
3. **Kickoff** — always, unless I've already approved a plan this session. Follow
   `.claude/skills/kickoff/SKILL.md`: ask 3–6 impact-ranked clarifying questions,
   then STOP. After I answer, produce the ordered build plan + blast radius (from
   `code_map.md`'s coupling/consumers tables), grounded in steps 1–2, then STOP
   for approval. Don't re-scan what those steps already covered. Keep these
   questions **distinct from intake**: Step 0 framed the task; these are the
   plan-shaping specifics that only sharpen *after* orienting — don't re-ask what
   intake already answered.
4. **Design handover** — flag, don't run. If the task is primarily a visual/UX
   surface to hand to a focused design agent, recommend `/design-handover`
   (`.claude/skills/design-handover/SKILL.md`) and say why; don't author the
   brief unless I ask.

End at an approved plan. Do not create or edit any file in this skill.
