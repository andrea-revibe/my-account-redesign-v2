---
status: live
verified_against: cc39517
covers:
  - src/components/ClaimFlow
  - src/components/RefundSplitRows.jsx
  - src/lib/returns.js
---

# Returns — Issue & Wrong device

> Customer-facing UI of the **device-fault** and **wrong-item** return branches. Both are reached from Screen 1 of the situation-first decision phase — `Something's wrong with the device` (`device_fault`) or `I received the wrong item` (`wrong_item`); the `device_fault` → repair remedy forks off to warranty ([warranties_compensations.md](../warranties_compensations.md) §2). The shared decision-phase mechanics (Screen 1, the remedy fork, tripwires, `SwitchFlowSheet`, the derived `claimType`) live in [change_of_mind.md](./change_of_mind.md) §0 + §2.2–2.3.2; this doc covers the **issue-specific** decision screens (category / specific / wrong-item / evidence) and the issue refund math. The operational state machine (drawio transcription — single repair-supplier path, country-aware AWB creation, LAB sub-flow) is documented separately in [`../../input/return_flow_issue.md`](../../input/return_flow_issue.md). Once submitted, the return appears on the customer's list as a `ClaimCard` — see [claim_tracking.md](./claim_tracking.md).

## 1. Overview

The issue branch is the entry point used when something is wrong with the delivered device — defect, wrong unit, doesn't work as described, etc. From the customer's perspective:

- Eligible for 10 days after delivery (same window as change of mind).
- The device is picked up by courier from the saved delivery address.
- Refund options: net amount + **AED 100 bonus** to **Revibe Wallet** (instant once return is complete), or full net to **original payment method** (5–10 business days). No restocking fee on either path.
- Revibe Care is refunded on top.

Distinguishing characteristics vs change of mind:

- The customer arrives by picking a fault/wrong-item **situation** on Screen 1, then describes it: `device_fault` → `category` → `specific` → `remedy`; `wrong_item` → `wrongitem` → `remedy`. The `remedy` fork is where the downstream `claimType` resolves (`device_fault`: refund→issue / repair→warranty; `wrong_item`: refund→issue / replacement→issue). After the fork, an `evidence` step collects structured proof via guided slotted capture (the specific issue is already chosen, so it gates only the description — proof is advisory, warned not gated).
- No restocking fee on the original-payment path.
- A flat AED 100 Wallet bonus (`ISSUE_WALLET_BONUS`) is added on the Wallet path — the implicit framing is "we owe you because something went wrong, and we'd like you to stay in the ecosystem".
- The operational flow has a single repair-supplier route (Original supplier) regardless of country, vs change-of-mind's three-way country split.

The flow chrome (white surface, segmented progress, sticky action bar, only-filled-button = Continue) is shared with change of mind. See [change_of_mind.md](./change_of_mind.md) §1 for the visual language rationale.

## 2. UI flow

```mermaid
flowchart TD
  entry([Screen 1 — situation]) -->|Something's wrong with the device| cat[category · 6 categories]
  entry -->|I received the wrong item| wi[wrongitem · how it differs]
  cat -->|"It works fine…" tripwire| comTrip[/SwitchFlowSheet → change of mind/]
  cat -->|Category picked| spec[specific · ≤5 issues, or free-text]
  spec --> rem[remedy · refund | repair]
  wi -->|"It's faulty…" tripwire| dfTrip[/SwitchFlowSheet → device_fault/]
  wi -->|Difference picked| rem2[remedy · refund | replacement]
  rem -->|repair → warranty| warranty[/Warranty branch — warranties_compensations.md §2/]
  rem -->|refund → issue| ev[evidence]
  rem2 -->|refund or replacement → issue| ev
  ev -->|Proof + description| prep[Device prep → packing → pickup]
  prep --> refund[Refund method · skipped on replacement/repair]
  refund --> review[Review & submit]
  review --> done[Confirmation]
  done -->|Back to my account| close([Close overlay])
```

### 2.1 The decision phase (shared, situation-first)

Screen 1, the remedy fork, the tripwires, and the `SwitchFlowSheet` are documented once in [change_of_mind.md](./change_of_mind.md) §0 + §2.2–2.3.2. The issue branches are reached by picking `Something's wrong with the device` (`device_fault`) or `I received the wrong item` (`wrong_item`) on Screen 1. The `claimType` is derived on the **remedy** screen, not picked up front.

### 2.2 Issue decision screens (the redesigned taxonomy)

The flat ~19-item two-scope picker is gone, replaced by `issueTaxonomy.js`:

**`device_fault` — `category` then `specific`.** `StepIssueCategory` shows six recognisable categories (each `< 5` specific issues), then `StepIssueSpecific` drills into the chosen category:

| Category id | Label | Specific issues |
|---|---|---|
| `battery_power` | Battery, charging & heat | `battery_drain`, `wont_charge`, `overheat`, `power_other` |
| `screen_body` | Screen & physical condition | `screen`, `body`, `button`, `spen` *(Samsung only)*, `body_other` |
| `camera_audio` | Camera, mic & speaker | `camera`, `mic`, `speaker`, `av_other` |
| `software_region` | Software & region | `software_bug`, `no_updates`, `language`, `intl_version`, `sw_other` |
| `account_lock` | Account & activation lock | `linked_account`, `prev_owner_pw`, `lock_other` |
| `something_else` | Something else | *(free-text capture — no radio list)* |

The category screen carries a warn-toned **`CATEGORY_COM_TRIP`** tripwire (*"It works fine, it's just not good enough for me"*) that opens `SwitchFlowSheet` to change of mind. The `something_else` category is `freeText: true`: `StepIssueSpecific` renders a textarea (pinned to the `something_else` subtype id) instead of a list, and gates on a non-empty description (`stepError` key `description`). Otherwise the specific screen gates on `issueSubtypeId` (`subtype`). Each specific issue carries the evidence contract (`need` / `mediaType` / `coverage` / `proofGuideUrl` / `examples` / `tryFirst` / `proofOptional`) the later `evidence` step reads. Each **category** also carries one `goldenExample` — the fallback proof shown when a specific issue has no `examples` of its own (the tiered resolution in §2.3.1).

**Brand-conditional copy.** `spen` is filtered out unless the order is a Samsung/Galaxy device (`visibleIssuesFor`). The `linked_account` issue's label and `need` copy adapt per OS via `labelForIssue` / `resolveNeed` — *Apple Account (iCloud)* / Activation Lock on iOS, *Google account* / Factory Reset Protection on Android.

**`wrong_item` — `wrongitem`.** `StepWrongItem` lists the four ways the device can differ (`wrong_colour`, `wrong_storage`, `wrong_specs`, `wrong_region` from `WRONG_ITEM_DETAILS`, scope `wrong_device`), plus a warn-toned **`WRONG_ITEM_FAULT_TRIP`** tripwire (*"It's faulty or damaged, not the wrong item"*) that switches to `device_fault`. Gates on `subtype`.

A charger is an accessory, not a device fault, so it's **not** in this taxonomy — it lives in the compensation branch (`accessory_broken`; see [warranties_compensations.md](../warranties_compensations.md) §3).

### 2.3 `evidence` — Show us the issue (issue / warranty)

After the remedy fork, both refund-issue and warranty-repair walk an `evidence` step (`StepEvidence`). The specific issue is **already chosen** upstream, so this step gates only the **description** (`stepError` returns `description`); proof is now **advisory** — the guided slotted capture surfaces a soft "missing proof" warning but never blocks Continue (the old `attachment` gate, and the `proofOptional` lift, are gone). Continue never grays (§2.1.1 in [change_of_mind.md](./change_of_mind.md)). Contents, top to bottom:

- The **`What good proof looks like`** evidence block (`IssueEvidence`) — the `sub` it renders is resolved via `evidenceSubFor(issueSubtypeId, order)`, which folds in the OS-adapted account-lock copy **and resolves the example set (bespoke `examples` else the category `goldenExample`, tagged `exampleKind`)**. See §2.3.1.
- The optional `BatteryHealthCheck` card — rendered only on the `battery_drain` issue (it now lives in its own file, extracted from the old issue-details screen). Unchanged behaviour, see below.
- A required free-text description (500-char max).

### 2.3.1 Evidence block (`IssueEvidence`) — guided slotted capture

One reusable proof component rendered for every issue/wrong-device sub-type, with **two modes that share the area**, toggled in component-local state (the files themselves live in reducer state, so toggling never loses them):

- **Collapsed (default) — the examples/guidance view.** A white **proof card** holding the two labelled groups below, with a primary brand **`Add your proof`** CTA beneath it that carries live progress (`Add your proof` → `Edit your proof · N of M` once anything is added, plus an amber "`X more to add — missing proof can delay your claim`" line when incomplete). This is the reference the customer collapses back to.
- **Expanded — the slotted capture** (opened from the CTA). Per-item upload slots (see below), with an `‹ Examples` control to collapse back.

The collapsed card's two groups:

- **Group A — `For this issue`** (per-issue, data-driven). The sub-type's `need` ask, prefixed by **media-type chip(s)** resolved from `sub.mediaType` — **two chip types only, `Photo` / `Video`** (`MEDIA_CHIPS` in `IssueEvidence.jsx`); the catch-all "Something else" issues use `mediaType: 'both'` → **both** chips. Below the ask, two optional rows when the issue defines them: a success-toned **`When we cover this`** line (`coverage`) and a brand-tinted **`Try this first`** tip (`tryFirst`). When examples resolve, an example strip renders captioned thumbnails — heading **`Approved examples`** for the issue's own bespoke proof (`exampleKind: 'specific'`) or **`Example of good proof`** for the category `goldenExample` fallback (`exampleKind: 'golden'`), plus an **`Optional`** chip when the issue is `proofOptional`. The `body` sub-type's amber `PhysicalConditionNote` (grade disclaimer) renders inside this group. Before a sub-type is picked, the group shows a placeholder ("Pick your issue above…").
- **Group B — `For every return`** (universal, identical for every issue). A four-item photo checklist — Screen · Back & camera · Accessories · Packed safely — each with a thumbnail and one-line description (`MINIMUM_PROOF_ITEMS` in `IssueEvidence.jsx`, images under `public/proof/minimum-required/`).
- One **`How to provide valid proof`** link below both groups — now a **quiet, easy-to-skip secondary** (muted, small), since the inline guidance above is the primary path. Resolves per sub-type via `sub.proofGuideUrl` → `DEFAULT_PROOF_GUIDE_URL` fallback (see "Real proof-guide links" below).

**Tiered example resolution.** `evidenceSubFor` decides the strip's images, best-available first: the issue's own `examples` if it has any (`exampleKind: 'specific'`) → else its category's `goldenExample` (`exampleKind: 'golden'`) → else none (the universal Group B checklist still shows). A `proofOptional` issue still shows its example (chip-marked `Optional`), not suppressed. Seeded today — **bespoke**: `battery_drain` (Battery Health + two timestamped battery-% photos), `prev_owner_pw` (two login-screen photos), `overheat` (the iOS temperature-warning screen, `proofOptional`); **goldens**: one per category (`GOLDEN_*` in `issueTaxonomy.js`) keyed to the verification hint — up-close damage (`screen_body`) / on-screen error, e.g. NFC scan (`software_region`) / the lock prompt (`account_lock`) / a fault video (`camera_audio`) / charge-or-swelling video (`battery_power`). Images live under `public/proof/golden/` (+ `public/proof/account-lock/`, `public/proof/overheating/`). `something_else` has no golden → universal checklist only.

Every proof thumbnail is tappable → opens a **paging lightbox** (`ProofLightbox`) that cycles across all images in the card (Group A examples first, then the Group B checklist), with keyboard arrows / Escape.

**The slotted capture (expanded view).** Replaces the old single drop-zone with per-item slots, grouped: one **issue slot** driven by `sub.mediaType` (label `Photo of the issue` / `Video of the issue` / `Photo or video of the issue` for `both`; marked **`Optional`** and excluded from the count when the issue is `proofOptional`, e.g. `overheat`) above the **four universal slots** (Screen · Back & camera · Accessories · Packed safely, from `MINIMUM_PROOF_ITEMS`). Each slot (`ProofSlot`) is **single-file**: an empty dashed tile (icon + label + `Add photo`/`Add video`) → tap to add → a placeholder thumbnail + the filename + a remove ✕. Still a **fake** picker — adding cycles a photo/video stub filename (`PHOTO_STUBS` / `VIDEO_STUBS`); the prototype has no real file picker. A live **`N of M added`** footer shows progress: a success line when complete, else an amber soft warning — *"You can continue, but missing proof can delay your claim."* Proof **never gates** the step (§2.3); the warning is advisory only. Files are stored as `issueDetails.proofSlots` (a `slotId → { label, filename }` map), so collapsing to re-read the examples and re-expanding keeps every upload.

**Real proof-guide links.** `How to provide valid proof` is a live (but now secondary) `<a target="_blank">`. It resolves per issue via `sub.proofGuideUrl`, falling back to `DEFAULT_PROOF_GUIDE_URL` ("how-to-show-us-your-issue") for any issue without its own article. Specific articles today: `battery_drain` → battery-draining guide; `body` → device-conditions guide; the hardware faults (`button` / `camera` / `mic` / `speaker`) share one `HARDWARE_PROOF_GUIDE_URL`. All defined in `issueTaxonomy.js`.

**Physical-condition disclaimer.** When `issueSubtypeId === 'body'` and the device's condition grade (from `conditionGradeOf(order)`) is known and **not `excellent`** (i.e. very good / good / fair), an amber `PhysicalConditionNote` renders inside Group A of the `IssueEvidence` card. It names the grade ("Your device is graded **Good**…") and explains that some signs of previous use are expected at that grade and aren't treated as a defect. Renders nothing for Excellent-grade devices or when the grade can't be derived.

The pre-redesign flat `category` field is gone; `Step6Review`'s `IssueSummary` consumes `issueSubtypeId` (via `findSpecificIssue(id)` in `issueTaxonomy.js`) and `issueScope`.

**Optional battery check (`battery_drain` issue only).** When `issueSubtypeId === 'battery_drain'`, a `BatteryHealthCheck` card (now its own file) renders between the `IssueEvidence` block and the description on the `evidence` step (shared by the issue **and** warranty paths). It lets the customer self-assess against the §7.2 Battery Standards before committing:

- A **capacity %** input (the figure from Settings → Battery → Battery Health) and a **non-original part** self-report toggle. Both live in `state.batteryCheck` (`SET_BATTERY_CHECK`); **fully optional** — never gates `canAdvance`, so the customer can skip it and submit proof + description as usual.
- The card derives the device's guaranteed floor from its condition grade (last segment of `product.variant`): `excellent` 95, `very good` 90, `good` 85, `fair` 85 (no published floor — treated as Good). Time-since-delivery comes from `deliveredOn`.
- A live, **generic** verdict (no flow-switching nudge) computed by `assessBattery(...)` in `src/lib/returns.js`, evaluated most-favourable-first: non-original part → **full refund**; > 3% degradation within 10 days → **full refund**; > 10% within 6 months **or** > 20% within 12 months → **free battery replacement**; otherwise **normal wear, not a covered defect** (still submittable). Each remedy names its delivery window (10 days / 6 months / 12 months) so the **time component is visible**, and every verdict carries an "estimate only — final eligibility is confirmed by quality check after inspection" caveat.
- The **time component is part of the math, not just the copy**: each tier requires both the degradation threshold *and* its window, checked against `deliveredOn` vs today (`daysSinceDelivery` + month math in `assessBattery`). The card surfaces this directly — it shows how many days ago the device was delivered next to the guaranteed floor.
- A collapsible **"What counts as a battery defect?"** disclosure (`BatteryThresholds`) lists all three §7.2 thresholds (window + degradation + remedy) plus the normal-wear / non-original-part rules, so a customer who just wants to understand normal battery usage can read the policy without entering anything.

The filled-in result is carried onto the claim as `claim.batteryAssessment` (`{ capacity, baseline, degradation, nonOriginal, remedy, reason }`) for the issue and warranty shapes — data only; no tracking-card surface reads it yet. Logic + thresholds live in `src/lib/returns.js` (`BATTERY_BASELINE_BY_GRADE`, `conditionGradeOf`, `batteryBaselineFor`, `assessBattery`).

### 2.4 `deviceprep` / `packing` / `pickup` (shared)

Identical to the change-of-mind branch. See [change_of_mind.md](./change_of_mind.md) §2.4–2.6.

### 2.5 `refund` — Refund method (shared chrome, issue math)

> Present on the refund-issue path only. The `wrong_item` → `replacement` and `device_fault` → `repair` (warranty) paths skip it (`tailSteps` drops `refund`).

Two stacked refund cards built off `refundBreakdown(order, units, method, 'issue')`. Chrome is identical to the change-of-mind refund step; only the math and secondary copy diverge.

- **Wallet card.** Net amount (= `gross + AED 100 bonus`) + an accent-tinted `+AED 100 bonus` chip + tagline `Full refund + bonus · instantly once return is complete`.
- **Original-payment card.** Full net (no fee), no breakdown table, tagline `Full refund · 5–10 business days once return is complete`. Card label uses `order.paymentMethod.brand` + `last4`. BNPL handling identical to the change-of-mind flow — see [change_of_mind.md](./change_of_mind.md) §2.7 for the `BnplDisclaimerTooltip` treatment. **Split-paid orders** (`order.paymentSplit`) get the shared `RefundSplitRows` block on the `original` path (here splitting the full net, no fee), carried through Review & Confirmation — see [change_of_mind.md](./change_of_mind.md) §2.7.

### 2.6 `review` — Review & submit (shared)

Sectioned summary. Issue-specific section:

- **Issue** (refund) / **Fault** (warranty) — specific-issue label (resolved via `findSpecificIssue(id)` against `issueTaxonomy.js`) sitting directly under the section header (the redundant inner "Issue" field label was removed) + a scope chip (`Device fault` / `Wrong item`) + description + a **`Proof`** list rendering each filled slot as a `label · filename` chip (`Not provided` when empty). The section's Edit link jumps to `wrongitem` when `situation === 'wrong_item'`, else `specific`.

Shared sections: Device prep (shows `Factory reset confirmed` — the single guided-reset path; `Unlinked + passcode shared` survives only for seeded credentials mocks), Packing summary (with the chosen method label), Pickup, Refund.

Two soft-validated ack cards sit inside the Review surface — **☑︎ I have factory reset my device** directly under Device preparation, **☑︎ I have packed the device properly** directly under the Packing summary. Submit stays clickable; clicking with either unchecked flips the topmost unchecked card into a danger-toned error state and blocks submission. Same `AckCard` chrome as the change-of-mind branch — see [change_of_mind.md](./change_of_mind.md) §2.8 for the full soft-validation contract.

The refund block surfaces the final net + an explanatory line: `Includes AED 100 bonus` (accent tone) for Wallet, or no extra line for Original payment.

The sticky bar swaps `Continue` for a success-tone `Submit return request`.

### 2.7 `confirm` — Confirmation (shared)

Same as change of mind (see [change_of_mind.md](./change_of_mind.md) §2.9). The **`wrong_item` → `replacement`** path diverges: the type badge reads `Replacement`, the `Expected refund` row becomes a `What you'll get back` row (*"The correct item"* + a no-refund explainer + the seller-stock disclaimer), and the track button reads `Track this replacement`.

## 3. Eligibility & refund math

### 3.1 Eligibility

Identical to change of mind. See [change_of_mind.md](./change_of_mind.md) §3.1 for the full decision tree (`eligibilityFor(order, today)` in `src/lib/returns.js`).

### 3.2 Refund math (`refundBreakdown(order, units, method, 'issue')`)

| Step | Formula |
|---|---|
| `unitPrice` | `order.unitPrice` (falls back to `subtotal`, then `total`) |
| `itemTotal` | `unitPrice * units` |
| `warranty` | `order.warranty ?? 0` |
| `gross` | `itemTotal + warranty` |
| **Wallet** | `fee = 0`, `bonus = ISSUE_WALLET_BONUS` (flat AED 100), `net = gross + bonus` |
| **Original payment** | `fee = 0`, `bonus = 0`, `net = gross` |

`bonus` is always present in the return shape (0 when not applicable) so consumers don't need null-guards. The refund step reads `bonus` to render the `+AED 100 bonus` chip and Review reads it for the `Includes AED 100 bonus` explanatory line.

`ISSUE_WALLET_BONUS` is a constant in `src/lib/returns.js`; the value is currency-agnostic and could grow into a per-order amount sourced from the backend.

## 4. Operational flow (backend / agent / supplier)

The customer-facing UI above stops at submission. Backend state — agent intake review, country-aware AWB creation, collection / QC / LAB sub-flow, refund chain — is described in the operational flow doc.

→ [`../../input/return_flow_issue.md`](../../input/return_flow_issue.md)

That doc carries:

- Mermaid diagrams of the full state machine (intake → agent review → country-aware AWB creation → collection → seller-decision → LAB invalid-claim sub-flow → ship-back chain → refund chain).
- Single repair-supplier path (`Original supplier`) — distinguishing factor vs change of mind.
- Country split on AWB creation: UAE/Others → auto by Revibe; SA → seller manually inputs.
- IS (internal) vs ES (customer-facing) state catalog.
- Decision points and their branches.
- Source-doc ambiguities preserved verbatim.

How the customer-facing UI surfaces backend state:

- **Agent intake review** (`Information complete?` decision in the ops doc — n4). When the agent flags missing documents, `claim.subStatusId` becomes `awaiting_documents` and an inline `ClaimActionBanner` fires on `ClaimCard`. See [claim_tracking.md](./claim_tracking.md) §4. The `DocsRejectedCard` takeover is the equivalent surface when ops rejects an *initial* evidence batch — see [claim_tracking.md](./claim_tracking.md) §3.1.
- **Collection failed.** `claim.pickupFailure` triggers the `PickupFailedCard` takeover. See [claim_tracking.md](./claim_tracking.md) §3.2.
- **LAB invalid-claim sub-flow** (ops nodes n33–n39). Tracked via `claim.subStatusId === 'expert_revision'`; not currently surfaced inline on `ClaimCard` — the long wait is implicit in the parent `qc` step.
- **Invalid claim confirmed + customer must pay return shipping.** `claim.invalidClaim` triggers the `InvalidClaimCard` takeover. See [claim_tracking.md](./claim_tracking.md) §3.3.

## 5. UX decisions

**Category → specific drill-down, not a flat list.** Earlier drafts had a single ~19-item flat list of sub-issues; the redesign groups faults into six recognisable categories (`< 5` specific issues each) the customer drills into. Most customers can predict which category their issue lives in and only scan a handful of specifics. The `wrong_item` situation gets its own short list (four ways the device differs), and each category carries a catch-all `*_other` free-text option so nothing is unrepresentable.

**Per-issue guidance, not a generic ask.** Once a specific issue is picked, the proof card shows what evidence is needed *for that issue* (`need` line + media-type chip). Generic asks ("Please provide photo evidence") got ignored. Specific asks ("A 30-second video showing the battery draining…") get followed.

**Unified proof card with worked examples, not a guidance line + bare uploader.** Earlier drafts surfaced the per-issue ask as a thin brand-tinted box above the upload zone. It told the customer *what* to send but not *what good looks like*. The redesigned `IssueEvidence` card splits proof into two concepts — `For this issue` (per-issue ask + media-type chip + captioned **approved-example** thumbnails) and `For every return` (a universal 4-photo checklist: screen, back & camera, accessories, packed safely) — backed by real customer-proof images and a paging lightbox. The intent is to cut the rejected-evidence rate by showing concrete examples, not just describing them. The standalone warn banner collapsed into the empty drop-zone (one required reinforcement, not two).

**Proof is guided into per-item slots, warned-not-gated.** Earlier drafts had a single required attachment that hard-gated Continue; before that, no requirement at all (ops spent half their time chasing evidence). The current design splits proof into per-item slots (one per universal photo + one issue-specific) so the customer sees exactly what's expected and how much is left, but **lets them continue with gaps** behind a soft "missing proof can delay your claim" warning rather than a hard gate — collecting more complete evidence without trapping customers who genuinely can't capture a shot.

**No restocking fee on the original-payment path.** The customer didn't choose to return — the seller messed up. Charging a fee felt like punishing the customer for a Revibe-side problem.

**AED 100 bonus on Wallet, not "double the bonus on original payment".** Earlier drafts had a sliding bonus that doubled when the customer chose Wallet. The clean +100 framing is simpler to communicate and easier to A/B against the change-of-mind branch's "no bonus, just a fee waiver".

**Packing and factory-reset acks moved onto Review as a soft-validated pair.** Earlier drafts had a single trailing packing checkbox on Review that hard-gated Submit; an even earlier version merged packing with a "testing acknowledged" checkbox to fix a negation-tick bug. Both got replaced when packing became a dedicated instructions screen — packing is now its own surface, and the *acknowledgments* (factory-reset + packed-properly) live on Review where they're enforced right before submission. See [change_of_mind.md](./change_of_mind.md) §5 for the rationale on splitting the two acks and using soft validation instead of disabling Submit.

**`category` field was replaced by `issueSubtypeId` + `issueScope`.** The pre-redesign flat `category` field couldn't differentiate "wrong device" from "battery issue" cleanly. Review now consumes the structured pair via `findSpecificIssue(id)`.

**Remedy is chosen after the issue, and shows only eligible outcomes.** Earlier the customer picked refund vs warranty up front (outcome-first). The redesign asks what's wrong first, then offers the remedy menu — for `device_fault`, refund or repair; for `wrong_item`, refund or get-the-correct-item. This keeps the refund/replacement/repair fork off the customer's plate until they've described the problem, and lets the menu hide outcomes that don't apply. See [change_of_mind.md](./change_of_mind.md) §5.

## 6. Data model

### 6.1 Order fields read by the flow

Same as change of mind (see [change_of_mind.md](./change_of_mind.md) §6.1), plus — for the optional battery check on the `battery_drain` issue — `order.product.variant` (the condition grade is its last `·`-separated segment) and `order.deliveredOn` (delivery date for the time-window math). Both are read through `conditionGradeOf` / `batteryBaselineFor` / `daysSinceDelivery` in `src/lib/returns.js`. `product.category_name` is also read by `issueTaxonomy.js` (`visibleIssuesFor`) to gate the Samsung-only S Pen issue, and `deviceOsForOrder` to swap the account-lock copy.

### 6.2 Claim object written at submit (issue shape)

The full claim-object reference (including takeover-card extensions) lives in [claim_tracking.md](./claim_tracking.md) §5. Issue-specific fields:

| Field | Type | Notes |
|---|---|---|
| `claim.type` | `'issue'` | Derived (`claimTypeFor`) — both `device_fault` + refund and `wrong_item` + refund/replacement land on `issue`. |
| `claim.remedy` | `'refund' | 'replacement'` | The remedy fork. `replacement` (wrong-item → correct item) carries **no** `refundMethod` / `expectedRefund` block — no money moves. `refund` carries both. |
| `claim.issueDetails` | `{ description, attachmentName, proofSlots }` | `description` is the customer's free-text; `proofSlots` is the slotted-capture map (`slotId → { label, filename }`, stub filenames today). `attachmentName` stays `''` on the issue path (it's retained for the compensation uploader + seeded mocks). The specific-issue id and scope are **separate** top-level fields (below), not nested here. |
| `claim.issueSubtypeId` | string | One of the specific-issue ids from `issueTaxonomy.js` (`battery_drain` / `wont_charge` / `screen` / `body` / `camera` / `linked_account` / `wrong_colour` / `something_else` / …), resolved via `findSpecificIssue(id)`. |
| `claim.issueScope` | `'not_working' | 'wrong_device'` | Derived from the issue via `scopeForIssue` (wrong-item details → `wrong_device`, everything else → `not_working`); also pre-filled by an accepted tripwire (`SWITCH_SITUATION` carries the scope). |
| `claim.batteryAssessment` *(optional)* | `{ capacity, baseline, degradation, nonOriginal, remedy, reason }` | Written **only** when the `battery_drain` issue's optional check was filled in (a capacity entered or the non-original toggle ticked). `remedy` is `'refund'` / `'replacement'` / `'none'` / `null`; `reason` is `'non_original'` / `'refund_10d'` / `'replacement_6m'` / `'replacement_12m'` / `'normal_wear'` / `null`. Computed by `assessBattery(...)`. Data only. |
| `claim.expectedRefund.bonus` | number | `ISSUE_WALLET_BONUS` (`100`) when `refundMethod === 'wallet'`; `0` otherwise. Absent on the replacement path. |

Fields common to both branches (`claimRef`, `claimStatusId`, `submittedAt`, `units`, `devicePrep`, `pickupDetails`, `refundMethod`, `expectedRefund`, `timeline`) are documented in [change_of_mind.md](./change_of_mind.md) §6.2.

`claim.reason` is **not set** on the issue branch.

## 7. Component map

Same shared components as change of mind. Issue-specific surfaces:

```
src/components/ClaimFlow/
├── StepIssueCategory.jsx       device_fault screen 1 — six category cards + CATEGORY_COM_TRIP
│                               change-of-mind tripwire. Exports CATEGORY_COM_TRIP.
├── StepIssueSpecific.jsx       device_fault screen 2 — the chosen category's ≤5 issues (radio list),
│                               or a free-text capture on the `something_else` category.
├── StepWrongItem.jsx           wrong_item screen — four WRONG_ITEM_DETAILS rows + WRONG_ITEM_FAULT_TRIP
│                               fault tripwire. Exports WRONG_ITEM_FAULT_TRIP.
├── StepRemedy.jsx              remedy fork (refund|repair · refund|replacement) — SET_REMEDY resolves
│                               claimType; replacement reveals the seller-stock disclaimer.
├── StepEvidence.jsx            issue/warranty proof step — IssueEvidence (sub via evidenceSubFor)
│                               + optional BatteryHealthCheck (on `battery_drain`) + description.
├── BatteryHealthCheck.jsx      The optional battery self-check card (extracted from the old issue-
│                               details screen) + BatteryVerdict + BatteryThresholds. Receives `order`.
├── IssueEvidence.jsx           Guided slotted proof capture. Collapsed: examples card (Group A per-issue
│                               `need` + media chip + Approved examples; Group B universal 4-photo
│                               checklist) + `Add your proof` CTA. Expanded: per-item slots (issue slot
│                               by mediaType + 4 universal) + live counter / soft warning. Paging
│                               ProofLightbox. Exported default; private ProofSlot / ProofThumb /
│                               PhysicalConditionNote.
└── issueTaxonomy.js            ISSUE_CATEGORIES (6, ≤5 issues each) + WRONG_ITEM_DETAILS (4); each
                                issue carries `mediaType` + optional `examples`/`tryFirst`/`proofGuideUrl`.
                                findSpecificIssue / scopeForIssue / visibleIssuesFor (Samsung S Pen) /
                                labelForIssue + resolveNeed (iCloud/Google) / evidenceSubFor resolvers.
```

Proof images are static assets under `public/proof/<id>/` (per-issue examples) and `public/proof/minimum-required/` (the universal checklist).

`refundBreakdown` (`src/lib/returns.js`) branches on the 4th argument (`claimType`); the issue branch flows through `case 'issue'`. The battery check's logic also lives in `src/lib/returns.js` (`BATTERY_BASELINE_BY_GRADE`, `conditionGradeOf`, `batteryBaselineFor`, `daysSinceDelivery`, `assessBattery`); `ClaimFlow.buildClaim` attaches the result via the private `batteryAssessmentForClaim(state, order)` helper.

## 8. Mocked vs production

- **Submit seeds an in-session claim.** Same as change of mind — see [change_of_mind.md](./change_of_mind.md) §8. The seeded claim carries `type: 'issue'`, `issueDetails` / `issueScope` / `issueSubtypeId` from the flow state, and the computed `expectedRefund`.
- **Proof slots are fake.** Tapping a slot stubs in a cycled photo/video filename (`proofSlots` map). No real file picker, no upload endpoint, no thumbnail of the actual file, no file-type/size validation.
- **AED 100 bonus is hardcoded** as `ISSUE_WALLET_BONUS` in `src/lib/returns.js`. Production should read from a backend config (per-order or per-category).
- **Issue guidance copy + media-type chips are hardcoded** in `issueTaxonomy.js` (`need`, `mediaType`, `coverage`, `tryFirst`, `examples`, `goldenExample`, `proofOptional`). Production should source from a content management system so non-engineers can revise.
- **Example + checklist images are static demo assets** under `public/proof/`. Seeded today: three **bespoke** sets (`battery_drain`, `prev_owner_pw`, `overheat`) + one **category golden** each for five categories — real customer-style photos. Production should attach examples per sub-type and category goldens from a content store, source the `coverage` / `tryFirst` / `proofOptional` flags from policy config, and point the universal 4-photo checklist at the canonical packing/condition guidance images.
- **No de-duplication / fraud check.** Production needs to flag repeat claimants and stop submission before it reaches ops.
- **`Try this first` preflight steps are placeholders.** Real preflight scripts (factory reset, signal-strength check, charge-cycle test) need to be sourced from device-care content.
- **Battery check is a customer-facing estimate, not a verified reading.** The capacity % is hand-typed (no Battery Health screenshot parsing / OCR), the condition grade is parsed from the `product.variant` string, and `deliveredOn` drives the time window. The verdict is advisory — `assessBattery` runs entirely client-side and the real eligibility is decided by QC. `claim.batteryAssessment` is captured but not surfaced on any tracking card / review screen / ops surface yet. Thresholds (3% / 10% / 20%, 10 days / 6 / 12 months) and grade baselines (95 / 90 / 85, fair→85) are hardcoded in `src/lib/returns.js` — production should source them from the same policy config as §7.2.

## 9. Open questions

- **Multi-file per slot + real uploads.** The slotted capture now collects multiple files (one per slot — issue + the four universal), but each slot is still single-file and stubbed, and the `both` issue slot collapses photo-or-video into one. Real evidence sometimes needs more than one shot per item — a real picker with multi-file slots and genuine thumbnails/previews is the next step.
- **Live-chat hand-off from issue details.** Some sub-issues (e.g. screen unresponsive at boot) would be better handled by support before the customer commits to a return. A `Talk to support` exit ramp on the sub-issue guidance panel is a natural addition.
- **Wrong device flow.** The `I received the wrong device` scope today flows through the same device-prep / packing / pickup steps as a normal issue claim. In practice the device prep step is moot (the customer doesn't own the wrong device's iCloud account). Worth gating device prep off when `issueScope === 'wrong_device'`.
- **Bonus tuning.** AED 100 is a fixed placeholder. Production may want to scale by item price, by historical claim rate, or A/B test against alternative incentives (instant replacement, expedited shipping).
- **Replacement-vs-refund branching.** Today the flow always lands on a refund. A `Replace` option (ship a working unit, take the broken one back on the same AWB) is a natural addition for issue claims.
- **Battery check → flow routing.** The check verdict is deliberately generic and never steers the customer between the return (refund) and warranty (replacement) flows, even when the computed remedy points at the other one. A future iteration could nudge (e.g. "your numbers point to a battery replacement — use your warranty instead") or surface `batteryAssessment` on Review / `ClaimDetailsSheet` / the QC ops view so the self-reported figure travels with the claim.
