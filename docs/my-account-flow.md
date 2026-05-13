# My Account — Orders Flow

> **Living document.** Update this when the order shape, status model,
> auto-collapse rules, or component structure changes. See
> [`CHANGELOG.md`](../CHANGELOG.md) for the change history.

This document describes how the orders area of the My Account page works in the
prototype. It is written for both product and engineering. Shared context is up
front; deeper architecture sits in the later sections — skim or skip as needed.

---

## 1. Overview

The orders area lives inside the customer's My Account page. It shows every
order the customer has placed, communicates the current shipment status at a
glance, and lets the customer drill into a single order for full details and
post-purchase actions (download receipt, raise a claim, change address while
the order is still actionable, track the parcel via the courier).

This prototype is intentionally narrow: only the orders list and the
expand/collapse interactions are functional. Everything around it (search,
filters, the Revibe Wallet pill, profile menu, language toggle) is decorative
— present for visual fidelity but not wired up.

**In scope**

- Order list with five demo orders, one per top-level state plus a cancelled order.
- Per-order collapsed summary card with status banner.
- Per-order expanded view with full timeline, courier banner, sub-timeline, and order summary.
- Auto-expand rule: only the single most in-flight order is expanded by default; the rest collapse.
- Status chip row that filters the list (`All / In progress / Delivered / Cancelled`).
- Status banner with `delayed` and `statusMessage` overrides.

**Out of scope (faked or stubbed)**

- Authentication, real backend, real customer data.
- Site-wide search and the in-list "Find items" search field.
- Date-range dropdown effect on the list (logic is wired but all mock orders fall inside every range).
- The Revibe Wallet pill in `GreetRow` (purely visual; the balance is a hardcoded prop and the info tooltip is the only interactive part).
- Right-to-left and Arabic localisation.
- Receipt-download flow and claims flow.
- Real courier tracking — the "Track order" button hardcodes a known-good DHL Express test shipment so the demo always lands on a real tracking page.

---

## 2. User flow

### 2.1 What the customer sees

A vertical list of orders, newest first. Each order is rendered as a card. The
card always shows a compact summary header so the customer can scan the list
and understand the state of each order without expanding anything.

When a card is **collapsed**, the customer sees:

- A small `ORDER · #{id}` eyebrow at the very top of the card so the order number is always visible without expanding (mirrors the hero card's `Active order · #{id}` eyebrow). The order ID is intentionally **not** repeated inside the product strip subtitle — keeping it in the eyebrow lets the product strip read as a clean Product → Revibe Care → Total breakdown.
- A status icon + headline (e.g. "Out for delivery", "At quality check", "Delivered", "Cancelled").
- A subline with the most relevant timestamp (forward-looking ETA when DHL provides one, otherwise the most recent status timestamp).
- A state chip on the right when relevant. Delivered orders carry a green "Delivered" chip (overrides the data's `state: 'close'`); cancelled orders carry a red "Cancelled" chip.
- A tinted **status banner** with a leading condition phrase and a descriptive sentence (see §3, "Status banner").
- The product image, name, and variant.
- A muted `Revibe Care +{currency} {amount}` line beneath the variant when the order carries a Revibe Care add-on (omitted otherwise). Prefixed with the small Revibe Care RE_CARE logo so the add-on reads as a branded product, not a generic warranty fee. Same treatment in the hero card's frosted product strip (icon shown at higher opacity so it stays legible on the dark gradient) and on `PastOrderCard`.
- A small uppercase `TOTAL` caption stacked above the bold amount on the right side of the product strip. The caption is what tells the customer the bold number is the sum of Product + Revibe Care rather than the line price of just the device. Same treatment on the hero card's frosted strip. `PastOrderCard` intentionally skips the caption — there's no other dollar amount competing on that row, so the price is already unambiguous.

When a card is **expanded**, everything above remains visible at the top, and
below it the customer sees:

- For created / quality_check orders, the four-step **Full timeline** comes first — there is no in-card dot timeline above the product strip for these states, so the expanded timeline is the only one shown. For shipped orders the in-card dot timeline stays and the Full timeline sits at the very bottom of the expanded view (kept for parity).
- The status banner (long form), the **Shipping progress** sub-timeline (shipped only), and the courier card with the "Track" link.
- The **Order details** collapse with phone, address, order date, and "Change address" / "Change phone number" actions while the order is in any in-progress state (`created` or `quality_check`).
- The action row:
  - `created` / `quality_check`: `Cancel order` + `Change order details` (the latter programmatically opens the Order details collapse via ref so the change-address / change-phone pills are immediately visible). On `created`, `Cancel order` opens the two-step cancellation bottom sheet (see §2.6); on `quality_check` the button is currently a visual stub.
  - shipped: `Receipt` + `Get help`.

Past-order cards (delivered, cancelled) are a separate, simpler component
(`PastOrderCard`). It branches internally on `order.state`:

- **Delivered** keeps its compact one-row product summary with two pill
  actions, right-aligned: `Download receipt` + `Raise a claim`.
- **Cancelled** renders the refund-hero redesign — a dedicated compact card
  that leads with the **refund** as the visual hero rather than the
  fulfilment journey. A `w-1` left accent strip carries the phase tone
  (warn amber for `requested`, brand purple for `refund_pending`, success
  green for `refunded`). A small uppercase `Order · #{id}` eyebrow sits at
  the very top (mirroring the `OrderCard` pattern); the phase pill sits on
  its own row below; then a tinted hero block with the refund amount
  (`text-[28px]` tabular-nums) and a destination chip — wallet destinations
  get a brand→accent gradient chip (echoes the `GreetRow` credits pill);
  card destinations get a neutral chip. Refunded orders surface a
  `fundsAvailable` sub-copy line ("Available now in your wallet"); the two
  earlier phases make no ETA promise. Expanded reveals a 3-step numbered
  dot stepper for refund progress (created-path cancellations skip the
  `requested` step, mirroring `cancellationStepsFor` in `statuses.js`).
  Each reached/current step carries the timestamp it entered that phase
  underneath its label (sourced from
  `order.cancellationTimeline[step.id]`); upcoming steps render the label
  only. Then a dimmed fulfilment trace ending in a red ✕ at the cancel
  point, and a two-action footer (`View refund details` + icon-only
  `Download receipt`). Tapping `View refund details` opens the
  `RefundDetailsSheet` bottom sheet, which is the canonical surface for
  the line-item breakdown (product + Revibe Care line items → subtotal →
  fee (card refunds only) → total refund). Always collapsed by default;
  no auto-expand.

The full `OrderCard` chrome (status banner, sub-timeline, courier banner,
order summary) is no longer rendered for cancelled past orders.
`CancellationSubTimeline` is retained for in-flight orders that are
mid-fulfilment with `state === 'cancelled'`.

The **hero card** (active in-flight order, currently the out-for-delivery
order) carries two stacked rows of full-width buttons beneath the headline,
ETA subtitle, product strip, and dot timeline:

- Row 1: `Track package` (filled white, brand-coloured text — only filled CTA in the app) + `Get help` (ghost, headphones icon).
- Row 2: `Cancel order` + `Raise a claim` (both ghost, same size as row 1).

Tapping `Cancel order` toggles a small dark tooltip centered above the button
— *"You cannot cancel the order at this stage"* — dismissing on outside-click.
The cancellation rule is prototype-only (production should derive eligibility
from `statusId`). The `Delivery by [date]` line under the headline reads
from `order.estimatedDelivery` and only renders when present.

### 2.2 Auto-expand rule

```mermaid
flowchart TD
    Land[Customer lands on My Account] --> Render[Filter orders by chip + range]
    Render --> Pick[pickActiveOrderId: highest progressIndex<br/>among non-delivered, non-cancelled]
    Pick --> Decide{Order is the active one?}
    Decide -->|Yes| E[Render expanded by default]
    Decide -->|No| C[Render collapsed by default]
    C --> Tap[Tap header to expand]
    E --> TapClose[Tap header to collapse]
```

Every card collapses by default. `pickActiveOrderId(orders)` returns the id
of the single most-in-flight order — the one with the highest pipeline
progress (`progressIndex × 10 + subProgressIndex`, in-flight only) — and
`App.jsx` passes `defaultExpanded` only to that card. The rule operates on
the *filtered* list, so picking the "Delivered" chip auto-expands nothing
(no order is in flight), while "All" or "In progress" auto-expands the most
progressed open order. Once the customer taps a card, their state sticks
across filter changes (state lives in `OrderCard`, not derived from
`activeId`).

### 2.3 Top-level state machine

```mermaid
stateDiagram-v2
    [*] --> created
    created --> quality_check
    quality_check --> shipped
    shipped --> delivered
    created --> cancelled
    quality_check --> cancelled
    shipped --> cancelled
    delivered --> [*]
    cancelled --> [*]
```

`cancelled` is modelled as a separate **state** on the order, not a top-level
status — see §4.2. This is so a cancelled order can carry the status it was in
when cancellation happened, which informs the timeline rendering.

### 2.4 Shipping sub-state machine

While the top-level status is `shipped`, the order also carries a
**sub-status** describing where the parcel is in DHL's pipeline:

```mermaid
stateDiagram-v2
    [*] --> arrived_destination: enters shipped
    arrived_destination --> cleared_customs
    cleared_customs --> forwarded_to_agent
    forwarded_to_agent --> out_for_delivery
    out_for_delivery --> [*]: top-level transitions to delivered
```

There is intentionally no `delivered` sub-status. When the parcel is delivered,
the order's top-level status moves to `delivered` and the sub-status is no
longer relevant. This avoids having "delivered" in two places at once.

### 2.5 Per-state behaviour cheat sheet

| Top-level state | Auto-expanded | Headline copy | Status banner lead | Banner tone | Header chip | Courier banner | Sub-timeline |
|---|---|---|---|---|---|---|---|
| created | If most in-flight | "Order placed" | "On track" | brand | none | No | No |
| quality_check | If most in-flight | "At quality check" | "On track" (or "Taking longer than expected" if `delayed`) | brand / warn | none | No | No |
| shipped (sub-status drives headline) | If most in-flight | sub-status label (e.g. "Out for delivery") | "On track" / "Arriving today" (out_for_delivery) | brand | none | Yes | Yes |
| delivered | Never | "Delivered" | "All done" | success | green "Delivered" | Yes (with completed copy) | No |
| cancelled — in flight (`state === 'cancelled'` + non-terminal `statusId`) | Never | "Cancelled" | "Refund in progress" | danger | red "Cancelled" | No | No |
| cancelled — past order | Never | phase pill (`Cancellation requested` / `Refund pending` / `Refunded`) | n/a — `PastOrderCard` refund-hero block replaces the banner | warn / brand / success per phase | n/a (own card chrome) | No | No |

### 2.6 Cancellation flow (created stage)

`Cancel order` on a `created` order opens a bottom sheet (`CancelOrderSheet`)
with a max-height of 92vh, a black-45% scrim, and a slide-up entrance.
Dismissible by tapping the scrim, the X icon, or pressing `Escape`.

The flow is two steps for the wallet path and three steps for the
original-payment path. The extra middle step is a take-rate-protection
"dissuade" screen that fires only when both conditions hold:
`method === 'original'` **and** `statusId === 'created'`.

```
              Select
                │
                │  method === 'original' && statusId === 'created'
                ├──────────────────────────────► Dissuade ──► Confirm
                │                                   ▲ back       │
                │                                   │            │
                └──── wallet or other paths ──────► Confirm ─────┴──► close
```

**Step 1 — Choose your refund.** Header (`Cancel order` + `#id`), then an
order-summary card with the product strip and a line-item breakdown
(`Product` + `Revibe Care` if present + `Total`), then two refund options as
radio cards:

- **Revibe Wallet** (wallet icon + tap-toggle info `i`, success-tone detail
  line) — full refund of the order total, available instantly. The
  recommendation is no longer signalled with a `Recommended` pill; instead
  the "Full refund · available instantly" detail line is rendered in
  `text-success font-semibold` so the concrete benefit carries the emphasis.
  The `i` opens a tooltip explaining that wallet credits can be used on any
  product and are combinable with any payment method, with a placeholder
  `terms & conditions` link. Same tooltip surfaces wherever "Revibe Wallet"
  is named (credits pill in `GreetRow`, confirm-step destination line) — all
  driven by the shared `WalletInfoTooltip` component.
- **Original payment method** — total minus a 5% processing fee, refunded
  to the card in 5–10 business days. The fee is shown explicitly as a
  negative line under the amount (e.g. `−AED 42.45 (5% processing fee)`).

The `Continue` CTA is disabled until a method is picked. `Keep order` closes
the sheet without changes. `Continue` routes to **Dissuade** when the
original-payment + created gate fires, otherwise straight to **Confirm**.

**Step 2 (original + created only) — Cancel this order?** A retention screen
designed to give the user a reason to wait rather than cancel. Three blocks
stacked in a single-column body:

1. A centered hero card with the delivery promise: *"You're on track to
   receive your {product name} by"* + a large weekday-formatted
   `estimatedDelivery` (e.g. `Monday, 4 May`). The weekday is computed in
   `formatDeliveryDate(estimatedDelivery, placedAt)`, which parses the
   short form (`"May 4"`) using the year from `placedAt` and emits
   `weekday, day month` via `Intl.DateTimeFormat`.
2. A neutral info-tone strip warning that the item *may not be available to
   reorder later*. Scarcity, not "this is irreversible" — the cancellation
   itself is fully reversible at `created`; the real risk is item supply.
3. A soft-green success-tone strip with `ShieldCheck` icon framing the
   protection: *"If we don't ship by {order.shipDeadlineFull}, the {currency}
   {fee} processing fee is waived."* Anchored on the **shipping** deadline,
   not delivery, because Revibe controls ship time but couriers can always
   add delivery delays — shipping is the commitment the company can
   actually defend.

Footer has two equal-height chunky buttons (52px, `rounded-[12px]`,
`text-[14.5px]`): a brand-filled `Keep my order` and an outlined
`Continue to cancel` that turns red on hover (`hover:bg-danger-bg
hover:text-danger hover:border-danger`). The earlier draft had a third
muted text link with the same label and an extra `Switch to Revibe Wallet`
button — both were dropped. The wallet switch overrode the user's earlier
method choice (paternalistic) and the muted Continue link buried the
forward path; promoting it to a real button with a red hover state is
clearer about consequence without alarming the default state.

The dissuade step does not show the refund amount or breakdown — those
live one screen later on Confirm, which keeps Dissuade emotional/decisional
and Confirm transactional. `Back` returns to Select; the `X` and `Keep my
order` both close the sheet.

**Step 3 — Confirm cancellation.** A back arrow returns to the previous step
(Dissuade if the user came through it, otherwise Select). Body shows a
centered amount block (`You'll receive` / amount / destination / ETA copy).
On the wallet path the destination line reads `back to your [wallet icon]
Revibe Wallet [i]`, with the same shared info tooltip. On `Original payment
method` the block also carries a muted breakdown line (e.g. `Total AED 849 ·
−AED 42.45 fee`) between the headline figure and the destination, and the
destination line stays as plain "original payment method" text.

Beneath the amount block sits a neutral info-tone strip with method-specific
copy. `Revibe Wallet`: *"Revibe Wallet credit stays on Revibe. It won't be
paid out to your bank account."* `Original payment method`: *"You're giving
up {fee} to the processing fee."* The original-payment copy is intentionally
trimmed to a pure fee reminder — the earlier wallet pitch (*"Choose Revibe
Wallet for the full amount, instantly."*) was removed when Dissuade was
introduced, because doing the wallet upsell twice in a row in the same flow
felt like the company was reluctant to let the user leave. Footer: `Back` +
a danger-filled `Cancel order` CTA. This is the only step on the
original-payment path where the destructive action carries danger styling —
the order of escalation now matches the order of finality.

The current prototype does **not** persist cancellation: tapping the final
`Cancel order` simply closes the sheet (the order keeps its `created` state).
Wiring this to flip `state` to `cancelled` and vary the cancelled-state banner
copy by chosen refund method is a future step.

The 5% fee, the 1–3 working-day shipping policy (which sets `shipDeadline`),
the success-tone recommendation styling, and the line-item split are all
prototype-only — production will need to read the eligibility window, fee
rate, ship SLA, recommendation policy, and per-line-item amounts from the
backend per order. Today only order `89712` carries `subtotal` + `warranty`
+ `shipDeadline`; other orders fall back to `subtotal = total` with no
warranty row, and the dissuade step never fires for them because they're
past the `created` stage.

---

## 3. UX decisions and rationale

These decisions came out of phase-2 review and are worth preserving so future
contributors understand why the prototype looks the way it does.

**Two-tier status model.** We considered flattening the four shipping
sub-statuses into the top-level timeline, which would have produced a
nine-step horizontal timeline. On a 430px-wide mobile column this is
unreadable. Instead the top timeline always shows the four high-level stages
(created → quality check → shipped → delivered), and the shipping sub-statuses
are exposed as a vertical sub-timeline that only appears when relevant.

**Courier banner elevated out of the order summary.** Previously the courier
name was a small hyperlink buried inside the summary table. It is now a
dedicated banner with explanatory copy ("Have a question about your delivery?
Contact the courier directly...") and a primary "Track order" CTA. The CTA is
the only filled brand-purple button in the app — a deliberate departure from
the otherwise-outlined button language, because we wanted the action to read
as a primary call-to-action.

**Auto-expand the active order, not the terminal ones.** Every card collapses
by default; only the single most in-flight order auto-expands. This keeps the
list scannable while still surfacing the order most likely to need attention.
Earlier the rule was the inverse (collapse only delivered/cancelled), which
left three or four orders open at once and pushed everything below the fold.

**Status banner sits in the always-visible card header.** Each card carries a
tinted banner with a colored leading phrase + descriptive sentence. The
leading phrase describes *condition* (`On track`, `Arriving today`, `All done`,
`Refund in progress`, `Taking longer than expected`) — never the process step,
since the headline already shows that. Tone resolution: `state === 'cancelled'`
→ red, `delayed === true` → orange, otherwise the per-status default (brand
purple for in-flight, green for delivered). `order.statusMessage` overrides
the body string in any branch — that's the production hook for ad-hoc
backend-injected updates without changing status.

**Delivered chip overrides the data's `state: 'close'`.** Delivered orders carry
`state: 'close'` in the data, but customers see a green "Delivered" pill instead
of the orange "Close" pill. The override lives in `OrderCard`'s `SummaryHeader`
so the data shape stays unchanged.

**Filled brand-purple horizontal timeline for reached stages.** Reached
stages and the connectors between them are filled with brand purple, not
gray. The current step's label is bold so it remains identifiable without
changing the dot treatment. Future stages stay outlined and gray.

**Forward-looking subline when ETA is available.** DHL provides an estimated
delivery date sometimes, not always. When present, the collapsed-card subline
reads "Delivery by [date]" — a customer-facing, future-tense answer to "when
is it coming." When absent it falls back to "Updated [timestamp]".

**Whole header is the tap target.** The chevron is decorative — tapping
anywhere on the collapsed-card header expands the card. Larger tap targets
are friendlier on mobile, and there is currently no rival action competing
for the same area.

---

## 4. Data model

The orders array (`src/data/orders.js`) is mock data today. Production will
swap it for an API response of the same shape.

### 4.1 Top-level fields

Each order object carries:

- **`id`** — the human-readable order number shown in the header (string).
- **`phone`** — the customer's phone number on the order (string).
- **`address`** — the delivery address on the order (string, free text).
- **`placedAt`** — the order timestamp shown on the summary screen (string, formatted).
- **`quantity`** — number of items in the order (integer).
- **`subtotal`** *(optional)* — product-only amount, no currency symbol. Used to render the line-item breakdown inside the cancellation sheet. When absent the sheet falls back to `subtotal = total`. Populated on every demo order today.
- **`warranty`** *(optional)* — Revibe Care add-on amount, no currency symbol. The field name is kept as `warranty` for backwards compatibility with the order shape; only the user-facing copy changed. When present it renders as a `Revibe Care +{amount}` line (prefixed with the Revibe Care logo) on the OrderCard / HeroCard / PastOrderCard product strip and as a `Revibe Care` row in the cancellation sheet's breakdown; all of these are omitted when the field is absent. Populated on every demo order today (varied amounts so the pattern is visible across the list).
- **`total`** — total amount paid (number, no currency symbol). When `subtotal` and `warranty` are both present, `total` should equal their sum.
- **`currency`** — three-letter currency code (string, e.g. "AED").
- **`customerName`** — the recipient's full name (string).

### 4.2 Status fields

Two parallel fields describe where the order is.

- **`statusId`** drives the four-step progression timeline. Valid values: `created`, `quality_check`, `shipped`, `delivered`.
- **`subStatusId`** is only meaningful while `statusId` is `shipped`. Valid values: `arrived_destination`, `cleared_customs`, `forwarded_to_agent`, `out_for_delivery`. May be omitted on a shipped order if DHL has not yet returned a sub-status.
- **`state`** is a parallel "header state" used for chips and filter classification. Valid values: `open` (default), `close`, `cancelled`. State is independent of progression — for example, a cancelled order keeps the `statusId` it had at cancellation.
- **`delayed`** *(optional, boolean)* — when true, the status banner switches to the warn (orange) tone with a delay-flavored body keyed by `statusId`.
- **`statusMessage`** *(optional, string)* — overrides the status banner's body text. The leading phrase and tone are still computed from `state` / `delayed` / `statusId`. Production hook for ad-hoc backend-injected notes.

### 4.3 Tracking and courier fields (only present once shipped)

- **`courier`** — name of the carrier shown in the banner (string). Today this is always `"DHL"`; the field exists so we can support multiple carriers later.
- **`trackingNumber`** — courier-issued tracking number, shown in the order summary (string).
- **`trackingUrl`** — gates whether the "Track order" CTA renders (truthy → render). The CTA's `href` itself is **hardcoded** to a known-good DHL Express test shipment so the demo always lands on a real tracking page; the per-order URL is ignored. Production should template `tracking-id` on `order.trackingNumber`.
- **`estimatedDelivery`** — DHL's forward-looking ETA, used as the collapsed-card subline when present (string, free-text date). **Optional** — DHL doesn't always communicate this. Code paths must handle absence gracefully.
- **`shipDeadline`** *(optional, string)* — the latest shipping date allowed by the Revibe 1–3 working-day ship SLA, short form (e.g. `"May 1"`). Surfaced only on the dissuade step of the cancellation flow (see §2.6). Today only populated on `89712` (the `created` order) because dissuade only fires at `created`.
- **`shipDeadlineFull`** *(optional, string)* — the human-readable long form of `shipDeadline` (e.g. `"Friday, 1 May"`), embedded into the fee-waiver copy on the dissuade step. The pair mirrors the `placedAt` / `placedAtFull` pattern: a short machine-ish form and a pre-formatted long form, so the component never has to do working-day arithmetic.

### 4.4 Timeline fields

Two related objects record when each milestone happened.

- **`timeline`** is keyed by top-level status id. It carries the timestamp at which the order entered each top-level stage. Keys are populated as the order progresses, not all at once. A `created` order will have only `timeline.created`; a delivered order will have all four.
- **`subTimeline`** is keyed by sub-status id. It carries the timestamp at which the parcel entered each sub-stage during the shipped phase. Only present on shipped (and later delivered) orders, and only as DHL emits each sub-status.

### 4.5 Refund fields (cancelled past orders only)

Cancelled past orders carry a `refund` object that drives `PastOrderCard`'s
refund-hero treatment. In-flight cancelled orders (still mid-fulfilment) and
non-cancelled orders do not need this field.

- **`refund.subtotal`** — pre-fee refund amount, no currency symbol (number). Sum of `refund.breakdown` line items.
- **`refund.fee`** *(optional, object)* — `{ label, rate, amount }`. Present only on card refunds (5% processing fee applied at cancellation per the `CancelOrderSheet` policy). Absent on wallet refunds. `rate` is the decimal (e.g. `0.05` → rendered as `(5%)` next to the label); `amount` is the currency value subtracted from `subtotal` to arrive at `amount`.
- **`refund.amount`** — **net** refund amount actually sent to the destination (number). Equals `subtotal - fee.amount` when a fee is present, otherwise `subtotal`. This is what the hero displays.
- **`refund.destination`** — where the refund is going. `{ kind: 'wallet', label: 'Revibe Wallet' }` for wallet refunds; `{ kind: 'card', label, last4 }` for card refunds.
- **`refund.breakdown`** — array of `{ label, amount }` line items summing to `refund.subtotal`. Rendered inside `RefundDetailsSheet`.
- **`refund.fundsAvailable`** *(optional, string)* — short status copy shown under the hero amount. Only surfaced on `refunded` orders today; future card-refund ETAs ("Expected by 22 May") could also populate it.

### 4.6 Product fields

Today an order has one product. The `product` object carries:

- **`name`** — display name (string).
- **`variant`** — variant string (e.g. "Black / 32 GB / Good").
- **`image`** — path to the product image asset.

Multi-item orders are out of scope for the prototype.

---

## 5. Component architecture

### 5.1 File layout

```
src/
├── App.jsx                       Page composition; owns filter state + active-id wiring
├── main.jsx                      Vite entry point
├── index.css                     Tailwind directives + base styles
├── data/
│   └── orders.js                 Mock orders array
├── lib/
│   └── statuses.js               Top-level + sub-status definitions, status-banner copy + tone, pickActiveOrderId, helpers
└── components/
    ├── PromoBar.jsx              Magenta promo strip at the top
    ├── Header.jsx                Logo, language, profile, wishlist, bag
    ├── SearchBar.jsx             Site-wide search field (decorative)
    ├── FiltersRow.jsx            Filters icon + profile chip
    ├── StoreCreditsCard.jsx      Wallet balance card (gradient amount + clipboard icon; decorative)
    ├── OrderFilters.jsx          Search field + range dropdown + status chip row (controlled)
    ├── OrderCard.jsx             The expandable order card
    ├── CancelOrderSheet.jsx      Two-step bottom sheet for cancelling a `created` order
    ├── RefundDetailsSheet.jsx    Bottom sheet for the past cancelled card's `View refund details` action
    ├── StatusBanner.jsx          Tinted status banner with leading phrase + sentence
    ├── StatusTimeline.jsx        Horizontal 4-step timeline
    ├── ShippingSubTimeline.jsx   Vertical sub-status timeline
    ├── CourierBanner.jsx         Tracking banner with "Track order" + "Need help with delivery?" CTAs
    ├── OrderSummary.jsx          Summary table inside the expanded card
    └── ChatFab.jsx               Floating chat-with-support button
```

### 5.2 Component tree

```mermaid
graph TD
    App --> PromoBar
    App --> Header
    App --> SearchBar
    App --> FiltersRow
    App --> StoreCreditsCard
    App --> OrderFilters[OrderFilters<br/>search + range dropdown + chip row]
    App --> OrderCard
    App --> ChatFab
    OrderCard --> SummaryHeader[SummaryHeader<br/>status icon + headline + chip]
    OrderCard --> StatusBanner[StatusBanner<br/>leading phrase + sentence]
    OrderCard --> ProductRow
    OrderCard --> OrderIdRow
    OrderCard --> Body[Expanded body — when open]
    Body --> DetailRows[DetailRows<br/>phone, address, quantity]
    Body --> Actions[Receipt + Claim buttons]
    Body --> CourierBanner[CourierBanner<br/>Track + Need help CTAs<br/>shipped or delivered only]
    Body --> StatusTimeline
    Body --> ShippingSubTimeline[ShippingSubTimeline<br/>shipped only]
    Body --> OrderSummary
```

`SummaryHeader`, `ProductRow`, and `OrderIdRow` are inner sub-components of
`OrderCard` (defined in the same file) — they are not separately exported.

### 5.3 Where API integration lands

When the backend is ready, the swap is small. `App.jsx` currently imports
the static `ORDERS` array from `src/data/orders.js`. Replace that import
with a fetch (or a hook) that returns an array of objects matching the shape
in §4. No component below `App` needs to change as long as the response shape
is preserved.

The auto-expand decision is centralised in `pickActiveOrderId(orders)`
(`src/lib/statuses.js`). `App.jsx` calls it on the *filtered* list and passes
`defaultExpanded={order.id === activeId}` to each card.

---

## 6. Extension points

These are the common changes a future contributor will want to make. Each is
intentionally cheap to do.

**Add a new top-level status.** Add an entry to the `STATUSES` array in
`src/lib/statuses.js`. The horizontal `StatusTimeline` is data-driven and will
render the new step automatically. Update `statusHeadline` and
`statusIconFor` to give the new status a customer-facing label and icon.

**Add a new shipping sub-status.** Add an entry to `SHIPPING_SUB_STATUSES` in
the same file. Pick a Lucide icon and import it next to the existing ones.
The vertical `ShippingSubTimeline` will render the new row automatically.

**Add a new order state.** Extend `ORDER_STATES` with a key, label, chip
treatment, and summary text class. The chip will appear in the collapsed-card
header and the order summary will pick up the colour treatment.

**Add a new courier.** Set `order.courier` to the new name and provide
`trackingUrl`. The `CourierBanner` displays whatever name the order carries.
If the courier needs different copy, branch on `order.courier` inside
`CourierBanner.jsx`.

**Change the auto-expand rule.** Edit `pickActiveOrderId` in
`src/lib/statuses.js`. One source of truth — `App.jsx` calls this helper on
the filtered list.

**Change status banner copy or tone.** Edit `STATUS_DESCRIPTIONS` and
`DELAYED_BODY` in `src/lib/statuses.js`. The leading phrase should describe
*condition* (`On track`, `Arriving today`, etc.), not the process step. To
add a new tone, also extend the `TONES` map in `src/components/StatusBanner.jsx`.

---

## 7. Mocked vs production gap

What looks real in the prototype but is faked:

- **Order data.** Five hand-written orders in `src/data/orders.js`. Production needs a fetch endpoint returning the same shape.
- **Authentication.** No login, no session, no per-customer scoping.
- **DHL integration.** "Track order" hardcodes a known-good DHL Express test shipment (`tracking-id=3392654392`) so the demo always lands on a real tracking page. Production should template `tracking-id` on `order.trackingNumber`. "Need help with delivery?" links to DHL's generic customer-service page.
- **`delayed` is a static flag.** In the prototype it's hand-set on `orders.js`. Production should derive lateness from comparing `estimatedDelivery` (or step ETAs) against current time / SLA. The `statusMessage` field is the production hook for ad-hoc backend-injected updates.
- **`estimatedDelivery` format.** Currently a freeform string (`"Wed, 29 Apr 2026"`). DHL's real shape may include time windows and structured data; we'll need to revisit when integrating.
- **Single carrier.** Code is generalised but mock data uses DHL only. Adding a second carrier requires no code change.
- **Single-item orders.** The product object is a single entry. Multi-item orders need a `products[]` array and a layout adjustment.
- **Download receipt, Raise a claim.** Buttons are present but do nothing. Each needs its own flow / page.
- **Site-wide search, in-list "Find items" search, Revibe Wallet pill.** Visual placeholders, no logic. The wallet balance is a hardcoded prop; the wallet info tooltip's `terms & conditions` link goes nowhere (`href="#"`).
- **Date-range dropdown.** Logic is wired (parses `placedAt`, filters by cutoff) but visibly inert because all five mock orders fall inside every range. Status chips do filter the list.
- **Inter font.** Production is Graphik; we substituted Inter via Google Fonts because Graphik is licensed.
- **Brand assets.** Local copies in `public/` rather than CDN-served.
- **No analytics or instrumentation.** No event tracking on expand/collapse, track-clicks, etc.

---

## 8. Open questions and future work

Items deliberately parked rather than built.

- **Domestic vs international sub-status branching.** All shipped orders show all four sub-statuses (arrived in destination country → cleared customs → forwarded to third-party agent → out for delivery). For a domestic UAE shipment, "cleared customs" doesn't apply. Worth adding an `isInternational` flag and conditionally rendering.
- **Real DHL ETA shape.** Today `estimatedDelivery` is a freeform string. Real DHL responses may carry structured date + time windows + multiple datapoints; the helper `statusSubline` and the collapsed-card UI will need updating.
- **Derive `delayed` from data, not a flag.** Today `delayed: true` is hand-set in `orders.js`. Production should compare timestamps against an SLA contract and set the warn-tone banner automatically.
- **Make the date-range dropdown visibly affect the demo.** Either backdate one of the mock orders past 30 days, or add a `Today` preset that excludes the older ones.
- **Hook the in-list "Find items" search and the global search bar to anything.** Both are decorative.
- **"Copy voucher code" actually copies.** The clipboard icon is decorative.
- **Returned and refunded states.** Not modelled. Likely additions to `ORDER_STATES` plus their own banner copy.
- **Re-order CTA on delivered orders.** Common pattern; not currently present.
- **Forward-looking ETA inside `CourierBanner`.** Currently the banner copy is generic; the ETA shows in the collapsed-card subline only. Could surface in both places.
- **Claim flow, receipt download.** Each is a stubbed button today.
- **Multi-item orders.** Layout change needed to render multiple `ProductRow`s.
- **Order list grouping ("In progress" / "Completed" sections).** Considered, set aside in favour of the chip-based filter. Worth revisiting if the list gets long.

---

## 9. How to keep this doc current

This is a living document. When making one of the changes below, update the
named section here as part of the same commit:

- Adding/removing a status or sub-status → §2.3, §2.4, §4.2, §6.
- Changing the order shape (including new optional fields like `delayed`, `statusMessage`) → §4.
- Changing the auto-expand rule, banner visibility, status-banner copy/tone, or chip override rules → §2.5, §3.
- Adding or removing a component → §5.1, §5.2.
- Resolving an item from §8 → move it out of §8 and integrate the description into the relevant earlier section.

Reference [`CHANGELOG.md`](../CHANGELOG.md) for change history; this document
describes only the current state of the prototype.
