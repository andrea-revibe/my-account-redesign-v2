# Product Imagery — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to redesign one thing in the Revibe My-Account → Orders prototype: **the product picture** — the device thumbnail the customer sees on every order/claim card, and the tile it sits in. You have **zero prior context** on this codebase. This doc is your self-contained brief: what the picture is, every place it renders, the two current assets and where they live, what catalogue the single placeholder is currently standing in for, the design tokens you must reuse, and the constraints the redesign must respect.

**What this doc is.** A map + a contract. It names the exact files/lines, the data field, the asset paths, and the visual tokens, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The visual direction — which image(s), how the tile looks, how big — is yours. This doc fixes the *inputs* (data, assets, tokens, contexts, constraints) and the *problem* (the goals in §1), not the output.

**Relationship to the product-summary handoff.** The recurring product **row** (thumbnail · name · variant · Revibe Care · price) was already redesigned and consolidated — see `docs/handoff/product-summary/`. That pass owned the *layout, typography, price breakdown, and warranty treatment*, and it **explicitly deferred product imagery** ("design as if the `/iphone-midnight.png` placeholder stays"). **You own exactly the piece it deferred: the image and its tile — not the name/variant/price/warranty arrangement.** Do not re-litigate the row layout; it's settled and lives in one shared component now (§6).

---

## 0. The 10-second picture

Every order/claim card carries a product row. Its left edge is the device thumbnail:

```
┌─────┐  iPhone 13
│ 📱  │  Midnight · 128 GB · Good          AED 1,029   ⌄
└─────┘  🛡 Revibe Care +AED 90
```

- **Thumbnail** ← `order.product.image` (a string path) — **this, and the tile around it, is your remit.**
- Everything to its right (name, variant, Revibe Care, price) is owned by `ProductSummary` and is **out of scope**.

Two problems converge on that one thumbnail: the **image is wrong** for almost every product (§3), and the **tile is small and the source art is a busy two-device composite** that reads poorly at thumbnail size (§4). The user's words: *"make the product picture bigger and improve its look."*

---

## 1. Your remit — design only

**You are responsible for the design, not the implementation.** Produce the visual direction and a spec (see §7); the asset wiring and code changes are a separate engineering pass *after* you hand back. Do **not** swap the asset across the data files, do **not** edit the components, do **not** touch `docs`/run codemap. Your job ends at a design (and a sourcing rule) the implementer can build from. (You *may* produce throwaway visual mocks to validate the look — see §7 for the boundary.)

### The goals (all in scope — confirmed with the user)

1. **Image accuracy.** Today **one placeholder stands in for the entire catalogue** — Samsung, Pixel, iPad, MacBook, and ~10 iPhone models in six colours all render as the same midnight iPhone 13 (§3). Decide the imagery *strategy*: a single better generic device, a small per-category set (phone / tablet / laptop, maybe per-brand), or a full per-device set — and the **sourcing rules** that keep whatever you pick consistent (angle, crop, background, format, resolution). The data hook (`order.product.image`) must keep working whichever you choose.
2. **Presentation / size.** Make the picture **bigger and better-looking** within the existing tile. Spec the tile: dimensions (it's `72×72` today — a prior exploration landed on `88×88`, treat that as one candidate, not the answer), padding, corner radius, background, and any subtle depth (shadow) — across all the contexts in §2.
3. **Cross-context consistency.** The same image + tile renders in a **light card**, a **dark hero gradient**, and two **compact summary boxes** (cancel sheet, returns review). One adaptable treatment must read in all of them (§2).
4. **Source-quality consistency.** Whatever image set you choose, the shots must be uniform — same framing, lighting, crop tightness, transparent background, square-ish aspect — so devices don't visually clash when the list mixes models. The current composite (two devices) vs a single angled shot is exactly the kind of inconsistency to rule out.

**Out of scope:** the product row's layout, typography, price breakdown, and Revibe Care treatment — all owned by `ProductSummary` (`docs/handoff/product-summary/`). Don't redesign the row; design only the image and the tile it sits in.

---

## 2. Where the picture renders — every occurrence

`order.product.image` renders in **three** places today. The canonical row is now a shared component (`ProductSummary`); the other two are bespoke compact tiles inside flows. Your design must cover all three tile treatments and both colour contexts.

| Surface | File · line | Tile today | Context | Notes |
|---|---|---|---|---|
| **Canonical product row** | `src/components/ProductSummary.jsx` ·21 (tile), ·25 (img) | `w-[72px] h-[72px]` · `rounded-[14px]` · `p-1.5` · `object-contain` | **Light card** (`bg-surface border border-line`) **and dark hero** (`bg-white/[.96]`), switched by the `tone` prop | The big one. Shared across every order/claim card via `ProductSummary`. **Primary target.** |
| Cancellation sheet — order summary | `src/components/CancelOrderSheet.jsx` ·206 | `w-11 h-14` · `rounded-[10px]` · `p-1` · `bg-brand-bg border border-line-2` | Light sheet | Compact portrait tile. Not `ProductSummary`. |
| Returns flow — review step | `src/components/ClaimFlow/Step6Review.jsx` ·113 | `w-11 h-13` · `rounded-[10px]` · `p-1` · `bg-brand-bg border border-line-2` | Light sheet | Compact portrait tile. Not `ProductSummary`. |

> **Two colour contexts, one component.** `ProductSummary` renders the same tile in a light card (ink-on-white) and on the dark purple `hero` gradient (`bg-white/[.96]`, white text around it). Your tile + image must read on both. The two compact boxes are light-only.
>
> **The tap target.** On the collapsible baseline cards the whole header is one button (the chevron is decorative). The thumbnail sits inside that tappable header — anything interactive you add to the tile would have to `stopPropagation`. You almost certainly won't add interaction to an image, but don't design a tile that needs a nested link/button.

---

## 3. The data — what the one placeholder is standing in for

**Hook:** `order.product.image` — a string path, one per order. **Today every order points at the same file**, `/iphone-midnight.png` (in `public/`). That single image is referenced **~26 times across 6 data files**: `src/data/orders/baseline.js` (11), `orders/claims.js` (8), `orders/compensation.js` (3), `orders/warranty.js` (2), `data/journey.js` (1), `data/journeys/initialOrder.js` (1).

**The accuracy gap, concretely.** The catalogue these orders describe is wildly heterogeneous — and *none* of it is a midnight iPhone 13 except a handful:

| Brand / type | Models in the mock data | Variants (colour · storage · grade) |
|---|---|---|
| iPhone | 7, 8, X, 11, 11 Pro, 12, 12 mini, 13, 14, SE, SE (3rd gen) | Black, White, Blue, Red, Green, Silver, Space Gray, Midnight |
| Samsung | Galaxy S22, Galaxy S23 | Phantom Black |
| Google | Pixel 6, Pixel 7 | Sorta Sage, Obsidian |
| Tablet | iPad Pro 11″ (`category_name: 'Tablet'`) | Space Gray |
| Laptop | MacBook Air 13″ (`category_name: 'Macbook'`) | Midnight |

So a Samsung Galaxy, a Google Pixel, an iPad, and a MacBook all currently show a midnight iPhone. The `variant` string encodes `colour · storage · grade` (e.g. `"Phantom Black · 256 GB · Good"`); `category_name` (`Tablet` / `Macbook`, absent ⇒ phone) is the coarsest device-type signal already in the data — useful if you go per-category.

**Field shape** (canonical in `src/data/orders/baseline.js`; full reference `docs/output/orders.md` §7): `order.product = { name, variant, image }`. Whatever imagery strategy you pick, it resolves through `image` — either by hand-setting the right path per record (engineering pass) or by a rule keyed on `name` / `category_name`. Spec the rule; you don't wire it.

---

## 4. The two assets — where they live, what they look like

### A. Current placeholder — `public/iphone-midnight.png`
- **800 × 800**, transparent PNG.
- **A two-device composite:** a midnight iPhone 13 shown **front** (colourful wallpaper screen) **and back**, side by side.
- **Why it reads poorly small:** at a 72px tile (≈144px @2×) the frame is split across two devices with heavy whitespace between them — each device renders tiny and the eye has no single subject. It's the "improve its look" problem in one image.

### B. Review candidate — `docs/handoff/product-imagery/candidates/iphone-black-back-tight.png`
- **621 × 621**, transparent PNG. (Copied into this folder so the brief is self-contained; original came from the user's Downloads.)
- **A single device, 3/4-angle, back view** — a black titanium Pro-style iPhone, tightly cropped.
- **Why it's a candidate:** one subject filling the frame reads far better at thumbnail size and looks more premium — directly serving "bigger + better look." **Caveats you must weigh:** (a) it's a black titanium *Pro* that matches **no** model in §3 (the current placeholder at least matches the few real iPhone-13-Midnight orders), so as a single generic it *trades* one mismatch for another; (b) 621px is lower-res than the current 800px (still ≈4× a 72px tile, ≈2× an 88px @2×, so fine); (c) a single angled hero shot sets a *sourcing standard* — if adopted, every other device image should match its angle/crop/background or the list will clash (goal 4).

**This candidate is one option, not the decision.** Evaluate it against the alternatives in §1 goal 1 and present a recommendation (§ process Step 2). Both assets are transparent PNGs, so they sit cleanly on the light tile (`bg-surface`/`bg-brand-bg`) and the dark hero tile (`bg-white/[.96]`).

---

## 5. Design tokens — reuse these, don't invent

Authoritative: `tailwind.config.js`. Narrative: `brief/design-system.md`. (The product-summary brief's §5 has the full table — `docs/handoff/product-summary/context.md`.) The ones that bear on a tile:

| Token | Value | Use |
|---|---|---|
| `surface` / `canvas` | `#FFFFFF` / `rgb(247,245,251)` | Card bg / page bg |
| `brand-bg` / `brand-bg2` | `rgb(243,237,251)` / `rgb(236,226,250)` | Thumbnail tile bg (the compact boxes use this) |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Tile borders / dividers |
| `brand` / `brand-2` | `rgb(80,25,160)` / `rgb(122,61,211)` | Primary purple |
| `hero-gradient` | purple 155° gradient | The dark `hero` tone the tile must read on |
| `ink` / `muted` | `rgb(28,34,48)` / `rgb(138,143,154)` | Text around the tile (not yours to change) |

Shape & type: cards `rounded-card` (18px); the product tile is currently `rounded-[14px]` (canonical) / `rounded-[10px]` (compact). Font Inter. Prices `tabular-nums`. Slash-opacity (`bg-brand/10`) works on any token.

**Gotcha — do not reintroduce a `page` colour token** (or any name colliding with a `fontSize` key): `text-{name}` resolves to either a fontSize or a colour, and the collision silently renders white text. See `CLAUDE.md` gotchas.

---

## 6. Structural reality you must design *for* (someone else builds it)

You don't implement — but your design has to be **buildable into the existing structure**:

- The canonical row is **one shared component already**: `ProductSummary` (`tone="light" | "hero"`). It owns the tile markup at lines 19–30. The engineering pass will change the tile dimensions/styling and (if you go per-device/per-category) the data `image` paths — your spec defines *what* it sets, in one place.
- The two compact tiles (`CancelOrderSheet`, `Step6Review`) are **not** `ProductSummary`; they're bespoke `w-11` portrait boxes. Decide whether your tile treatment should unify with them or stay deliberately smaller — and say so. Don't assume they auto-inherit.
- Keep `order.product.image` as the hook. If you propose a per-category/per-device rule, it must still resolve to a path on `order.product.image` — don't invent a new data field without flagging the data-shape change and its blast radius (the ~26 references in §3).
- New image assets live in `public/` (served at `/`), like `public/iphone-midnight.png` and `public/revibe-logo.svg`. Spec the **naming convention** (e.g. `iphone-13-midnight.png` / `phone-generic.png`) so the set is legible.
- This is a **prototype for evaluating UX before production specs** — favour clarity and fidelity over architectural ceremony, but consistency across the contexts (§2) and the image set (goal 4) matters.

---

## 7. Your deliverable — a design spec, handed back

Produce a **design spec** the engineering pass can build from. Recommended home: write it to `docs/handoff/product-imagery/design.md` (so the implementer picks it up cleanly), or present in-conversation if that's the agreed flow. It should contain:

- **Imagery strategy** — single generic / per-category / per-device — with the rationale, and the **sourcing rules** (angle, crop tightness, background = transparent, aspect, min resolution, file format/naming) that keep the set consistent.
- **The mapping** — if not a single image: how `order.product.image` is set (hand-set per record, or a rule keyed on `name` / `category_name`), with the fallback for an unmatched device.
- **The tile** — final dimensions, padding, corner radius, background, and any depth (shadow) — for the canonical `ProductSummary` tile, with explicit calls on the **light** and **dark hero** contexts, plus a decision on the two **compact** boxes (unify or leave).
- **Tokens used** (from §5) and the **measurements/redlines** the implementer needs.
- Annotated mocks — ASCII, or a single throwaway live mock (boundary below).

**Hand-back boundary — do NOT cross it:**
- ❌ No swapping the asset across the 6 data files, no editing `ProductSummary`/`CancelOrderSheet`/`Step6Review`, no renaming/deleting `public/iphone-midnight.png`.
- ❌ No edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.
- ✅ You **may** build **one** throwaway live mock (a single card or scratch route) purely to validate the look — flag it as disposable and don't spread edits across other files.

When the spec is ready, hand back: the implementer wires the asset(s), adjusts the tile in `ProductSummary` (and the compact boxes if specced), updates the ~26 data references if going per-device/per-category, and updates the docs/codemap per `CLAUDE.md`.

---

## 8. Source files to read when this brief isn't enough

| You want… | File |
|---|---|
| The canonical tile + image markup | `src/components/ProductSummary.jsx` ·19–30 |
| The two compact tiles | `src/components/CancelOrderSheet.jsx` ·204–211 · `src/components/ClaimFlow/Step6Review.jsx` ·111–117 |
| What the row already settled (don't redo it) | `docs/handoff/product-summary/context.md` + `design.md` |
| The product/`image` field shape | `src/data/orders/baseline.js`; spec in `docs/output/orders.md` §7 |
| The full catalogue the placeholder covers | `src/data/orders/*.js` (`name` / `variant` / `category_name`) |
| The current asset | `public/iphone-midnight.png` (800×800, two-device composite) |
| The review candidate | `docs/handoff/product-imagery/candidates/iphone-black-back-tight.png` (621×621, single angled back) |
| Design tokens (authoritative) | `tailwind.config.js`; narrative in `brief/design-system.md` |
| Repo conventions & gotchas | `CLAUDE.md` (root) |
