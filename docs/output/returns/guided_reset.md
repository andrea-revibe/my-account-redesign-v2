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
  - src/components/ClaimFlow/PasscodeField.jsx
  - src/components/ClaimFlow/flowReducer.js
  - src/components/ResetGuidePanel.jsx
---

# Guided reset (device prep)

Step 3 of every device claim flow (`change_of_mind` / `issue` / `warranty`; `compensation` skips it). Before pickup, the customer runs a guide that removes the device's **account lock**: Apple Find My, Google + Samsung, Microsoft, or PlayStation primary console. Source of truth for the content is the doc *Guided resets for returns and warranties*. This prototype implements its guides, modes, mapping, "I can't use my device" branch and Repair-mode passcode field. It keeps the guide at Step 3 (no post-submit move, no pickup gate) and leaves out Arabic/RTL, the shared opening steps and the per-guide "Before you start" notes.

## 1. Seven guides + no-reset, grouped by lock system

Guides are grouped by what locks the device, not by brand. Brand and model differences are a variant, a branch question or a one-line note inside the guide.

**What the customer must do vs. what Revibe does.** Revibe erases every returned device on arrival, so a guide only *requires* what Revibe can't undo: removing the account lock (sign-out / account removal). Erasing protects the customer's privacy and stays in the guides where it needs no key combinations; on Mac it is optional (Erase All Content and Settings, skipped where macOS doesn't offer it). No guide uses keyboard shortcuts or hardware-button sequences (no Recovery / Command-R, NVRAM, BIOS keys, Shift-restart, recovery-mode restore). A firmware/BIOS password — rare, and only the owner or the manufacturer can clear it — is a one-line "tell us" fold-out on the last Mac/Windows step, not a step.

| # | Guide (`id`) | Variants | Modes | Brand/model handled by |
|---|---|---|---|---|
| G1 | iPhone & iPad (`apple_mobile`) | `iphone`, `ipad` | Return · Repair | `{noun}` wording; iOS-version notes |
| G2 | Android (`android`) | `samsung_phone`, `other_android` | Return · Repair | Samsung-only steps via `when.variant` |
| G3 | Windows laptop (`windows`) | `laptop` (brand-neutral) | Return · Repair | no BIOS step — a startup-password fold-out on the last step |
| G4 | MacBook (`mac`) | `macbook` | Return · Repair | no chip question — sign-out is the must-do; erase is optional (Return) |
| G5 | Apple Watch (`watch`) | `apple_watch` | single | — |
| G6 | AirPods (`airpods`) | `airpods`, `airpods_max` | single | Max reset step via variant |
| G7 | PlayStation (`playstation`) | `ps5`, `ps4`, `ps3` | Return · Repair | per-console steps via variant |
| — | No reset (`no_reset`) | accessory / audio / controller | single | packing note only |

**Content as data.** Each guide is one file in `src/data/resetGuides/*`. The barrel `index.js` exports `RESET_GUIDES` / `RESET_GUIDE_BY_ID`. Account recovery and "if nothing works" are shared in `recovery.js` (`ACCOUNT_RECOVERY`, `NEVER_ASK`). Step shape: `{ id, modes?, when?: { variant | data }, title, body, path?, notes?: [{ when, text }], mock?, frame?, revibe?, passcode?, trouble? }`. `{noun}` / `{is}` are filled from the variant. Step order is array order after filtering, so a step shared by both modes sits where *both* sequences want it.

## 2. Mode from claim type

`modeForClaimType` (`lib/resetGuides.js`):

- `change_of_mind` / `issue` → **Return**: remove every account, then factory reset. Ends at the setup screen.
- `warranty` (incl. Care accidental) → **Repair**: lift the account lock and turn the screen lock off. By default the data stays, and no account password is shared (see §2.1).
- `compensation` → no guide.

Single-mode guides (`modes: ['single']`, G5/G6/no-reset) ignore the mode. `stepsFor(guide, mode, { variant, data })` does all the filtering.

### 2.1 Repair data choice

Guides with `privacy: true` (G1 iPhone/iPad, G2 Android, G3 Windows, G4 Mac) ask on the Repair intro **What should happen to your data?**:

- **Keep it on the device** — preselected, recommended; runs the steps tagged `when: { data: ['keep'] }` (today's Repair path, incl. the Mac/Windows passcode step).
- **Protect it first** — `privacyFor(guide, variant)` says how. `'erase'` (default) reuses the Return erase steps, which carry `modes: ['return', 'repair']` + `when: { data: ['private'] }` (Mac has its own `repair_erase`, since its Return erase is optional — where macOS lacks Erase All Content and Settings, a note sends the customer back to Keep); the passcode step drops out. Samsung variants set `privacy: 'maintenance'` instead: remove accounts → **Maintenance mode** (hides the data in a separate profile, nothing erased).

`data` only filters in Repair mode, so Return is untouched. Erase is gated on an inline back-up checkbox (Start never disabled; unticked → error). While erasing, *I can't use my device* runs in Return mode so it offers erase fixes, not "don't erase". The sheet reports `dataChoice` (`'keep' | 'erase' | 'maintenance'`, null without a choice) in `onDone`; it lands on `devicePrep.dataChoice` and drives the Done, Review (`devicePrepText`) and Confirmation copy. PlayStation (Sony resets repaired consoles anyway) and the single-mode guides offer no choice. **Held for ops:** a warning that software faults may not reproduce after erasing ("no fault found"), and whether repair partners accept erased devices.

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

1. **Intro** — device art (`GuideIntroArt`: the legacy CSS-art device where one exists, else an icon coin), a mode-aware title, step count, and (Repair, where offered) the data choice. Start is never disabled: an unticked backup box lights an inline error.
2. **Steps** — one per screen. The screen art is, in order:
   - a **hand-drawn CSS-art mock** when `step.mock` resolves through the `MOCKS` registry (`resetGuideMocks.jsx`): iOS / iPadOS Return + Repair (Wallet, Find My switch, Passcode off), One UI Return + Repair (Swipe screen lock), macOS sign-out / erase / setup, and Windows' region setup screen;
   - otherwise a **`PathScreen`** built from `step.path` in the variant's own OS (`variant.os`: `ios` / `ipados` / `android` / `macos` / `windows` / `playstation`; `frame: 'phone'` steps on Watch / AirPods run on the iPhone, `frame: 'browser'` draws a browser in the laptop). The screen title is the second-to-last segment, the last segment is the glowing row (`Off` becomes a switch), and neutral skeleton rows stand in for the rest so no menu labels are invented;
   - otherwise (no path — a physical action: pairing screen, AirPods reset, console restart, packing) a **`StepIllustration`** card (`resetGuideFrames.jsx`), pending the product-photo review.

   **One frame per platform, never shared across brands:** iPhone (Dynamic Island, `9:41`), Android phone (dark body, punch-hole, `12:45` + battery %), iPad (light bezel), MacBook (silver deck), Windows laptop (dark deck + taskbar), TV for PlayStation. The OS travels by context (`OsContext`), so shared pieces — status bar, toggle colour — follow the frame. Every drawn screen shows the path caption under the title.

   Notes render as "**when:** text" chips, and `revibe` steps get a *Revibe check* tag. Carousel mocks (`.screens`) still walk screen by screen.
3. **Done** — mode-aware copy (Return: "at the setup screen"; Repair: "ready for repair", or "erased and ready for repair" / Maintenance mode per §2.1; single: "ready to send").
4. **I can't use my device** — a link on the intro and every step. It is symptom-first and never sends the customer to another section:
   - **Picker** — *What's stopping you?* lists `cantUse.symptoms` (filtered by mode + variant via `symptomsFor`): typically the lock / passcode, a broken or dead device, can't sign in to the account, and already sent to Revibe.
   - **Questions** — a node with `ask` + `options` (e.g. *changed the passcode in the last 3 days?*, *which iPhone?*, *PIN or password?*) routes to the one fix that applies.
   - **Fix** — a node with numbered `steps` (`text`, optional `path` rendered as tap chips, `note`, and a `help` link that jumps to another node such as account recovery). `then` appends another fix's steps with continuous numbering (e.g. Windows "send it as it is" → Microsoft account removal), so a fix is always self-contained. A `lead` labels the join.
   - Any node field can be per-mode (`{ return, repair }`); steps and options filter by `modes` / `when: { variant }`. `resolveNode` (`lib/resetGuides.js`) does all of it, so the sheet only renders.
   - **Account recovery** is shared: `RECOVERY_NODES` in `data/resetGuides/recovery.js` (`account_apple` / `_google` / `_samsung` / `_microsoft` / `_playstation`), reached from the account symptom or any step's `help` link.

   Fix screens end with an *If nothing works* fold-out (each `account`'s `nothingWorks` + continue anyway). **Continue with this** finishes via `via: 'cant_use'`, which counts as done (the doc's gate rule). A `resume` node (the problem is solved: old passcode, recovered password) shows **Back to the guide** instead.

`onDone({ via: 'guide' | 'cant_use', passcodeProvided })`. `initialView` opens the branch directly: `'with_you'` at the picker, `'sent'` / `'recovery'` at that symptom's node (`cantUseEntry`); Back from there closes the sheet. `ResetFailedCard` uses `initialView="sent"` + `skipDone`, because the device is already at Revibe.

## 5. Repair-mode passcode field — `PasscodeField.jsx`

Only on steps carrying `passcode`, and only in Repair mode:

- G3 `windows_pin`: a temporary Windows Hello PIN, at least 4 characters.
- G4 `mac_login`: the login or a temporary admin password.

It is optional (a fallback) and masked, with show/hide. `passcodeError` rejects anything containing `@` (an account email must never land here) and blocks "next" on that screen until it's fixed or cleared. Beside it: the storage line and the fixed `NEVER_ASK` copy. Never offered for Apple mobile (Apple advises against sharing) or Android (Samsung says turn the lock off). Only the boolean `passcodeProvided` leaves the sheet — the value is never stored on the claim in this prototype.

## 6. The Step 3 surface — `Step3DevicePrep.jsx`

`flowReducer` seeds `devicePrep.{ device, guideId, variant }` from the mapping (null when the customer must pick). When the guide finishes, `devicePrep` also gets `mode`, `guideVia` and `passcodeProvided`.

- **Copy is mode-aware**: heading ("…for return" / "…for repair"), the warn `Callout`, the launcher label (*Start the guided reset* / *Start the repair prep guide*) and the confirm-gate wording. The backup `SafetyNote` shows in Return mode only (Repair keeps the data).
- **Launcher step count** comes from `stepsFor`.
- **`DevicePicker`** (`ClaimFlow/DevicePicker.jsx`) shows the category's question when `needsChooser`, also above the `NoResetCard`, with a *From your order* tag on the title's guess. Switching resets `resetGuideSeen` / `resetConfirmed` / `passcodeProvided` / `dataChoice`. Unpicked: the launcher reads *A few simple steps* and tapping it, or Continue (`stepError` → `devicePick`), lights the picker error.
- **No-reset items** render a single `NoResetCard` instead of the launcher + gate, and `stepError` passes (`dp.guideId === 'no_reset'`).
- **Unchanged:** the confirm gate stays locked until `resetGuideSeen`, soft validation (`resetGuide` → `resetConfirm`), the `ResetOffRamps` disclosure (now *Can't run the guide?*) and the change-of-mind never-set-up skip.
- **Downstream**: `devicePrepText` (`lib/claims.js`), `Step6Review` (summary + ack) and `Step7Confirmation` distinguish no-reset, `cant_use`, Repair (+ "passcode shared securely") and Return.

## 7. Dev sandbox — `?journey=guided_reset`

`kind: 'reset_sandbox'`, `nodes: []`. `useResetGuideSandbox` (`lib/resetGuideSandbox.js`) owns product category / device / title-guess / mode / open-at. It also synthesises a delivered order carrying the category name + the device's sample title (or `Unknown model` with title-guess off), so **I need help with this device** on the card behind reaches the same guide through the real Step 3. `ResetGuidePanel` offers:

- **product category** chips (`product_categories` name + id), then the **customer is asked** chips for the device (when the category spans guides) and a *Pre-select from title* toggle (off by default, so the sandbox opens on the unmatched-title case; *Route by title* for a `byTitle` category, whose chips read "Routed by title · no question" on a match), then the derived guide (read-only);
- a Return/Repair toggle (labelled single-mode where relevant);
- open-at chips: Start / Can't use › picker / › sent / Account recovery;
- **Open guide** — shows the customer's `DevicePicker` first when the category asks, then the guide;
- a debug strip that re-runs `resetGuideForOrder` on the synthesised order (what it asks / pre-selects, or the guide it maps to), plus mode · step count · passcode kind and the last finish result.

It replaced the old `ResetGuidePicker` chip row in `JourneyDevPanel`.

## Mocked vs production

The content is transcribed from the vendor-checked doc but has **not been run on real devices**. QA in EN and AR is still a launch requirement. Path-driven screens and mocks are illustrations, not OS screenshots; physical steps still use a placeholder card. Not built: Arabic/RTL + the device-language toggle, the shared opening steps, "Before you start" notes, saving progress on the claim, the post-submit placement + pickup gate, analytics events, and passcode storage/encryption (the field only reports `passcodeProvided`).

## See also

- Returns flow mechanics: `docs/output/returns/change_of_mind.md`, `issue.md`.
- Reset-failed takeover (`ResetFailedCard`): `docs/output/returns/claim_tracking.md` §3.4.
