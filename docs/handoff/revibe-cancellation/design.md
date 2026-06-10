# Handoff: Revibe-Initiated Cancellation Card

## Overview

A **new order card** for the Revibe **My Account → Orders** prototype: the surface a customer sees when **Revibe had to cancel their order** (the customer never asked to). Its job flips the existing customer-initiated cancelled card on its head — instead of leading with a refund receipt, it **apologises, reassures about the full no-fee refund, and drives the customer to buy again** with a fixed-amount discount code.

This is a **sibling** of the existing `CancelledOrderCard`, not a variant: it shares that card's chrome and components but has a different content hierarchy. It is a **terminal** state (full + instant refund, no "keep my order" reversal, no phase stepper) and lives in the **Past orders** section.

> Primary purpose: **the re-buy.** The apology lands honestly but briefly; the offer block + "Browse similar devices" CTA are the hero forward action.

## About the Design Files

The files in this bundle are **design references created in HTML** — a prototype showing intended look and behaviour, **not production code to copy directly**. The target is the existing repo (`my-account-redesign-v2`): **React 19 + Vite + Tailwind 3 + lucide-react**. Recreate the card there using the codebase's established components and tokens (see *Component Reuse* below). The card should be **assembled from existing pieces** plus two small net-new blocks — not built fresh.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, copy, interactions, and motion. Recreate pixel-accurately at the **430px mobile frame** using the repo's Tailwind tokens. Redlines below are exact; where a value maps to an existing component (`ProductSummary`, `DestinationChip`, `RefundDetailsSheet`), **reuse the component rather than re-implementing the redline**.

---

## The four product decisions (settled with the user — do not re-litigate)

1. **Incentive = fixed-amount credit** (e.g. `AED 50 off`), rendered as a discount-code block (code + copy-to-clipboard + expiry). Treat amount/code/expiry as **data**.
2. **Single unified card** — the three cancellation reasons drive one explanatory line; layout + CTA are constant.
3. **Apology + offer leads; refund reassures below** — the opposite of the existing refund-hero card.
4. **One CTA = "Browse similar devices"** for all reasons (no deep-link back to the same item).

### Locked visual choices (from the design exploration)

- **Offer block: Subtle variant** — a light brand-tint tile (not the loud magenta gradient). The offer + CTA together form a cohesive light-magenta zone above the fold.
- **CTA: "White · magenta" (option E)** — white fill, 1.5px magenta border, magenta label + arrow. Chosen because it reads as a clearly separate action from the dark-purple Revibe Care banner. *(Five other CTA styles were explored and are wired as Tweaks in the prototype — see "CTA — explored alternatives". E is the locked default.)*
- **Left accent strip:** kept, **magenta** (`accent`), one settled tone (ties to the offer).
- **Card is collapsible on the refund only** (see *Interactions*).

---

## Screen / View

### Card: "Revibe-initiated cancellation"

**Purpose.** Tell the customer Revibe cancelled the order, reassure them it wasn't their fault and they're fully refunded with no fee, and move them forward to re-buy.

**Layout.** A single `article`, full width inside the 430px frame, `rounded-card` (18px), `bg-surface`, `border border-line`, `overflow-hidden`, `position: relative`. A **4px magenta (`accent`) strip** runs the full left edge (`absolute left-0 top-0 bottom-0 w-1`, above content via `z-index`). Inner padding `12px 13px 14px 15px`; content is a **vertical flex, `gap: 11px`**, in this order:

1. **Eyebrow + chevron** (header row)
2. **State pill** — "Cancelled by Revibe"
3. **Apology block** (net-new)
4. **Offer block** (net-new, subtle)
5. **"Browse similar devices" CTA** (white·magenta)
6. **Product row** — reused `ProductSummary` (`tone="light"`)
7. **Refund strip** — collapsible reassurance (reused chrome)

#### 1. Eyebrow + chevron
- Eyebrow text `Order · #{id}` — `10.5px / 700 / uppercase`, `letter-spacing: 0.08em`, `text-muted` (`rgb(138,143,154)`), `tabular-nums`. **Reuse `OrderEyebrow`** (`PastOrderCard.jsx`).
- Optional chevron at right: 24×24 circle, `bg-line-2`, `text-ink-2`, rotates 180° on expand (`transition .22s`). See *Interactions* for whether to keep it.

#### 2. State pill — "Cancelled by Revibe"
Reuse the `StatePill` **shape** (`PastOrderCard.jsx ·223`) with a **neutral** tone (this is informational, not danger):
- `self-start inline-flex items-center gap-1.5`, `h-6` (23px), `px-2.5`, `rounded-full`, `10.5px / 700 / uppercase`, `letter-spacing: 0.06em`.
- `bg-line-2` (`rgb(241,238,245)`), `text-ink-2` (`rgb(75,82,96)`); 6px dot `bg-ink-2`.
- Label: **"Cancelled by Revibe"**.

#### 3. Apology block (NET-NEW)
A calm, neutral tile — **no `danger`**.
- Container: `border border-line`, `bg #faf8fd` (very light lilac), `rounded-[13px]`, `padding 12px`, `flex gap-[11px] items-start`.
- **Icon tile**: 38×38, `rounded-[11px]`, `bg-brand-bg` (`rgb(243,237,251)`), `text-brand` (`rgb(80,25,160)`). Reason-specific lucide icon, 20px, stroke 1.9:
  - `item_unavailable` → `PackageX`
  - `price_error` → `Tag`
  - `undeliverable_address` → `Truck`
- **Headline** `h2`: "We had to cancel your order" — `16.5px / 700`, `line-height 1.18`, `letter-spacing -0.01em`, `text-ink`.
- **Reason line** `p`: `12.5px`, `line-height 1.5`, `text-ink-2`, `margin-top 5px`, `text-wrap: pretty`. The closing "**you've been fully refunded.**" is bold (`text-ink`, weight 600). Copy per reason:
  - `item_unavailable`: "The seller no longer has this item in stock. This wasn't your fault — **you've been fully refunded.**"
  - `price_error`: "This item was listed at the wrong price, so we had to cancel the order. This wasn't your fault — **you've been fully refunded.**"
  - `undeliverable_address`: "Our courier partner can't deliver to your address. This wasn't your fault — **you've been fully refunded.**"
- **Delivery address pill** — **only on `undeliverable_address`**. Recommendation: **show it** (it's contextual to *why*, and confirms the address that failed). **Reuse `DeliveryAddressPill`** (`src/components/DeliveryAddressPill.jsx`). Redline if rolled inline: `margin-top 10px`, `inline-flex gap-7px`, `bg-surface border border-line rounded-[10px]`, `padding 6px 10px`, `11.5px text-ink-2`; `MapPin` icon 13px; label "Delivery to" bold (`text-ink`, nowrap); value **ellipsised** (`overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0`) so it never overflows the card.

#### 4. Offer block (NET-NEW) — **Subtle variant (locked)**
Built on the `brand`/`accent` promo vocabulary, but light (not the loud gradient).
- Container: `bg-brand-bg` (`rgb(243,237,251)`), `border 1px #e6dcf7`, `rounded-[15px]`, no shadow, `padding 14px 14px 13px`.
- **Eyebrow**: "A little something to make it right" — `10.5px / 700 / uppercase`, `letter-spacing 0.07em`, `text-accent` (`rgb(217,26,122)`); `Sparkles` icon 13px stroke 2.
- **Amount headline**: `{currency} {amount} off your next order` (e.g. "AED 50 off your next order") — `22.5px / 800`, `line-height 1.1`, `letter-spacing -0.015em`, `text-brand` (`rgb(80,25,160)`).
- **Code row** (`margin-top 11px`, `flex gap-8px`): `bg-surface`, `border 1px dashed rgba(217,26,122,.45)`, `rounded-[11px]`, `padding 7px 7px 7px 13px`.
  - **Code** (e.g. `COMEBACK50`): `15px / 800`, `letter-spacing 0.12em`, `text-brand`, `tabular-nums`, flex-1.
  - **Copy button**: `h-8` (32px), `px-3` (12px), `rounded-[9px]`, `bg-accent text-white`, `12px / 700`, gap 6; `Copy` icon 13px. **On click**: copy to clipboard, swap to `Copied` + `Check` icon for 1800ms (copied state `bg-brand`). Mirror the existing copy affordance (`Step7Confirmation.jsx` / `CourierStrip`).
- **Expiry**: `Expires {expiresAt}` (e.g. "Expires 30 Jun 2026") — `margin-top 9px`, `11px`, `text-muted`; `Clock` icon 12px; `white-space: nowrap`.

#### 5. CTA — "Browse similar devices" — **White · magenta (locked, option E)**
The single forward action; **visual placeholder** (no real catalogue route).
- Base: full width, `h-[46px]`, `rounded-btn` (10px), `14px / 700`, `inline-flex items-center justify-center gap-8px`, `overflow-hidden` (for the shine).
- **Option E fill**: `bg-surface` (`#fff`), `border 1.5px solid accent`, `text-accent`; label + arrow inherit the magenta. `ArrowRight` 16px stroke 2.
- **Motion** (kept across all CTA options): a magenta **glow pulse** (`box-shadow` animates `accent → accent`, ~3.8s loop), a **shine sweep** (translucent band crossing left→right), and a subtle **arrow nudge**. **All motion gated behind `@media (prefers-reduced-motion: no-preference)`** — reduced-motion shows a static button. Label `white-space: nowrap`.

#### 6. Product row — **reuse `ProductSummary` (`tone="light"`)**
Shows *what was cancelled*. Optional small eyebrow "What we cancelled" (`10.5px / 700 / uppercase / text-muted`) above it. **Do not re-roll** — `ProductSummary` already renders the thumbnail (brand-tint well for the transparent cut-out), name, variant, the **Revibe Care** callout (hero-gradient banner, `+AED 100`), and **Total paid**. It owns the row but not a tap target. *(The HTML prototype slightly compacts this row for the mock; in the repo, use `ProductSummary` unchanged.)*

#### 7. Refund strip — reassurance, **collapsible (locked)**
Borrow the refund **chrome + tone vocabulary** (`DestinationChip`, `success` tone) but **not** `RefundHero`.
- Container: `border 1px #c6ebd9`, `bg-success-bg` (`rgb(230,246,240)`), `rounded-[13px]`, `overflow-hidden`.
- **Teaser (always visible, tappable)**: `padding 10px 12px`, `flex gap-10px`. Icon 28×28 circle `bg-surface`, `border #c6ebd9`, `text-success`, `ShieldCheck` 15px. Text `{currency} {refund.amount} fully refunded · no fee` — `13px / 700 text-ink`; "**no fee**" in `text-success`. Trailing chevron 22px `text-success`, rotates 180° on open.
- **Body (revealed on expand)**: a dashed top divider (`#bfe7d6`), then a destination row — "Sent to" + **`DestinationChip`** (`destination.kind`: `card` → neutral chip `Visa •• 4242`; `wallet` → brand→accent gradient chip "Revibe Wallet"; `bnpl` → `BnplDisclaimerTooltip`). Then a **"View refund details"** button (`h-[37px]`, `rounded-[10px]`, `bg-surface`, `border #c6ebd9`, `text-success`, `12.5px / 700`) → opens **`RefundDetailsSheet`** (`{ order, open, onClose }`). **No fee row** in the sheet — Revibe waives it.

---

## Interactions & Behavior

- **Copy code**: `navigator.clipboard.writeText(reBuyOffer.code)`; button swaps to "Copied ✓" for ~1800ms. Implement as a `stopPropagation` child if inside any tappable region.
- **Refund expand/collapse**: the **refund teaser row is the expander** (own chevron). It reveals the destination chip + "View refund details". **Recommendation:** make the refund strip its own self-contained expand/collapse and treat the rest of the card as always-visible; the header chevron (optional) may mirror the same `open` state or be dropped. *(In the prototype both the header chevron and the refund row toggle the same state.)* This is a **terminal** card — there's no fulfilment journey to hide, so only the refund detail collapses.
- **View refund details**: opens `RefundDetailsSheet` (bottom sheet). `Escape` closes; body scroll locked while open (existing behaviour).
- **Browse similar devices / Copy**: visual placeholders — no real route/engine (like Search, Wallet balance, "Download receipt").
- **Reduced motion**: all CTA motion (glow, shine, arrow nudge) disabled under `prefers-reduced-motion: reduce`.
- **Tap-target convention**: any interactive child inside a tappable region must `stopPropagation` (per `HistoryThread` chips / `BnplDisclaimerTooltip`).

## CTA — explored alternatives (wired as Tweaks in the prototype)

E (white·magenta) is **locked**. The prototype's Tweaks panel also includes, for reference: **A** solid magenta, **B** outlined brand, **C** ink/near-black, **D** bright brand→accent gradient, **F** brand fill + magenta accent edge. All keep the same motion. Not needed for the build — listed only so the choice of E is legible.

---

## Card Routing

`App.jsx` selects one card per order by precedence (full tree: `docs/output/diagrams.md#card-routing`).

- **Discriminator (new field): `cancellationInitiator: 'revibe'`.** Absent / `'customer'` ⇒ existing `CancelledOrderCard` (refund-hero). `'revibe'` ⇒ **this card**, rendered **instead of** `CancelledOrderCard`, inside the `state === 'cancelled'` branch.
- **Placement: Past orders.** The refund is full + instant (no `requested → pending` journey, no "keep my order" reversal), so this is a settled terminal state — it belongs in the Past orders section, not "In progress / awaiting refund". No auto-expand dependency.

## State Management

- Local component state: `refundOpen` (boolean) for the collapsible refund; `detailsOpen` (boolean) for `RefundDetailsSheet`; transient `copied` (boolean) for the copy affordance.
- No data fetching new to this card; reads `order` fields below.

## Data Model (fields the implementer adds — design specifies the shape)

```
cancellationInitiator: 'customer' | 'revibe'        // discriminator; 'revibe' → this card
cancellationReason: 'item_unavailable' | 'price_error' | 'undeliverable_address'
state: 'cancelled'                                   // statusId unchanged (parallel to state)
cancellationRef?: string                             // optional customer-facing ref

reBuyOffer: {
  amount: number,        // fixed credit, e.g. 50 (currency = order.currency)
  code: string,          // e.g. 'COMEBACK50'
  expiresAt: string,     // human-readable, e.g. '30 Jun 2026'
  label?: string         // optional pre-composed headline
}

refund: {                // reuse existing shape (cancellations.md §7.2)
  amount: number,        // = order.total — FULL refund
  // NO `fee` — Revibe waives it (5% fee is customer-initiated only)
  destination: { kind: 'card', label, last4 } | { kind: 'wallet', label } | { kind: 'bnpl', ... },
  breakdown: [{ label, amount }]   // product + Revibe Care
}
```

## Design Tokens (authoritative: `tailwind.config.js`)

| Token | Value | Use here |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Primary / secondary text |
| `muted` | `rgb(138,143,154)` | Eyebrows, expiry, tertiary text |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Borders, state-pill bg, chevron bg |
| `brand` / `brand-2` | `rgb(80,25,160)` / `rgb(122,61,211)` | Apology icon, offer amount/code |
| `brand-bg` | `rgb(243,237,251)` | Apology icon tile, **subtle offer fill** |
| `accent` | `rgb(217,26,122)` | **Left strip, offer eyebrow, copy btn, CTA border/label** |
| `success` (+`.bg`) | `rgb(0,150,106)` / `rgb(230,246,240)` | Refund reassurance strip |
| `surface` / `canvas` | `#FFFFFF` / `rgb(247,245,251)` | Card bg / page bg |

Extra literals used (not tokens): apology tile `#faf8fd`; subtle-offer border `#e6dcf7`; refund border `#c6ebd9`, refund divider `#bfe7d6`. Shapes: `rounded-card` 18px (card), `rounded-btn` 10px (CTA); inner blocks 11–15px. Type: body 12.5–14px, eyebrows 10.5px, headline 16.5px, offer amount 22.5px. Font Inter (Graphik substitute). Icons lucide 12–20px, stroke 1.75–2. Prices `tabular-nums`.

> **Gotcha:** do **not** introduce a `page` colour token (or any name colliding with a `fontSize` key) — `text-{name}` silently renders white. See `CLAUDE.md`.

## Component Reuse Map

| Reuse | Where | For |
|---|---|---|
| `OrderEyebrow` | `PastOrderCard.jsx ·215` | Top eyebrow |
| `StatePill` shape | `PastOrderCard.jsx ·223` | "Cancelled by Revibe" (neutral tone) |
| `ProductSummary` (`tone="light"`) | `src/components/ProductSummary.jsx` | Product row + Care + Total paid |
| `DestinationChip` + `success` tone | `PastOrderCard.jsx ·309 / ·112 / ·118` | Refund destination chip + reassurance tone |
| `RefundDetailsSheet` | `src/components/RefundDetailsSheet.jsx` | "View refund details" breakdown (no fee row) |
| Copy affordance | `Step7Confirmation.jsx` / `CourierStrip` (`ReturnShipmentTracking.jsx`) | Copy-code button |
| `accent` promo language | `GreetRow` credits pill / issue-claim bonus pill | Offer block vocabulary |
| `DeliveryAddressPill` | `src/components/DeliveryAddressPill.jsx` | Address on `undeliverable_address` |

**Net-new (minimal, on existing tokens):** the **apology block** and the **discount-code block**. The motion-styled CTA reuses `Browse`-style button conventions; its glow/shine is net-new CSS but small.

## Assets

- Product image: `public/iphone-cutout.png` (transparent cut-out → brand-tint well in `ProductSummary`).
- Revibe Care icon: hosted PNG already referenced by `ProductSummary` (`REVIBE_CARE_ICON`).
- All other glyphs: `lucide-react` (`PackageX`, `Tag`, `Truck`, `Sparkles`, `Copy`, `Check`, `Clock`, `ArrowRight`, `ShieldCheck`, `ChevronDown`, `CreditCard`, `Wallet`, `MapPin`).

## Files in this bundle

- `Revibe-cancellation card.html` — the hi-fi prototype (3 reasons rendered; Tweaks panel for CTA style + offer loudness; locked to White·magenta + Subtle).
- `Revibe-cancellation CTA options.html` — the 6 CTA directions in context (reference for why E was chosen).
- `design.md` — this spec (same content), for dropping into `docs/handoff/revibe-cancellation/`.

## Hand-back boundary (from the brief)

This was a **design-only** engagement. The engineering pass should: build the card (reusing the components above), add the `cancellationInitiator` / `cancellationReason` / `reBuyOffer` fields + one mock order per reason in `src/data/orders/*`, wire the `App.jsx` cancelled-branch routing on `cancellationInitiator === 'revibe'`, and update docs per `CLAUDE.md` (touches `docs/output/cancellations.md` + `CHANGELOG.md`; run `npm run codemap` if files move).
