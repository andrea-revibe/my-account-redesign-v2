# Product Summary Redesign — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to redesign one recurring surface in the Revibe My-Account → Orders prototype: **the product line-item** — the row that shows the customer *what they bought* (device + Revibe Care warranty if present) and *what they paid* (total). You have **zero prior context** on this codebase. This doc is your self-contained brief: what the surface is, every place it renders, where its two assets live, the money model behind it, the design tokens you must reuse, and the divergences the redesign needs to resolve.

**What this doc is.** A map + a contract. It names the exact files/lines, the data fields, the asset hooks, and the visual tokens, so you can design *and* implement without a fan-out search.

**What this doc isn't.** A solution. The visual direction is yours. This doc fixes the *inputs* (data, assets, tokens, constraints) and the *problem* (four goals in §1), not the output.

---

## 0. The 10-second picture

The collapsed/footer of every order card carries a row like this (from the live screenshot):

```
┌─────┐  iPhone 13
│ 📱  │  Midnight · 128 GB · Good          AED 1,029   ⌄
└─────┘  🛡 Revibe Care +AED 90
```

- **Thumbnail** ← `order.product.image`
- **Name** ← `order.product.name`  ·  **Variant** ← `order.product.variant`
- **Warranty line** (only if bought) ← shield icon + `Revibe Care +{currency} {warranty}`
- **Price** ← `order.total` (sometimes under a small "Total" eyebrow label)
- **Chevron** ← decorative expand affordance (only on the two collapsible baseline cards)

This row is **copy-pasted into 10 card components** and renders in two visual contexts (light cards + one dark-gradient hero). It has drifted. That drift, plus three content gaps, is what you're fixing.

---

## 1. Your remit — design only

**You are responsible for the design, not the implementation.** Produce the visual direction and a spec (see §7); the consolidation, cleanup, and code implementation across all the cards are handled by a separate engineering pass *after* you hand back. Do **not** refactor the cards, do **not** build the shared component, do **not** edit `docs`/run codemap. Your job ends at a design the implementer can build from. (You *may* produce throwaway visual mocks to validate the look — see §7 for the boundary.)

### The four goals (all in scope)

1. **Price transparency.** Today the cards show only `total` and a tiny `+AED 90` warranty micro-line. The **subtotal is never shown on a card** — the customer can't see `device price + Revibe Care = total`. The breakdown math exists in the codebase (cancellation/refund surfaces, §4) but never on the order cards. Design a clear breakdown.
2. **Warranty clarity.** "Revibe Care" is currently a 10–14px shield + `+AED 90` afterthought under the variant. Make it legible: what it is (an add-on warranty), that it was purchased, and its price.
3. **Cross-card consistency.** The row is duplicated across 10 files and has already diverged (different thumbnail sizes, "Total" eyebrow present in some and absent in others, two different JSX spellings of the same warranty line). Design **one** treatment that resolves the drift — the engineering pass will collapse the copies into a shared component (§6), but your spec must define the single canonical look it builds toward.
4. **Visual refresh.** Restyle the row (thumbnail, typography, hierarchy, spacing) within the existing design language (§5).

**Out of scope for the design too:** real per-device product imagery. Every order today points at one placeholder (`/iphone-midnight.png`); design as if it stays. Just don't design something that *depends* on real images — the data hook is `order.product.image` (§3) and it must keep working with the placeholder.

---

## 2. Where the row renders — every occurrence

The line-item is **not a shared component today**. Each card re-implements it inline. Redesign means touching all of these (and §6 proposes collapsing them into one).

### Primary renderers — the full product row (thumbnail · name · variant · care · total)

| Card | File | Row region (approx lines) | Thumbnail | "Total" eyebrow? | Context |
|---|---|---|---|---|---|
| In-progress (collapsible) | `src/components/InProgressCard.jsx` | `ProductRow` ·156–201 | `w-8 h-10` rounded-8 | **No** — bare price | Light card footer; has chevron |
| Active order (collapsible) | `src/components/OrderCard.jsx` | 104–141 | `w-11 h-14` rounded-10 | **Yes** | Light card; dashed top border; has chevron |
| Past order | `src/components/PastOrderCard.jsx` | 107–135 (also a refund-hero img ·388) | — | — | Light card |
| Hero (top-of-page) | `src/components/HeroCard.jsx` | 67–104 | `w-12 h-12` rounded-10 | **Yes** | **Dark purple gradient** — uses `white/opacity` tokens, not ink/muted |
| Active claim | `src/components/ClaimCard.jsx` | 296–316 | — | — | Light card |
| Docs rejected (takeover) | `src/components/DocsRejectedCard.jsx` | 504–532 | — | — | Light card |
| Invalid claim (takeover) | `src/components/InvalidClaimCard.jsx` | 856–884 | — | — | Light card |
| Pickup failed (takeover) | `src/components/PickupFailedCard.jsx` | 432–460 | — | — | Light card |
| Reset failed (takeover) | `src/components/ResetFailedCard.jsx` | 479–507 | — | — | Light card |
| Warranty claim | `src/components/WarrantyClaimCard.jsx` | 365–385 | — | — | Light card |

> The collapsed card header *is* the tap target on `OrderCard`/`InProgressCard`; the chevron is decorative. If your row sits inside that tappable header, any interactive sub-element (e.g. a "what's this?" tooltip on Revibe Care) must `stopPropagation` — that's the established convention here (see `HistoryThread` chips).

### Secondary surfaces — already show a price *breakdown* (reuse their pattern, don't fight it)

These are NOT the order-card row, but they already render `subtotal / warranty / total` as labeled line items. They're your reference for what "transparent breakdown" looks like in this app, and they should stay visually consistent with whatever you design.

| Surface | File | Note |
|---|---|---|
| Cancellation sheet | `src/components/CancelOrderSheet.jsx` ·49–59, ·236 | Computes `subtotal / warranty / total`; renders a `Revibe Care` breakdown line |
| Refund method step | `src/components/ClaimFlow/Step5RefundMethod.jsx` ·118 | Lists `Revibe Care` as a refund line item |
| Refund hero (past order) | `src/components/PastOrderCard.jsx` ·326–335 | Shows refund net + Wallet bonus |

---

## 3. The two assets — where they live

### A. Product thumbnail
- **Hook:** `order.product.image` — a string path.
- **Today:** every order points at **one placeholder**, `public/iphone-midnight.png`. (Confirmed in `src/data/orders/baseline.js`, `data/journey.js`, `data/journeys/initialOrder.js`.) Real per-device images are out of scope — but keep reading `order.product.image` so they drop in later.
- **Rendered as:** `<img src={order.product.image} className="object-contain" />` inside a small rounded tile (`bg-brand-bg border border-line-2`, or `bg-white/[.94]` on the dark hero).

### B. Revibe Care shield icon
- **Source:** a Shopify CDN PNG — `https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652`.
- **The smell:** this URL is assigned to a `const REVIBE_CARE_ICON` that is **copy-pasted verbatim into 11 files**: `CancelOrderSheet`, `ClaimCard`, `DocsRejectedCard`, `HeroCard`, `InProgressCard`, `PastOrderCard`, `InvalidClaimCard`, `OrderCard`, `PickupFailedCard`, `WarrantyClaimCard`, `ResetFailedCard` (and `Step5RefundMethod` has its own copy). Rendered at `w-2.5 h-2.5` to `w-3.5 h-3.5` depending on the card.
- **Consolidation note:** the repo already has a precedent for "one icon constant, exported once, imported everywhere" — `WalletInfoTooltip` exports `REVIBE_WALLET_ICON` and CLAUDE.md mandates reusing it rather than re-rolling. **Do the same for the Revibe Care icon**: export it once (ideally from the shared component in §6) and import it. Do not add a 12th copy.
- Other brand assets for reference: `public/revibe-logo.svg` (header logo), wallet icon via `WalletInfoTooltip`.

---

## 4. The money model — what the numbers mean

Fields live on each order object (`src/data/orders/baseline.js` is the canonical shape; full field reference in `docs/output/orders.md` §7):

| Field | Type | Meaning |
|---|---|---|
| `order.subtotal` | number | Device price before the warranty add-on. **Never shown on cards today.** |
| `order.warranty` | number \| null | The Revibe Care add-on price. `null` ⇒ no warranty bought ⇒ the whole care line is omitted (`order.warranty != null` guards it everywhere). |
| `order.total` | number | What the customer paid. **`total = subtotal + warranty`** (e.g. `559 + 60 = 619`). |
| `order.currency` | string | `'AED'` throughout the mocks. Always render as `{currency} {amount.toLocaleString()}`. |
| `order.quantity` | number | Always `1` in mocks (Revibe sells single-unit orders). |
| `order.unitPrice` | number | Present on some orders; for the single-unit catalogue it equals `subtotal`. |
| `order.product.{name,variant,image}` | — | `variant` is a pre-joined string like `"Midnight · 128 GB · Good"` (colour · storage · condition grade). |

**Breakdown pattern that already exists:** refund/cancellation surfaces carry `refund.breakdown[] = [{ label, amount }]` with an explicit `{ label: 'Revibe Care', amount }` line (see `data/orders/baseline.js`, `data/journeys/cancellation.js`). If you design a breakdown, mirror this label/amount shape so the two reconcile.

**The transparency gap, precisely:** an order card shows `total` (big) + `Revibe Care +AED 90` (tiny). The customer can derive the device price by subtraction but it is never stated. Your redesign should make `subtotal + Revibe Care = total` readable without mental math.

---

## 5. Design tokens — reuse these, don't invent

Tailwind config: `tailwind.config.js`. Visual reference: `brief/design-system.md`. Prefer the **named tokens** below over arbitrary values (slash-opacity like `bg-brand/10` works on any of them).

| Token | Value | Use |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Primary / secondary text |
| `muted` | `rgb(138,143,154)` | Tertiary text (variant, care line today) |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Borders / dividers / tile bg |
| `brand` / `brand-2` | `rgb(80,25,160)` / `rgb(122,61,211)` | Primary purple |
| `brand-bg` / `brand-bg2` | `rgb(243,237,251)` / `rgb(236,226,250)` | Thumbnail tile bg, soft fills |
| `accent` | `rgb(217,26,122)` | Magenta — Wallet/promo accent |
| `success` / `warn` / `danger` (+`.bg`) | — | Status tones |
| `canvas` / `surface` | `rgb(247,245,251)` / `#FFFFFF` | Page / card bg |
| `hero-gradient` (bg image) | purple 155° gradient | The `HeroCard` background — your row must read on this too |

Shape & type: cards `rounded-card` (18px), buttons `rounded-btn` (10px); thumbnails currently `rounded-[8px]`/`rounded-[10px]`. Body 14px, small 12px. Font: Inter (Graphik substitute). Icons: lucide-react, 18–22px, stroke 1.75–2. Prices use `tabular-nums`.

**Gotcha — do not reintroduce a `page` colour token.** `text-{name}` resolves to either a fontSize or a colour; defining `colors.page` alongside `fontSize.page` silently renders white text. The same name-collision risk applies to any new token — avoid one.

**One dark context.** Nine cards are light (ink/muted on white). `HeroCard` is the **purple gradient** and uses `text-white` + `white/[.NN]` opacity tokens for the same row. Your design needs a light variant and a hero variant, or one component that adapts via a prop (see §6).

---

## 6. Structural reality you must design *for* (someone else builds it)

You don't implement this — but your design has to be **buildable as one component**, because that's how the engineering pass will resolve goal 3. So design with these facts in mind; don't design something that can only work as 10 bespoke variants.

- Today there is no shared product-row component — 10 inline copies + 1 duplicated icon constant. The implementer's target is **one component** (e.g. `ProductSummary`) that takes `order` + a `light | hero` tone, owning thumbnail, name, variant, the Revibe Care line + icon, and the price/breakdown.
- So your spec must define **one canonical treatment** plus its **two contexts** (light card, dark `HeroCard` gradient) and its **states** (with warranty / without warranty / collapsed-with-chevron). One adaptable design, not ten.
- Reconcile the current divergences into a single decision each: one thumbnail size, one call on the "Total" eyebrow, one warranty-line treatment. (The two current JSX spellings produce identical output — that's drift, not intent; pick one look.)

**Constraints your design must respect (from `CLAUDE.md`) so it's buildable:**
- The collapsed header is the tap target on `OrderCard`/`InProgressCard`; any interactive bit you add inside the row (e.g. a "what's Revibe Care?" tooltip) must be implementable as a `stopPropagation` child, not a nested link/button that hijacks the tap.
- Reuse design tokens (§5) over arbitrary values; don't rely on a `page` token.
- This is a **prototype for evaluating UX before production specs** — favour clarity and fidelity.

---

## 7. Your deliverable — a design spec, handed back

Produce a **design spec** the engineering pass can build from. Recommended home: write it to `docs/handoff/product-summary/design.md` (so the implementer picks it up cleanly), or present it in-conversation if that's the agreed flow. It should contain:

- The **canonical row layout** — hierarchy and arrangement of thumbnail, name, variant, Revibe Care, and price/breakdown.
- How the **breakdown** reads (`subtotal + Revibe Care = total`) without mental math.
- The **states**: with warranty, **without** warranty (`order.warranty == null` — the care line must disappear cleanly, no empty gap), and the collapsed/chevron case.
- The two **contexts**: light card and the dark `HeroCard` gradient.
- **Tokens used** (from §5) and any measurements/redlines (sizes, spacing, weights) the implementer needs.
- Annotated mocks — ASCII, or a single throwaway live mock (see boundary below).

**Hand-back boundary — do NOT cross it:**
- ❌ No refactor of the 10 cards, no shared component, no deleting the duplicated icon constants.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.
- ✅ You **may** build **one** throwaway live mock (a single card, or a scratch route) purely to validate the look — but flag it clearly as a disposable mock for review and don't spread edits across other files. The full implementation (consolidation + cleanup + all cards + docs) is the engineering pass's job, not yours.

When the spec is ready, hand back: the implementer reads `design.md`, builds the shared `ProductSummary` component, replaces the row in all 10 cards, removes the duplicated `REVIBE_CARE_ICON` copies, and updates the docs/codemap per `CLAUDE.md`.

---

## 8. Source files to read when this brief isn't enough

| You want… | File |
|---|---|
| The canonical row markup + thumbnail/typography | `src/components/OrderCard.jsx` ·104–141 (richest version) |
| The dark-gradient variant | `src/components/HeroCard.jsx` ·67–104 |
| The collapsed-only minimal variant (`ProductRow`) | `src/components/InProgressCard.jsx` ·156–201 |
| The money fields / order shape | `src/data/orders/baseline.js`; spec in `docs/output/orders.md` §7 |
| Existing breakdown pattern (`label`/`amount`) | `src/components/CancelOrderSheet.jsx` ·49–59, ·236; `data/orders/baseline.js` (`refund.breakdown`) |
| The "export one icon, reuse everywhere" precedent | `src/components/WalletInfoTooltip.jsx` (`REVIBE_WALLET_ICON`) |
| Design tokens (authoritative) | `tailwind.config.js`; narrative in `brief/design-system.md` |
| Card-routing (which card shows when) | `docs/output/diagrams.md#card-routing`; `App.jsx` routing block |
| Repo conventions & gotchas | `CLAUDE.md` (root) |
