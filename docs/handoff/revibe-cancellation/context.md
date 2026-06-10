# Revibe-Initiated Cancellation Card — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to design **one new card** for the Revibe My-Account → Orders prototype: the card a customer sees when **Revibe cancelled their order — not them.** You have **zero prior context** on this codebase. This doc is your self-contained brief: what the card is, why it can't just be a variant of the existing cancelled-order card, the three reasons it fires, where it slots into the card-routing tree, the components you must reuse, the money + discount model, and the design tokens you must reuse.

**What this doc is.** A map + a contract. It names the exact files/lines, the data fields, the components to reuse, and the visual tokens, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The visual direction is yours. This doc fixes the *inputs* (data, components, tokens, constraints) and the *problem* (the goals in §1, the four product decisions in §1.1), not the output.

---

## 0. The 10-second picture

Today, when a **customer** cancels their own order, the order list shows a *refund-hero* card (`PastOrderCard` → `CancelledOrderCard`) that leads with the refund amount and destination — it answers *"where's my money going?"*.

This card is the **inverse case**: **Revibe** had to cancel the order, the customer never asked to. The customer's question is not "where's my money" (they're getting a full refund, no fee, because it wasn't their fault) — it's *"why, and what now?"*. So the card's job flips from a refund receipt to an **apology + a reason to come back**:

```
┌───────────────────────────────────────────┐
│ ORDER · #89640                              │
│ ● Cancelled by Revibe                       │  ← state chip
│                                             │
│  We had to cancel your order                │  ← apology hero
│  The seller no longer has this item in      │  ← reason (1 of 3)
│  stock. We're sorry for the inconvenience.  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  AED 50 off your next order          │   │  ← the offer (the POINT
│  │  COMEBACK50            [ Copy ]      │   │     of this card)
│  │  Expires 30 Jun 2026                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [  Browse similar devices  ]               │  ← primary CTA
│                                             │
│  📱 iPhone 14 · Blue · 128 GB · Excellent   │  ← ProductSummary (reused)
│  🛡 Revibe Care +AED 100      AED 1,199     │
│                                             │
│  ✓ AED 1,199 fully refunded to your         │  ← refund REASSURANCE
│    Visa •• 4242 · no fee                    │     strip (not the hero)
│  [ View refund details ]                    │
└───────────────────────────────────────────┘
```

The ASCII is **illustrative, not prescriptive** — your job is the visual direction. What's fixed is the *content hierarchy*: apology+offer leads, refund reassures, the product row and refund breakdown reuse existing components.

---

## 1. Your remit — design only

**You are responsible for the design, not the implementation.** Produce the visual direction and a spec (see §9); the component build, card-routing wiring, mock data, and docs are a separate engineering pass *after* you hand back. Do **not** build the card, do **not** wire `App.jsx` routing, do **not** add mock orders, do **not** edit `docs`/run codemap. Your job ends at a design the implementer can build from. (You *may* produce **one** throwaway visual mock to validate the look — see §9 for the boundary.)

### The goals (all in scope)

1. **Make the apology land without feeling like a dead end.** The customer ordered something and Revibe pulled it. The card should own that honestly (clear reason, clear "this wasn't your fault, you're fully refunded") *without* dwelling — the centre of gravity is forward, to the re-buy.
2. **Drive the re-buy.** This is the card's **primary purpose.** The fixed-amount discount code + "Browse similar devices" CTA are the hero action, not a footnote. Design the offer block to be the thing the eye lands on after the apology.
3. **Reuse, don't re-roll.** This card sits in a family of order/claim cards that already share components (`ProductSummary`, the refund chrome, progress dots, sheets). Maximise reuse (§5) so it reads as part of the system, not a bolt-on. The engineering pass should be assembling existing pieces, not building net-new surfaces, wherever possible.
4. **Visual refresh within the language.** Restyle within the existing design tokens (§7) — no new colour system.

### 1.1 The four product decisions — already made with the user (do not re-litigate)

| Decision | Choice | What it means for your design |
|---|---|---|
| **Incentive type** | **Fixed-amount credit** | A flat money-off code (e.g. `AED 50 off`), **not** a percentage. Render a **discount-code block**: the code string, a **copy-to-clipboard** affordance, and an **expiry date**. Treat the amount/code/expiry as data (§6.2) — don't hardcode a number into the design language. |
| **Per-reason treatment** | **Single unified card** | One layout for all three reasons. The reason drives a single **explanatory line/chip** (§3) — copy varies, layout + CTA do **not**. Do not design three bespoke cards or three different CTAs. |
| **Visual emphasis** | **Apology + discount leads** | The hero is the apology + the offer. The **refund is a reassurance strip below**, not the hero. This is the opposite of the existing refund-hero card (§2) — don't copy its hero treatment; borrow its *chrome* (§5). |
| **Primary CTA target** | **Browse / similar devices** | One CTA — *"Browse similar devices"* (or similar) — for **all** reasons, including item-unavailable. Don't deep-link to the same product (the item may be the reason it was cancelled). The CTA is a visual placeholder (no real catalogue route exists — see §8). |

---

## 2. Why this is a new card, not a variant of the existing one

There are now **two cancellation worlds**, and they answer different customer questions:

| | **Customer-initiated** (exists today) | **Revibe-initiated** (this card) |
|---|---|---|
| Who cancelled | The customer, from `InProgressCard` → `CancelOrderSheet` | Revibe ops, before fulfilment |
| Customer's question | "Where's my money going?" | "Why? And what now?" |
| Hero | **Refund amount + destination** (`RefundHero` in `PastOrderCard.jsx` ·242) | **Apology + discount offer** |
| Refund | May carry a 5% fee (their choice cost them) | **Always full, no fee** — not their fault |
| Reversible? | Yes, while `requested` (`I want to keep my order`) | **No** — Revibe can't un-cancel |
| Progress stepper | 3-step `Requested → Pending → Refunded` | Not the point — refund is a settled reassurance, not a journey |
| Emotional tone | Neutral/transactional | **Apologetic → forward-looking** |

The existing card (`docs/output/cancellations.md` §3, `PastOrderCard.jsx` ·124 `CancelledOrderCard`) is **the wrong shape** for this — its whole structure leads with the refund and offers a "keep my order" reversal. Trying to bend it into the apology+offer hierarchy would break both. **So this is a sibling card.** But it lives next to the existing one and **shares its chrome and components** (§5) — same `OrderEyebrow`, same `DestinationChip`, same `ProductSummary`, same `RefundDetailsSheet`. Design it as a *new member of the same family*, not a new family.

---

## 3. The three reasons Revibe cancels

All three render in the **one** unified card; the reason drives a single explanatory line (and optionally a small icon/chip), nothing structural. Customer-facing copy below is a **starting point** — refine the tone, but keep the "not your fault + here's the path forward" framing.

| Reason (proposed enum) | When it fires | Customer-facing explanation (draft) | Note for the offer/CTA |
|---|---|---|---|
| `item_unavailable` | Seller no longer has the item in stock | *"The seller no longer has this item in stock."* | The exact device is gone — this is **why** the CTA is "browse similar," not "re-buy this." |
| `price_error` | The listed price was wrong | *"This item was listed at the wrong price and we had to cancel the order."* | The item may still exist at the correct price, but per the CTA decision we still send to browse (not a corrected re-order). |
| `undeliverable_address` | Courier can't deliver to the address | *"Our courier partner can't deliver to your address."* | You **may** surface the order's delivery address (reuse `DeliveryAddressPill`, `src/components/DeliveryAddressPill.jsx`) as a contextual detail — but the CTA stays "browse similar devices," not "edit address." Decide whether showing the address helps or just rubs salt in; recommend in your spec. |

The reasons are **neutral/informational in tone**, not error/danger — Revibe is apologising, not flagging a customer problem. Lean on `info`/`muted`/neutral chrome for the reason line, reserve `danger` for nothing here.

---

## 4. Where the card slots — card routing

`App.jsx` picks one card per order by precedence (full tree: `docs/output/diagrams.md#card-routing`). The cancelled branch today:

- `isInFlightCancellation(o)` (`App.jsx` ·52: `state === 'cancelled' && cancellationStatusId !== 'refunded'`) → renders `PastOrderCard` in the **In progress** section (`App.jsx` ·511–519).
- Otherwise a `refunded` cancelled order falls through to the **Past orders** `PastOrderCard` (`App.jsx` ·578–584), which branches internally on `state === 'cancelled'` (`PastOrderCard.jsx` ·30).

**Where this card goes (proposed — confirm the discriminator in your spec, the implementer wires it):** a Revibe-initiated cancellation is discriminated by a new field `cancellationInitiator: 'revibe'` (§6.1). When set, routing should render **this new card instead of** `CancelledOrderCard`, inside the `state === 'cancelled'` branch. Because the refund is **full and instant** (no `requested → pending` journey to wait on) and there's **no "keep my order" reversal**, the natural home is the **Past orders** section — it's a settled, terminal state. Don't design for an "in progress / awaiting refund" phase; this card represents a completed cancellation + refund.

You don't wire this — but design **for** it: one terminal state, no phase-tone progression, no auto-expand dependency.

---

## 5. Components to reuse — the core constraint

This is goal 3 made concrete. The implementer should assemble this card largely from pieces that already exist. Your design must be **buildable from these** — don't design something that forces a re-roll of a row/chip/sheet that already exists.

| Reuse | Where it lives | For |
|---|---|---|
| **`ProductSummary`** | `src/components/ProductSummary.jsx` (`tone="light"`) | The device row — thumbnail · name · variant · Revibe Care callout · **Total paid**. Shows *what was cancelled*. Exports `REVIBE_CARE_ICON` — do **not** re-roll the Care icon or the row. (Full brief: `docs/handoff/product-summary/`.) |
| **`DestinationChip` + refund tone language** | `PastOrderCard.jsx` ·309 (`DestinationChip`), ·112 (`toneFor`), ·118 (`TONE`) | The refund **reassurance strip**. Reuse the chip (wallet = brand→accent gradient; card = neutral; BNPL = `BnplDisclaimerTooltip`) and the `success` tone to say "fully refunded, no fee." You are *not* reusing `RefundHero` (·242) — that's the hero you're explicitly *not* leading with — but borrow its chip + tone vocabulary so the strip reads consistently. |
| **`RefundDetailsSheet`** | `src/components/RefundDetailsSheet.jsx` (props `{ order, open, onClose }`) | The `View refund details` action → line-item breakdown (product + Revibe Care → subtotal → total; **no fee row** here, since Revibe waives it). Reads `order.refund` (§6.3). Don't build a new breakdown surface. |
| **`OrderEyebrow`** | `PastOrderCard.jsx` ·215 (`Order · #{id}` uppercase eyebrow) | The top eyebrow. Same treatment as every other card. |
| **State chip** | Pattern in `PastOrderCard.jsx` ·223 (`StatePill`) / ·62 (`DeliveredStatePill`) | A `Cancelled by Revibe` chip. Reuse the pill shape/treatment; new label + tone. |
| **Copy-to-clipboard affordance** | `CourierStrip` in `src/components/ReturnShipmentTracking.jsx` (copyable AWB) | The discount **code** needs a copy affordance — mirror the existing copyable-AWB interaction rather than inventing one. |
| **Promo / accent language** | The `accent` magenta pill (`GreetRow` credits pill; the issue-claim `+AED 100 bonus` pill, `bg-accent/15 text-accent`, `Sparkles`) | The **discount-offer block**. The app already has a visual language for "money on top / promo" — the accent magenta. Build the offer on that vocabulary so it reads as a positive incentive, consistent with the Wallet-bonus treatment. |
| **`DeliveryAddressPill`** *(optional)* | `src/components/DeliveryAddressPill.jsx` | Only if you choose to surface the address on the `undeliverable_address` reason (§3). |

**Net-new pieces you're introducing** (keep them minimal, on existing tokens): the **apology hero** block and the **discount-code block**. Everything else should lean on the table above. If your design needs a net-new element not listed here, flag it explicitly in the spec as net-new and justify why an existing piece won't do.

---

## 6. The money + discount model

### 6.1 Cancellation discriminator + reason (proposed new fields)

The implementer adds these; you spec the shape they need:

| Field | Type | Notes |
|---|---|---|
| `cancellationInitiator` | `'customer'` \| `'revibe'` | **The discriminator** (§4). Absent / `'customer'` ⇒ existing refund-hero card. `'revibe'` ⇒ this card. |
| `cancellationReason` | `'item_unavailable'` \| `'price_error'` \| `'undeliverable_address'` | Drives the explanatory line (§3). Only meaningful when initiator is `'revibe'`. |
| `state` | `'cancelled'` | Set as today. `statusId` is unchanged (a cancelled order keeps the `statusId` it had at cancellation — see `CLAUDE.md` "state is parallel to statusId"). |
| `cancellationRef` *(optional)* | string | Customer-facing reference, as on the existing card. |

### 6.2 The discount offer (proposed new object)

| Field | Type | Notes |
|---|---|---|
| `reBuyOffer.amount` | number | Fixed credit value (e.g. `50`). Currency is `order.currency`. |
| `reBuyOffer.code` | string | The code to display + copy (e.g. `'COMEBACK50'`). |
| `reBuyOffer.expiresAt` | string | Human-readable expiry (e.g. `'30 Jun 2026'`). |
| `reBuyOffer.label` *(optional)* | string | Pre-composed headline if you want copy out of the component (e.g. `'AED 50 off your next order'`). |

Design the block to render **any** fixed amount/code/expiry — treat them as data. (Per the user's decision: fixed amount, not percentage.)

### 6.3 The refund (reuse the existing `refund` shape)

Carried under `order.refund` exactly as the existing cancelled card uses it (full reference: `docs/output/cancellations.md` §7.2; example mock `89205` at `src/data/orders/baseline.js` ·417). For a Revibe-initiated cancellation:

- `refund.amount` = `order.total` — **full refund**.
- **No `refund.fee`** — Revibe waives it (the 5% fee only applies when the *customer* chose to cancel). Your reassurance strip + `RefundDetailsSheet` should make "no fee" legible.
- `refund.destination` = original payment (`{ kind: 'card', label, last4 }`) or wallet (`{ kind: 'wallet', label }`) — reuse `DestinationChip`.
- `refund.breakdown` = the same `[{ label, amount }]` line items (product + Revibe Care).

> **Don't show a phase stepper or a `Refund of` / `Refunded` hero.** Those belong to the customer-initiated card's journey. Here the refund is **done** — a single settled, reassuring fact.

---

## 7. Design tokens — reuse these, don't invent

Authoritative: `tailwind.config.js`. Narrative: `brief/design-system.md`. Prefer **named tokens**; slash-opacity (`bg-accent/15`) works on any.

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Primary / secondary text |
| `muted` | `rgb(138,143,154)` | Tertiary text, the neutral reason line |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Borders / dividers / tile bg |
| `brand` / `brand-2` | `rgb(80,25,160)` / `rgb(122,61,211)` | Primary purple — CTA, code block |
| `brand-bg` / `brand-bg2` | `rgb(243,237,251)` / `rgb(236,226,250)` | Soft fills, tile bg |
| `accent` | `rgb(217,26,122)` | **Magenta — the promo/discount language** (offer block). The app's established "bonus / money-on-top" colour. |
| `success` (+`.bg`) | green | The "fully refunded, no fee" reassurance strip |
| `warn` (+`.bg`) | amber | Available if you want a softer "we had to cancel" tone; don't overuse |
| `canvas` / `surface` | `rgb(247,245,251)` / `#FFFFFF` | Page / card bg |

Shape & type: cards `rounded-card` (18px), buttons `rounded-btn` (10px). Body 14px, small 12px. Font Inter (Graphik substitute). Icons: lucide-react, 18–22px, stroke 1.75–2. Prices use `tabular-nums`. The existing cancelled card uses a `w-1` left accent strip carrying the phase tone — decide whether this card keeps that strip and in what tone (a single settled tone, not a progression).

**Gotcha — do not reintroduce a `page` colour token** (or any name colliding with a `fontSize` key): `text-{name}` resolves to either a fontSize or a colour, and the collision silently renders white text. See `CLAUDE.md` gotchas.

---

## 8. Constraints your design must respect

- **Mobile frame is 430px wide.** Design and screenshot at **430px**, `deviceScaleFactor: 2` (Playwright, `_snap.mjs` at repo root). Desktop-width mocks don't count.
- **Everything actionable here is a visual placeholder.** There's no real catalogue route, no real discount engine, no backend. "Browse similar devices" and "Copy code" are decorative/illustrative in the prototype (like Search, Wallet balance, "Download receipt" — see `CLAUDE.md` Gotchas). Design the affordances; don't design around a real destination that doesn't exist.
- **Card-as-tap-target convention.** On the collapsible baseline cards the whole header is one button and the chevron is decorative; if this card is expandable, any interactive child inside the tappable region (copy-code button, tooltip) must be implementable as a `stopPropagation` child (the established pattern — see `HistoryThread` chips, the `BnplDisclaimerTooltip` inside `DestinationChip`). Note: this is a **terminal** card — you may choose to make it fully expanded / non-collapsible since there's no journey to hide. Recommend in your spec.
- **Reuse tokens (§7) over arbitrary values; don't rely on a `page` token.**
- **This is a prototype for evaluating UX before production specs** — favour clarity and fidelity over architectural ceremony, but consistency with the existing card family (§5) matters a lot.

---

## 9. Your deliverable — a design spec, handed back

Produce a **design spec** the engineering pass can build from. Recommended home: write it to `docs/handoff/revibe-cancellation/design.md` (so the implementer picks it up cleanly), or present in-conversation if that's the agreed flow. It should contain:

- The **card layout + content hierarchy** — apology hero, the discount-offer block, the "Browse similar devices" CTA, the reused `ProductSummary` row, and the refund reassurance strip + `View refund details`. Make the **offer the visual focal point** after the apology (goal 2).
- The **reason treatment** — how the single explanatory line/chip renders for all three reasons (§3), and your recommendation on whether to surface the address for `undeliverable_address`.
- The **discount-code block** — code display, copy affordance (reuse the `CourierStrip` pattern), expiry, built on the `accent` promo language.
- The **refund reassurance strip** — using `DestinationChip` + `success` tone to say "full refund, no fee," and the `View refund details` → `RefundDetailsSheet` hook.
- **Which existing components you're reusing** (map to §5) and **any net-new element** you're introducing, justified.
- **Tokens used** (§7) and the **measurements/redlines** (sizes, spacing, weights) the implementer needs.
- **Card-routing note** — the `cancellationInitiator: 'revibe'` discriminator and the Past-orders placement (§4), so the implementer knows where it slots.
- Annotated mocks — ASCII, or a single throwaway live mock (boundary below). Validate at least the three reasons read correctly in one layout.

**Hand-back boundary — do NOT cross it:**
- ❌ No building the real card component, no `App.jsx` routing wiring, no adding mock orders to `src/data/orders/*`.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.
- ✅ You **may** build **one** throwaway live mock (a single card or scratch route) purely to validate the look — flag it clearly as disposable and don't spread edits across other files.

When the spec is ready, hand back: the implementer builds the card (reusing §5), adds the `cancellationInitiator` / `cancellationReason` / `reBuyOffer` fields + a mock order per reason, wires the `App.jsx` cancelled-branch routing, and updates the docs/codemap per `CLAUDE.md` (this change touches `docs/output/cancellations.md` + `CHANGELOG.md`).

---

## 10. Source files to read when this brief isn't enough

| You want… | File |
|---|---|
| The existing cancelled-order card (the sibling you're *not* copying the hero of) | `src/components/PastOrderCard.jsx` ·124 (`CancelledOrderCard`), ·242 (`RefundHero`), ·309 (`DestinationChip`), ·112/·118 (tone) |
| The reusable product row | `src/components/ProductSummary.jsx` (exports `REVIBE_CARE_ICON`); brief `docs/handoff/product-summary/` |
| The refund breakdown sheet | `src/components/RefundDetailsSheet.jsx` |
| The copy-to-clipboard pattern | `src/components/ReturnShipmentTracking.jsx` (`CourierStrip`, copyable AWB) |
| The promo/accent pill language | `src/components/GreetRow.jsx` (credits pill); the issue-claim bonus pill (`docs/output/cancellations.md` §2.5) |
| The cancellation data + refund shape | `docs/output/cancellations.md` §7; example mock `src/data/orders/baseline.js` ·388 (`89205`) |
| Card-routing (which card shows when) | `src/App.jsx` ·52 (`isInFlightCancellation`), ·511 & ·578 (cancelled branches); `docs/output/diagrams.md#card-routing` |
| The money / order field shape | `src/data/orders/baseline.js`; spec in `docs/output/orders.md` §7 |
| Design tokens (authoritative) | `tailwind.config.js`; narrative `brief/design-system.md` |
| Repo conventions, gotchas, card-routing model | `CLAUDE.md` (root) |
