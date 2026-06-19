# Order↔Claim Card Pairing — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to redesign **how a claim and the order it was raised against relate in the Orders list** of the Revibe My-Account → Orders prototype.

Today a claim and its order are *one* entry: the claim card renders, and the original order is reachable only as a **summary** — a small strip above the card that opens a read-only bottom sheet. You are replacing that with a **linked pair of real cards** the customer can move between seamlessly: the actual delivered order card *and* the claim card, stacked and connected, where opening one collapses the other to a compact header row.

You have **zero prior context** on this codebase. This doc is your self-contained brief: how the linkage works today, the one premise you are reversing, the decisions already settled with the user, the decisions you own, the primitives to build from, and the hand-back boundary.

**What this doc is.** A map + a contract. It names the exact `file·line`s, the data fields, the components to reuse, and the visual tokens, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The visual direction — the compact row, the connector, the accordion transition, the per-card-family defaults — is yours. This doc fixes the *inputs* and the *problem*, not the output.

> **One hard rule (from the user): reference only what already exists in the repo.** Cite real tokens, files, lines. Anything net-new (the collapsible delivered-card header, the claim compact row) you design *as net-new*, derived from existing primitives (§6), and flag it as new — never present an invented token/hex as an established repo fact.

---

## 0. The 10-second picture

When a customer raises a claim on a delivered order, the order leaves the list as a standalone card and **becomes** the claim card. To see the order behind the claim, today they tap a small "Order #…" strip that opens `OriginalOrderSheet` — a read-only **summary** (order #, total, payment, receipt). They can never reach the *real* delivered card, with its delivered-on hero, history thread, and full chrome.

The target: the **real delivered card and the claim card live together as a linked pair**, and the customer flips between them like an accordion.

```
TODAY                                          TARGET
┌──────────────────────────────┐              DEFAULT (claim is live → expanded)
│ • Order #89610 · Placed 2 Jun │ ← strip      ┌────────────────────────────────────┐
│   (tap → summary SHEET)       │   (summary)  │ ▸ Order #89610 · Placed 2 Jun  View▸│ ← order COMPACT
│ ┌──────────────────────────┐ │              └─────────────┬──────────────────────┘
│ │ Return · RET-… · progress│ │ ← claim card    connector thread
│ │ [timeline, actions, …]   │ │   (the only  ┌─────────────┴──────────────────────┐
│ └──────────────────────────┘ │    real card)│ ▾ Return · RET-… · in progress      │ ← claim EXPANDED
└──────────────────────────────┘              │   [full claim card: timeline, …]    │   (full card)
                                               └─────────────────────────────────────┘

                                               ORDER OPENED (accordion flip)
                                               ┌─────────────────────────────────────┐
                                               │ ▾ Order #89610        Delivered ✓    │ ← order EXPANDED
                                               │   [full delivered card: hero, …]     │   (full PastOrderCard)
                                               └─────────────┬───────────────────────┘
                                                  connector thread
                                               ┌─────────────┴───────────────────────┐
                                               │ ▸ Return · RET-… · Raised 4 Jun View▸│ ← claim COMPACT
                                               └─────────────────────────────────────┘
```

The ASCII is **illustrative, not prescriptive.** What's fixed: two *real* cards (not a sheet), connected, in an **accordion** where exactly one is expanded and the other is a compact header row.

---

## 1. Your remit — design only

**You are responsible for the design, not the production wiring.** You produce a visual direction and a spec (`docs/handoff/order-claim-pairing/design.md`). The card-routing change (rendering two linked cards where one renders today), the shared expand/collapse state, and the `OrderClaimLink` rewrite live in `App.jsx` + the claim-card family and are a separate engineering pass *after* you hand back.

**One exception, granted by the user:** you **may edit `src/components/OrderClaimLink.jsx`** itself to prototype the pairing chrome (the connector + the compact rows). Everything else in §8 is off-limits.

### The goals (all in scope)

1. **Surface the real delivered card, not a summary.** The order behind a claim must render as the actual delivered card (the `PastOrderCard` delivered branch — §2.C) — full chrome, full content — not the `OriginalOrderSheet` summary.
2. **One linked, connected pair.** The delivered card and the claim card read as a single unit that belongs together (the connector thread is the existing cue — §2.A).
3. **Accordion: open one, collapse the other.** Exactly one of the two is expanded at a time. The collapsed one shrinks to a **compact header row** — for the claim: `Claim # · date raised · View ▸`, mirroring a collapsed order header. Opening the collapsed one expands it and collapses its partner. The user's words: *"When the delivered card is open, the claim card should collapse to the Claim # and date raised with the view chip."*

**Out of scope for the design:** the card-routing precedence and the two-card render (engineering pass — §7), the claim pipeline/timeline internals, the filter rows, any backend.

---

## 2. How the linkage works today — every occurrence

### A. The shared linkage wrapper (your primary surface)

`src/components/OrderClaimLink.jsx` ·12 — props `{ order, onReveal, children }`. It wraps the `<article>` of **every claim-card-family member** (code_map: `In: 8`) and renders:

- a **connector thread** — a vertical gradient line (·30-33) with two nodes (·34-41): the order strip is the top/parent node, the claim card the bottom node. This is the "these belong together" cue. **Keep this idea; it's the spine of the pair.**
- the **parent order strip** (·43-68) — a tap target: product thumbnail + `Order #{id}` + `Placed {date}` + a `View ▸` chip. Tapping it opens the sheet (below).
- the **round-trip ring** (·70-79) — when the customer comes back from the sheet's "Linked claim" row (`onReveal` + a `ringPulse`), the wrapped card pulses to reorient them.
- `OriginalOrderSheet` (·81-86) — the summary sheet.

### B. The summary sheet you are replacing

`src/components/OriginalOrderSheet.jsx` ·31 — a read-only bottom sheet, the "order side" of the link. It carries:

| Content | Line |
|---|---|
| `Original order` eyebrow + `#{id}` + `Delivered` chip + `Placed {date}` | ·83-103 |
| `ProductSummary` (`tone="light"`) | ·116 |
| **Order total** row | ·120-123 |
| **Payment** method row | ·125-135 |
| reciprocal **Linked claim** row (`onGoToClaim` → dismiss + ring the claim card) | ·139-162 |
| **Download receipt** button (decorative) | ·167-173 |

**This sheet is being retired for the cards in scope (settled — §4).** Its unique content (order total, payment method, download receipt) must be accounted for in §5.3.

### C. The real delivered card the pair will surface

`src/components/PastOrderCard.jsx` ·34 → `DeliveredOrderCard` ·40. This is the card that **disappears** the moment a claim is raised (it flips to a claim card — §3.B). It renders:

- `OrderEyebrow` `Order · #{id}` (·49), `DeliveredStatePill` (·50, green "Delivered"), `DeliveredHero` (·51, the "Delivered on {date}" gradient block + delivery address), `ProductSummary` (·52, incl. price breakdown), `HistoryThread` (·53), and a footer (·54-64): **"I need help with this device"** (→ raise a claim) + **Download receipt**.
- **It is not collapsible today** — it's a plain `<article>`, always fully shown, no chevron, not a tap-toggle. (Contrast the *cancelled* branch ·140, which **is** a tap-to-expand `<button>` and **is** wrapped in `OrderClaimLink` ·150.) Making the delivered card collapse to a compact header is **net-new** (§5).

### D. The claim-card family (every card that gets the pairing)

All wrap their `<article>` in `OrderClaimLink` and share the refund-hero chrome (left accent strip · eyebrow · state pill · tinted hero · `ProductSummary` · expand-on-tap header `<button>`):

| Card | File | When it renders |
|---|---|---|
| `ClaimCard` | `ClaimCard.jsx` ·47 | active refund / compensation claim, and refunded (past) |
| `WarrantyClaimCard` | `WarrantyClaimCard.jsx` ·53 | warranty claim (repair tail) |
| `DocsRejectedCard` | `DocsRejectedCard.jsx` ·35 | takeover — docs rejected |
| `PickupFailedCard` | `PickupFailedCard.jsx` ·22 | takeover — pickup failed |
| `ResetFailedCard` | `ResetFailedCard.jsx` ·28 | takeover — activation-lock / reset failed |
| `InvalidClaimCard` | `InvalidClaimCard.jsx` ·43 | takeover — invalid / ship-back |
| `ClosedClaimCard` | `ClosedClaimCard.jsx` ·47 | closed/declined claim (past) |
| `PastOrderCard` (cancelled branch) | `PastOrderCard.jsx` ·140 | a **cancellation** — see the mismatch in §3.C |

The claim card's header is a single `<button>` (`ClaimCard.jsx` ·77-98) — the **whole header toggles** (eyebrow ·85 = `formatClaimRef(claim)`, chevron ·89, state pill ·95, hero ·96, product ·97). The expanded body (·100+) holds the timeline, action banners, tracking, history.

---

## 3. The premise you are reversing + the one mismatch

### A. The old premise (now obsolete)

The earlier `claims-filter` handoff (`docs/handoff/claims-filter/context.md` §3.B, §4 decision 4) was built on: *"the claim card **replaces** the order card — there is no order card to scroll to, so linkage must be a within-card affordance."* That produced the strip + summary sheet you see today.

**Your work reverses that premise.** The order card no longer *vanishes* — it renders as the real delivered card, paired with the claim. When you write the spec, **state explicitly that this supersedes `claims-filter` decision 4** so the two briefs don't read as contradictory.

### B. Routing reality: today one order → one card

When a claim is raised from a delivered `PastOrderCard` (`onRaiseClaim` → `ClaimFlow` → the order gains `order.claim`), the order flips from "past/delivered" to "open/has-active-claim" and renders **only** as the claim card (App.jsx routing, the past-section map at `App.jsx` ·688-752 and the in-progress map above it). The target renders **two** cards for that one order. **You design the paired *visual*; the engineering pass owns making routing emit two linked cards** (§7) — don't try to wire it.

### C. The mismatch: the cancellation member has no separate order

`OrderClaimLink` also wraps the `PastOrderCard` **cancelled** branch (·140-240). But a cancellation is not a claim raised *against* a delivered order — **the order itself was cancelled**, so there is no separate delivered card to pair with; its linked entity is a cancellation ref (`#{cancellationRef}`), not a claim. The accordion-of-two-cards model doesn't map cleanly here.

**You own how to handle this** (§4 open decision 3): recommend either (a) the cancellation card keeps a lighter self-contained treatment outside the new pairing, or (b) it pairs with the *pre-cancellation* order detail. Pick one, justify it in a sentence — don't silently force it into the two-card accordion.

---

## 4. The settled decisions (made with the user — do not re-litigate)

| # | Decision | What it means for your design |
|---|---|---|
| 1 | **Real delivered card, not a summary** | The order behind a claim renders as the actual `PastOrderCard` delivered branch (§2.C), full chrome — **not** `OriginalOrderSheet`. |
| 2 | **Accordion — exactly one expanded** | Opening the delivered card collapses the claim to its compact row; opening the claim collapses the delivered card. Mutually exclusive. One shared "which is open" state across the pair. |
| 3 | **Applies to the whole claim-card family** | All six claim cards + `ClosedClaimCard` (§2.D). The cancellation member is the documented exception (§3.C). |
| 4 | **Fully replace the strip + sheet** | Retire the `OrderClaimLink` parent strip *and* `OriginalOrderSheet` for cards in scope. The real card is the linkage; account for the sheet's unique content (§5.3). |

### The genuinely open decisions — you own these (bring a recommendation for each)

1. **The compact header row** — for the **claim**: `Claim # · date raised · View ▸`, mirroring a collapsed order header (the user's spec). For the **order** when *it's* collapsed: `Order #… · Placed {date} · View ▸`. Settle: does the collapsed claim also carry a **status tone dot / phase tag** (the claim has live state a collapsed order doesn't)? Recommend one. *(My seed: a small tone dot — `warn`/`brand`/`success` per `claimToneFor` — so the collapsed claim still reads its state at a glance.)*
2. **Which is expanded by default, per family.** *(Seed: default-expand the claim — it's the live, actionable entity — with the order collapsed. For the four **takeover** cards (urgent/danger), keep the takeover card expanded and never auto-collapse it.)* Settle and justify the per-family defaults.
3. **The cancellation member** (§3.C) — lighter standalone treatment, or pair with the pre-cancellation order. Recommend one.
4. **The accordion transition** — the connector thread + the open/collapse motion. Reuse `animate-slideDown` (the existing expand precedent — §6); decide whether the round-trip `ringPulse` (§2.A) still has a role when both halves are inline (you no longer return *from a sheet* — does opening a collapsed partner still want a reorienting pulse?).

---

## 5. Design considerations you must resolve

### 5.1 The compact row must mirror — but not equal — a collapsed order header
The user wants the collapsed claim to read "the same as the collapsed order card" — i.e. the `Order #… · Placed {date} · ChevronDown` header pattern (`PastOrderCard` cancelled branch ·163-174; `ClaimCard` ·83-94). Match that rhythm (uppercase ref eyebrow, right-aligned affordance), but the **View ▸** chip (from the old strip, `OrderClaimLink` ·64-67) signals "tap to open this card," distinct from the bare chevron. Settle whether the compact row uses a chevron, the `View ▸` chip, or both, and keep the two compact rows (order / claim) visually consistent.

### 5.2 One shared expand state replaces two independent ones
Today the claim card owns its own `expanded` state (`ClaimCard.jsx` ·54) and the delivered card has none (always open). The pair needs **one** "which half is open" state. You design the *visual* of both halves in both states; **note in the spec that the two cards must share a single open/collapsed signal** (the engineering pass lifts it), and that the existing per-card `expanded`/`openSignal` (`ClaimCard.jsx` ·54-65 — driven by "Track this return") must still be able to force the claim open.

### 5.3 Where the retired sheet's content goes (content-migration audit)
`OriginalOrderSheet` is retired (§4 decision 4). The expanded delivered card (§2.C) already shows: Delivered pill, delivered-on hero, `ProductSummary` (incl. price breakdown), history, Download receipt, "I need help with this device." The sheet uniquely added: an explicit **Order total** row and a **Payment method** row (§2.B). **Audit the gap** and recommend: do those two rows migrate into the expanded delivered card, or are they intentionally dropped (the price breakdown in `ProductSummary` may already cover total)? Spec the answer — don't leave the content unaccounted for.

### 5.4 The round-trip reorientation
The old flow pulsed the claim card when you returned from the sheet's "Linked claim" row (§2.A, `onReveal`). With both halves inline in an accordion, "return from sheet" no longer exists. Decide whether tapping a compact partner to expand it warrants any highlight/pulse, or whether the expand motion alone is enough. (Don't keep `ringPulse` machinery that no longer has a trigger.)

### 5.5 The 430px frame + the tap-target convention
The mobile frame is **430px wide**. Both compact rows and both expanded cards must work there. The claim card header is a single `<button>` (whole-header tap-target — `ClaimCard.jsx` ·77; `CLAUDE.md` "whole header is the tap target"). Any control you add to a compact row that *isn't* "expand this card" (there shouldn't be many) must be a `stopPropagation` child. The compact row itself should be one tap target that expands the card.

---

## 6. The visual primitives you build *from* (existing — invent nothing untested)

Token authority: **`tailwind.config.js`** + narrative in **`brief/design-system.md`**. Prefer named tokens; slash-opacity (`bg-brand/10`) works on any.

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Primary / secondary text |
| `muted` | `rgb(138,143,154)` | Eyebrow refs, the `Placed {date}` line, count text |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Card border / inactive fill, dividers |
| `brand` (+`bg`/`bg2`) | `rgb(80,25,160)` / `rgb(243,237,251)` / `rgb(236,226,250)` | The `View ▸` chip tone (it's `text-brand` today), brand claim-state hero |
| `brand-2` | — | The connector thread / node color today (`OrderClaimLink` ·32-40) |
| `success` (+`bg`) | green | Delivered pill + delivered hero (`PastOrderCard` ·73-99); `success` claim-state tone |
| `warn` / `danger` (+`.bg`) | amber / red | Claim-state tones (`warn`→`brand`→`success`) + takeover-card danger |
| `accent` | `rgb(217,26,122)` | Magenta promo accent — sparingly |
| `surface` / `canvas` | `#FFFFFF` / `rgb(247,245,251)` | Card / page bg |

Shape & type: cards `rounded-card` (18px), inner blocks `rounded-[14px]`, buttons `rounded-btn` (10px); eyebrow refs `text-[10.5px] font-bold uppercase tracking-[0.08em] tabular-nums`; body 12.5–14px. Font Inter. Icons lucide-react (`ChevronDown` for expand, `ChevronRight` for the `View ▸` chip). Claim-state tone vocabulary lives in `claimToneFor` (`lib/claims.js`) — `warn`→`brand`→`success`.

**Reuse, don't re-roll:**
- `ProductSummary` (`tone="light"|"hero"`, exports `REVIBE_CARE_ICON`) — the product line-item row; both halves of the pair already use it.
- `OrderClaimLink` (`OrderClaimLink.jsx` ·12) — **your one editable file**; the connector + nodes already live here.
- `formatClaimRef(claim)` (`lib/claims.js`) — the typed ref for the claim compact row (`RET-`/`WAR-`/`CMP-`/`CXL-`); never hardcode a prefix.
- The expand precedent: `animate-slideDown` (`tailwind.config.js` ·73/·126), used by every card body that opens (`PastOrderCard` ·181, `ClaimCard` ·101).

> **Gotcha (from `CLAUDE.md`): never introduce a `page` colour token** — `text-{name}` resolves to either a fontSize or a colour, and a name colliding with a `fontSize` key silently renders white text. The same risk applies to any new token name you propose — check it doesn't collide.

---

## 7. Structural reality you must design *for*

- **You may edit `src/components/OrderClaimLink.jsx`** to prototype the pairing chrome (connector + compact rows). The card-routing change that makes one order emit **two linked cards** (today the claim card replaces the order — §3.B) lives in `App.jsx` and is the engineering pass's job. So design the pair's **shape/contract** clearly — what the wrapper renders (delivered card + connector + claim card), what state it needs (one shared "which is open"), what each compact row shows — so the implementer can wire routing + lifted state without re-deriving your intent.
- **One shared open state** (§5.2): the wrapper (or App) owns "order-open vs claim-open"; spec the contract (e.g. the wrapper takes both cards as children/slots and owns the accordion, or App passes an `openHalf` + setter). Recommend the cleaner shape.
- **Mobile frame is 430px.** Both compact rows + both expanded cards must fit. Verify there (§ system prompt step 4) if you prototype.
- **Decorative placeholders** (per `CLAUDE.md`): "Download receipt", search, profile — don't design around real behaviour for these.
- **Whole-header tap-target** (§5.5): a compact row is one tap target → expand its card. Keep it consistent across both halves.

---

## 8. Your deliverable — a design spec, handed back

Write the spec to **`docs/handoff/order-claim-pairing/design.md`**. It should contain:

- **The paired-card system** — the two cards + connector, in **both** accordion states (claim-open / order-open), at 430px (annotated ASCII). Show the default state per family (open decision 2).
- **The two compact rows** — claim (`Claim # · raised date · View ▸` + your tone-dot decision) and order (`Order #… · Placed {date} · View ▸`), measured (sizes, weights, spacing), shown consistent with each other and echoing a collapsed order header (§5.1).
- **The shared-state contract** (§5.2, §7) — what the wrapper renders and what "which is open" state it needs, so the engineering pass can lift it and still honour the existing force-open signal (`ClaimCard` `openSignal`).
- **The content-migration answer** (§5.3) — where Order total + Payment method land (migrate into the expanded delivered card, or dropped) now that the sheet is retired.
- **The per-family defaults** (§4 open decision 2) — incl. the takeover-cards-stay-open rule.
- **The cancellation member** (§3.C / open decision 3) — your recommended treatment.
- **The transition** (open decision 4) — accordion motion (reuse `animate-slideDown`), connector behaviour, and the `ringPulse` decision.
- **A one-line note that this supersedes `claims-filter` decision 4** (§3.A).
- **Tokens used** (§6) + redlines; **net-new elements** (collapsible delivered header, claim compact row) flagged as net-new and justified against existing primitives.

**Deliverable is a spec with annotated ASCII mocks.** You *may* edit `OrderClaimLink.jsx` to prototype the pairing if it sharpens the spec — flag any such edit and keep it confined to that file.

**Hand-back boundary — do NOT cross it:**
- ✅ You may edit `src/components/OrderClaimLink.jsx` (the granted exception).
- ❌ No edits to `App.jsx` (routing, the two-card render, lifted state), the claim-card family files (`ClaimCard.jsx`, `WarrantyClaimCard.jsx`, the four takeover cards, `ClosedClaimCard.jsx`, `PastOrderCard.jsx`), `OriginalOrderSheet.jsx`, `lib/*`, or any `data/*`.
- ❌ No rewiring routing to emit two cards, no lifting state into `App.jsx`.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.

When the spec is ready, hand back. The engineering pass makes routing emit the linked pair, lifts the shared open state, retires `OriginalOrderSheet` for the in-scope cards, migrates the audited content, and updates docs/codemap per `CLAUDE.md` (this touches `docs/output/returns/claim_tracking.md` §10 + `docs/output/orders.md` + `CHANGELOG.md`).

---

## 9. Source files to read when this brief isn't enough

| You want… | File · line |
|---|---|
| The linkage wrapper you're extending (and may edit) | `src/components/OrderClaimLink.jsx` ·12 (connector ·30-41, strip ·43-68, sheet ·81) |
| The summary sheet you're retiring (content to migrate) | `src/components/OriginalOrderSheet.jsx` ·31 (total ·120, payment ·125, linked-claim row ·139, receipt ·167) |
| The real delivered card the pair surfaces (not collapsible today) | `src/components/PastOrderCard.jsx` ·40 (`DeliveredOrderCard`), ·49-64 (eyebrow/pill/hero/product/footer); cancelled branch ·140 |
| The primary claim card (header tap-target, ref, tone, expand body) | `src/components/ClaimCard.jsx` ·47, ·77-98 (header button), ·85 (`formatClaimRef`), ·100 (expanded body) |
| The rest of the claim-card family (pairing generalises across all) | `WarrantyClaimCard.jsx` ·53, `DocsRejectedCard.jsx` ·35, `PickupFailedCard.jsx` ·22, `ResetFailedCard.jsx` ·28, `InvalidClaimCard.jsx` ·43, `ClosedClaimCard.jsx` ·47 |
| Where one order renders one card today (routing to change later — read only) | `src/App.jsx` past-section map ·688-752, in-progress map above it |
| Claim ref formatting + tone | `src/lib/claims.js` (`formatClaimRef`, `claimToneFor`) |
| The reusable product row | `src/components/ProductSummary.jsx` (exports `REVIBE_CARE_ICON`); brief `docs/handoff/product-summary/` |
| Design tokens (authoritative) + expand animation | `tailwind.config.js` (`animate-slideDown` ·73/·126); narrative `brief/design-system.md` |
| The brief whose linkage decision this supersedes | `docs/handoff/claims-filter/context.md` §3.B, §4 decision 4 |
| Repo conventions, gotchas (the `page`-token trap), card-routing model, `OrderClaimLink` reuse rule | `CLAUDE.md` (root); routing tree `docs/output/diagrams.md#card-routing`; linkage spec `docs/output/returns/claim_tracking.md` §10 |
