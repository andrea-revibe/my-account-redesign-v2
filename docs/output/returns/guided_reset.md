---
status: live
verified_against: cc39517
covers:
  - src/lib/devices.js
  - src/components/ClaimFlow/Step3DevicePrep.jsx
  - src/components/ClaimFlow/ResetGuideSheet.jsx
  - src/components/ClaimFlow/resetGuideMocks.jsx
  - src/components/ClaimFlow/resetGuideAnim.js
  - src/components/ClaimFlow/flowReducer.js
---

# Guided reset (device prep)

Step 3 of every device return flow — **"Prepare your device for return"** (`change_of_mind` / `issue` / `warranty`; `compensation` skips it). The customer must run a guided reset — unlink their account and wipe the device — before pickup, so Revibe can resell it. It's a single mandatory path: there's no separate passcode-handover option, because the guide itself branches to a remote route for devices that can't be unlocked or powered on.

The feature is two layers:

1. **The mapping** (`src/lib/devices.js`) — resolves an order's product category to the two dimensions that pick the right guide. Pure functions, no UI.
2. **The guide surface** — `Step3DevicePrep.jsx` (the step: launcher + confirm gate) opens `ResetGuideSheet.jsx` (the full walkthrough), which draws device mockups from `resetGuideMocks.jsx` and slide transitions from `resetGuideAnim.js`. The flow reducer (`flowReducer.js`) seeds the starting `os`/`device` from the mapping.

## 1. The mapping — `src/lib/devices.js`

The canonical field is `product.category_name ?? order.category_name` (the production category, e.g. `iPhone`, `Macbook`, `Samsung phone`, `Tablet`, `Laptop`). `order.deviceOs` is only a fallback for orders that predate the field. From the category the mapping derives **two independent dimensions**:

| Dimension | Values | Drives | Functions |
|---|---|---|---|
| `os` | `ios` \| `android` | The Apple-vs-Google split — iCloud-vs-Google account copy in the step | `osForCategory(categoryName)`, `deviceOsForOrder(order)` |
| `device` (deviceType) | `iphone` \| `ipad` \| `mac` \| `android` \| `tablet` | The finer split that selects the guide's copy, steps, mock screens, and frame | `deviceTypeForCategory(categoryName)`, `deviceTypeForOrder(order)` |

`isOsAmbiguous(order)` is `true` exactly when `deviceTypeForOrder` returns the OS-ambiguous `tablet` (see §3).

Matching is regex-based (`IOS_RE` / `ANDROID_RE` / `IPAD_RE` / `MAC_RE` / `TABLET_RE`), Android-first, so any Android-ish category resolves to the Samsung guide knowingly (it's the only Android guide built).

### Production category → guide

| Category | `os` | `device` | Guide variant | Notes |
|---|---|---|---|---|
| `iPhone` | `ios` | `iphone` | iPhone | |
| `Macbook` | `ios` | `mac` | MacBook | desktop-Safari remote path, laptop frame |
| `Samsung phone` | `android` | `android` | Samsung phone | |
| `Tablet` | — | `tablet` → resolved | iPad **or** Samsung tablet | **OS-ambiguous** — resolved by the Step 3 chooser (§3) |
| `Laptop` (Windows) | `ios` (fallback) | `iphone` (fallback) | iPhone | **no Windows guide yet** — falls through to the iPhone guide |

Unknown categories, or orders with only `deviceOs`, fall back to `iphone`/`ios` (an `android` `deviceOs` collapses to the Samsung-phone guide).

## 2. The five guide variants

`device` keys five parallel guide definitions in `ResetGuideSheet.jsx`. Each variant has its own on-device steps (`DEVICE_STEPS`), remote steps (`REMOTE_STEPS`), copy (`COPY`), short label (`DEVICE_LABEL`), and frame:

| `device` | Frame (`resetGuideMocks.jsx`) | On-device steps | Account system unlocked |
|---|---|---|---|
| `iphone` | `MiniPhone` | 3 | iCloud / Activation Lock |
| `ipad` | `MiniTablet` | 3 | iCloud / Activation Lock |
| `mac` | `Laptop` shell (Safari chrome) | 3 | Apple Account / Activation Lock (Apple silicon + T2) |
| `android` | `MiniPhone` | 4 | Google FRP + Samsung Reactivation Lock |
| `android_tablet` | `MiniTablet` | 4 | Google FRP + Samsung Reactivation Lock |

`iphone`/`ipad` share one Apple remote-step factory (`appleRemoteSteps(noun, Frame)` — icloud.com/find + account.apple.com); `mac` has its own desktop variant (`MAC_REMOTE_STEPS`); `android`/`android_tablet` each remove both Google and Samsung accounts. `android_tablet` is intentionally a **tablet-shaped clone** of the Samsung-phone guide — same One UI steps, just the `MiniTablet` frame and "tablet" wording — kept distinct from `android` (Samsung phone).

### Guide internal structure

`ResetGuideSheet` is a full-screen sheet with its own phases (component-local state, not the flow reducer):

1. **`intro`** — `COPY[device]` asks *"can you still unlock and use this device?"* → **Yes** picks the on-device route, **No** picks the **remote** route (`route === 'remote'` swaps `DEVICE_STEPS` → `REMOTE_STEPS`). This is what covers broken/locked devices without a separate option.
2. **Steps** — one screen per step with a device mockup (`Mock`), a `lead` (what to do) and a `why` (why it matters). Some steps are **carousels**: their `Mock` exposes a `.screens` array and the footer walks screen-by-screen before advancing the step. Slide transitions come from `resetGuideAnim.js` (`STEP_ANIM_CSS` / `stepAnim`).
3. **Trouble** — most steps carry `trouble: { label, body, escalate? }`. When `escalate` is set, the trouble panel offers a jump to the remote route (the standard "forgot password / device broken" off-ramp).
4. **Done** — a centered success state: green check coin + `doneTitle` ("Your {device} is ready to ship") + `doneSub` ("It's erased and unlinked…"). The header title is blank on this phase (just the close ✕). Tapping `Done` fires `onDone`, which sets `resetGuideSeen`. (There is no pre-ship checklist — the optional `FINAL_CHECKS` list, its `resetGuideChecks` persistence, and the "Almost there" header were removed.)

## 3. OS-ambiguous `Tablet` → the chooser

The production `Tablet` category covers both iPads and Android tablets, so the category alone can't pin the OS. `deviceTypeForCategory` returns `tablet`, and the resolution is deferred to a single manual input in Step 3:

- **Seeding** (`flowReducer.js`): a `tablet` order is **preselected to iPad** — `device: 'ipad'`, `os: 'ios'`. Everything non-ambiguous resolves directly from the category.
- **Chooser** (`TabletPicker` in `Step3DevicePrep.jsx`): rendered only when `isOsAmbiguous(order)`. Two options — **Apple** → `device: 'ipad'`, `os: 'ios'`; **Android** → `device: 'android_tablet'`, `os: 'android'`.
- Switching the OS invalidates any reset already run on the other guide, so `setTabletOs` clears `resetGuideSeen` + `resetConfirmed` (re-gating the confirm checkbox).

This is the **only** manual device input in the whole flow.

## 4. The Step 3 surface — `Step3DevicePrep.jsx`

Layout, top to bottom: a warn **`Callout`** (reset before refund — also warns that a device arriving still locked may have its refund delayed and a fee deducted), the **`TabletPicker`** (ambiguous only), the **`HeroLauncher`**, the **`ResetOffRamps`** disclosure, a **`SafetyNote`** (your iCloud/Google backup stays safe — the screen's emotional crux), and the **`ConfirmGate`**.

- **`HeroLauncher`** has three tones: `default` (brand purple, meta chips `~10 min` · `{stepCount} simple steps`, where `stepCount` is 4 for Android else 3), `done` (green, "Guided reset completed", tap to re-run), and `error` (red + `animate-shakeX`). It also dims (`opacity-55 grayscale`) when the never-set-up skip is checked.
- **`ResetOffRamps`** — a single collapsed-by-default **"Can't run the guided reset?"** disclosure (bordered button row, `HelpCircle` + chevron) that folds away the two off-ramps from the normal on-device reset, replacing what used to be two always-on text blocks (see §5). Expanding reveals, in order:
  1. **"Never set up this device?"** — change-of-mind only (§5): an attestation checkbox that skips the reset.
  2. **"Broken, or can't unlock it?"** — informational (all flows): points the customer into the guide's remote route (the route itself is picked inside the guide intro, not here).
- **`ConfirmGate`** — the checkbox is **locked until `resetGuideSeen`** (guide opened and finished via `Done`). The card border/fill tracks locked → error → checked → default. The old always-on "Run the guide and tap Done" hint under it is gone — it now appears **only** in the red error state. Hidden entirely when the never-set-up skip is checked (§5).
- **Soft validation** (the flow-wide model — Continue is never disabled): `stepError` returns `'resetGuide'` first (guide not yet completed → launcher goes red + shakes) then `'resetConfirm'` (guide done but box unticked → gate goes red, scrolls into view). The error flag is reducer-owned and cleared by every step-changing action.

## 5. The never-set-up skip (change_of_mind only)

A device that was never set up has no account linked and nothing to erase, so the guided reset is moot. The customer can attest to that instead of running it — but **only on the change-of-mind flow** (`state.claimType === 'change_of_mind'`). On issue / warranty the device is presumed used, so the `ResetOffRamps` disclosure shows only the informational remote-route row.

- **State** — `devicePrep.neverSetUp` (boolean). Set true when the attestation checkbox inside `ResetOffRamps` is ticked. `ROUTE_FROM_REASON` clears it back to `false` whenever the resolved track isn't `change_of_mind`, so a back-nav out of change-of-mind can't carry a skip the UI never offered.
- **Gate** — `stepError`'s `deviceprep` case short-circuits to `null` (step satisfied) at the top when `claimType === 'change_of_mind' && dp.neverSetUp`, before the `resetGuide` / `resetConfirm` checks. No new error key: if the box is left unticked the normal reset error still applies, since reset stays the default expectation.
- **UI when checked** — the `HeroLauncher` dims, and the `SafetyNote` + reset `ConfirmGate` are hidden (the attestation is now the gate). The disclosure stays force-expanded so the ticked attestation is visible. Unticking restores the reset path.
- **Downstream** — `neverSetUp` rides into the seeded claim (`devicePrep` is spread in `ClaimFlow.jsx`). It's checked **before** the `option === 'reset'` branch in `devicePrepText` (`lib/claims.js`, → "Not set up — no reset needed"), `Step6Review` (summary + ack card), and `Step7Confirmation`.
- **Charge caveat on the Review acks** — the Step 6 device-prep ack subtitles carry an amber (`text-warn`) warning that a device arriving still locked may be delayed and charged a fee, on **both** the factory-reset ack and this never-set-up ack (the latter's neutral "no account is linked…" lead-in was dropped, leaving only the amber line). The seeded unlink/passcode ack stays neutral. Mirrors the Step 3 `Callout` (§4).

## Mocked vs production

The mapping and all five guide variants are real and exercised through the live `Raise a claim` → Step 3 path; pick any delivered order whose category resolves to the variant you want to see. The Windows `Laptop` fallback to the iPhone guide is a known gap (no Windows guide built). Device mockups in `resetGuideMocks.jsx` are CSS-art placeholders of the real OS screens.

In **journey mode** (`?journey=`), `JourneyDevPanel`'s **Reset guide** chip row (`src/components/ResetGuidePicker.jsx`) opens any variant at its intro directly — running the same `deviceTypeForCategory` resolution (Tablet → Apple/Android chooser, Laptop → iPhone fallback), so the guides are previewable without walking the claim flow.

## See also

- **Returns flow** mechanics (steps, reducer, soft validation): `docs/output/returns/change_of_mind.md`, `issue.md`.
- **Reset-failed takeover** (QC hits Activation Lock post-pickup → `ResetFailedCard`): `docs/output/returns/claim_tracking.md` §3.4.
