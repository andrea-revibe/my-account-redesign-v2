---
status: live
verified_against: 8fb818a
covers:
  - src/lib/countries.js
  - src/components/CountryPicker.jsx
  - src/lib/journey.js
  - src/App.jsx
  - src/components/HeroCard.jsx
  - src/components/ClaimCard.jsx
  - src/components/WarrantyClaimCard.jsx
  - src/components/InvalidClaimCard.jsx
  - src/components/JourneyDevPanel.jsx
  - src/components/EddSandboxPanel.jsx
  - src/lib/address.js
  - src/components/AddressForm.jsx
  - src/components/EditableContactCard.jsx
  - src/components/ClaimFlow/Step4PickupDetails.jsx
---

# Country split

> Revibe operates across markets (UAE, South Africa, Saudi Arabia, and a catch-all "Others") that differ in two ways the customer sees: **how cards look** (e.g. some markets get no granular shipment tracking) and **the sequence of journey steps** (e.g. AE inserts an expert-revision step before a claim can be marked invalid). This doc is the source of truth for both — and, crucially, the **playbook** an agent follows to add the next country difference. Operational source for the market routing lives in `input/return_flow_*.md`.

## 1. The model

Country is an **orthogonal dimension**, not a multiplier on journeys. The same journey replays under any country; one data-driven capability layer (`src/lib/countries.js`) is the single source of truth; the cards read flags off it; `order.country` carries the active code. We deliberately did **not** fork a journey (or a component) per country — most flows are identical, so forking would 4× the maintenance surface and drift.

- **Canonical codes:** `AE` / `ZA` / `SA` / `Others`, default `AE`. These are the values written on `order.country` (already present on every mock order in `data/orders/*`).
- **Axes of difference & their mechanisms:**

| Difference | Mechanism | Where |
|---|---|---|
| **Card look** (a feature is shown/hidden/altered per country) | Capability **flag** in `lib/countries.js`, read by the shared card | §5 |
| **Form structure** (which address fields a market collects) | Per-country **schema** in `lib/address.js`, rendered by the shared `AddressForm` | §4b |
| **Journey sequence** (a step exists only in some countries) | Per-edge **country tag** on a node's `next`, filtered in `validNext` | §6 |

- **Don't confuse country with the EDD market.** `lib/edd.js` `MARKETS` (`UAE/ZA/SA`) drives the Dynamic-EDD sandbox's *timing* math and is a separate axis. The two overlap on the country but are not unified yet; `COUNTRIES[code].eddMarket` is the bridge field, read by nothing today. See §8.

## 2. The capability layer — `lib/countries.js`

The single source of truth. Add a flag here, gate on it in the card; add a market by adding a row.

```js
export const DEFAULT_COUNTRY = 'AE'
export const COUNTRIES = {
  AE:     { label: 'UAE',          detailedTracking: true,  expertReview: true,  eddMarket: 'UAE' },
  ZA:     { label: 'South Africa', detailedTracking: true,  expertReview: false, eddMarket: 'ZA'  },
  SA:     { label: 'Saudi Arabia', detailedTracking: false, expertReview: true,  eddMarket: 'SA'  },
  Others: { label: 'Others',       detailedTracking: false, expertReview: false, eddMarket: null  },
}
export const COUNTRY_CODES = ['AE', 'ZA', 'SA', 'Others']
export function countryConfig(country) { /* code string OR order → config, safe default */ }
```

| Flag | Meaning | Status |
|---|---|---|
| `detailedTracking` | Show the `See detailed tracking` dropdowns (order delivery + claim inbound/return legs). `false` → the dropdown is omitted entirely. | **live** (§4) |
| `expertReview` | Claim gets an expert-revision step before it can be marked invalid (a journey-sequence difference). | **scaffolded — flag exists, nothing reads it yet** (§6 worked example) |
| `eddMarket` | Bridge to `lib/edd.js` `MARKETS` keys. | reserved, unread (§8) |

`countryConfig(arg)` accepts **either** a country-code string **or** an order object (`{ country }`) and falls back to the default config for an unknown/missing code, so callers never crash. Cards have `order` in scope, so the idiom is `countryConfig(order).<flag>`.

## 3. Country selection & wiring

- **Source:** `?country=<code>` URL param (validated against `COUNTRY_CODES`, default `AE`), held as `activeCountry` state in `App.jsx`. `selectCountry(code)` updates state + URL (`replaceState`), mirroring `selectJourney`. So `?journey=claim_issue&country=SA` is shareable.
- **Injection point:** `App.jsx` builds `activeOrderFromJourney = { ...(isSandbox ? sandbox.order : journey.order), country: activeCountry }` — country is spread in **last** so it wins over anything the journey nodes set (they never set `country`), and `INITIAL_ORDER` stays country-free.
- **Dev-panel control:** `src/components/CountryPicker.jsx` — a neutral/ink-toned chip row (`AE · ZA · SA · Others`), rendered in **both** `JourneyDevPanel` and `EddSandboxPanel` under the journey-picker chips. It's the orthogonal axis to the brand-toned journey chips, so the two read as different controls. Journey-mode only (that's where the panels live).
- **`validNext` gating:** `useJourney(journeyId, activeCountry)` receives the active country so per-edge country tags filter correctly (§6).
- **Showcase (non-journey) mode** reads each order's own `order.country` natively (all `AE` today) — the picker is journey-mode only because that's where we demo a single order through a lifecycle.

## 4. Shipped difference #1 — no detailed tracking for SA & Others

`detailedTracking` gates **every granular-milestone surface** (so "no detailed tracking" is a blanket per-country capability, not a per-leg one):

| Surface | File · guard |
|---|---|
| Original order delivery (dropdown) | `HeroCard.jsx` — `isShipped && countryConfig(order).detailedTracking` |
| Order delivery (expanded card sub-timeline) | `OrderCard.jsx` — `isShipped && countryConfig(order).detailedTracking` |
| Claim inbound pickup (customer → Revibe) | `ClaimCard.jsx` — `…picked_up && countryConfig(order).detailedTracking` |
| Warranty inbound pickup | `WarrantyClaimCard.jsx` — `…picked_up && !shipBack.awb && countryConfig(order).detailedTracking` |
| Return leg (Revibe → customer) | `WarrantyClaimCard.jsx` (`shipBack`) + `InvalidClaimCard.jsx` (`invalidClaim.returnShipment`) — both wrap `<ReturnShipmentTracking>` in the guard |
| Status-banner copy (shipped sub-status) | `statuses.js` — `descriptionKey()` collapses `shipped:<sub>` → the single `shipped` message when `!detailedTracking`, so the destination-country / customs sentence never shows |

`OrderCard`'s "Shipping progress" block is the **only always-on** sub-timeline (not behind a dropdown); the rest are `See detailed tracking` toggles. Off → the milestone view is removed but the top-level courier "Track" card / claim-progress dots / status remain. `ReturnShipmentTracking.jsx` stays **country-agnostic** (pure presentational); gating happens at its two call sites, where `order` is in scope. **Matrix:** AE ✓, ZA ✓, SA ✗, Others ✗.

The same flag also collapses the **journey shipment sequence** to a single "Shipped" step for these markets (so the sequence and the card agree — no granular steps in either) — that's the §6 worked example below. The banner collapse here is the belt-and-suspenders that additionally covers data-driven (non-journey) orders, since for journey replays `SA`/`Others` never set a shipping `subStatusId` in the first place.

## 4b. Shipped difference #2 — structured per-country address fields

Address is **structured per market**, not one free-text line. This is a third mechanism alongside the capability flag (§2) and the journey tag (§6): a per-country **field schema** in `src/lib/address.js`, rendered by one shared component.

- **Schema — `ADDRESS_SCHEMAS[country]`**, an ordered `{ id, label, required, full?, type?, options?, inputMode? }` list. Field `id` is the storage key; `full` spans both grid columns; `type` is `text` (default) / `select` / `textarea`.

| Market | Fields (in order) |
|---|---|
| **AE** | Area · Building · Flat/Office no. · Street · City · Emirate (select) — all required, no postal code |
| **SA** | Building no. · Street · District · City · Postal code · Additional code (the only optional field) |
| **ZA** | Street address · Suburb · City/Town · Province (select) · Postal code |
| **Others** | single `Full address` free-text (fallback for a market with no schema) |

- **Value shape.** The editable address (`pickupDetails.address`, `claim.pickupDetails.address`, `order.addressFields`) is an **object keyed by field id**. `order.address` stays a plain display string (read by `DeliveryAddressPill` / heroes) — untouched.
- **Helpers, all string-tolerant** (a legacy string passes through, so un-migrated mocks still render): `addressSchema(country|order)` (safe default `DEFAULT_COUNTRY`), `emptyAddress(country)`, `formatAddress(addr, country)` (→ one line, schema order, blanks dropped, consecutive duplicates collapsed; `DeliveryAddressPill` splits it on `,`), `addressError(addr, country)` (first unmet required id, topmost-first — mirrors `stepError`), `isAddressComplete`.
- **Shared component — `AddressForm`** (`{ address, country, onChange, errorField? }`): a two-column grid built from the schema; `onChange` returns the whole next object. It is the single body used by:

| Surface | How |
|---|---|
| `EditableContactCard` → `PickupFailedCard`, `AwbFailedCard` | `AddressForm` + phone/email; `country={order.country}` |
| `InvalidClaimCard` | private `DeliveryDetailsCard` clone retired → shared `EditableContactCard` |
| Returns flow Step 4 (`Step4PickupDetails` → `EditFieldSheet`) | the address row opens a sheet rendering `AddressForm`; the row shows `formatAddress` |

- **Flow plumbing.** `flowReducer` carries `country` in state (from `order.country`) and seeds `pickupDetails.address = order.addressFields ?? emptyAddress(country)`; pickup validation is `addressError(pd.address, state.country)`. Read-only displays (`ClaimCard` / `WarrantyClaimCard` scheduled-pickup strips, `ClaimDetailsSheet`, `Step6Review`) route the address through `formatAddress`.
- **Mocked vs prod.** Demo orders are `AE`; the three takeover claim mocks carry a structured UAE `pickupDetails.address`, the rest keep legacy strings (display-safe via `formatAddress`). No order seeds `addressFields` yet, so a flow raised on a delivered order starts with an **empty** country-shaped form — prefill lands once upstream order addresses are structured.

**To add / change a market's fields:** edit `ADDRESS_SCHEMAS[code]` in `lib/address.js` (give a new market a full list, or let it fall back to `Others`); every surface picks it up with no component change.

## 5. Recipe — add a CARD-design country difference

Use this whenever a market should *show / hide / alter a piece of a card*. This is the §4 pattern generalised.

1. **Add a flag** to every row of `COUNTRIES` in `lib/countries.js` (give every country a value — don't rely on `undefined`).
2. **Read it in the shared card:** `countryConfig(order).<flag>`. Most differences are a conditional render (`{countryConfig(order).flag && <X/>}`) or a value pick (`countryConfig(order).flag ? a : b`).
3. **Fork a component only if the layout genuinely diverges.** If two countries need structurally different cards (not just a hidden block), create a sibling component and select it by country at the routing layer — but exhaust the flag approach first. To date nothing has needed a fork.
4. **Keep shared presentational components country-agnostic** (like `ReturnShipmentTracking`): pass the decision in, or gate at the call site where `order` is available — don't thread `country` into a leaf that has no other reason to know about it.
5. **Test both states** with `?country=AE` vs `?country=SA` (and the relevant journey) at 430px.
6. **Docs:** add the flag to the §2 table, the surface to a table like §4, and a `CHANGELOG.md` bullet.

## 6. Recipe — add a JOURNEY-flow country difference

Use this when a market has a *different sequence of steps*. The mechanism is **per-edge country tags** on a node's `next`, filtered in `useJourney`'s `validNext` (`lib/journey.js`). Chosen over a function-valued `next` because it's declarative, greppable, and the dev panel can introspect it; chosen over forked journeys because most of the graph is shared.

**How it works.** A `next` entry is either a plain id string (applies to all countries) or an object `{ id, countries: [...] }` (applies only when the active country is listed). `validNext` filters edges by `order.country`; untagged edges always pass, so every existing journey is unchanged.

**Worked example — shipment legs collapse to a single step for SA/Others** (the live case; first real use of the tags). The four detailed-tracking markets walk the granular logistics milestones; `SA`/`Others` see one step per leg, agreeing with their hidden card tracking (§4). Two patterns, picked by whether the leg's entry node already carries the end-state:

- **New collapsed node** (outbound, where skipping straight to `delivered` would never set `statusId: 'shipped'`). Fork the branch-point edge and add one node:
  ```js
  // qc_started.next — AE/ZA walk arrived_destination → … → out_for_delivery;
  // SA/Others get the single shipped_simple step instead.
  next: [
    { id: 'shipped_arrived_destination', countries: ['AE', 'ZA'] },
    { id: 'shipped_simple',              countries: ['SA', 'Others'] },
  ]
  // shipped_simple → next: ['delivered'] · statusId 'shipped', subStatusId null,
  // event 'shipment.shipped'. Appended at the array end (so default-next
  // routing isn't disturbed). In the cancellation journey the outbound leg is
  // entered from cancellation_declined + cancellation_kept, so both fork.
  ```
- **Edge-skip to the leg exit** (return leg / warranty ship-back / inbound pickup, where the entry node *already* set the needed functional state — `currentStatusId: 'shipped'`, the `picked_up` flag, etc.). No new node — the fork just jumps past the granular sub-statuses:
  ```js
  // claim_return_shipping_paid.next (paying already set the shipment 'shipped'):
  next: [
    { id: 'claim_invalid_return_arrived_destination', countries: ['AE', 'ZA'] },
    { id: 'claim_invalid_return_delivered',           countries: ['SA', 'Others'] },
  ]
  ```
  Same shape for warranty ship-back (`claim_ship_back_created` → `claim_device_returned`) and the inbound pickup leg (`claim_picked_up` → `claim_qc_started`). The inbound fork lives **only** on `claim_picked_up`: the pickup-failed branch re-merges there (`claim_pickup_rescheduled` → `claim_picked_up`, untagged), so it inherits the same fork — no separate tagging on the reschedule node.

The skipped nodes stay in each journey's array — they're simply unreached for `SA`/`Others`, reachable for `AE`/`ZA`. (The `expertReview` flag in §2 is still reserved for a future AE-only expert-revision step — same mechanism, not yet built.)

**Steps:**
1. Add the country-only node(s) to the journey's `data/journeys/*` file (id, label, `trigger`, `event`, `apply`), same as any node (see `journey_backend_spec.md` "Adding a new journey").
2. Tag the fork edges on the **branch-point** node's `next` with `countries: [...]`; leave shared edges as plain strings. Converge the country branch back onto the shared chain by pointing its last node at the rejoin id.
3. Gate the matching customer-facing surface (if any) on the `expertReview`-style flag (§5) so the card and the journey agree.
4. No engine change needed — `validNext` already filters. Verify by flipping the CountryPicker: the AE-only Next button appears only under AE.
5. **Docs:** `CHANGELOG.md` + a convention line in `journey_backend_spec.md`; the mechanics stay here.

**Caveats:**
- **Set country before walking a branched journey.** `validNext` filters on the *current* country; flipping mid-path can leave a visited path that includes a node the new country wouldn't reach. For demos, pick the country first (or `Reset journey` after switching). Acceptable for a dev tool; flagged in §8.
- **`apply` must not depend on country** for correctness of replay — country is injected by `App.jsx` after replay, and the hook's internal `order` doesn't carry it. Country decides *which* nodes are reachable (via `next` tags), not what a node computes.

## 7. Mocked vs production

- **Country picker is a demo control**, journey-mode only; production reads `order.country` from the order. The showcase mocks are all `AE`.
- **`?country=` is in-session** — flipping it re-derives the cards immediately but persists nothing.
- **EDD sandbox shows two market controls** right now (the Country chips + the EDD `Market` dropdown) — different axes (capabilities vs timing), not yet unified. See §8.
- **The journey-flow path is live; `expertReview` is still scaffolded.** The per-edge country tags are now used in earnest by the shipment-step collapse (§6) across all six journeys. The `expertReview` flag itself is still unread — reserved for the future AE expert-revision step (same mechanism, not yet built).

## 8. Open questions

- **~~"Tracking unavailable" copy.~~ Resolved.** Rather than a "tracking isn't available in your region" note, `SA`/`Others` get a single collapsed "Shipped" step + a country-neutral banner (§4, §6) — the difference reads as *less granular surfacing*, not *missing* tracking. The `shipment.shipped` comm copy is owner-authored (it resolves to `silent` until then).
- **Unify country with the EDD market.** The Dynamic-EDD sandbox keeps its own `MARKETS` (`UAE/ZA/SA`, no "Others") for timing math. The `eddMarket` bridge field is in place; decide whether the CountryPicker should drive the sandbox market (one control) or stay independent.
- **Country switch mid-journey** can desync a branched path once §6 forks exist (see §6 caveat). Decide whether to auto-reset the journey on country change or leave it to the operator.
- **Per-country EDD/SLA timing in cards.** Transit SLAs likely differ by market (see `claim_tracking.md` §9 "Country-aware transit SLAs"); that's a future capability-flag/`edd.js` integration, not yet wired.
