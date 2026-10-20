---
status: live
verified_against: e8888d6
covers:
  - src/lib/devices.js
  - src/lib/resetGuides.js
  - src/lib/resetGuideSandbox.js
  - src/data/resetGuides
  - src/components/ClaimFlow/Step3DevicePrep.jsx
  - src/components/ClaimFlow/ResetGuideSheet.jsx
  - src/components/ClaimFlow/resetGuideFrames.jsx
  - src/components/ClaimFlow/resetGuideMocks.jsx
  - src/components/ClaimFlow/resetGuideAnim.js
  - src/components/ClaimCard.jsx
  - src/components/ClaimFlow/flowReducer.js
  - src/components/ResetGuidePanel.jsx
---

# Guided reset (device prep)

Step 3 of every device claim flow (`change_of_mind` / `issue` / `warranty`; `compensation` skips it). Before pickup, the customer runs a guide that removes the device's **account lock**: Apple Find My, Google + Samsung, Microsoft, or PlayStation primary console. Source of truth for the content is the doc *Guided resets for returns and warranties*. This prototype implements its guides (tightened to one strict standard for every claim type, §1), mapping and "I can't use my device" branch with remote unlink. The guide runs at Step 3, with a post-submit remote-unlink link on `ClaimCard` (§5); no pickup gate and leaves out Arabic/RTL, the shared opening steps and the per-guide "Before you start" notes.

## 1. Seven guides + no-reset, grouped by lock system

Guides are grouped by what locks the device, not by brand. Brand and model differences are a variant, a branch question or a one-line note inside the guide.

**One strict standard for every claim type** (ops rules, 2026-10). Return and warranty run the same steps; the only difference is copy (a warranty customer gets the device back, so the backup step leans harder). For every device the guide covers, in order: **back up** (the data is the customer's responsibility) → **theft protection off** (Stolen Device Protection / Samsung Theft protection) → **every account signed out / removed** → **screen lock + biometrics off** → **a check that Settings shows no name, photo or email** → **erase**. Erasing is the customer's choice on phones, tablets and consoles (`erase: 'optional'`); laptops are always erased (`erase: 'required'`), because a Mac or Windows laptop can't be handed over without a password and Revibe never takes one. No guide uses keyboard shortcuts or hardware-button sequences (no Recovery / Command-R, NVRAM, BIOS keys, Shift-restart, recovery-mode restore); a Mac that can't erase from Settings skips that step and is sent signed out. A firmware/BIOS password — rare, and only the owner or the manufacturer can clear it — is a one-line "tell us" fold-out on the last Mac/Windows step, not a step. No passcode is ever shared in the guide.

| # | Guide (`id`) | Variants | Erase | Brand/model handled by |
|---|---|---|---|---|
| G1 | iPhone & iPad (`apple_mobile`) | `iphone`, `ipad` | optional | `{noun}` wording; iOS-version notes |
| G2 | Android (`android`) | `samsung_phone`, `other_android` | optional | Samsung-only steps via `when.variant` |
| G3 | Windows laptop (`windows`) | `laptop` (brand-neutral) | required | no BIOS step — a startup-password fold-out on the last step |
| G4 | MacBook (`mac`) | `macbook` | required | older Macs without Erase All Content and Settings skip the erase (we erase on arrival) |
| G5 | Apple Watch (`watch`) | `apple_watch` | — (unpair erases) | — |
| G6 | AirPods (`airpods`) | `airpods`, `airpods_max` | — | Max reset step via variant |
| G7 | PlayStation (`playstation`) | `ps5`, `ps4`, `ps3` | optional | per-console steps via variant |
| — | No reset (`no_reset`) | accessory / audio / controller | — | packing note only |

**Content as data.** Each guide is one file in `src/data/resetGuides/*`. The barrel `index.js` exports `RESET_GUIDES` / `RESET_GUIDE_BY_ID`. Account recovery and "if nothing works" are shared in `recovery.js` (`ACCOUNT_RECOVERY`, `RECOVERY_NODES`, `NEVER_ASK`); the Apple remote carousel in `remote.js`. Step shape: `{ id, erase?, when?: { variant }, title, body, path?, notes?: [{ when, text }], mock?, frame?, revibe?, trouble? }` — `title` / `body` may be per-mode copy (`{ return, repair }`), `erase: true` marks a step of the optional-erase tail. `{noun}` / `{is}` are filled from the variant. Step order is array order after filtering.

## 2. Claim type → copy only

`modeForClaimType` (`lib/resetGuides.js`): `change_of_mind` / `issue` → `'return'`, `warranty` (incl. Care accidental) → `'repair'`, `compensation` → no guide. The mode never filters steps; it only picks per-mode copy (`pick(field, mode)`), today the backup step's warning.

### 2.1 Optional erase

`stepsFor(guide, mode, { variant, erase })` returns the must-do steps; for an `erase: 'optional'` guide it then appends the `ERASE_CHOICE` pseudo-step and, when `erase` is true, the `erase: true` steps. The choice screen (**Erase it — optional**) offers *Send it as it is* or *Erase the {noun} first*. Continue is never disabled: no pick → *Choose one to continue*; erase without the "I've backed up what I need, and I'm responsible for my data" tick → inline error. *Send it as it is* finishes the guide. The sheet reports `erased` (`true` / `false`, `null` for a fix route or a guide with no erase) in `onDone`; it lands on `devicePrep.erased` and drives Done, Review (`devicePrepText`) and Confirmation copy.

This settles the earlier ops hold ("software faults may not reproduce after erasing"): the customer is told up front that the data and the choice are theirs. Samsung Maintenance mode and the warranty-only passcode field are gone.

## 3. Allocating a guide — production category + the customer's answer (`lib/devices.js`)

The guide is allocated from the order line's **production category** (`order_products.category_id` → `product_categories`, 13 rows, no subcategory). `PRODUCT_CATEGORIES` mirrors that table; each row lists the device options it can be, and each option in `DEVICE_OPTIONS` names its guide + variant. A category with one option needs no input; a category spanning several guides **asks the customer** (`DevicePicker`). The product title only **pre-selects** an answer (`guessDevice`, a positive match per option) — the customer has the final say, and with no match nothing is pre-selected. Exception: a `byTitle` category (Watch) routes on a title match with no question; the picker is only the fallback for an unmatched title (`asksCustomer`).

Options are trimmed to what prod actually sells per category (`order_products`, Oct 2025 → Oct 2026): Tablet is iPads only, Smartphone only Oppo / Huawei (no Samsung, no iPhone), Watch ~95% Apple Watch plus the Awei H25, Not found only Samsung TVs. No Samsung or other Android tablets are sold, so G2 has no tablet variant.

| `product_categories` (id) | Customer is asked | Options → guide |
|---|---|---|
| iPhone (2) | — | G1 `iphone` |
| Samsung phone (1) | — | G2 `samsung_phone` |
| Smartphone (11) | — | G2 `other_android` |
| Tablet (6) | — | G1 `ipad` |
| Macbook (5) | — | G4 |
| Laptop (4) | — | G3 `laptop` |
| Watch (8) | only if the title doesn't match (`byTitle`) | Apple Watch → G5 · Another watch (Awei, Galaxy Watch…) → no-reset |
| Audio (10) | Which headphones or speaker is it? | AirPods / Pro → G6 · AirPods Max → G6 · Other → no-reset |
| Gaming (9) | Which console is it? | PS5 / PS4 / PS3 → G7 · Controller or other console (incl. PS2) → no-reset |
| Accessories (7), TV (13) | — | no-reset |
| Not found (12), or an unknown name | — | no-reset (prod holds only TVs here) |
| Warranty (3) | — | not a device (Care+ line; a Care+ claim carries its covered device's product) |

`resetGuideForOrder(order)` returns `{ category, device, guideId, variant, needsChooser }`; with `needsChooser` and no title match, `device` / `guideId` / `variant` are `null` until the customer picks. Orders with no category fall back on legacy `deviceOs` (android → Samsung phone, else iPhone). `osForCategory` / `deviceOsForOrder` stay because `issueTaxonomy.js` reads the OS.

**Gaps:** a device miscategorised into Not found gets no reset guide; Xbox / Switch fall under "other console" (no guide); a Chromebook in `Laptop` would get the Windows guide. Real per-guide claim shares need a production query (the old hard-coded percentages were unsourced and are gone).

## 4. The engine — `ResetGuideSheet.jsx`

One renderer for every guide. Props: `{ guideId, mode, facts: { variant }, initialView, skipDone, onDone, onClose }`.

1. **Intro** — device art (`GuideIntroArt`: the legacy CSS-art device where one exists, else an icon coin), one title (*Prepare your {noun}*), a subline per `erase` kind, then the opening fork: **Yes, I can unlock and use it** (on-device steps, with step count) or **No — it's locked, broken or not with me** (→ the remote-unlink carousel; Back returns here). A guide without a can't-use branch shows Start instead. A *Your data is your responsibility* callout sits under it on device guides.
2. **Steps** — one per screen. The screen art is, in order:
   - a **hand-drawn CSS-art mock** when `step.mock` resolves through the `MOCKS` registry (`resetGuideMocks.jsx`): iOS / iPadOS (sign-out, Stolen Device Protection, Passcode off, the signed-out Settings check, erase, Hello), One UI (remove accounts, Swipe screen lock, empty accounts list, reset, welcome), macOS sign-out / erase / setup, and Windows' region setup screen;
   - otherwise a **`PathScreen`** built from `step.path` in the variant's own OS (`variant.os`: `ios` / `ipados` / `android` / `macos` / `windows` / `playstation`; `frame: 'phone'` steps on Watch / AirPods run on the iPhone, `frame: 'browser'` draws a browser in the laptop). The screen title is the second-to-last segment, the last segment is the glowing row (`Off` becomes a switch), and neutral skeleton rows stand in for the rest so no menu labels are invented;
   - otherwise (no path — a physical action: pairing screen, AirPods reset, console restart, packing) a **`StepIllustration`** card (`resetGuideFrames.jsx`), pending the product-photo review.

   **One frame per platform, never shared across brands:** iPhone (Dynamic Island, `9:41`), Android phone (dark body, punch-hole, `12:45` + battery %), iPad (light bezel), MacBook (silver deck), Windows laptop (dark deck + taskbar), TV for PlayStation. The OS travels by context (`OsContext`), so shared pieces — status bar, toggle colour — follow the frame. Every drawn screen shows the path caption under the title.

   Notes render as "**when:** text" chips. `revibe: true` marks the step whose result QC verifies on arrival — data only, not shown to the customer. Carousel mocks (`.screens`) still walk screen by screen.
3. **Done** — copy by outcome: erased ("erased and unlinked"), kept ("ready to send · your data stays on it"), or no erase step ("ready to send").
4. **Remote unlink** — the intro's *No* option, plus *I can't use my device* under every on-device step. No picker and no questions: one carousel per guide (`guide.remote.steps`, read through `remoteStepsFor`), in the same step layout as the on-device guide. Unlink only — erasing is a "want it wiped too" note, never a step.
   - **Apple** (iPhone, iPad, Mac, Watch, AirPods share `APPLE_REMOTE` in `data/resetGuides/remote.js`): two parallel **routes** behind an *On another iPhone | In a browser* switch at the top of the carousel (`remoteRoutesFor`; switching keeps the step position). Find My on another iPhone (drawn: device list → device card with *Remove This Device* → the Remove alert) or icloud.com/find in Safari on a laptop (sign in → the device panel → the Remove dialog). Same three steps either way. A guide's `remote` is either `{ routes: [{ id, label, steps }] }` or a plain `{ steps }`.
   - **Android**: myaccount.google.com sign-out, then (Samsung) account.samsung.com removal — the existing `GoogleRemoveRemote` / `SamsungRemoveRemote` screens. **Windows**: account.microsoft.com/devices › Remove (browser path screens). **PlayStation**: Deactivate All Devices from a browser.
   - A step's `help` link (*Can't sign in to your Apple Account?*) opens **account recovery** (`RECOVERY_NODES`, `resolveNode`); *Back to the guide* returns to the same step. The last step carries an *If nothing works* fold-out (each `account`'s `nothingWorks` + continue anyway).
   - Finishing the carousel reports `via: 'cant_use'`, which counts as done (the gate rule).

`onDone({ via: 'guide' | 'cant_use', erased })`. `initialView`: `'start'` (intro), `'remote'` (the carousel — Step 3's off-ramp, `ClaimCard`, `ResetFailedCard`), `'recovery'` (the guide's first account recovery); Back from a direct open closes the sheet. `ClaimCard` and `ResetFailedCard` pass `skipDone`.

## 5. Remote unlink after submit — `ClaimCard.jsx`

While a device claim is at `pickup` or `qc`, the expanded `ClaimCard` shows **Forgot to remove your account?** (`RemoteUnlink`). It opens the sheet on the remote-unlink carousel (guide from `claim.devicePrep`, else `resetGuideForOrder`); finishing shows a local *Thanks — noted* line. Hidden for compensation, no-reset items and guides without a remote carousel. `ResetFailedCard` stays the fallback once QC has found the lock. Prototype only: nothing is recorded on the claim.

## 6. The Step 3 surface — `Step3DevicePrep.jsx`

`flowReducer` seeds `devicePrep.{ device, guideId, variant }` from the mapping (null when the customer must pick). When the guide finishes, `devicePrep` also gets `mode`, `guideVia` and `erased`.

- **Copy is the same for every claim type** except the heading ("…for return" / "…for repair"), the warn `Callout` and the `SafetyNote` line (*Back up first — your data is your responsibility*, shown for every claim type). Launcher: *Start the device prep guide*; gate: "…unlinked from my accounts and its screen lock is off".
- **Launcher step count** comes from `stepsFor`.
- **`DevicePicker`** (`ClaimFlow/DevicePicker.jsx`) shows the category's question when `needsChooser`, also above the `NoResetCard`, with a *From your order* tag on the title's guess. Switching resets `resetGuideSeen` / `resetConfirmed` / `erased`. Unpicked: the launcher reads *A few simple steps* and tapping it, or Continue (`stepError` → `devicePick`), lights the picker error.
- **No-reset items** render a single `NoResetCard` instead of the launcher + gate, and `stepError` passes (`dp.guideId === 'no_reset'`).
- **Unchanged:** the confirm gate stays locked until `resetGuideSeen`, soft validation (`resetGuide` → `resetConfirm`), the `ResetOffRamps` disclosure (*Can't run the guide?*) and the change-of-mind never-set-up skip. Its *Broken, locked, or not with you?* row is a button that opens the sheet straight on the remote-unlink carousel (`initialView='remote'`).
- **Downstream**: `devicePrepText` (`lib/claims.js`), `Step6Review` (summary + ack) and `Step7Confirmation` distinguish no-reset, `cant_use`, erased ("Unlinked and erased") and not erased ("Unlinked · locks off").

## 7. Dev sandbox — `?journey=guided_reset`

`kind: 'reset_sandbox'`, `nodes: []`. `useResetGuideSandbox` (`lib/resetGuideSandbox.js`) owns product category / device / title-guess / mode / open-at. It also synthesises a delivered order carrying the category name + the device's sample title (or `Unknown model` with title-guess off), so **I need help with this device** on the card behind reaches the same guide through the real Step 3. `ResetGuidePanel` offers:

- **product category** chips (`product_categories` name + id), then the **customer is asked** chips for the device (when the category spans guides) and a *Pre-select from title* toggle (off by default, so the sandbox opens on the unmatched-title case; *Route by title* for a `byTitle` category, whose chips read "Routed by title · no question" on a match), then the derived guide (read-only);
- a claim-type toggle (Return / Warranty — copy only, same steps);
- open-at chips: Start / Remote unlink / Account recovery;
- **Open guide** — shows the customer's `DevicePicker` first when the category asks, then the guide;
- a debug strip that re-runs `resetGuideForOrder` on the synthesised order (what it asks / pre-selects, or the guide it maps to), plus mode · step count · erase kind and the last finish result (via · erased).

It replaced the old `ResetGuidePicker` chip row in `JourneyDevPanel`.

## Mocked vs production

The content is transcribed from the vendor-checked doc but has **not been run on real devices**. QA in EN and AR is still a launch requirement. Path-driven screens and mocks are illustrations, not OS screenshots; physical steps still use a placeholder card. Not built: Arabic/RTL + the device-language toggle, the shared opening steps, "Before you start" notes, saving progress on the claim, the pickup gate, analytics events, and recording a post-submit remote unlink on the claim. Samsung's account.samsung.com sign-out path and the One UI Theft protection menu path are unverified on devices.

## See also

- Returns flow mechanics: `docs/output/returns/change_of_mind.md`, `issue.md`.
- Reset-failed takeover (`ResetFailedCard`): `docs/output/returns/claim_tracking.md` §3.4.
