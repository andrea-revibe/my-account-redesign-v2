# Claims Filter + Claim↔Order Linkage — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to design **two related additions** to the Revibe My-Account → Orders prototype:

1. A **second filter dimension** — a "claims" chip row beneath the existing status chips — that lets a customer narrow the list to **Returns · Warranties · Compensations · Cancellations**.
2. A **claim↔order linkage** — a way, from a claim card, to *understand and reach the order the claim was raised against*.

You have **zero prior context** on this codebase. This doc is your self-contained brief: where filtering lives today, how claims surface, the one architecture mismatch you must design around, the decisions already settled with the user, the two genuinely open decisions you own, the tokens/primitives to build from, and the hand-back boundary.

**What this doc is.** A map + a contract. It names the exact `file·line`s, the data fields, the components to reuse, and the visual tokens, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The visual direction — chip-row layout, multi-select treatment, the linkage affordance — is yours. This doc fixes the *inputs* and the *problem*, not the output.

> **One hard rule (from the user): reference only what already exists in the repo.** Cite real tokens, files, lines. Anything net-new (a multi-select chip treatment, an "Original order" block) you design *as net-new*, derived from existing primitives (§6), and flag it as new — never present an invented token/hex as an established repo fact.

---

## 0. The 10-second picture

Today the Orders list has **one** filter dimension — a status chip row (All / Open / Delivered / Cancelled). Claims (returns, warranties, compensations) and cancellations are *scattered through the same list* as cards; there's no way to say "show me just my claims," and no easy way, from a claim card, to get back to the order it came from.

```
TODAY                                   TARGET
┌───────────────────────────────┐      ┌───────────────────────────────┐
│ [ Find an order or item   🔍 ] │      │ [ Find an order or item   🔍 ] │
│                                │      │                                │
│ [All][Open][Delivered][Cancel] │      │ Status: [All][Open][Deliv][Can]│  ← row 1 (exists)
│                                │      │ Claims: [Returns][Warranty]    │  ← row 2 (NEW,
│  ── In progress ──             │      │         [Compensation][Cancel] │     multi-select)
│  [ claim card ]                │      │                                │
│  [ order card ]                │      │  ── In progress ──             │
│  ── Past orders ──             │      │  ┌ Return · in progress ─────┐ │
│  [ claim card ]                │      │  │ Order · #89610            │ │  ← linkage:
│  [ order card ]                │      │  │ 📱 iPhone 13 · Blue       │ │     reach the
│  ...                           │      │  │ … View original order ▸   │ │     ORIGIN order
└───────────────────────────────┘      │  └───────────────────────────┘ │
                                        └───────────────────────────────┘
```

The ASCII is **illustrative, not prescriptive.** What's fixed is: a *second, multi-select* claims row that filters together with status; and a claim-card affordance that reaches the originating order's details.

---

## 1. Your remit — design only

**You are responsible for the design, not the production wiring.** You produce a visual direction and a spec (`docs/handoff/claims-filter/design.md`). The filter *predicate* (what each chip selects), the routing, and the data live in `lib/` + `App.jsx` and are a separate engineering pass *after* you hand back. **One exception, granted by the user:** you **may edit `src/components/OrderFilters.jsx`** itself to prototype the chip row (§7). Everything else in §8 is off-limits.

### The goals (all in scope)

1. **A second filter dimension that reads as one system.** Add a claims chip row that visually belongs with the existing status row + search (`OrderFilters.jsx`), not a bolt-on. It filters the *same* list the status chips filter.
2. **Multi-select within the claims row.** A customer can toggle several claim types at once (Returns **+** Warranties). This is richer than the existing single-select status chips — you must settle how an active-multi state, an empty state, and a "clear" affordance read (§5.2).
3. **Make claim→order obvious and reachable.** From a claim card, the customer should understand *which order* the claim belongs to and be able to open that order's details (date, line-item, receipt). Today only a static `Order · #id` eyebrow exists (§3.B) and the order card itself is *replaced* by the claim card — so "reach the order" is a within-card affordance, not a scroll-to.

**Out of scope for the design:** the filter *predicate* logic (which orders each chip matches — that's `matchesStatus`/`isOpen` in `App.jsx`, off-limits), the claim pipeline/timeline internals, the card-routing precedence, and any backend.

---

## 2. Where filtering & claims live today — every occurrence

### A. The filter component (your primary surface)

`src/components/OrderFilters.jsx` — a search input + one chip row.
- `STATUS_CHIPS` ·3 — `[All, Open(=in_progress), Delivered, Cancelled]`.
- `OrderFilters` ·13 — props `{ activeStatus, onStatusChange, counts }`. Renders the search `<label>` (·20, decorative placeholder), then a horizontally-scrollable chip row (·29). Active chip = `bg-ink text-white border-ink`; inactive = `bg-surface text-ink border-line` (·48-53). Each chip carries a **count badge** (·56-67): inactive `bg-line-2 text-muted`, active `bg-white/20 text-white`.

### B. How the filter is driven (App.jsx — read, don't edit the predicates)

| Concern | `App.jsx` · line |
|---|---|
| `activeStatus` state (single-select) | ·84 |
| `matchesStatus(order, status)` — the predicate | ·75 |
| `isOpen` / `isDeliveredPast` / `isInFlightCancellation` | ·51 / ·66 / ·42 |
| `counts` (per-chip badge counts) | ·481 |
| `filtered` (the rendered set) | ·491 |
| `<OrderFilters … />` render | ·541 |
| In-progress vs Past section split | ·510-513; renders ·555 / ·661 |

### C. How claims & cancellations surface as cards

A claim lives on `order.claim` (`type`: `change_of_mind` / `issue` / `warranty` / `compensation` — string contract, `data/orders.js` → switched in `App.jsx` routing). The card that renders it:

| Customer concept | Internal model | Card(s) | Section |
|---|---|---|---|
| **Returns** | `claim.type` ∈ `{change_of_mind, issue}` | `ClaimCard`, or takeover variants `DocsRejectedCard`/`PickupFailedCard`/`ResetFailedCard`/`InvalidClaimCard` | In-progress while active; Past when refunded/delivered |
| **Warranties** | `claim.type === 'warranty'` | `WarrantyClaimCard` | In-progress / Past |
| **Compensations** | `claim.type === 'compensation'` | `ClaimCard` (compensation chain) | In-progress / Past |
| **Cancellations** | `state === 'cancelled'` (+ `cancellationStatusId`, `cancellationInitiator`) | `PastOrderCard` (cancelled branch) / `RevibeCancellationCard` | In-progress while in-flight; Past when refunded |

---

## 3. The architecture mismatch you must design around

### A. The claims row spans **two different internal models**

This is the crux of the filter. Three of your four chips map to `order.claim.type`; **"Cancellations" does not** — cancellations are an *order-state* thing (`state === 'cancelled'`), not a claim. The user has **decided to group them anyway** (§4) because the customer thinks of all post-purchase actions as one family. So the intended chip→predicate mapping (which the *engineering pass* wires, but which **you must spec** so they know your intent) is:

| Claims chip | Intended predicate |
|---|---|
| **Returns** | `order.claim?.type === 'change_of_mind' \|\| order.claim?.type === 'issue'` |
| **Warranties** | `order.claim?.type === 'warranty'` |
| **Compensations** | `order.claim?.type === 'compensation'` |
| **Cancellations** | `order.state === 'cancelled'` |

Note **"Returns" bundles two claim types** (change-of-mind + faulty/wrong-device issue). Confirm that grouping reads right in your spec; if you think "Returns" should split, raise it in one sentence — don't silently redesign it.

### B. The claim card *replaces* the order card — there is no order card to scroll to

When a claim is raised from a delivered `PastOrderCard` (`onRaiseClaim` → `App.jsx` ·716 → `ClaimFlow`), the order flips to "open" (`isOpen` → `hasActiveClaim`) and renders **only** as the claim card — the original `PastOrderCard` is no longer in the list. So "jump to the order" (the user's words) cannot be a scroll-to-another-card; it must be a **within-card affordance** that surfaces/opens the originating order's details.

What already exists on the claim card: `OrderEyebrow` (`ClaimCard.jsx` ·79, prints `Order · #89610`) and the reused `ProductSummary` row (·90, the product thumbnail/name/variant/price). What's **missing**: order *date placed*, the original receipt, and any way to *open* the order. That gap is the linkage problem.

---

## 4. The settled decisions (made with the user — do not re-litigate)

| # | Decision | What it means for your design |
|---|---|---|
| 1 | **Two independent filter dimensions** | Keep the status chip row as-is; add the claims row as a **separate, always-visible second row**. Not a 5th status chip, not an expanding chip, not a filter sheet. Status and claims filter **together** (AND across rows). |
| 2 | **Claims row is multi-select** (OR within the row) | Status stays single-select; the claims row lets several types be active at once → "orders with a return **OR** warranty claim." You own the active-multi / empty / clear treatment (§5.2). |
| 3 | **Cancellations are grouped under the claims row** | Even though they're `state`, not `claim` (§3.A). The customer-facing grouping wins; the predicate mapping handles the model difference. |
| 4 | **Linkage = reach the originating order from the claim card** | Because the order card is replaced (§3.B). A within-card affordance surfacing order #, date, line-item, receipt — *not* a scroll-to. |

### The two genuinely open decisions — you own these (bring a recommendation for each)

1. **Filter-row placement & style.** Where/how the claims row sits relative to the status row + search: stacked second row vs. a labelled two-row block (`Status:` / `Claims:`) vs. a segmented treatment. How it reads on the 430px frame with horizontal scroll. *Recommend one.*
2. **The claim→order affordance form.** How the claim card reaches the order:
   - an **inline reference line** (`From order #89610 · placed 2 Jun`) under the eyebrow — lightweight, no navigation;
   - an **expandable "Original order" section** inside the card;
   - a **lightweight order-detail sheet** (reusing the existing sheet chrome — `ClaimDetailsSheet.jsx` ·16 / `RefundDetailsSheet.jsx` ·7 are the precedents).
   *Recommend one, justify it, and note whether it applies only to `ClaimCard` or across the whole claim-card family (§5.3).*

---

## 5. Design considerations you must resolve

### 5.1 Counts on the claims chips
The status chips carry count badges today (`counts`, `App.jsx` ·481; rendered `OrderFilters.jsx` ·56). Decide whether the claims chips also show counts (the data is derivable per type) and how that reads when multiple are active. Recommend in the spec.

### 5.2 The multi-select states (net-new vs the single-select status chips)
The existing chips are single-select (`aria-pressed`, one active). A multi-select row needs:
- a clear **active treatment** for *several* simultaneously-active chips (the current `bg-ink text-white` pressed style was designed for one — does it still read with 3 active? a checkmark? a count?);
- an **empty state** (no claim chip active = no claim filter applied — the list shows everything the status chip allows);
- a **clear / reset** affordance for the row.
Spec all three. This is the richest net-new piece.

### 5.3 Does the linkage affordance generalise across the card family?
A claim can surface as `ClaimCard`, `WarrantyClaimCard`, or four takeover cards (`DocsRejectedCard`/`PickupFailedCard`/`ResetFailedCard`/`InvalidClaimCard`) — all carry the same `OrderEyebrow`/`ProductSummary` pattern. Recommend whether your affordance is designed once and reused across all of them (preferred for consistency) or scoped to `ClaimCard` first. You may spec it on `ClaimCard` and state it generalises.

### 5.4 Filtering doesn't regroup
The user chose *filter*, not regroup — when claims chips are active, the existing **In-progress / Past** section split still holds (a returns filter can show cards in both sections: active returns are "open," refunded returns are "past"). Don't design a by-claim-type regrouping; design a filter.

---

## 6. The visual primitives you build *from* (existing — invent nothing untested)

Token authority: **`tailwind.config.js`** + narrative in **`brief/design-system.md`**. Prefer named tokens; slash-opacity (`bg-brand/10`) works on any.

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Active chip bg / secondary text |
| `muted` | `rgb(138,143,154)` | Count badge text, row label |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Chip border / inactive badge bg |
| `brand` (+`bg`/`bg2`) | `rgb(80,25,160)` / `rgb(243,237,251)` / `rgb(236,226,250)` | Primary purple — a natural "active claim chip" tone if you move off the `ink` pressed style |
| `accent` | `rgb(217,26,122)` | Magenta promo accent — use sparingly |
| `success` / `warn` / `danger` (+`.bg`) | green / amber / red | Claim-state tones (already used across claim cards) |
| `surface` / `canvas` / `searchBg` | `#FFFFFF` / `rgb(247,245,251)` / `rgb(244,240,250)` | Card / page / search bg |
| `chip.warn` / `chip.warnInk` / `chip.danger` | — | Existing chip color tokens, if a claim chip needs a tone |

Shape & type: chips today are `rounded-full`, `h-[30px]`, `text-[12px] font-semibold`; cards `rounded-card` (18px), buttons `rounded-btn` (10px); body 14px, small 12px. Font Inter. Icons lucide-react. The claim cards already carry tone language via `TONE` (`ClaimCard.jsx` ·37) — warn→brand→success across states; if you tone the claim chips, align with that vocabulary.

Existing sheet chrome to reuse for a linkage *sheet* option: `ClaimDetailsSheet.jsx` ·16, `RefundDetailsSheet.jsx` ·7. Existing reusable row: `ProductSummary` (`tone="light"|"hero"`, exports `REVIBE_CARE_ICON` — don't re-roll). Animation precedent: `animate-slideDown` (`tailwind.config.js` ·73/·126), used by expanding card bodies.

> **Gotcha (from `CLAUDE.md`): never introduce a `page` colour token** — `text-{name}` resolves to either a fontSize or a colour, and a name colliding with a `fontSize` key silently renders white text. `colors.page` was removed; don't reintroduce it. The same risk applies to any new token name you propose — check it doesn't collide.

---

## 7. Structural reality you must design *for*

- **You may edit `src/components/OrderFilters.jsx`** to prototype the claims row (the user's one in-bounds source file). The *predicate* that consumes your chips (`matchesStatus`, the `counts` shape) lives in `App.jsx` and is the engineering pass's job — so design the chip row's **props/shape** clearly (e.g. `activeClaimTypes: Set`, `onToggleClaimType`, `claimCounts`) so the implementer can wire it without re-deriving your intent.
- **Mobile frame is 430px wide.** The status row already scrolls horizontally with an edge mask (`OrderFilters.jsx` ·29-37). A second multi-select row must also work at 430px — decide whether it scrolls, wraps, or fits.
- **Search is a decorative placeholder** (like Wallet-balance-less features noted in `CLAUDE.md`) — don't design around real search behaviour.
- **Card-as-tap-target convention.** The whole claim-card header is one button (`ClaimCard.jsx` ·72); any interactive child you add (a "View original order" link/button inside the header region) must be implementable as a `stopPropagation` child — the established pattern (see `HistoryThread` chips, `BnplDisclaimerTooltip`). A linkage control placed in the *expanded* body avoids the header tap-target entirely.

---

## 8. Your deliverable — a design spec, handed back

Write the spec to **`docs/handoff/claims-filter/design.md`**. It should contain:

- **The filter design** — the claims chip row: placement/style (open decision 1), the four chips + their intended predicates (§3.A), counts treatment (§5.1), and the **multi-select states** — active-multi, empty, clear (§5.2). Show it at 430px (ASCII), including the scroll/wrap behaviour with the status row above it.
- **The proposed `OrderFilters` prop shape** for the claims row, so the engineering pass can wire the predicate.
- **The linkage affordance** — the chosen form (open decision 2), what it surfaces (order #, date placed, line-item, receipt), where it sits on the card (header vs expanded body, respecting the tap-target rule), and whether it generalises across the claim-card family (§5.3). Map any reused chrome (`ProductSummary`, the sheet pattern) to §6.
- **Tokens used** (§6) + measurements/redlines (chip sizes, spacing, weights) for both additions.
- **Net-new elements** flagged as net-new and justified against the existing primitives.
- **Annotated ASCII mocks** — the filter in its key states, and the claim card with the linkage affordance.

**Deliverable is a spec with ASCII/annotated mocks (no throwaway scratch route).** You *may* edit `OrderFilters.jsx` to prototype the row if it sharpens the spec — flag any such edit clearly and keep it confined to that file.

**Hand-back boundary — do NOT cross it:**
- ✅ You may edit `src/components/OrderFilters.jsx` (the granted exception).
- ❌ No edits to `App.jsx` (the `matchesStatus` / `isOpen` predicates, `counts`, routing), `lib/claims.js`, `lib/statuses.js`, `lib/countries.js`, or any `data/*`.
- ❌ No building the real linkage component into the claim cards, no rewiring routing.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.

When the spec is ready, hand back. The engineering pass wires the multi-select predicate into `App.jsx` (`matchesStatus` + a claim-type filter + `counts`), builds the linkage affordance into the claim-card family, and updates docs/codemap per `CLAUDE.md` (this touches `docs/output/orders.md` + `CHANGELOG.md`).

---

## 9. Source files to read when this brief isn't enough

| You want… | File · line |
|---|---|
| The filter component you're extending (and may edit) | `src/components/OrderFilters.jsx` ·3 (`STATUS_CHIPS`) / ·13 (`OrderFilters`) |
| How the filter is driven (predicate, counts, sections) — **read, don't edit** | `src/App.jsx` ·75 (`matchesStatus`), ·481 (`counts`), ·491 (`filtered`), ·510-513 (sections), ·541 (render) |
| The primary claim card (eyebrow, ProductSummary, header tap-target, tone) | `src/components/ClaimCard.jsx` ·37 (`TONE`), ·72 (header button), ·79 (`OrderEyebrow`), ·90 (`ProductSummary`) |
| Claim type labels + the `type` contract values | `src/lib/claims.js` ·411 (`CLAIM_TYPE_LABELS`), ·418 (`claimTypeLabel`) |
| The other claim-card-family members (linkage generalisation) | `WarrantyClaimCard.jsx`, `DocsRejectedCard.jsx`, `PickupFailedCard.jsx`, `ResetFailedCard.jsx`, `InvalidClaimCard.jsx` |
| Cancellation surfaces (the non-claim member of the claims row) | `src/components/PastOrderCard.jsx` ·31 (cancelled branch), `RevibeCancellationCard.jsx` |
| Sheet chrome (for a linkage-sheet option) | `src/components/ClaimDetailsSheet.jsx` ·16, `src/components/RefundDetailsSheet.jsx` ·7 |
| The reusable product row | `src/components/ProductSummary.jsx` (exports `REVIBE_CARE_ICON`); brief `docs/handoff/product-summary/` |
| Design tokens (authoritative) | `tailwind.config.js`; narrative `brief/design-system.md` |
| Repo conventions, gotchas (the `page`-token trap), card-routing model | `CLAUDE.md` (root); routing tree `docs/output/diagrams.md#card-routing` |
