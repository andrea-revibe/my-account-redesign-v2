# Journey mode

> Alternate demo for the prototype: `?journey=<id>` replaces the eight-card showcase with a single order replayed through one lifecycle, advanced via the floating `JourneyDevPanel`. Two purposes — immersive end-to-end demo of one customer journey, and the seed for a backend-event spec.

> **Detailed backend spec (event names, payloads, field deltas per transition) is intentionally deferred.** Once the data-warehouse column mapping is done, this doc will be rewritten against real backend columns. Until then it carries only what's needed to keep working on the prototype between sessions.

## Shipped journeys

Source of truth: `src/data/journey.js → JOURNEYS`. Today the array holds four: `happy_path`, `cancel_at_qc`, `claim_change_of_mind`, `claim_warranty`. `?journey=1` aliases the first journey; unknown ids fall back to the first.

The warranty journey reuses the pre-claim chain (placed → QC → 4× shipping sub-statuses → delivered) and then submits a `type: 'warranty'` claim with no refund-method fork (Step 5 is skipped on warranty intake). Downstream forks are: pickup-failed loop (rejoins the trunk at `claim_transit_arrived_origin_hub`, same shape as the CoM journey), QC outcome (valid → repair → ship-back → device_returned; invalid → `claim.invalidClaim` set → customer pays → 4× return sub-statuses → delivered, *or* customer declines → terminal). Same convention for customer-triggered nodes: the dev panel surfaces them with the `via UI` chip so the demo can advance regardless of how much of the real surface is wired.

## Adding a new journey

1. **Sketch the nodes on paper first.** For each: `id`, `label`, `trigger` (`customer` or `system`), `event` (backend event name), and the exact field deltas `apply(order)` applies. The node *is* the spec — do this before writing code.
2. **Decide branching.** Default is linear (next node in the array). For forks, set `next: ['idA', 'idB']` on the source node — both ids must exist in `nodes`. Terminal nodes set `next: []` if they aren't last in the array. For converging branches, point the last node of each branch at the rejoin target's id.
3. **Author the journey config** as an entry in `JOURNEYS`. Reuse `INITIAL_ORDER` unless the journey starts from a meaningfully different shape.
4. **Verify card routing.** Journey mode runs the projected order through `App.jsx`'s existing routing tree. If transitions land the order in a state no card handles, update routing too.
5. **Update meta docs.** One-line bullet at the top of `CHANGELOG.md` Unreleased.

## Conventions worth not re-discovering

- **Customer vs system triggers.** `customer` nodes should be driven by the real UI (sheet submits, button taps) — `App.jsx` listens for the submit event and calls `journey.advance(nodeId)`. `system` nodes (courier webhooks, ops decisions, supplier confirms) stay on the dev panel — there's no customer-facing surface that fires them.
- **`validNext()` gate is mandatory.** Real-UI handlers must check `journey.validNext().some(n => n.id === target)` before advancing. Without the gate, an out-of-sequence submit (cancel sheet opened at delivered, claim flow submitted at placed) would silently apply the wrong delta.
- **Hybrid architecture.** `JOURNEYS` is an array of top-level journeys (picker chip per journey in the panel). Branching lives *inside* a journey via the `next: [...]` field, not by adding a new top-level journey for every variant.
- **Refund-method branching pattern.** When a customer-triggered node forks on refund method, use sibling nodes (`*_wallet`, `*_card`) that converge later in the chain. Branch suffix maps to the sheet's refund-method value in `App.jsx` (`store_credit → wallet`, `original → card`).
- **Permissive panel (current default).** The dev panel renders Next buttons for `customer`-triggered nodes too, styled outlined with a `via UI` chip — flags that the real surface is the canonical path. Switch to strict (filter `trigger === 'customer'`) once 3+ customer-triggered nodes exist across journeys.
- **Path-based replay.** `useJourney` tracks `path: string[]` rather than a single cursor. Required for branched journeys — applying nodes 0..i in array order would silently misapply deltas as soon as the array contains nodes from unreachable branches.

## Source files

- `src/data/journey.js` — `INITIAL_ORDER` + `JOURNEYS` array.
- `src/lib/journey.js` — `useJourney(journeyId)` hook (`advance` / `back` / `reset` / `validNext`).
- `src/components/JourneyDevPanel.jsx` — floating panel + journey picker.
- `src/App.jsx` — `journeyMode` + `?journey=<id>` URL param; `handleCancelOrder` / `handleSubmitClaim` (customer-triggered advances).
- `src/components/Header.jsx` — `Journey mode ×` chip (exits the mode).

## Editing this doc

Bloat-traps that grew the previous version:

| Don't add | Why |
|---|---|
| Per-transition payloads / field deltas / UI-surface notes | This is the backend spec — defer until real-column mapping |
| ASCII node graphs | Branching is in `src/data/journey.js`; redrawing duplicates and drifts |
| Worked-example expansions of wiring patterns | One pattern statement in conventions is enough |
| Per-journey "Open prototype gaps" subsections | Track unfinished work in `CHANGELOG.md` or GitHub issues |
| New top-level §sections per journey | A new convention is one bullet; a new recipe step is one numbered step |

When backend column mapping ships, replace this doc with the real spec.
