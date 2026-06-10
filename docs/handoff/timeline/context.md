# Unified Timeline / Step-Progress Component — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to design **one shared step-progress timeline** for the Revibe My-Account → Orders prototype — the dotted "where is this in its journey" indicator that today exists as **five separate renderers** that have drifted apart. You have **zero prior context** on this codebase. This doc is your self-contained brief: every place a timeline renders, what differs between them, where the step data comes from, the visual decisions already settled with the user, the tokens/animations you must build *from*, and the hand-back boundary.

**What this doc is.** A map + a contract. It names the exact files/lines, the data sources, the existing visual primitives, and the constraints, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The **new motion (the pulse) and the partial-fill connector are yours to design** — pick the keyframes, timing, and any new token. This doc fixes the *inputs* (what exists, what data drives it, the locked behaviour) and the *problem*, not the output.

> **One hard rule up front (from the user): reference only what already exists in the repo. Do not invent untested token values, hex codes, or animation CSS in your spec and present them as facts.** Where you need something new (the pulse keyframe, a partial-fill technique), design it explicitly *as net-new*, derive it from the existing primitives named in §5, and flag it as new — don't smuggle in unverified values as if they were established tokens.

---

## 0. The 10-second picture

Every card that shows "how far along is this" draws a row (or column) of dots joined by connector lines. There are **two orientations** and **five hand-rolled implementations** of the same idea, and they disagree on how the *current* step looks, whether it shows a checkmark, and whether the dot carries an icon.

```
HORIZONTAL (the target look)

  done       done      current        future
   ●✓ ━━━━━━━ ●✓ ━━━━━━━ ○ ┉┉··        ○
  solid      solid      hollow         hollow
                        PULSING        static
                        └─ ¾ fill out toward next step


VERTICAL (same rules, stacked)

  ●✓   Arrived in country        ← done: solid + check, full connector
  ┃
  ●✓   Cleared customs
  ┊¾   ← current's outgoing connector fills ~¾, pulsing
  ○    Out for delivery          ← current: hollow ring, no check, PULSING
  ┊
  ○    Delivered                 ← future: grey hollow ring, static

Legend:  ● solid dot   ✓ checkmark   ○ hollow ring   ━/┃ full connector   ┉/┊ ¾ partial fill
```

Your job: collapse the five into **one `<Timeline>` component** with an `orientation` prop, applying the settled rules in §4 consistently across all of them.

---

## 1. Your remit — design only

**You are responsible for the design, not the implementation.** You produce a visual direction and a spec (`docs/handoff/timeline/design.md`); a separate engineering pass builds the shared component and swaps it into the five call sites *after* you hand back. Do **not** build the component, refactor the five renderers, edit `docs/output/*`, run codemap, or touch `CHANGELOG.md` / `CLAUDE.md`. Your job ends at a spec the implementer can build from. (You *may* build **one** throwaway live mock to validate the look — see §8.)

### The goals (all in scope)

1. **One component, two orientations.** A single `<Timeline orientation="horizontal | vertical">` that replaces all five renderers in §2. Design must be buildable as *one adaptable component*, not five variants wearing the same paint.
2. **Consistent step states.** Today "completed" and especially "current" render five different ways (§3). Settle one treatment: **completed = filled + checkmark; current = hollow ring, pulsing; future = grey hollow ring.** (§4.)
3. **The ¾ partial connector.** The connector *leaving the current step* fills ~75% toward the next step — an "in transit, not yet arrived" signal. Completed connectors fill 100%; future connectors are grey. This is net-new (today connectors are binary reached/not-reached).
4. **A subtle pulse on the active segment.** The current dot **and** its ¾ outgoing connector breathe gently. Net-new motion — yours to design, honouring `prefers-reduced-motion`.
5. **Preserve the tone system.** The timelines are tone-aware (brand / warn / success / danger). Your single component must accept a `tone` and apply it to fill, check, ring, and connector — without re-introducing per-renderer drift.

**Out of scope for the design:** the courier dropdown chrome, the copyable AWB strip, card layout around the timeline, and the step *data* itself (status copy, ordering, SLAs all live in `lib/` — §3.B). You design the timeline; the data and the surrounding card stay.

---

## 2. Where a timeline renders — every occurrence

Five renderers, four consuming cards. Redesign means defining one look that subsumes all of them; the engineering pass collapses the code.

### The five renderers

| # | Renderer | File · export line | Orientation | Today's tone | Per-step icon? |
|---|---|---|---|---|---|
| 1 | `StatusTimeline` | `src/components/StatusTimeline.jsx` ·6 | horizontal | brand only | no |
| 2 | `ClaimProgressDots` | `src/components/ClaimProgressDots.jsx` ·22 | horizontal | **warn / brand / success** (prop) | no |
| 3 | `ShippingSubTimeline` | `src/components/ShippingSubTimeline.jsx` ·9 | vertical | brand only | **yes** (lucide, per step) |
| 4 | `CancellationSubTimeline` | `src/components/CancellationSubTimeline.jsx` ·11 | vertical | **danger / success** (per step) | **yes** (lucide, per step) |
| 5 | `SubStatusItem` (one row) | `src/components/ReturnShipmentTracking.jsx` ·95 | vertical | brand only | no |

> Renderer 5 is **one row** inside the `ReturnShipmentTracking` dropdown — that dropdown's toggle button + `CourierStrip` (the DHL chip + copyable AWB, ·62) are **not** yours to change. You replace the *milestone rows* it stacks, not the dropdown shell.

### The four consuming cards (call sites the engineering pass will rewire)

| Card | File · line | Uses |
|---|---|---|
| `OrderCard` | ·66 / ·113 / ·120 | `StatusTimeline` / `CancellationSubTimeline` / `ShippingSubTimeline` |
| `ClaimCard` | ·102 | `ClaimProgressDots` |
| `WarrantyClaimCard` | ·106 / ·130 | `ClaimProgressDots` / `ReturnShipmentTracking` (→ `SubStatusItem`) |
| `InvalidClaimCard` | ·398 / ·413 | `ClaimProgressDots` / `ReturnShipmentTracking` (→ `SubStatusItem`) |

---

## 3. What differs today — the drift you're resolving

### A. The "current step" is rendered five different ways

This is the crux. Read the five and you'll see no two agree:

| Renderer | Completed dot | **Current dot** | Future dot |
|---|---|---|---|
| `StatusTimeline` | filled + check | **filled + check** (identical to completed) | hollow, tiny inner dot |
| `ClaimProgressDots` | filled + check | **filled, no check, glow ring** | hollow |
| `ShippingSubTimeline` | filled + check | **soft-fill + lucide icon** (no check) | hollow + lucide icon |
| `CancellationSubTimeline` | filled + check | **soft-fill + lucide icon** (no check) | hollow + lucide icon |
| `SubStatusItem` | filled + check | **filled, no check, glow ring** | hollow |

The settled rule (§4) makes **current = hollow ring, no fill, no check, pulsing** everywhere. That is a deliberate *change* to all five — including dropping the checkmark on `StatusTimeline`'s current step and dropping the soft-fill on the two vertical sub-timelines. Don't preserve the old per-renderer current treatments; unify them.

### B. The step data — you consume it, you don't author it

The component is generic over a **step list + a current index**. The data already exists; the best existing API to build on is `ClaimProgressDots`'s signature `{ steps, curIdx, stamps, tone }` (it's already the most generic of the five).

| Step list source | Module · line | Drives |
|---|---|---|
| `STATUSES` | `lib/statuses.js` ·4 | order status timeline |
| `SHIPPING_SUB_STATUSES` | `lib/statuses.js` ·56 | shipping + return-shipment rows |
| `cancellationStepsFor(order)` | `lib/statuses.js` ·116 | cancellation steps |
| `CLAIM_STATUSES` / `COMPENSATION_CLAIM_STATUSES` | `lib/claims.js` ·18 / ·64 | refund + compensation progress |
| `WARRANTY_CLAIM_STATUSES` | `lib/claims.js` ·284 | warranty progress |
| `RETURN_CLAIM_STATUSES` | `lib/claims.js` ·124 | return-shipment progress |
| `CLAIM_TRANSIT_SUB_STATUSES` | `lib/claims.js` ·146 | inbound-pickup transit |

Current-index helpers (one per list): `progressIndex` ·95 / `subProgressIndex` ·100 / `cancellationProgressIndex` ·105 in `statuses.js`; `claimProgressIndex` ·114 / `warrantyClaimProgressIndex` ·340 / `returnClaimProgressIndex` ·137 / `transitSubProgressIndex` ·153 in `claims.js`. **You don't change any of these** — your component takes their output. Each step entry carries at least `{ id, label }` (horizontal also uses a short label; some carry a lucide `icon` — see §4 open decision).

### C. Sizes, labels, timestamps differ by orientation (a real constraint, not drift to erase)

- Horizontal dots are small (`ClaimProgressDots` ~18px, `StatusTimeline` ~24px) with the label **below** the dot and an optional date/time stack under that.
- Vertical dots are larger (sub-timelines ~36px today; `SubStatusItem` ~14px) with the label **beside** the dot and an optional timestamp under the label.

One component, parameterised by orientation — not one size forced on both. Settle the canonical sizes per orientation in your spec.

---

## 4. The settled design decisions (made with the user — do not re-litigate)

These came out of a direct Q&A with the user. They are the contract; if you think one is wrong, raise it in one sentence and let the user decide — don't quietly design against it.

1. **One component, `orientation` prop, replaces all five renderers.** (Not horizontal-only or vertical-only — all five.)
2. **Completed step = solid filled dot + checkmark.** Its connector to the next step fills **100%** in the tone colour.
3. **Current step = hollow outline ring.** No fill, no checkmark. It is visually distinct from "future" only by the **pulse** (and, if you choose, a toned border — but it stays empty inside; see the chosen preview). The user explicitly picked the *hollow, pulsing* treatment over a filled or target-dot current step.
4. **Current step's outgoing connector fills ~¾** of the way toward the next step ("in transit, not arrived"). The direction is **out of current → next**, not into current.
5. **Future step = plain grey hollow ring, static.** Grey connector.
6. **Pulse scope = the active segment only.** The current dot **and** its ¾ outgoing connector breathe together. Completed (solid) and future (grey) stay static. Not the whole timeline.
7. **Pulse is subtle** and must honour `prefers-reduced-motion` (static fallback — likely the existing static ring).

### The one genuinely open decision — bring a recommendation

The two **vertical** sub-timelines (`ShippingSubTimeline`, `CancellationSubTimeline`) currently render a **lucide step icon** inside each current/future dot (e.g. truck, package). The settled scheme makes current/future dots *hollow*. So: **do hollow dots keep a faint step icon, or drop icons entirely** (check on completed, empty ring otherwise, label carries the meaning)?
- The two horizontal renderers never had icons, so "drop icons" is the cleaner cross-orientation unification.
- "Keep an optional icon slot" preserves the truck/package semantics but reintroduces a horizontal/vertical divergence.

Pick one, justify it, and note it as the single behaviour change beyond §4. (Recommended default: drop per-step icons for one consistent system; if the user values the iconography, support an **optional** `icon` slot that renders only when supplied, so horizontal stays icon-free.)

---

## 5. The visual primitives you build *from* (existing — reference these, invent nothing untested)

Token authority: **`tailwind.config.js`** + narrative in **`brief/design-system.md`**. Prefer named tokens over arbitrary values; slash-opacity (`bg-brand/40`) works on any of them.

### Tones already in use across the five renderers

| Tone | Fill / check bg | Soft / ring source seen today |
|---|---|---|
| brand | `bg-brand` (`rgb(80,25,160)`) | glow ring `shadow-[0_0_0_4px_rgb(243,237,251)]` (= `brand-bg`) |
| warn | `bg-warn` | glow ring `shadow-[0_0_0_4px_rgb(255,242,221)]` |
| success | `bg-success` | glow ring `shadow-[0_0_0_4px_rgb(216,239,225)]` |
| danger | `bg-danger` / `bg-danger-bg` | (cancellation timeline) |

Future/empty dots today use `border-line` on `bg-surface`/`bg-white` with `text-muted`/`text-line`. Connectors use the tone `bg-*` when reached and `bg-line` / `bg-line/70` when not. These are your starting palette — the pulse and partial-fill should be *built from* them.

### The motion precedents

- **There is no pulse animation today.** The only registered keyframe/animation is **`slideDown` / `animate-slideDown`** in `tailwind.config.js` (`keyframes` ~·72, `animation` ~·113), used by the `ReturnShipmentTracking` dropdown. That's your precedent for **how** a new animation is registered (add a keyframe + an `animation` entry in the config) — **the pulse keyframe itself is net-new and yours to design.**
- The current-step **glow ring** (`shadow-[0_0_0_4px_...]` above) is the existing static "this is live" cue. Your pulse can animate this ring (opacity/scale loop) so the reduced-motion fallback is simply the existing static ring — a clean, already-shipped baseline.

### The ¾ partial fill

Net-new — no existing renderer fills a connector partially. You choose the technique (e.g. a tone segment over a grey track, a gradient, or two stacked spans). Specify it concretely in tokens; don't ship a raw hex the implementer can't trace to the palette.

> **Gotcha (from `CLAUDE.md`): never introduce a `page` colour token** — `text-{name}` resolves to either a fontSize or a colour, and a name that collides with a `fontSize` key silently renders white text. The same risk applies to any *new* token name you propose — check it doesn't collide.

---

## 6. Structural reality you must design *for* (someone else builds it)

You don't implement this, but your design must be **buildable as one component**, because that's how the engineering pass resolves goal 1:

- The target is **one `<Timeline>`** taking roughly `{ steps, currentIndex, tone, orientation, stamps?, renderStep? }` — generalising `ClaimProgressDots`'s existing `{ steps, curIdx, stamps, tone }` to both orientations. Design to that shape; don't design something only expressible as five bespoke variants.
- Define the **three step states** (completed / current / future), the **¾ connector**, and the **pulse** once, then show they hold in **both orientations** and in **all four tones**.
- The vertical case must also satisfy the `SubStatusItem` slot: it lives inside the `ReturnShipmentTracking` dropdown next to a `CourierStrip` — so the vertical timeline must read correctly with a courier chip above it and a per-row timestamp.
- **Tap-target constraint:** several timelines sit inside tappable card headers. Anything interactive you add must be implementable as a `stopPropagation` child (the established convention) — but a progress timeline is normally non-interactive, so keep it presentational unless you have a strong reason.

---

## 7. Your deliverable — a design spec, handed back

Write the spec to **`docs/handoff/timeline/design.md`** (so the implementer picks it up cleanly). It should contain:

- The **canonical dot states** — completed (filled + check), current (hollow + pulse), future (grey hollow) — with exact tokens, sizes, stroke weights.
- The **connector**: full (100%, tone), ¾ partial (current → next, the technique + tokens), grey (future).
- The **pulse**: what animates (the active segment — current dot + its ¾ connector), the keyframe shape, timing/easing, and the **`prefers-reduced-motion` fallback**. Mark it net-new.
- The **tone matrix** (brand / warn / success / danger) across all dot/connector states.
- **Both orientations** with their canonical sizes, label placement, and timestamp treatment.
- Your **call on the open icon decision** (§4), justified.
- The proposed **component API** (props), aligned to §6 so it's buildable as one component.
- Annotated mocks — ASCII, or one throwaway live mock (§8).

**Hand-back boundary — do NOT cross it:**
- ❌ No building the shared component, no rewiring the four cards, no deleting the five renderers.
- ❌ No edits to `lib/statuses.js` / `lib/claims.js` or any step data.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.
- ✅ You **may** build **one** throwaway live mock (a scratch route rendering the timeline in both orientations + all tones) purely to validate the look — flag it as disposable, don't spread edits.

When the spec is ready, hand back. The engineering pass builds `<Timeline>`, swaps it into `StatusTimeline` / `ClaimProgressDots` / `ShippingSubTimeline` / `CancellationSubTimeline` / `SubStatusItem`'s call sites, registers the pulse keyframe in `tailwind.config.js`, and updates docs/codemap per `CLAUDE.md`.

---

## 8. Validate the look (optional, throwaway)

If you build a mock, screenshot at **430px wide, `deviceScaleFactor: 2`** (Playwright, `_snap.mjs` at repo root — the mobile frame). Confirm: (a) completed→current→future reads at a glance in **both** orientations; (b) the ¾ connector is legible at small horizontal dot sizes (~18px); (c) the pulse is *subtle*, not distracting, and the reduced-motion fallback still marks the current step; (d) all four tones hold. Capture these as reference in the spec, then leave implementation to the engineering pass.

---

## 9. Source files to read when this brief isn't enough

| You want… | File · line |
|---|---|
| The most generic existing API (build on this) | `src/components/ClaimProgressDots.jsx` ·22 (`{ steps, curIdx, stamps, tone }`) |
| The simplest horizontal renderer | `src/components/StatusTimeline.jsx` ·6 |
| Vertical with per-step icons + tone-per-step | `src/components/CancellationSubTimeline.jsx` ·11 |
| Vertical, brand, with timestamps | `src/components/ShippingSubTimeline.jsx` ·9 |
| The vertical row inside the dropdown (+ the chrome you DON'T touch) | `src/components/ReturnShipmentTracking.jsx` — `SubStatusItem` ·95, `CourierStrip` ·62 |
| Step lists + current-index helpers | `src/lib/statuses.js` (·4/·56/·95/·100/·105/·116), `src/lib/claims.js` (·18/·114/·124/·137/·146/·153/·284/·340) |
| How an animation is registered (the precedent) | `tailwind.config.js` — `slideDown` keyframe ~·72, `animation` ~·113 |
| Design tokens (authoritative) | `tailwind.config.js`; narrative in `brief/design-system.md` |
| Repo conventions & gotchas (incl. the `page`-token trap) | `CLAUDE.md` (root) |
