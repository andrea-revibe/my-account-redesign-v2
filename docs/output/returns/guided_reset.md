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

| # | Guide (`id`) | Variants | Modes | Brand/model handled by |
|---|---|---|---|---|
| G1 | iPhone & iPad (`apple_mobile`) | `iphone`, `ipad` | Return · Repair | `{noun}` wording; iOS-version notes |
| G2 | Android (`android`) | `samsung_phone`, `samsung_tablet`, `other_android` | Return · Repair | Samsung-only steps via `when.variant` |
| G3 | Windows laptop (`windows`) | `dell`, `ideapad`, `thinkpad`, `hp`, `acer`, `surface` | Return · Repair | one BIOS-key line per brand (`guide.bios`) |
| G4 | MacBook (`mac`) | `macbook` | Return · Repair | intro chip question (`branch.chip`: Apple silicon / Intel+T2 / Intel 2012–17) |
| G5 | Apple Watch (`watch`) | `apple_watch` | single | — |
| G6 | AirPods (`airpods`) | `airpods`, `airpods_max` | single | Max reset step via variant |
| G7 | PlayStation (`playstation`) | `ps5`, `ps4`, `ps3` | Return · Repair | per-console steps via variant |
| — | No reset (`no_reset`) | accessory / audio / controller | single | packing note only |

**Content as data.** Each guide is one file in `src/data/resetGuides/*`. The barrel `index.js` exports `RESET_GUIDES` / `RESET_GUIDE_BY_ID`. Account recovery and "if nothing works" are shared in `recovery.js` (`ACCOUNT_RECOVERY`, `NEVER_ASK`). Step shape: `{ id, modes?, when?: { variant | chip }, title, body, path?, notes?: [{ when, text }], mock?, frame?, revibe?, bios?, passcode?, trouble? }`. `{noun}` / `{is}` are filled from the variant. Step order is array order after filtering, so a step shared by both modes sits where *both* sequences want it.

## 2. Mode from claim type

`modeForClaimType` (`lib/resetGuides.js`):

- `change_of_mind` / `issue` → **Return**: remove every account, then factory reset. Ends at the setup screen.
- `warranty` (incl. Care accidental) → **Repair**: lift the account lock and turn the screen lock off. By default the data stays, and no account password is shared (see §2.1).
- `compensation` → no guide.

Single-mode guides (`modes: ['single']`, G5/G6/no-reset) ignore the mode. `stepsFor(guide, mode, { variant, chip, data })` does all the filtering. An unanswered Mac chip counts as the majority Intel 2012–17 path, so step counts are stable before the question is answered.

### 2.1 Repair data choice

Guides with `privacy: true` (G1 iPhone/iPad, G2 Android, G3 Windows, G4 Mac) ask on the Repair intro **What should happen to your data?**:

- **Keep it on the device** — preselected, recommended; runs the steps tagged `when: { data: ['keep'] }` (today's Repair path, incl. the Mac/Windows passcode step).
- **Protect it first** — `privacyFor(guide, variant)` says how. `'erase'` (default) reuses the Return erase steps, which carry `modes: ['return', 'repair']` + `when: { data: ['private'] }`; the passcode step drops out. Samsung variants set `privacy: 'maintenance'` instead: remove accounts → **Maintenance mode** (hides the data in a separate profile, nothing erased).

`data` only filters in Repair mode, so Return is untouched. Erase is gated on an inline back-up checkbox (Start never disabled; unticked → error). While erasing, *I can't use my device* runs in Return mode so it offers erase fixes, not "don't erase". The sheet reports `dataChoice` (`'keep' | 'erase' | 'maintenance'`, null without a choice) in `onDone`; it lands on `devicePrep.dataChoice` and drives the Done, Review (`devicePrepText`) and Confirmation copy. PlayStation (Sony resets repaired consoles anyway) and the single-mode guides offer no choice. **Held for ops:** a warning that software faults may not reproduce after erasing ("no fault found"), and whether repair partners accept erased devices.

## 3. Mapping an order line — `resetGuideForOrder(order)` (`lib/devices.js`)

Catalogue `category_name` first, then `product.name` (title). Returns `{ guideId, variant, needsChooser }`.

| Category | Rule |
|---|---|
| `iPhone` | G1 `iphone` |
| `Macbook` | G4 |
| `Tablet` | title starts "iPad" → G1 `ipad`; "Samsung"/"Galaxy" → G2 `samsung_tablet`; any other title → G2 `other_android`; **no title** → G1 `ipad` + `needsChooser` |
| `Samsung phone` | G2 `samsung_phone` |
| `Smartphone` / Android | G2, Samsung by title else `other_android` |
| `Laptop` | G3, brand from the title (ThinkPad / Lenovo→IdeaPad / Dell / HP / Acer / Surface; default Dell) |
| `Watch` | title "Apple…" → G5, else no-reset |
| `Audio` | "AirPods Max" / "AirPods" → G6, else no-reset |
| `Gaming` | PS3–PS5 / PlayStation 3–5 and not a controller → G7, else no-reset |
| anything else | no-reset |
| *(no category)* | legacy `deviceOs` fallback: android → G2 Samsung phone, else G1 iPhone |

Care+ lines never reach the mapper: a Care+ claim carries its covered device's product. Production should key this on a controlled `reset_guide` catalogue column, and these rules are its migration seed. The older `osForCategory` / `deviceTypeFor*` exports stay because `issueTaxonomy.js` reads the OS.

## 4. The engine — `ResetGuideSheet.jsx`

One renderer for every guide. Props: `{ guideId, mode, facts: { variant, chip? }, initialView, skipDone, onDone, onClose }`.

1. **Intro** — device art (`GuideIntroArt`: the legacy CSS-art device where one exists, else an icon coin), a mode-aware title, step count, and the G4 chip question. Start is never disabled: an unanswered chip lights an inline error.
2. **Steps** — one per screen. The screen art is, in order:
   - a **hand-drawn CSS-art mock** when `step.mock` resolves through the `MOCKS` registry (`resetGuideMocks.jsx`): iOS / iPadOS Return + Repair (Wallet, Find My switch, Passcode off), One UI Return + Repair (Swipe screen lock), macOS sign-out / erase / setup, and Windows' region setup screen;
   - otherwise a **`PathScreen`** built from `step.path` in the variant's own OS (`variant.os`: `ios` / `ipados` / `android` / `android_tablet` / `macos` / `windows` / `playstation`; `frame: 'phone'` steps on Watch / AirPods run on the iPhone, `frame: 'browser'` draws a browser in the laptop). The screen title is the second-to-last segment, the last segment is the glowing row (`Off` becomes a switch), and neutral skeleton rows stand in for the rest so no menu labels are invented;
   - otherwise (no path — a physical action: BIOS key, NVRAM, pairing screen, AirPods reset, console restart, packing) a **`StepIllustration`** card (`resetGuideFrames.jsx`), pending the product-photo review.

   **One frame per platform, never shared across brands:** iPhone (Dynamic Island, `9:41`), Android phone (dark body, punch-hole, `12:45` + battery %), iPad (light bezel), Android tablet (dark, squarer), MacBook (silver deck), Windows laptop (dark deck + taskbar), TV for PlayStation. The OS travels by context (`OsContext`), so shared pieces — status bar, toggle colour — follow the frame. Every drawn screen shows the path caption under the title.

   Notes render as "**when:** text" chips, and `revibe` steps get a *Revibe check* tag. The BIOS row shows only the active brand's line. Carousel mocks (`.screens`) still walk screen by screen.
3. **Done** — mode-aware copy (Return: "at the setup screen"; Repair: "ready for repair", or "erased and ready for repair" / Maintenance mode per §2.1; single: "ready to send").
4. **I can't use my device** — a link on the intro and every step. It is symptom-first and never sends the customer to another section:
   - **Picker** — *What's stopping you?* lists `cantUse.symptoms` (filtered by mode + variant via `symptomsFor`): typically the lock / passcode, a broken or dead device, can't sign in to the account, and already sent to Revibe.
   - **Questions** — a node with `ask` + `options` (e.g. *changed the passcode in the last 3 days?*, *which iPhone?*, *PIN or password?*) routes to the one fix that applies.
   - **Fix** — a node with numbered `steps` (`text`, optional `path` rendered as tap chips, `note`, and a `help` link that jumps to another node such as account recovery). `then` appends another fix's steps with continuous numbering (e.g. computer restore → Find My removal), so a fix is always self-contained. A `lead` labels the join.
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

`flowReducer` seeds `devicePrep.{ guideId, variant }` from the mapping. When the guide finishes, `devicePrep` also gets `mode`, `guideVia` and `passcodeProvided`.

- **Copy is mode-aware**: heading ("…for return" / "…for repair"), the warn `Callout`, the launcher label (*Start the guided reset* / *Start the repair prep guide*) and the confirm-gate wording. The backup `SafetyNote` shows in Return mode only (Repair keeps the data).
- **Launcher step count** comes from `stepsFor`.
- **`TabletPicker`** shows only when `needsChooser` (a Tablet with no title). Switching resets `resetGuideSeen` / `resetConfirmed` / `passcodeProvided`.
- **No-reset items** render a single `NoResetCard` instead of the launcher + gate, and `stepError` passes (`dp.guideId === 'no_reset'`).
- **Unchanged:** the confirm gate stays locked until `resetGuideSeen`, soft validation (`resetGuide` → `resetConfirm`), the `ResetOffRamps` disclosure (now *Can't run the guide?*) and the change-of-mind never-set-up skip.
- **Downstream**: `devicePrepText` (`lib/claims.js`), `Step6Review` (summary + ack) and `Step7Confirmation` distinguish no-reset, `cant_use`, Repair (+ "passcode shared securely") and Return.

## 7. Dev sandbox — `?journey=guided_reset`

`kind: 'reset_sandbox'`, `nodes: []`. `useResetGuideSandbox` (`lib/resetGuideSandbox.js`) owns guide / variant / mode / open-at. It also synthesises a delivered order carrying the variant's catalogue `category` + `title`, so **I need help with this device** on the card behind reaches the same guide through the real Step 3. `ResetGuidePanel` offers:

- guide chips (with claim share) and device chips;
- a Return/Repair toggle (labelled single-mode where relevant);
- open-at chips: Start / Can't use › picker / › sent / Account recovery;
- **Open guide**;
- a debug strip that re-runs `resetGuideForOrder` on the synthesised order (✓ maps back / ✗ mismatch), plus mode · step count · passcode kind and the last finish result.

It replaced the old `ResetGuidePicker` chip row in `JourneyDevPanel`.

## Mocked vs production

The content is transcribed from the vendor-checked doc but has **not been run on real devices**. QA in EN and AR is still a launch requirement. Path-driven screens and mocks are illustrations, not OS screenshots; physical steps still use a placeholder card. Not built: Arabic/RTL + the device-language toggle, the shared opening steps, "Before you start" notes, saving progress on the claim, the post-submit placement + pickup gate, analytics events, and passcode storage/encryption (the field only reports `passcodeProvided`).

## See also

- Returns flow mechanics: `docs/output/returns/change_of_mind.md`, `issue.md`.
- Reset-failed takeover (`ResetFailedCard`): `docs/output/returns/claim_tracking.md` §3.4.
