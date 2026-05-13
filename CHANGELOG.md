# Changelog

Internal demo project. Format roughly follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — phase 11 (in-progress card alignment + delivered card refresh)

### Added

- **`InProgressCard` component** (`src/components/InProgressCard.jsx`) — dedicated card for non-cancelled `created` + `quality_check` orders, sharing the chrome family established by the cancelled-past refund-hero card so the in-progress, delivered, and refunded cards now read as one consistent set. A `w-1` left brand-purple accent strip carries the in-flight tone (constant brand purple regardless of `delayed` — see Changed below). A small uppercase `Order · #{id}` eyebrow sits at the very top, then the state pill on its own row (`Order placed` for `created`, `Quality check` for `quality_check`, with `Package` / `ShieldCheck` icons), then a brand-purple gradient hero block (`from-brand-bg to-brand-bg2`) carrying `Delivery by` eyebrow + `On track` tag with `Zap` icon on top, the big `text-[26px]` headline using `order.estimatedDeliveryLong || estimatedDelivery`, the status body sentence (`statusDescription(order).body`), and a `Delivering to [Home]` chip below. Compact product row underneath with image / name / variant / Revibe Care / total / chevron. Expanded body adds a horizontal `Timeline` dot row (Placed → QC → Shipped → Delivered) where each reached step shows the date + time it entered that stage on two lines below the label (sourced from `order.timeline[stepId]`); the `Order details` collapse with delivery address / phone / order date and `Change address` / `Change phone number` pills; and a `Cancel order` (danger outline) + `Change details` (brand outline) action row. The cancel button still opens the existing `CancelOrderSheet`. Auto-expand parity with the previous `OrderCard` is preserved — `App.jsx` passes the same `defaultExpanded={!showHero && o.id === activeId}` it always did.
- **`estimatedDeliveryLong` field on in-progress mock orders.** `89712` and `89510` now carry `estimatedDeliveryLong: 'Monday, 4 May'` next to the existing short-form `estimatedDelivery: 'May 4'`. The hero falls back to the short form when the long form is absent. Mirrors the `placedAt` / `placedAtFull` and `shipDeadline` / `shipDeadlineFull` pattern: a short machine-ish form and a pre-formatted long form, so the component never has to do weekday arithmetic.
- **`deliveredOnLong` field on the delivered mock order.** `89657` now carries `deliveredOnLong: 'Wednesday, 15 April'` for the new delivered-card hero. Same fallback pattern: the hero falls back to the date part of `order.timeline.delivered` (split on ` · `) when absent.

### Changed

- **`DeliveredOrderCard` in `PastOrderCard.jsx` rebuilt to match the refunded card's chrome family.** The old single-row product summary is replaced with: `w-1` left success-green strip; `Order · #{id}` eyebrow; success-tinted `Delivered` state pill (`PackageCheck` icon); a success-gradient hero block (`from-success-bg to-[#d4f0e3]`) carrying `Delivered on` eyebrow, `Complete` tag with checkmark, `text-[26px]` `deliveredOnLong` headline, and a `Delivered to [Home]` chip; a compact product row that surfaces the Revibe Care line + total on the right (the obvious differences from the refunded card, which leads with money and omits both); and the existing `Download receipt` + `Raise a claim` chip-style footer kept verbatim, separated by a top dashed border. The card no longer expands — there's no chevron and no expanded body.
- **`App.jsx` routes `created` and `quality_check` non-cancelled orders through `InProgressCard` instead of `OrderCard`.** The `inFlight.map(...)` ternary now branches three ways: in-flight cancellations → `PastOrderCard`; created/quality_check → `InProgressCard`; everything else (i.e. shipped) → `OrderCard`. `OrderCard` is therefore no longer the entry point for created/quality_check rendering.
- **Delayed `quality_check` orders no longer flip the in-progress hero to warn-amber.** Per design feedback, the QC card should stay brand-purple throughout even when `delayed: true`. The hero gradient, headline color, accent strip, and state pill are all hardcoded brand-purple in `InProgressCard`. The delay signal is preserved in two subtler ways: the right-side tag swaps to `Clock` icon + `Taking longer than expected` (still rendered in brand-purple, not warn) and the body sentence uses the existing `DELAYED_BODY[statusId]` copy. The full warn-amber treatment still exists for `OrderCard`'s shipped cards via `statusDescription` — the change applies only to the new `InProgressCard` chrome.
- **The redundant header timestamp on the in-progress card is gone.** `OrderCard`'s `SummaryHeader` showed `#id · placedAtShort` next to the status icon. The new `InProgressCard` drops this entirely — the order ID lives in the `Order · #id` eyebrow and the placed date is surfaced inside the expanded `Order details` → `Order date` row. No collapsed surface for placed date, mirroring the cancelled card.

### Notes

- `OrderCard` is now reached only by shipped non-cancelled orders and (still) by in-flight cancelled orders that are mid-fulfilment with `state === 'cancelled'`. Created and quality_check go to `InProgressCard`; delivered and past cancelled go to `PastOrderCard`. Three card components, three states.
- The `Timeline` label (replacing `Full timeline`) is shorter to leave room for the date + time text under each step. The vertical full timeline that lived in `OrderCard`'s expanded body for created/QC is intentionally not ported — its content has been merged into the dates-under-dots horizontal timeline.
- The hardcoded "Home" destination chip (both in-progress and delivered hero blocks) is decorative — there is no `addressLabel` field on the order shape today. If real address-label data lands ("Home" / "Office" / etc.), thread it from `order.addressLabel` and fall back to "Home" when absent.

## [Unreleased] — phase 10 (cancelled past orders redesign)

### Added

- **Refund-hero treatment for cancelled past orders in `PastOrderCard`.** The component now branches internally on `order.state`: delivered renders the unchanged one-row summary + `Download receipt` / `Raise a claim` footer; cancelled (`requested` / `refund_pending` / `refunded`) renders a dedicated compact card that leads with the refund as the visual hero. A `w-1` left accent strip carries the phase tone (warn amber for `requested`, brand purple for `refund_pending`, success green for `refunded`) — a deliberate departure from the all-red in-flight cancellation treatment so a completed refund reads as positive rather than alarming. The collapsed view stacks a small uppercase `Order · #{id}` eyebrow (mirroring the `OrderCard` eyebrow pattern), the phase pill, the hero block (refund amount in `text-[28px]` tabular-nums + destination chip — gradient brand→accent for wallet, neutral for card), and the product row. Expanded view adds a 3-step numbered dot stepper for refund progress (created-path cancellations skip `requested`, mirroring `cancellationStepsFor`); each reached/current step shows the timestamp it entered that phase below its label (from `order.cancellationTimeline[step.id]`), upcoming steps show the label only. Followed by a dimmed fulfilment trace ending in a red ✕ at the cancel point, and a two-action footer (`View refund details` + icon-only `Download receipt`). Always collapsed by default; no auto-expand.
- **`refund` object on each cancelled mock order in `src/data/orders.js`.** `89499` (requested) → wallet destination; `89321` (refund_pending) → card destination (Visa ••4242); `89150` (refunded) → wallet destination with `fundsAvailable: 'Available now in your wallet'`. Each carries `subtotal`, `amount` (net), `destination`, and a `breakdown` array of `{ label, amount }` summing to `subtotal`. Card refunds also carry `fee: { label, rate, amount }` — the 5% processing fee applied at cancellation time, mirroring the `CancelOrderSheet` rate. The hero `refund.amount` reflects the **net** post-fee figure (e.g. `89321` shows AED 331.55, not the gross 349). Wallet refunds have no fee — `subtotal === amount`. `fundsAvailable` is only populated on the refunded order — `requested` and `refund_pending` make no ETA promise.
- **`RefundDetailsSheet` component** (`src/components/RefundDetailsSheet.jsx`) — bottom sheet opened by the `View refund details` button on the expanded cancelled past card. Strictly the money math: line items (from `refund.breakdown`) → subtotal → fee (shown only when present, with `label (rate%)` and a danger-toned negative value) → total refund (tone-coloured to match the phase). Matches `CancelOrderSheet`'s chrome (`bg-black/45` scrim, `slideUp` panel, `Escape` to close, body-scroll lock). Tone uses the same `toneFor` mapping (warn / brand / success per cancellation phase).

### Changed

- **Past-orders rendering in `App.jsx` simplified to a single component.** The ternary that routed cancelled past orders back through the full `OrderCard` (with its in-flight chrome, status banner, sub-timeline, courier banner, and order summary) is gone. The block is now `{past.map((o) => <PastOrderCard key={o.id} order={o} />)}`; `PastOrderCard` handles both delivered and cancelled branches internally.

### Removed

- **Inline `RefundBreakdown` block from the expanded cancelled past card.** The breakdown is now the sole content of `RefundDetailsSheet`, so the inline block was redundant. Expansion now shows: refund progress stepper, fulfilment trace, two-action footer.

### Notes

- `CancellationSubTimeline` is unchanged — it's still used by the in-flight `OrderCard` when `state === 'cancelled'` but the order is mid-fulfilment. Only past-order cancellation rendering moved.
- The icon-only `Download receipt` button next to `View refund details` is still decorative (matching the existing pattern).

## [Unreleased] — phase 9 (cancellation take-rate dissuade)

### Added

- **Dissuade step in `CancelOrderSheet`** — a new middle step (`step === 'dissuade'`) that fires only when the user picks `Original payment method` AND the order is at `statusId === 'created'`. Three-block body: a centered hero card with the delivery promise (*"You're on track to receive your {product} by Monday, 4 May"*), a neutral info-tone strip warning that the item *may not be available to reorder later*, and a soft-green success-tone strip with `ShieldCheck` icon promising that *"If we don't ship by {shipDeadlineFull}, the {currency} {fee} processing fee is waived."* Footer carries two chunky 52px buttons: brand-filled `Keep my order` and outlined `Continue to cancel` that turns red on hover (`hover:bg-danger-bg hover:text-danger hover:border-danger`). For wallet refunds and non-created statuses the flow is unchanged.
- **`shipDeadline` + `shipDeadlineFull` on `created` order `89712`** — pre-formatted strings (`"May 1"` / `"Friday, 1 May"`) for the latest acceptable ship date per the 1–3 working-day SLA. Mirrors the `placedAt` / `placedAtFull` pattern so the component never has to do working-day arithmetic. Only populated on the created order because the dissuade step only fires at `created`.
- **`formatDeliveryDate(estimatedDelivery, placedAt)` helper in `CancelOrderSheet`** — parses the short `"May 4"` form using the year from `placedAt` and emits `Monday, 4 May` via `Intl.DateTimeFormat`. Used for the dissuade hero; also tolerates the existing `shipDeadlineFull` field as a pre-baked override.

### Changed

- **Flow shape for the original-payment + created path is now three steps:** Select → Dissuade → Confirm. Wallet and non-created paths keep the existing two-step flow (Select → Confirm). The order of escalation now matches the order of finality — the danger-filled `Cancel order` button on Confirm is the actual final action, instead of an earlier-screen commitment followed by a quiet text-link gate.
- **Confirm-step nudge copy trimmed for the original-payment path.** Was *"You're giving up {fee} to the processing fee. Choose Revibe Wallet for the full amount, instantly."* Now: *"You're giving up {fee} to the processing fee."* Dropping the wallet pitch removes the double-nudge (Dissuade already had the wallet alternative in an earlier draft). The wallet-path info strip is unchanged.
- **`Continue` on the Select step now routes by gate** — to Dissuade when `method === 'original' && statusId === 'created'`, otherwise straight to Confirm. **`Back` on Confirm mirrors the same gate** so the user retraces their actual path.

### Removed

- **Switch-to-Revibe-Wallet button on the dissuade step** (from an earlier draft that included it as a tertiary action). It overrode the method the user explicitly picked on Select and created a back-routing loop. The wallet alternative is still surfaced on Select (option 1, with the green "Full refund · available instantly" emphasis).

## [Unreleased] — phase 8 (Revibe Wallet rebrand)

### Added

- **`WalletInfoTooltip` component** (`src/components/WalletInfoTooltip.jsx`) — shared tap-to-toggle tooltip used wherever "Revibe Wallet" is named. Exports the wallet icon constant (`REVIBE_WALLET_ICON`, `account.revibe.me/assets/icons/home/ic_wallet.svg`) and a default-exported component with `align` (`'center' | 'left' | 'right'`), `iconClassName` (so the `i` can be themed for light or dark backgrounds), and `stopPropagation` props. Tooltip body is `whitespace-normal` to wrap even when an ancestor sets `whitespace-nowrap` (e.g. the credits pill). Dismisses on outside click. Tooltip copy is verbatim: *"Store credits can be used to purchase items on Revibe. Credits can be used on any product and are combinable with any payment method. See more on credits terms & conditions."* — with `terms & conditions` rendered as a placeholder link.
- **Wallet icon + info `i` on the `GreetRow` credits pill.** The top-of-page pill now reads `[wallet icon] Revibe Wallet · AED 384 [i]` instead of `● AED 384`. The pill's outer element switched from `<button>` to `<div>` so the nested info button is valid HTML; the wallet glyph is white-tinted (`filter: brightness(0) invert(1)`) to read on the gradient background. The tooltip is right-anchored under the pill so it stays inside the 430px viewport.
- **Wallet icon + info `i` on the confirm step's destination line.** When the user picked the wallet option, the `back to your …` line inside the amount card now renders `[icon] Revibe Wallet [i]`. On the original-payment-method path the line is unchanged.

### Changed

- **"Store credit" → "Revibe Wallet" everywhere in the cancellation flow.** Both `CancelOrderSheet` steps: option title, amount line ("back to your Revibe Wallet"), confirm-step destination, and the info banner copy. Phrases that previously read *"Store credit stays on Revibe."* / *"Choose Store credit for the full amount, instantly."* now read *"Revibe Wallet credit stays on Revibe."* / *"Choose Revibe Wallet for the full amount, instantly."*. The internal method id (`method === 'store_credit'`) is unchanged.
- **Wallet refund option restyled.** The `Recommended` pill is gone. The detail line (`Full refund · available instantly`) is now the visual emphasis: `text-success font-semibold` (green) instead of `text-muted`. Goal: keep the recommendation signal but anchor it on the concrete benefit rather than a meta-label.
- **`RefundOption` outer element switched from `<button>` to `<div role="button">`.** Lets it nest the info-icon button (the wallet option's `WalletInfoTooltip`) as valid HTML. Keyboard activation (Enter / Space) preserved via `onKeyDown`.



### Changed

- **`Warranty` renamed to `Revibe Care` everywhere it surfaces.** OrderCard / HeroCard / PastOrderCard product strips and the cancellation sheet's line-item breakdown all read `Revibe Care` now, prefixed with the Revibe RE_CARE logo (`cdn.shopify.com/.../Revibe_logo_RE_CARE_Color_copy.png`) at ~14px next to the amount. The underlying `order.warranty` field is unchanged so the order shape stays backwards-compatible — only the user-facing copy and the icon are new.
- **Order number moved out of the product strip and into a card eyebrow.** On `OrderCard`, the collapsed subtitle no longer reads `{variant} · #{id}` — `· #{id}` is dropped and the order number now sits in a small uppercase `Order · #{id}` eyebrow at the very top of the card. This mirrors the hero card's `Active order · #{id}` eyebrow pattern, and lets the product strip read as a clean three-line breakdown (Product / Revibe Care / Total) without competing metadata. `PastOrderCard` is unchanged — its `#{id}` already shares a line with the placed-date and there's no visual ambiguity to resolve.
- **`TOTAL` caption above the bold amount in the product strip.** A tiny `TOTAL` label (uppercase, tracked, muted on light / 70% opacity on hero) now sits above the bold price on `OrderCard` and `HeroCard`. Goal: make it unambiguous that the bold figure is the sum of Product + Revibe Care, not the line price of the device alone. `PastOrderCard` skips the caption because nothing else on its row reads as a price.

## [Unreleased] — phase 6 (cancellation flow)

### Added

- **`CancelOrderSheet`** — two-step bottom sheet wired to the `Cancel order` button on `created` orders. Step 1 shows an order-summary card with a line-item breakdown (`Product` + `Warranty` if present + `Total`) and two refund options as radio cards: `Store credit` (recommended pill, full refund, instant) and `Original payment method` (total minus a 5% processing fee, refunded to the card in 5–10 business days, fee shown explicitly). Step 2 confirms the chosen amount and destination and exposes a danger-filled `Cancel order` CTA. Dismissible via scrim, X, `Escape`, or `Back`/`Keep order`. Confirmation does not yet persist a state change — the sheet just closes (option A from planning).
- **`subtotal` + `warranty` fields on every demo order.** All five mock orders now carry a `subtotal` + `warranty` split (e.g. iPhone 12: 779 + 70 = 849; iPhone 7: 209 + 30 = 239). The fields remain optional in the order shape; rendering paths skip the warranty row/line when the field is absent.
- **`+ Warranty {amount}` line on the product strip.** Both `OrderCard` (collapsed header strip) and `HeroCard` (frosted strip on the dark gradient) render a third line beneath the variant — `text-muted` on the light cards, `opacity-60` on the hero — when `order.warranty` is present. PastOrderCard is intentionally untouched (different one-row layout).
- **`slideUp` + `fadeIn`** keyframes / animation utilities in `tailwind.config.js`, used by the sheet's panel and scrim respectively.

### Changed

- **`OrderCard`'s `Cancel order` button** is now wired up on `created` orders only (opens the sheet). On `quality_check` it remains a visual stub pending its own design pass. The internal `SecondaryBtn` helper now accepts `onClick` and sets `type="button"` so it can be safely placed inside other interactive contexts.
- **Confirm-cancellation copy + amount card.** The shared warn-tone strip (`This can't be undone. Your order won't be processed.`) is replaced with a neutral info-tone strip (`border-line` / `bg-line-2` / `Info` icon) and method-specific copy. `Store credit`: *"Store credit stays on Revibe. It won't be paid out to your bank account."* `Original payment method`: *"You're giving up {currency} {fee} to the processing fee. Choose Store credit for the full amount, instantly."* The original-payment amount card also carries a small breakdown line (`Total {currency} {total} · −{currency} {fee} fee`) between the headline figure and the destination. Goal: reduce wrong-method regret at the final confirm.

## [Unreleased] — phase 5 (post-handoff iteration)

### Added

- **Hero card secondary action row.** Beneath the primary `Track package` + `Get help` CTAs, the hero now carries a second row of two same-sized ghost buttons (`bg-white/[.12]` / white border, white text, matching the `Get help` style): `Cancel order` + `Raise a claim`. Tapping `Cancel order` toggles a small dark tooltip — *"You cannot cancel the order at this stage"* — centered above the button and dismissing on outside-click. Cancellation eligibility logic is prototype-only.
- **"Delivery by [date]" subtitle in the hero.** Renders directly under the status headline ("Out for delivery") when `order.estimatedDelivery` is present. Data-driven, follows the same pattern as the in-card eta block.
- **`Change order details` action on in-progress order cards.** Replaces `Get help` on `created` + `quality_check` cards. Clicking it programmatically opens the `<details>` collapse (via ref) so `Change address` + `Change phone number` are immediately visible.
- **Edit pills on `quality_check`.** `canEdit` now covers all in-progress states (was `created`-only), so the quality-check expanded view also surfaces `Change address` + `Change phone number` pills inside Order details.
- **Past-delivered "Raise a claim" pill.** Delivered `PastOrderCard` now renders both `Download receipt` **and** `Raise a claim`, right-aligned with a small gap.

### Changed

- **`MessageSquareText` → `Headphones` for hero help button.** Reads more clearly as "contact a person" and visually pairs with the `Truck` icon on Track package. Label also tightened from "Help" to "Get help" to match the rest of the app.
- **Shipped order `estimatedDelivery`** updated from `'Wed, 29 Apr'` to `'May 4'` so the new hero ETA subtitle reads sensibly given the prototype's current date.
- **`STATUSES.quality_check.short`** renamed `QC` → `Quality Check` so the dot-timeline label is fully spelled out under both the hero and the shipped OrderCard's main-card timeline.
- **Hero ETA subtitle bumped** from `text-[14px] font-semibold` to match the headline (`text-[22px] font-bold tracking-[-0.02em]`), so "Delivery by [date]" reads as a paired second line of the title rather than a sub-eyebrow.
- **`Change order details` button restyled** outline-purple (`bg-surface text-brand border-brand`) via a new `variant="outline"` prop on `PrimaryBtn`. Visually distinguishes it from the filled-purple `Get help` used on shipped cards.
- **Cancel-order tooltip width fixed** at `w-[180px]` with `whitespace-normal` + `text-center` so it wraps to two lines and stays inside the hero section's `overflow-hidden` clip even when centered above the Cancel order button.
- **In-progress timeline dedup.** For `created` and `quality_check` orders, the in-card dot timeline (`DotBar`) no longer renders above the product strip — the same progression was being shown twice. The four-step Full timeline now sits **above** Order details / Cancel / Change order details inside the expanded view. Shipped orders are unchanged: in-card dot timeline + Full timeline at the bottom.

### Removed

- **"Raise a claim" on cancelled past orders.** Cancelled `PastOrderCard` no longer renders an action area at all (no border-top, no button row).

## [Unreleased] — phase 4 (My Account redesign handoff)

### Added

- **`HeroCard`** — full-bleed gradient (purple → magenta) hero pulled to the top of the orders list for the single most-in-flight order. Live "Active order · #id" eyebrow with a pulsing green dot, status headline, frosted product strip, light-on-dark dot timeline, and a primary "Track package" / ghost "Help" CTA pair.
- **Detailed-tracking expand inside `HeroCard`.** Visible only while `statusId === 'shipped'`. Renders a DHL courier strip (badge, courier name, tracking number, copy-to-clipboard) and the vertical sub-timeline restyled for the dark gradient.
- **`PastOrderCard`** — compact one-row card for delivered + cancelled orders, with a status pill, placement date, order id, total, and a single contextual action (`Download receipt` for delivered, `Raise a claim` for cancelled).
- **`GreetRow`** — "My orders" page title + count line + tight gradient credits pill, replacing the old full-width `StoreCreditsCard`.
- **Section labels** — `In progress` / `Other open orders` / `Past orders` headings with item counts, so delivered/cancelled history sits below the live list instead of mixed in.
- **Chip count badges** — each status chip in `OrderFilters` now carries a small numeric badge (computed from the date-range-filtered set).
- **"Delivery by [date]" eta block** in the collapsed `OrderCard` header for `created` and `quality_check` orders. Large headline + a muted sentence (colored "On track" / "Taking longer than expected" lead phrase + body), placed above the dot timeline.
- **Order details collapse** inside expanded `OrderCard` — `<details>` block with delivery address, phone number, and order date. While `statusId === 'created'`, the card also exposes subtle pill buttons for `Change address` and `Change phone number`.
- **`placedAtFull`** field on every mock order — long-form date used inside the Order details collapse.
- **`STATUSES[].short`** — short labels (`Placed / QC / Shipped / Delivered`) used by the compact dot timelines.

### Changed

- **Top chrome condensed.** The four-row stack (`PromoBar + Header + SearchBar + FiltersRow`) collapses into a single sticky `Header` (menu / logo / search / bell / avatar) plus the new `GreetRow` and a search-inline `OrderFilters` row.
- **`OrderCard` rebuilt.** Collapsed view: status badge + headline + chevron → eta block (in-progress only) → dot timeline → product strip with price. Expanded body: status banner → shipping sub-timeline (when shipped) → courier card → Order details collapse → Cancel/Receipt + Get help action row → full timeline.
- **Header action buttons.** Old "Download receipt / Raise a claim" pair replaced with state-aware actions: `Cancel order` (red ghost) for in-progress orders, `Receipt` for past orders, paired with a primary `Get help`.
- **"In progress" chip** renamed to **"Open"** to match the chip label set used in the design.
- **Page background** is now the warm off-white `canvas` token (`#f7f5fb`) so cards feel elevated without shadows.
- **Brand palette extended.** Added nested tokens: `brand-bg`, `brand-bg2`, `success-bg`, `warn`, `warn-bg`, `danger`, `danger-bg`, `line-2`, `ink-2`. Plus `bg-hero-gradient` / `bg-credits-pill` background-image utilities and `slideDown` / `heroPulse` keyframe animations.
- **Card radius** bumped from 16px to 18px; button radius from 8px to 10px to match the prototype.
- **Status headline copy.** `STATUSES.created` is now `Order placed` and `STATUSES.quality_check` is now `Quality check` (was `Order created` / `At quality check`), matching the design.

### Removed

- **`PromoBar`, `SearchBar`, `FiltersRow`, `StoreCreditsCard`, `StatusBanner`, `OrderSummary`, `CourierBanner`** components — superseded by the new `Header` / `GreetRow` / `OrderFilters` / `HeroCard` / `OrderCard` / `PastOrderCard` set. Their behaviors are folded into the new components.
- **`fontSize.page` token** (only ever used by `text-page` on the old "Orders" heading; no longer needed).

## [Unreleased] — phase 3

### Added

- **`StatusBanner`** — tinted box rendered inside the always-visible card header (above the product row). A colored leading phrase describes *condition* (`On track`, `Arriving today`, `All done`, `Refund in progress`, `Taking longer than expected`) and a sentence describes the current step. Four tones: brand / success / warn / danger.
- **`statusDescription(order)`** in `src/lib/statuses.js` — returns `{ tone, lead, body }` resolved in this order: cancelled state → delayed flag → status defaults. `order.statusMessage` overrides the body string in any branch.
- New optional order fields: `delayed: true` flips the banner to the warn tone with a delay-flavored body keyed by `statusId`; `statusMessage: '…'` overrides the banner body. The iPhone 11 quality-check order is marked `delayed: true` for the demo.
- **`pickActiveOrderId(orders)`** in `src/lib/statuses.js` — returns the id of the single most-in-flight order (highest `progressIndex × 10 + subProgressIndex`, in-flight only). Returns `null` when nothing is in flight.
- **Order filter chips** (`All / In progress / Delivered / Cancelled`) actually filter the rendered list. State is owned by `App.jsx`; `OrderFilters` is now controlled.
- **Date-range dropdown** with four presets (`Last 30 days / 3 months / 1 year / All time`), open/close, click-outside-to-close, active-option checkmark. Plumbed to `App.jsx` and applied via `placedAt` parsing — visibly inert today because all mock orders fall inside every range.
- **Empty state** in the order list when filters yield zero results.
- **"Need help with delivery?"** secondary CTA inside `CourierBanner`, soft-filled (`bg-brand/10 text-brand`), links to DHL customer service.
- **CLAUDE.md** at the repo root — collaboration guide for future sessions.

### Changed

- **Auto-expand replaces auto-collapse.** Everything collapses by default; `App.jsx` auto-expands only the single most-in-flight card via `pickActiveOrderId`. Old `isCollapsedByDefault` removed.
- **Delivered chip is green.** When `statusId === 'delivered'`, `OrderCard` overrides the data's `state: 'close'` chip and renders a green "Delivered" pill instead of the orange "Close" one.
- **`StoreCreditsCard` redesigned.** AED amount now renders with a purple→magenta gradient (`from-[rgb(115,65,186)] to-accent`, `bg-clip-text`). Voucher row collapsed to a single line: code + clipboard icon button. Info button removed. Section spacing tightened.
- **`OrderFilters` flattened.** Card wrapper dropped; search field + range dropdown side-by-side; status chip row underneath.
- **`CourierBanner` "Track order"** URL hardcoded to a known-good DHL Express test shipment (`tracking-id=3392654392`) so the demo always lands on a real tracking page.
- **"Raise a claim"** outlined-purple on delivered orders (matches "Download receipt"); muted gray on every other state.
- **"Orders" heading** now renders correctly. Removed the unused `colors.page` token from `tailwind.config.js` to fix a `text-page` color/font-size collision that had been making the heading white-on-white.

### Removed

- **"Change address" button + its help icon.** Customer-service contact for delivery now lives in the new "Need help with delivery?" CTA inside `CourierBanner`.
- **`isCollapsedByDefault`** in `src/lib/statuses.js` — superseded by `pickActiveOrderId`.

## [Unreleased] — phase 2

### Added

- **Two-tier status model.** Top-level `STATUSES` (`created → quality_check → shipped → delivered`) is unchanged; new `SHIPPING_SUB_STATUSES` (`arrived_destination → cleared_customs → forwarded_to_agent → out_for_delivery`) apply only while `statusId === 'shipped'`. All four sub-statuses render in order today — international/domestic branching is parked.
- **`ShippingSubTimeline`** — vertical sub-timeline rendered inside `OrderCard` only while `statusId === 'shipped'`. Pattern adapted from Noon's tracking screen; colours kept in Revibe palette.
- **`CourierBanner`** — visible while `statusId` is `shipped` or `delivered`. Carrier headline, explanatory sentence about contacting the courier, primary "Track order" CTA. Uses a filled brand-purple button — first filled CTA in the app, deliberately so the action stands out.
- Mock orders now cover every top-level stage plus a cancelled order: `created`, `quality_check`, `shipped` (with sub-status `out_for_delivery` and an `estimatedDelivery` ETA), `delivered`, and a cancelled-at-QC order.
- New helpers in `src/lib/statuses.js`: `isCollapsedByDefault`, `statusHeadline`, `statusSubline`, `statusIconFor`, `subProgressIndex`. The collapsed-card header is driven by these so new statuses stay in sync.
- **`estimatedDelivery`** field on the order shape (optional — DHL doesn't always provide it). When present on a shipped order the collapsed-card subline reads "Delivery by [date]"; absent, it falls back to "Updated [timestamp]".
- `docs/my-account-flow.md` — living documentation of the orders flow for product + engineering audiences (Mermaid diagrams, data model, extension points, mocked-vs-production gap).

### Changed

- **Collapsed card rebuilt** in Noon-summary style: status icon + headline + state chip + chevron, divider, product image with name/variant/total, divider, order ID. The chip is now visible at-a-glance, so cancelled orders read as cancelled even when collapsed.
- **`StatusTimeline` filled with brand colour** for reached stages (circles + 2px connectors). The current step's label is bold so it stands out without changing the dot treatment.
- **Auto-collapse** delivered + cancelled orders by default, wired through `isCollapsedByDefault` in `App.jsx`.
- **Expanded body deduped** — dropped the inline `ProductBlock` and the "Date & Time" + "Total Amount" detail rows since the new header carries them.
- **`OrderSummary`** no longer renders the courier as a hyperlink (the `CourierBanner` owns that); replaced with a static "Carrier" row that hides when the order has no carrier yet.
- **"Change address"** hidden on delivered and cancelled orders. "Download receipt" and "Raise a claim" stay visible at every stage.
- Courier across all mock orders switched from Quiqup to **DHL**.
- README rewritten — replaced the Vite starter boilerplate with a project-specific overview.

### Known trade-offs

- `OrderCard` is tall when fully expanded for shipped orders (header + banner + horizontal timeline + vertical sub-timeline + summary). Acceptable for phase 2; flag for review if real users complain.
- All shipping sub-statuses always render, even on shipments that wouldn't realistically clear customs. Intentional for the demo; see `docs/my-account-flow.md` § 8.

## [0.1.0] — 2026-05-01 — phase 1 baseline

### Added

- React + Vite + Tailwind 3 + lucide-react scaffold inside `order-redesign/`.
- Mock orders + canonical status model in `src/lib/statuses.js`, `src/data/orders.js`.
- Account-home + order-list components: `PromoBar`, `Header`, `SearchBar`, `FiltersRow`, `StoreCreditsCard`, `OrderFilters`, `OrderCard` (inline-expandable), `StatusTimeline`, `OrderSummary`, `ChatFab`.
- Local copies of Revibe logo + sample product image in `public/`.
- Inter loaded via Google Fonts as a Graphik substitute.
- `brief/design-system.md` updated with values inferred from the source screenshots.

### Removed

- Duplicate top-level `package.json`, `node_modules`, Tailwind/PostCSS configs that lived above `order-redesign/`.
- Vite/React starter assets and demo CSS.
