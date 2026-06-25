# Issue Evidence Block — Context for a Design Agent

**Audience.** You are a design agent (Claude Design) about to **redesign the evidence area** of one step in the Revibe My-Account → Orders prototype: the *"Tell us what went wrong"* step of the **raise-an-issue claim flow** (`Step2IssueDetails.jsx`). You have **zero prior context** on this codebase. This doc is your self-contained brief: what the evidence area is today, why it has become hard to scan, the exact files/lines, the per-issue data that drives it, the visual primitives + tokens you build *from*, the decisions already settled with the user, the one genuinely open decision, and the hand-back boundary.

**What this doc is.** A map + a contract. It names real files, lines, data shapes, existing components, and tokens, so you can design *and* spec without a fan-out search.

**What this doc isn't.** A solution. The layout, hierarchy, and disclosure pattern are **yours to design**. This doc fixes the *inputs* (what exists, what data drives it, the locked behaviour) and the *problem*, not the output.

> **One hard rule up front (from the user): reference only what already exists in the repo. Do not invent untested token values, hex codes, or animation CSS and present them as established facts.** Where you need something new, design it explicitly *as net-new*, derive it from the existing primitives named in §6, and flag it as new — don't smuggle an unverified value in as if it were a repo token.

---

## 0. The 10-second picture

The step `Step2IssueDetails.jsx` ("Tell us what went wrong") collects three things: **what's the issue** (a two-scope picker), **a description** (free text), and **proof** (the evidence area). You are redesigning the **proof / evidence area only** — the part below the description — and turning it into **one reusable component that works for every issue**.

```
STEP: "Tell us what went wrong"          ← Step2IssueDetails.jsx

  ┌ What's the issue? ─────────────┐      ← picker  (NOT yours — settled)
  │ ▸ Device not working           │
  │ ▸ I received the wrong device  │
  │   (battery → a Battery check    │      ← BatteryHealthCheck (NOT yours)
  │    tool appears here)           │
  └────────────────────────────────┘
  ┌ Describe the issue ────────────┐      ← textarea (NOT yours — settled)
  │ [ … ]                  0/500   │
  └────────────────────────────────┘

  ╔ THE EVIDENCE AREA — what you redesign ═══════════════╗
  ║ Photo or video of the issue                          ║  SectionLabel
  ║ ┌ What we need ───────────────────────────────────┐  ║  ← ProofGuidance
  ║ │ ✓ <per-issue ask, e.g. "A screenshot of …">     │  ║    (per-issue, data-driven)
  ║ │   Examples from approved claims                  │  ║  ← worked examples
  ║ │   [📷][📷] caption …                              │  ║    (battery only today)
  ║ │   → How to provide valid proof                   │  ║  ← external link
  ║ └──────────────────────────────────────────────────┘  ║
  ║ [⬆ Add a photo or video]  (single fake file)         ║  ← uploader (stub)
  ║ ⚠ Required — claims without proof are often rejected ║  ← warn banner
  ║                                                      ║
  ║ MINIMUM REQUIRED PROOF                               ║  ← MinimumRequiredProof
  ║ [📷] Screen — front, no cracks                       ║    (universal: same 4
  ║ [📷] Back & camera — undamaged                       ║     items for every issue)
  ║ [📷] Accessories — all included                      ║
  ║ [📷] Packed safely                                   ║
  ╚══════════════════════════════════════════════════════╝
```

The ASCII is **illustrative, not prescriptive**. What's fixed is the *content* the area must carry (per-issue ask + optional worked examples + a universal minimum-required checklist + the upload affordance + the "required" reinforcement); the *arrangement* is your design.

Your job: collapse this evidence area into **one reusable component** that renders well for **all 19 issue subtypes** — and is more scannable and more polished than today.

---

## 1. Your remit — design only

**You are responsible for the design, not the implementation.** You produce a visual direction + a spec (`docs/handoff/issue-evidence/design.md`) and **may** build **one** throwaway 430px mock. A separate engineering pass builds the component, wires it into `Step2IssueDetails.jsx`, and (if your spec proposes it) extends the per-issue data shape. Do **not** build the production component, refactor the step, edit `issueSubtypes.js` / `flowReducer.js` / `lib/` / `data/`, edit `docs/output/*`, run codemap, or touch `CHANGELOG.md` / `CLAUDE.md`. Your job ends at a spec the implementer can build from.

### The goals — the success criteria the user picked (in priority order)

1. **Less overwhelming / scannable.** The evidence area has grown long — a per-issue ask, worked examples, a 4-item universal checklist, an uploader, and a warn banner all stack vertically. For a non-battery issue that's already a lot of scrolling before the customer can act. Reduce cognitive load; make it scannable at a glance.
2. **Higher-quality proof.** The whole point of the area is that customers submit **valid, complete** proof the first time — fewer rejected/delayed claims. Whatever you design must make "what counts as good proof" *unmissable*, not buried.
3. **Visual polish.** Bring the area fully up to the design-system standard (§6 tokens, spacing, type hierarchy). Today it's functional but a stack of differently-shaped tinted boxes.

### Structural requirement (the "what", distinct from the goals above)

**One component, reused for every issue.** The output must be a single component the engineering pass drops in for **all** subtypes — not a battery-special-case plus a thin fallback for everything else. It must render gracefully across the full spread of issues (§4): some ask for a screenshot, some a video, some a voice memo, some "describe it on the next step"; some carry worked examples (battery only, today), most don't; some carry a *"Try this first"* self-check. Design for that variance — don't design only for the battery case you can see fully fleshed out.

> Note: the user did **not** pick "consistency across issues" as an explicit goal. Don't read that as "make every issue as rich as battery" — that would fight goal 1. Reusability is structural; richness is per-issue and data-driven (§4). A sparse issue should look intentionally sparse, not broken.

### Out of scope — do not redesign these (settled)

- **The issue picker** — the two-scope accordion (`Device not working` / `I received the wrong device`) → subtype list. `Step2IssueDetails.jsx` ·104–164 (picker) and ·282 (`SubIssueRow`), ·301 (`SelectedSubtype`). Leave it.
- **The description textarea.** ·171–202. Leave it.
- **The `BatteryHealthCheck` interactive tool** (`Step2IssueDetails.jsx` ·622) — the capacity-input + non-original toggle + verdict + thresholds that appears **inside the picker section** for the battery subtype (·94). It is **not** part of the evidence area and stays exactly as-is. (It's a per-issue *interactive* extension; your evidence component does not need to host it.)

You design the **evidence area** (the `Photo or video of the issue` section + the `Minimum required proof` section). The picker, description, and battery tool stay.

---

## 1.1 The settled decisions (made with the user — do not re-litigate)

These came out of a direct Q&A. They are the contract; if you think one is wrong, raise it in **one sentence** and let the user decide — don't quietly design against it.

| Decision | Choice | What it means for your design |
|---|---|---|
| **What the component encompasses** | **The evidence block** | Per-issue *"What we need"* + worked examples + the universal *minimum-required* checklist + the attachment uploader + the "required" reinforcement. The picker and description stay **separate, above** it. |
| **Scope of flows** | **Issue flow only** | Only `Step2IssueDetails.jsx` in the raise-an-issue flow. **Not** change-of-mind, **not** warranty, **not** compensation. Don't generalise across claim types. |
| **Picker + battery tool** | **Settled — leave them** | The two-scope picker and the `BatteryHealthCheck` tool are out of scope (above). Redesign only the evidence area. |
| **Deliverable** | **Spec + one throwaway mock** | A `design.md` spec **and** one disposable HTML/JSX mock at the 430px mobile frame so the user can see it before any production build (§9). |
| **Primary success criteria** | **Scannable › proof-quality › polish** | The three goals above, in that priority. Reusability is a structural requirement, not a stated goal — don't trade scannability for max richness. |

---

## 2. What the evidence area contains today — every piece

Everything below lives in `src/components/ClaimFlow/Step2IssueDetails.jsx`. The evidence area is the **third `<section>`** of the step (·204–274) plus the `<MinimumRequiredProof />` section (·276, defined ·539). Redesign means defining one component that subsumes these pieces; the engineering pass collapses the code.

| Piece | File · line | What it is | Driven by |
|---|---|---|---|
| Section label `Photo or video of the issue` | `Step2IssueDetails.jsx` ·208 | `SectionLabel` (·850) — uppercase muted caption | static |
| `ProofGuidance` | ·334 (rendered ·209) | Brand-tinted box: per-issue *"What we need"* line + optional worked examples + `How to provide valid proof` link. Renders only once a subtype is picked. | `sub.need`, `sub.examples`, `sub.proofGuideUrl` (§4) |
| `ProofExampleCard` | ·422 | One captioned example card (1+ thumbnails + caption). | `sub.examples[]` (battery only today) |
| `ProofThumb` | ·397 | The tappable thumbnail (hover zoom affordance) → opens the lightbox. **Shared** by the example cards and the minimum-required checklist. | an image `src` |
| `ProofLightbox` | ·442 | Full-screen image viewer (`z-[70]`, Esc / ← → / tap-out close, prev-next paging across the set). | a flat image list |
| `PhysicalConditionNote` | ·601 (rendered ·210) | A warn-tinted note shown **only** for the `physical` subtype on graded (non-excellent) devices. | `conditionGradeOf(order)` |
| Attachment uploader | ·213–260 | Either an "attached file" chip or a dashed drop-zone. **Fake** — clicking stubs a filename from `STUB_FILES` (·41) via `pickStub` (·70). Single file only. | `state.issueDetails.attachmentName` |
| "Required" warn banner | ·261–270 | Warn-tinted reinforcement: *"Required — claims without proof are often rejected or delayed."* | static |
| Attachment inline error | ·271–273 | `InlineError` — soft-validation message when Continue is clicked with no file. | `error === 'attachment'` |
| `MinimumRequiredProof` | ·539 (rendered ·276) | The **universal** 4-item checklist (Screen / Back & camera / Accessories / Packed safely), each with a real example photo → lightbox. Same for every subtype. | `MINIMUM_PROOF_ITEMS` (·516, static) |

**Naming caution.** The component is `Step2IssueDetails.jsx`, but the customer-facing flow numbers this as **Step 3** (a required *reason* step precedes it — see `docs/output/returns/issue.md` §“flow”). The step title shown is **"Tell us what went wrong."** Use the title, not a step number, in your mock.

---

## 3. What's wrong today — the problem you're solving

### A. The area is a vertical stack of differently-shaped tinted boxes

In source order a customer scrolls past: a section label → a brand-tinted guidance box (with, for battery, two more nested example cards) → a warn-tinted condition note (physical only) → a big dashed uploader → a warn-tinted "required" banner → a section label → four bordered checklist cards. That's **2 tints, 3 box shapes, 2 section labels, and up to ~8 stacked cards** before the customer has done anything. This is the root of goal 1 (overwhelming).

### B. The per-issue richness is wildly uneven

Worked **examples exist for exactly one subtype (battery)** of 19 (§4). For the other 18 the guidance is a single `need` line. So today the area is *rich and tall* for battery and *thin* for everything else — and the universal minimum-required checklist (4 cards) is the same height regardless. The redesign needs one structure that reads well at **both** extremes (a sparse issue and a richly-exampled one) without looking broken or padded.

### C. Two "what good proof looks like" ideas compete

There are now **two** distinct proof concepts in the area, and they're not visually related:
- the **per-issue** ask ("what we need *for this specific issue*", e.g. a battery screenshot), and
- the **universal** minimum-required checklist ("what every returned device must show, *whatever* the issue" — untampered + packed).

Today they're two separate tinted regions with a big uploader and a warn banner wedged between them. A customer can easily satisfy one and miss the other. Reconciling these two into one coherent, scannable system is the heart of the redesign (and the open decision, §5).

### D. It's functional, not polished

Spacing, box radii (`rounded-[10px]` / `rounded-[12px]` mixed), and the mixed brand/warn tinting are ad-hoc rather than systematic. Goal 3.

---

## 4. The data contract — what drives the component (you consume it; you may *propose* extending it)

The per-issue content lives in **`src/components/ClaimFlow/issueSubtypes.js`** as two arrays of subtype objects: `NOT_WORKING_SUBTYPES` (·35, 16 entries) and `WRONG_DEVICE_SUBTYPES` (·147, 4 entries). Each entry today carries:

| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `'battery'`, `'camera'`, `'wrong_color'`. The subtype key. |
| `label` | string | The picker row + the `SelectedSubtype` chip. |
| `need` | string | **The per-issue evidence ask** — one sentence. Present on every entry. This is the `What we need` line. |
| `proofGuideUrl` | string? | Optional help-centre article; falls back to `DEFAULT_PROOF_GUIDE_URL` (·15). Drives the `How to provide valid proof` link. |
| `tryFirst` | string? | Optional self-check shown in `SelectedSubtype` (·317) **in the picker**, not the evidence area — e.g. screen / charger / software-updates. |
| `examples` | array? | Optional worked examples. **Battery only today** (`issueSubtypes.js` ·42). Each entry = `{ caption, images: [paths] }`; images live under `public/proof/<topic>/`. |

The **evidence "type" varies by issue** and is encoded only in the prose of `need` — there's no structured `mediaType` today. The spread:
- **screenshot** (battery, storage, languages, account-link, software-updates),
- **video filmed on another device** (software, screen, camera, button, speaker, S-Pen),
- **photo on another device** (physical, wrong colour, wrong language),
- **voice memo / video** (microphone),
- **"describe on the next step", no media** (`other`, ·143).

> **The reusable component must render gracefully for all of these.** If your design wants a structured signal (e.g. an explicit `mediaType: 'screenshot' | 'video' | 'photo' | 'voice' | 'none'`, or a per-issue `examples` array on every subtype) **propose that new data shape in the spec** — describe the fields the implementer should add to each `issueSubtypes.js` entry. **Do not edit `issueSubtypes.js` yourself** (§9). Flag any field you invent as net-new.

The **universal** minimum-required content is `MINIMUM_PROOF_ITEMS` (`Step2IssueDetails.jsx` ·516) — four `{ src, label, desc }` items, the same for every issue. Treat it as data too.

---

## 5. The one genuinely open decision — bring a recommendation

**How should the per-issue guidance, the worked examples, and the universal minimum-required checklist be arranged and disclosed inside one component so the area is scannable for *every* issue — sparse or rich — while keeping "what counts as good proof" unmissable?**

This is the crux because goals 1 (scannable) and 2 (proof-quality) pull against each other: hiding guidance behind toggles makes it scannable but easier to miss; showing everything makes proof-quality unmissable but overwhelming. You must settle the **information architecture**. Concretely, weigh at least:

- **All-expanded, unified styling** — keep everything visible but collapse the 2 tints / 3 box shapes into one systematic pattern (goal 3 carries goal 1). Risk: still tall for richly-exampled issues.
- **Progressive disclosure** — lead with the per-issue ask + the uploader; put worked examples and/or the minimum-required checklist behind a *"See what good proof looks like"* affordance (precedent exists: the `What counts as a battery defect?` expander, ·713, using `animate-slideDown`). Risk: customers skip it → worse proof (goal 2). If you choose this, the minimum-required items are *required* — be careful what you hide.
- **Merge the two proof concepts** — one *"What good proof looks like"* structure that presents the per-issue ask and the universal checklist as one labelled set (e.g. a single checklist where the first item(s) are issue-specific and the rest are the universal four), with examples inline as thumbnails. Risk: blurring "specific to your issue" vs "every return".

Pick one, **justify it against the priority order (scannable › proof-quality › polish)**, and note it as the defining structural choice of your spec. A recommendation beats a survey.

---

## 6. The visual primitives you build *from* (existing — reference these, invent nothing untested)

Token authority: **`tailwind.config.js`** + narrative in **`brief/design-system.md`**. Prefer named tokens over arbitrary values; slash-opacity (`bg-brand/30`) works on any of them.

### Tokens in play in this area (real values from `tailwind.config.js`)

| Token | Value | Used today for |
|---|---|---|
| `ink` / `ink-2` | `rgb(28,34,48)` / `rgb(75,82,96)` | Primary / secondary text |
| `muted` | `rgb(138,143,154)` | Section labels, captions, tertiary text |
| `line` / `line-2` | `rgb(230,227,236)` / `rgb(241,238,245)` | Borders, dividers, thumbnail bg |
| `brand` / `brand-2` | `rgb(80,25,160)` / `rgb(122,61,211)` | Guidance accent, link, icon tiles |
| `brand-bg` / `brand-bg2` | `rgb(243,237,251)` / `rgb(236,226,250)` | The guidance / checklist tint (`bg-brand-bg/30`) |
| `accent` | `rgb(217,26,122)` | Magenta — the app's "bonus / positive" language (not used here yet) |
| `success` (+`.bg`) | `rgb(0,150,106)` / `rgb(230,246,240)` | "good / confirmed" tone (battery verdict) |
| `warn` (+`.bg`) | `rgb(196,105,0)` / `rgb(255,242,221)` | The "required" banner + physical-condition note |
| `danger` (+`.bg`) | `rgb(200,36,58)` / `rgb(253,232,235)` | Inline validation errors, the error drop-zone border |
| `surface` / `canvas` | `#FFFFFF` / `rgb(247,245,251)` | Card bg / page bg |

Shape & type today in this area: boxes `rounded-[10px]`–`rounded-[12px]` (system tokens are `rounded-card` 18px / `rounded-btn` 10px — consider aligning), thumbnails `w-12 h-[60px] rounded-[8px]`, section labels `text-[11px] font-bold uppercase tracking-[0.08em] text-muted`, body `text-[11.5px]–[14px]`, icons lucide 13–18px stroke 1.75. Prices/counts use `tabular-nums`.

### Existing components you should reuse (don't re-roll)

| Reuse | File · line | For |
|---|---|---|
| `ProofThumb` | `Step2IssueDetails.jsx` ·397 | The tappable evidence thumbnail (hover zoom → lightbox). Already shared. |
| `ProofLightbox` | ·442 | Full-screen image viewer. Keep it; don't re-roll a second viewer. |
| `SectionLabel` | ·850 | The uppercase caption. |
| `InlineError` | `src/components/ClaimFlow/InlineError.jsx` | The soft-validation message row. |
| `StepHeading` | `src/components/ClaimFlow/StepHeading.jsx` | The step title/subtitle (above the area; don't restyle it). |

Reuse precedent rules live in `CLAUDE.md` §Conventions (shared components, tokens over arbitrary values). **Cite them; don't restate them.** If your design needs a net-new element not in this table, flag it as net-new and justify why an existing piece won't do.

### Motion precedents (if you add any)

Registered animations in `tailwind.config.js`: `fadeIn` (·81/·136, used by the lightbox + battery verdict) and `slideDown` (·73/·134, used by the `What counts as a battery defect?` expander ·713). These are your precedents for a reveal/disclosure. **Any new keyframe is net-new** — design it from these, register it the same way (a `keyframes` + `animation` entry), and gate it behind `motion-reduce` (the pattern the timeline/cta keyframes already follow, ·112–123).

> **Gotcha (from `CLAUDE.md`): never introduce a `page` colour token** — `text-{name}` resolves to either a fontSize or a colour, and a name colliding with a `fontSize` key (`body`/`small`/`section`) silently renders **white text**. The same risk applies to any new token name you propose — check it doesn't collide.

---

## 7. Structural reality you must design *for* (someone else builds it)

You don't implement this, but your design must be **buildable as one reusable component**, because that's the whole point:

- The target is **one component** — call it e.g. `<IssueEvidence sub={selectedSubtype} order={order} state={…} dispatch={…} error={error} />` — that the engineering pass drops into `Step2IssueDetails.jsx` in place of the current `ProofGuidance` + uploader + warn banner + `MinimumRequiredProof` pieces. Design to a shape that takes **the selected subtype's data** (§4) + the attachment state, not five bespoke variants.
- It must degrade for the **pre-selection** state: today `ProofGuidance` renders only once a subtype is picked (·209), while the uploader + minimum-required show regardless. Decide what the component shows **before** a subtype is selected and say so.
- **Preserve the validation contract.** The attachment is the **only gated field** in this area: the flow's soft validation gates on `subtype → description → attachment` in that order, surfaced one at a time; **Continue never greys out** — clicking with the file missing reddens the drop-zone + shows the `InlineError`. This lives in `flowReducer.js` (`stepError`) and is **out of your remit to change**. Your design must keep: (a) exactly one required upload affordance, (b) an error state on it, (c) examples + minimum-required as **guidance, not gated inputs**. Don't introduce new required fields.
- **The uploader is a single fake file today** (`pickStub`, `STUB_FILES` ·41). Multi-attachment (photo *and* video, a small carousel of up to N) is a **known, flagged future direction** (`docs/output/returns/issue.md` "Future / backlog"). You **may** design the uploader to anticipate multiple attachments — if you do, flag it as a forward-looking option, not a behaviour you're asserting exists.
- **Tap-target convention:** anything interactive you add (a disclosure toggle, a thumbnail) must be implementable as a normal button; the lightbox already uses `stopPropagation` on its image. Keep the area presentational apart from the uploader, the thumbnails, and any disclosure you introduce.

---

## 8. Constraints your design must respect

- **Mobile frame is 430px wide.** Design and screenshot at **430px**, `deviceScaleFactor: 2`. Desktop-width mocks don't count. (`max-w-mobile` = 430px is a real token.)
- **Everything actionable here is a visual placeholder.** No real file picker, no upload endpoint, no file-type/size validation — clicking the drop-zone stubs a filename. The `How to provide valid proof` links are real `<a target="_blank">`s; the example/minimum-required images are real static assets under `public/proof/`. Design the affordances; don't design around a real upload backend that doesn't exist (`CLAUDE.md` §Gotchas).
- **Reuse tokens (§6) over arbitrary values; don't rely on a `page` token.**
- **This is a prototype for evaluating UX before production specs** — favour clarity and fidelity over architectural ceremony, but consistency with the existing claim-flow surfaces matters.

---

## 9. Your deliverable — a design spec, handed back

Write the spec to **`docs/handoff/issue-evidence/design.md`** (so the implementer picks it up cleanly). It should contain:

- The **redesigned evidence-area layout + hierarchy** — how the per-issue ask, worked examples, the upload affordance + its required-state, and the universal minimum-required checklist arrange into **one** scannable component, at the 430px frame.
- Your **call on the open decision (§5)** — the information-architecture / disclosure choice — justified against the priority order (scannable › proof-quality › polish), noted as the defining structural choice.
- How the component **renders across the issue spread (§4)** — show it for at least: a **sparse** issue (one-line `need`, no examples, e.g. `wrong_color` or `software`), the **battery** issue (rich, with worked examples), and an issue with a different **media type** (e.g. a video-based one like `camera`). Prove it doesn't look broken or padded at either extreme.
- The **two-proof reconciliation** — how "specific to your issue" vs "every return" read as one coherent system (§3.C).
- The **upload affordance** — the drop-zone, the attached-file state, the error state (preserve the validation contract, §7), and — if you choose — a forward-looking multi-attachment treatment flagged as such.
- **Which existing components you reuse** (map to §6) and **any net-new element / data field** you introduce, justified and flagged as net-new (incl. any proposed `issueSubtypes.js` shape change — as a spec, not an edit).
- **Tokens used** (§6) and the **measurements/redlines** (sizes, spacing, radii, weights) the implementer needs.
- Annotated mocks — ASCII, and/or one throwaway live mock (boundary below).

**Hand-back boundary — do NOT cross it:**
- ❌ No building the real component, no refactoring `Step2IssueDetails.jsx`, no editing `issueSubtypes.js` / `flowReducer.js` / the validation contract.
- ❌ No redesigning the issue picker, the description, or the `BatteryHealthCheck` tool (§1).
- ❌ No edits to `lib/` / `data/`, no edits to `docs/output/*`, no `npm run codemap`, no `CHANGELOG.md` / `CLAUDE.md` updates.
- ❌ No new customer-facing notification copy (`src/data/notifications/*` is owner-only).
- ✅ You **may** build **one** throwaway live mock (a scratch route / single HTML file rendering the evidence component for the three issues above) purely to validate the look — flag it disposable, don't spread edits.

When the spec is ready, hand back. The engineering pass builds the component, swaps it into `Step2IssueDetails.jsx`, applies any agreed `issueSubtypes.js` shape change + per-issue data, and updates `docs/output/returns/issue.md` + `CHANGELOG.md` per `CLAUDE.md`.

---

## 10. Source files to read when this brief isn't enough

| You want… | File · line |
|---|---|
| The step you're redesigning (the whole thing) | `src/components/ClaimFlow/Step2IssueDetails.jsx` — evidence area ·204–276; `ProofGuidance` ·334; `ProofExampleCard` ·422; `ProofThumb` ·397; `ProofLightbox` ·442; `MinimumRequiredProof` ·539 (+ `MINIMUM_PROOF_ITEMS` ·516); `SectionLabel` ·850 |
| What you must **not** touch in that file | picker ·104–164 + `SubIssueRow` ·282 + `SelectedSubtype` ·301; description ·171–202; `BatteryHealthCheck` ·622 (+ `BatteryThresholds` ·757, `BatteryVerdict` ·787) |
| The per-issue data shape (`need` / `examples` / `proofGuideUrl` / `tryFirst`) | `src/components/ClaimFlow/issueSubtypes.js` — `NOT_WORKING_SUBTYPES` ·35 (battery + `examples` ·37–57), `WRONG_DEVICE_SUBTYPES` ·147, `findSubtype` ·170, `scopeForSubtype` ·178 |
| The soft-validation contract you must preserve | `src/components/ClaimFlow/flowReducer.js` — `stepError` (gate order subtype → description → attachment; Continue never greys) |
| How this step fits the flow + why guidance moved into the photo section + the multi-attachment backlog | `docs/output/returns/issue.md` (§flow, §“Description and attachment”, §Future) |
| Design tokens (authoritative) + narrative | `tailwind.config.js`; `brief/design-system.md` |
| Reuse + token conventions, the `page`-token gotcha, the prototype-placeholder gotchas | `CLAUDE.md` (root) — §Conventions, §Gotchas |
| A worked example of a finished spec in this repo | `docs/handoff/timeline/design.md`, `docs/handoff/revibe-cancellation/design.md` |
