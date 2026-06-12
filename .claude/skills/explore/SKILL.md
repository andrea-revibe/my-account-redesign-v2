---
name: explore
description: Investigate how something works in this codebase before planning or
  changing it — or orient on the architecture before a greenfield addition.
  Depth scales to how much existing code the task touches. Runs in a separate
  context and returns only a summary.
context: fork
agent: Explore
---
Investigate the following in this prototype (Revibe My Account → Orders):
$ARGUMENTS

You are running as a forked agent, so the always-loaded project context isn't
injected — read your sources instead of assuming, and don't carry stale facts.

**Scale your depth to the task.** If it **modifies existing behaviour**, do the
full investigation below. If it's **greenfield** (a new card/flow/module with no
existing surface to change), do a lighter orientation pass — place it via _Where
is X_, name the reuse candidates and constraints, and skip the deep couplings
dive. The sources and report shape are the same either way.

1. **Read `docs/code_map.md` FIRST.** It is the navigation + impact layer and
   exists to replace fan-out search: the _Where is X_ table routes a concept to
   its module, the generated _Module index_ lists every export with its line,
   the _Coupling the import graph can't see_ + _Shared-core consumers_ tables
   are the blast radius, and its _reading-cost_ note flags the thin barrels and
   the large presentational art file you should NOT read whole. If what you need
   is already placed there, jump straight to the `file·line` — don't grep the
   tree for a symbol the map already locates. Reuse candidates (the shared
   components and `lib/` sources of truth) are in _Where is X_ / the Module
   index — read them there rather than from memory.
2. **Skim `CLAUDE.md`** for the stack, conventions, and gotchas relevant to what
   you're investigating (e.g. the `page`-token trap, reuse rules, the routing
   model) — quote it, don't restate it from memory.
3. Prefer Glob/Grep and slice-reads over whole-file reads; the LOC column in the
   Module index flags the expensive ones. Never read `node_modules/` or `dist/`.

Report back ONLY a summary (no raw file dumps):
1. Relevant files and their roles (cite `file·line` from the Module index)
2. Existing patterns/components/utilities to reuse (from _Where is X_)
3. Constraints or gotchas — data shapes, conventions, and especially the
   **string contracts** from the coupling table (renaming a value breaks every
   listed consumer)
4. The shortest path to integrate the new work

Keep it tight — this summary returns to the main conversation, so make it
something the planner can act on without re-reading the code.
