# Code map

> Navigation + impact layer for agents. **Read this before exploring.** It exists to replace fan-out search: locate a concept here, then do one targeted read at the listed file/line instead of grepping the tree. The generated block (below the marker) is rebuilt by `node scripts/codemap.mjs` — never hand-edit it. The curated sections above the marker carry the "why" and the couplings a dependency graph can't see.

## How agents should use this doc

1. **Finding code** → use _Where is X_ + the generated _Module index_. The index lists every export with its line number. Jump straight there; do **not** spawn an Explore agent for a symbol that is already listed.
2. **Planning a change** → read _Coupling the import graph can't see_ first, then the generated _Shared-core consumers_ table. Together they are the blast radius: imports + string contracts. Hand both to the planning agent.
3. **Reading cost** → the _LOC_ column flags expensive whole-file reads (the largest is now `resetGuideMocks.jsx` ~1.7k of CSS-art). `data/journey.js`, `data/orders.js`, and `ResetGuideSheet.jsx` are thin barrels/shells — open the specific sub-module (`data/journeys/*`, `data/orders/*`, `resetGuideMocks`/`resetGuideAnim`) or read a slice around the listed line, not the whole file.
4. **The "why"** → this doc deliberately does not explain rationale. Each row links to the per-feature doc in `docs/output/`; follow it only when you need the reasoning, not the location.

## Where is X — concept → module

| You want… | Module(s) | Why-doc |
|---|---|---|
| Order status / banner copy + tone / timeline / `pickActiveOrderId` | `lib/statuses.js` | `output/orders.md` |
| Claim pipeline states / tone / SLAs / sub-status copy / action-gate copy | `lib/claims.js` | `output/returns/claim_tracking.md` |
| Cancel claim — window / clean-revert vs ship-back / confirm sheet | `lib/claims.js` (`canCancelClaim`·159, `cancelNeedsShipBack`·170, `cancelReturnGate`·182), `components/CancelClaimSheet.jsx`, `components/InvalidClaimCard.jsx` (`reason: 'cancelled'`), `App.jsx` (`cancelledClaims` / `shipBackCancels`) | `output/returns/claim_tracking.md` §2.8 |
| Returns eligibility / refund math / fee rate / window / `generateClaimRef` | `lib/returns.js` | `output/returns/change_of_mind.md`, `issue.md` |
| Returns-flow steps, soft validation, step-skips | `components/ClaimFlow/` + `flowReducer.js` (`stepError`·199) | `output/returns/*.md`, `warranties_compensations.md` |
| Guided-reset mapping / copy / steps / device frames | `lib/devices.js` + `components/ClaimFlow/ResetGuideSheet.jsx` + `Step3DevicePrep.jsx` | `output/returns/guided_reset.md` |
| History-thread events | `lib/events.js` (`getHistoryEvents`·119) | `output/orders.md` §6 |
| EDD / SLA model | `lib/edd.js`; sandbox: `lib/eddSandbox.js` + `data/journey.js` | `output/journey_backend_spec.md` |
| Journey replay mode | `lib/journey.js` + `data/journey.js` + `JourneyDevPanel.jsx` | `output/journey_backend_spec.md` |
| Card routing (which card renders) | `App.jsx` (routing block ≈ L285–375) | `output/orders.md` §2 |
| Cancellation sheet / keep-order undo | `CancelOrderSheet.jsx`, `KeepOrderSheet.jsx` | `output/cancellations.md` |
| Mock orders / field shapes | `data/orders.js` | `output/orders.md` §7 |
| Product line-item (thumbnail · name · variant · Revibe Care callout · price breakdown), shared across all cards | `components/ProductSummary.jsx` (exports `REVIBE_CARE_ICON`) | `output/orders.md` §3.0 |
| Return-shipment (Revibe → customer) `See detailed tracking` dropdown — shared by `WarrantyClaimCard` ship-back + `InvalidClaimCard` paid | `components/ReturnShipmentTracking.jsx` (exports `ReturnShipmentTracking` + `CourierStrip` + `SubStatusItem`) | `output/warranties_compensations.md` §2.3.3, `output/returns/claim_tracking.md` §3.3 |
| Horizontal claim-progress dot strip (tone-aware), shared by `ClaimCard` / `WarrantyClaimCard` / `InvalidClaimCard` | `components/ClaimProgressDots.jsx` (props `{ steps, curIdx, stamps, tone }`); status lists `CLAIM_STATUSES` / `WARRANTY_CLAIM_STATUSES` / `RETURN_CLAIM_STATUSES` in `lib/claims.js` | `output/returns/claim_tracking.md` §2.3 + §3.3 |
| Per-country capability flags / country-specific card + journey differences | `lib/countries.js` (`COUNTRIES`, `countryConfig`); selector `components/CountryPicker.jsx`; journey-flow forks via per-edge `next` country tags in `lib/journey.js` (`validNext`) | `output/country_split.md` |

## Coupling the import graph can't see

These are **string contracts**: a value written as a literal in data/flow code, switched on elsewhere. No `import` edge connects them, so the generated tables below miss them — but renaming or adding a value breaks every consumer here. Verified counts are from `data/orders.js`.

| Contract value | Written in | Switched on in | Add/rename a value → also touch |
|---|---|---|---|
| `statusId` (`created`/`quality_check`/`shipped`/`delivered`) | `data/orders.js`, `data/journey.js` | `lib/statuses.js` (`STATUSES`, `statusDescription`), `App.jsx` routing, `StatusTimeline` | `STATUSES` + `STATUS_DESCRIPTIONS` in `statuses.js` |
| `subStatusId` (shipping legs) | `data/orders.js` | `lib/statuses.js` (`SHIPPING_SUB_STATUSES`), `ShippingSubTimeline` | `SHIPPING_SUB_STATUSES` in `statuses.js` |
| `state` (`open`/`close`/`cancelled`) | `data/orders.js` | `lib/statuses.js` (`ORDER_STATES`), header chips | `ORDER_STATES` in `statuses.js` |
| `claim.claimStatusId` (`initiated`→…→`refund_credited` / warranty tail) | `data/orders.js`, `ClaimFlow` seed (always `initiated`) | `lib/claims.js` (`CLAIM_STATUSES` / `COMPENSATION_` / `WARRANTY_`), `hasActiveClaim`, `isClaimRefunded`, `isWarrantyDelivered` | the right status list in `claims.js` + the `hasActive`/`isRefunded` predicates |
| `claim.type` (`change_of_mind`/`issue`/`warranty`/`compensation`) | `ClaimFlow`, `data/orders.js` | `App.jsx` routing, `claimStatusesFor`, `flowReducer` step-skips (`visibleStepCount`) | routing in `App.jsx` + step-skip logic in `flowReducer.js` |
| Takeover flags `claim.docsRejection` / `pickupFailure` / `resetFailed` / `invalidClaim` | `data/orders.js` (hand-seeded only) | `App.jsx` routing **precedence** → takeover cards | the routing precedence list in `App.jsx` (order matters) |
| `claim.invalidClaim.reason` (`invalid` default / `cancelled`) | `data/journeys/claim*.js`, `lib/claims.js` (`cancelReturnGate`), `App.jsx` (`shipBackCancels` projection) | `components/InvalidClaimCard.jsx` (copy + `Decline`-vs-`Keep claim`) | the `reason` branches in `InvalidClaimCard.jsx` |
| `category_name` (`iPhone`/`Macbook`/`Samsung phone`/`Tablet`/`Laptop`) | `data/orders.js` product | `lib/devices.js` → `ResetGuideSheet` variant | mapping in `devices.js` + a guide variant in `ResetGuideSheet.jsx` |
| `claim.transitSubTimeline.picked_up`, `claim.shipBack.awb` | `data/orders.js` | gate the `See detailed tracking` dropdown in `ClaimCard` / `WarrantyClaimCard` | the gating check in the relevant card |
| `order.country` (`AE`/`ZA`/`SA`/`Others`) | `data/orders/*` (mocks), `App.jsx` (injected onto the replayed order from `?country=`/`CountryPicker`) | `lib/countries.js` (`countryConfig`) → `detailedTracking` gate in `HeroCard`/`OrderCard`/`ClaimCard`/`WarrantyClaimCard`/`InvalidClaimCard`; per-edge `next` country tags in `lib/journey.js` (`validNext`) | a flag in `COUNTRIES` + the card guard, or a `{id,countries}` edge in the journey `next` |

**Projection invariant:** `App.jsx` projects the in-session `submittedClaims` map over `ORDERS` (≈L204), so a freshly-submitted claim always lands on `initiated`. Every post-`initiated` state and all four takeover surfaces are reachable **only** via hand-seeded mocks in `data/orders.js` — see each `docs/output/*.md` "Mocked vs production" list.

## Cross-cutting diagrams

The connective control flow — spans more than one file, so it can't be read off a single module. Read the relevant one before planning a change that crosses flows. All three live in [`output/diagrams.md`](output/diagrams.md):

- [**Card routing**](output/diagrams.md#card-routing) — the two-stage `isOpen` partition + precedence ladder in `App.jsx`. Read before touching routing precedence or adding a card variant / takeover flag.
- [**Claim lifecycle**](output/diagrams.md#claim-lifecycle) — all four pipelines (refund / compensation / warranty) + the four takeover detours on one canvas, with the card per state. Read before changing a claim pipeline or adding a state.
- [**Returns data-flow**](output/diagrams.md#returns-data-flow) — `ClaimFlow.onSubmitClaim` → `submittedClaims` → projection over `ORDERS` → card routing. Read before changing how a submitted claim reaches a card. This is the runtime projection no import edge shows.

<!-- codemap:generated:start -->

### Module index

_Concept → file → symbol → line. Read the file + jump to the line; do not fan-out search for a symbol that is listed here. `In` = how many src files import this module._

| Module | LOC | In | Exports (line) |
|---|--:|--:|---|
| `App.jsx` | 732 | 1 | `App`·100 |
| `components/BnplDisclaimerTooltip.jsx` | 86 | 6 | `bnplProviderLabel`·9, `isBnpl`·13, `BnplDisclaimerTooltip`·17 |
| `components/CancelClaimSheet.jsx` | 155 | 1 | `CancelClaimSheet`·15 |
| `components/CancelOrderSheet.jsx` | 711 | 2 | `CancelOrderSheet`·19 |
| `components/CancellationSubTimeline.jsx` | 94 | 1 | `CancellationSubTimeline`·11 |
| `components/ChatFab.jsx` | 14 | 1 | `ChatFab`·3 |
| `components/ClaimActionBanner.jsx` | 46 | 1 | `ClaimActionBanner`·8 |
| `components/ClaimCard.jsx` | 439 | 1 | `ClaimCard`·43 |
| `components/ClaimDetailsSheet.jsx` | 230 | 2 | `ClaimDetailsSheet`·16 |
| `components/ClaimFlow/ClaimFlow.jsx` | 405 | 1 | `ClaimFlow`·21 |
| `components/ClaimFlow/InlineError.jsx` | 16 | 8 | `InlineError`·6 |
| `components/ClaimFlow/ProgressBar.jsx` | 28 | 1 | `ProgressBar`·3 |
| `components/ClaimFlow/ResetGuideSheet.jsx` | 803 | 2 | `ResetGuideSheet`·424 |
| `components/ClaimFlow/Step1ClaimType.jsx` | 225 | 1 | `Step1ClaimType`·33 |
| `components/ClaimFlow/Step2Compensation.jsx` | 229 | 1 | `Step2Compensation`·22 |
| `components/ClaimFlow/Step2IssueDetails.jsx` | 612 | 1 | `Step2IssueDetails`·44 |
| `components/ClaimFlow/Step2Reason.jsx` | 160 | 3 | `REASONS`·13, `REASON_LABELS`·29, `REDIRECT_REASON_IDS`·35, `SWITCH_CTA_LABELS`·41, `routeForReason`·57, `scopeForReason`·66, `Step2Reason`·72 |
| `components/ClaimFlow/Step3DevicePrep.jsx` | 549 | 1 | `Step3DevicePrep`·37 |
| `components/ClaimFlow/Step4Packing.jsx` | 253 | 2 | `PACKING_OPTIONS`·15, `PACKING_LABELS`·36, `Step4Packing`·40 |
| `components/ClaimFlow/Step4PickupDetails.jsx` | 427 | 1 | `Step4PickupDetails`·53 |
| `components/ClaimFlow/Step5RefundMethod.jsx` | 269 | 1 | `Step5RefundMethod`·9 |
| `components/ClaimFlow/Step6Review.jsx` | 600 | 1 | `Step6Review`·28 |
| `components/ClaimFlow/Step7Confirmation.jsx` | 207 | 1 | `Step7Confirmation`·15 |
| `components/ClaimFlow/StepHeading.jsx` | 16 | 9 | `StepHeading`·1 |
| `components/ClaimFlow/StickyActionBar.jsx` | 38 | 1 | `StickyActionBar`·1 |
| `components/ClaimFlow/SwitchFlowSheet.jsx` | 171 | 1 | `SwitchFlowSheet`·69 |
| `components/ClaimFlow/compensationSubtypes.js` | 30 | 3 | `COMPENSATION_SUBTYPES`·6, `COMPENSATION_SUBTYPE_LABELS`·23, `findCompensationSubtype`·27 |
| `components/ClaimFlow/flowReducer.js` | 329 | 2 | `STEP_SEQUENCES`·12, `visibleStepCount`·55, `visibleStepIndex`·61, `initialState`·66, `flowReducer`·138, `stepError`·265, `canAdvance`·326 |
| `components/ClaimFlow/issueSubtypes.js` | 165 | 2 | `PROOF_GUIDE_LABEL`·9, `DEFAULT_PROOF_GUIDE_URL`·12, `ISSUE_SCOPES`·19, `NOT_WORKING_SUBTYPES`·32, `WRONG_DEVICE_SUBTYPES`·129, `findSubtype`·152, `scopeForSubtype`·160 |
| `components/ClaimFlow/resetGuideAnim.js` | 10 | 2 | `STEP_ANIM_CSS`·3, `stepAnim`·8 |
| `components/ClaimFlow/resetGuideMocks.jsx` | 1647 | 1 | _(none)_ |
| `components/ClaimProgressDots.jsx` | 94 | 3 | `ClaimProgressDots`·22 |
| `components/CountryPicker.jsx` | 37 | 2 | `CountryPicker`·8 |
| `components/DeliveryAddressPill.jsx` | 44 | 5 | `DeliveryAddressPill`·9 |
| `components/DocsRejectedCard.jsx` | 500 | 1 | `DocsRejectedCard`·34 |
| `components/EddSandboxPanel.jsx` | 164 | 1 | `EddSandboxPanel`·10 |
| `components/GreetRow.jsx` | 39 | 1 | `GreetRow`·3 |
| `components/Header.jsx` | 50 | 1 | `Header`·6 |
| `components/HeroCard.jsx` | 299 | 1 | `HeroCard`·30 |
| `components/HistoryThread.jsx` | 218 | 3 | `HistoryThread`·86 |
| `components/InProgressCard.jsx` | 285 | 1 | `InProgressCard`·29 |
| `components/InvalidClaimCard.jsx` | 795 | 1 | `InvalidClaimCard`·41 |
| `components/JourneyDevPanel.jsx` | 254 | 1 | `JourneyDevPanel`·15 |
| `components/JourneyNotificationPanel.jsx` | 205 | 1 | `JourneyNotificationPanel`·29 |
| `components/KeepOrderSheet.jsx` | 122 | 1 | `KeepOrderSheet`·9 |
| `components/OrderCard.jsx` | 450 | 1 | `OrderCard`·37 |
| `components/OrderFilters.jsx` | 151 | 1 | `STATUS_CHIPS`·4, `DATE_RANGES`·11, `OrderFilters`·21 |
| `components/PastOrderCard.jsx` | 403 | 2 | `PastOrderCard`·29, `DestinationChip`·309 |
| `components/PickupFailedCard.jsx` | 428 | 1 | `PickupFailedCard`·21 |
| `components/ProductSummary.jsx` | 152 | 15 | `REVIBE_CARE_ICON`·1, `ProductSummary`·20 |
| `components/RefundDetailsSheet.jsx` | 165 | 2 | `RefundDetailsSheet`·7 |
| `components/ResetFailedCard.jsx` | 494 | 1 | `ResetFailedCard`·27 |
| `components/ReturnShipmentTracking.jsx` | 133 | 2 | `ReturnShipmentTracking`·14, `CourierStrip`·62, `SubStatusItem`·95 |
| `components/RevibeCancellationCard.jsx` | 215 | 1 | `RevibeCancellationCard`·43 |
| `components/ShippingSubTimeline.jsx` | 73 | 1 | `ShippingSubTimeline`·9 |
| `components/StatusTimeline.jsx` | 62 | 1 | `StatusTimeline`·6 |
| `components/TapToFixCta.jsx` | 14 | 4 | `TapToFixCta`·3 |
| `components/UndoSnackbar.jsx` | 44 | 1 | `UndoSnackbar`·8 |
| `components/WalletInfoTooltip.jsx` | 71 | 4 | `REVIBE_WALLET_ICON`·4, `WalletInfoTooltip`·7 |
| `components/WarrantyClaimCard.jsx` | 420 | 1 | `WarrantyClaimCard`·52 |
| `data/journey.js` | 89 | 3 | `INITIAL_ORDER`·28, `JOURNEYS`·30 |
| `data/journeys/cancellation.js` | 778 | 1 | `CANCELLATION_NODES`·25 |
| `data/journeys/claimChangeOfMind.js` | 798 | 1 | `CLAIM_COM_NODES`·19 |
| `data/journeys/claimCompensation.js` | 375 | 1 | `CLAIM_COMPENSATION_NODES`·29 |
| `data/journeys/claimIssue.js` | 907 | 1 | `CLAIM_ISSUE_NODES`·31 |
| `data/journeys/claimWarranty.js` | 973 | 1 | `CLAIM_WARRANTY_NODES`·26 |
| `data/journeys/happyPath.js` | 128 | 1 | `HAPPY_PATH_NODES`·5 |
| `data/journeys/initialOrder.js` | 37 | 1 | `INITIAL_ORDER`·2 |
| `data/notifications/claims.js` | 263 | 1 | `CLAIM_NOTIFICATIONS`·26 |
| `data/notifications/index.js` | 16 | 1 | `NOTIFICATIONS`·11 |
| `data/notifications/orders.js` | 56 | 1 | `ORDER_NOTIFICATIONS`·19 |
| `data/notifications/shipment.js` | 40 | 1 | `SHIPMENT_NOTIFICATIONS`·9 |
| `data/orders.js` | 20 | 3 | `ORDERS`·14 |
| `data/orders/baseline.js` | 564 | 1 | `BASELINE_ORDERS`·3 |
| `data/orders/claims.js` | 666 | 1 | `CLAIM_ORDERS`·4 |
| `data/orders/compensation.js` | 184 | 1 | `COMPENSATION_ORDERS`·3 |
| `data/orders/warranty.js` | 174 | 1 | `WARRANTY_ORDERS`·3 |
| `lib/claims.js` | 607 | 12 | `CLAIM_STATUSES`·18, `COMPENSATION_CLAIM_STATUSES`·64, `claimStatusesFor`·98, `claimToneFor`·108, `claimProgressIndex`·114, `RETURN_CLAIM_STATUSES`·124, `returnClaimProgressIndex`·137, `CLAIM_TRANSIT_SUB_STATUSES`·146, `transitSubProgressIndex`·153, `hasActiveClaim`·160, `isClaimRefunded`·168, `canCancelClaim`·182, `cancelNeedsShipBack`·193, `cancelReturnGate`·205, `isWarrantyDelivered`·225, `isReturnDelivered`·238, `claimPhaseTag`·244, `claimStatusHeadline`·261, `claimStatusSubline`·266, `WARRANTY_CLAIM_STATUSES`·284, `warrantyClaimToneFor`·332, `warrantyClaimProgressIndex`·340, `warrantyClaimPhaseTag`·344, `warrantyClaimStatusHeadline`·363, `warrantyClaimStatusSubline`·368, `REASON_LABELS`·384, `reasonText`·395, `devicePrepText`·403, `CLAIM_TYPE_LABELS`·411, `claimTypeLabel`·418, `claimRequiresProof`·427, `refundMethodLabel`·433, `CLAIM_SLAS`·452, `expectedCompletionFor`·475, `SUB_STATUS_LABELS`·500, `actionGateCopy`·561 |
| `lib/countries.js` | 32 | 9 | `DEFAULT_COUNTRY`·15, `COUNTRIES`·17, `COUNTRY_CODES`·24, `countryConfig`·28 |
| `lib/devices.js` | 65 | 3 | `osForCategory`·26, `deviceOsForOrder`·33, `deviceTypeForCategory`·39, `deviceTypeForOrder`·51, `isOsAmbiguous`·62 |
| `lib/edd.js` | 245 | 1 | `MARKETS`·24, `STAGE_ORDER_CREATED`·60, `STAGE_QC`·61, `STAGE_SHIPPED`·62, `SLA_ON_TIME`·64, `SLA_LATE`·65, `MSG_ORDER_LATE`·72, `MSG_QC_BACK_ON_TRACK`·74, `MSG_QC_LATE`·76, `MSG_SHIPPED_LATE`·78, `workdayIntl`·100, `currentStage`·117, `calculateEdd`·125, `buildCustomerMessage`·161, `orderStatus`·185 |
| `lib/eddSandbox.js` | 231 | 1 | `useEddSandbox`·187 |
| `lib/events.js` | 152 | 3 | `getHistoryEvents`·119 |
| `lib/journey.js` | 112 | 1 | `useJourney`·25 |
| `lib/notifications.js` | 83 | 2 | `NOTIFICATIONS`·14, `NOTIFICATION_STATUSES`·26, `notificationStatus`·39, `notificationFor`·45, `journeyNotificationCoverage`·73 |
| `lib/returns.js` | 267 | 5 | `RETURN_WINDOW_DAYS`·4, `RESTOCKING_FEE_RATE`·5, `ISSUE_WALLET_BONUS`·9, `addDays`·36, `startOfDay`·40, `eligibilityFor`·46, `groupOrdersByEligibility`·71, `refundBreakdown`·89, `formatMoney`·135, `formatLongDate`·140, `formatShortDate`·149, `generateClaimRef`·158, `BATTERY_BASELINE_BY_GRADE`·166, `conditionGradeOf`·175, `batteryBaselineFor`·182, `daysSinceDelivery`·193, `assessBattery`·210 |
| `lib/statuses.js` | 349 | 9 | `STATUSES`·4, `CANCELLATION_STATUSES`·32, `SHIPPING_SUB_STATUSES`·56, `ORDER_STATES`·81, `progressIndex`·95, `subProgressIndex`·100, `cancellationProgressIndex`·105, `cancellationStepsFor`·116, `statusDescription`·126, `pickActiveOrderId`·264, `statusHeadline`·277, `statusSubline`·296, `statusIconFor`·325 |
| `main.jsx` | 11 | 0 | _(none)_ |

### Shared-core consumers (blast radius)

_Editing a `lib/` or `data/` module touches every file listed. Hand these importers to a planning agent before changing a signature or a data shape._

| Source-of-truth module | Consumers |
|---|---|
| `lib/claims.js` | `App.jsx`, `components/CancelClaimSheet.jsx`, `components/ClaimActionBanner.jsx`, `components/ClaimCard.jsx`, `components/ClaimDetailsSheet.jsx`, `components/ClaimFlow/ClaimFlow.jsx`, `components/ClaimFlow/Step4PickupDetails.jsx`, `components/ClaimFlow/Step6Review.jsx`, `components/ClaimFlow/Step7Confirmation.jsx`, `components/InvalidClaimCard.jsx`, `components/WarrantyClaimCard.jsx`, `lib/notifications.js` |
| `lib/countries.js` | `App.jsx`, `components/ClaimCard.jsx`, `components/CountryPicker.jsx`, `components/HeroCard.jsx`, `components/InvalidClaimCard.jsx`, `components/OrderCard.jsx`, `components/WarrantyClaimCard.jsx`, `lib/journey.js`, `lib/statuses.js` |
| `lib/statuses.js` | `App.jsx`, `components/CancellationSubTimeline.jsx`, `components/HeroCard.jsx`, `components/InProgressCard.jsx`, `components/OrderCard.jsx`, `components/PastOrderCard.jsx`, `components/ReturnShipmentTracking.jsx`, `components/ShippingSubTimeline.jsx`, `components/StatusTimeline.jsx` |
| `lib/returns.js` | `components/ClaimFlow/ClaimFlow.jsx`, `components/ClaimFlow/Step2IssueDetails.jsx`, `components/ClaimFlow/Step5RefundMethod.jsx`, `components/ClaimFlow/Step6Review.jsx`, `components/ClaimFlow/Step7Confirmation.jsx` |
| `data/journey.js` | `App.jsx`, `lib/eddSandbox.js`, `lib/journey.js` |
| `data/orders.js` | `App.jsx`, `components/ClaimFlow/ClaimFlow.jsx`, `components/ClaimFlow/flowReducer.js` |
| `lib/devices.js` | `components/ClaimFlow/Step3DevicePrep.jsx`, `components/ClaimFlow/flowReducer.js`, `components/ResetFailedCard.jsx` |
| `lib/events.js` | `components/ClaimCard.jsx`, `components/PastOrderCard.jsx`, `components/WarrantyClaimCard.jsx` |
| `lib/notifications.js` | `components/JourneyDevPanel.jsx`, `components/JourneyNotificationPanel.jsx` |
| `data/journeys/cancellation.js` | `data/journey.js` |
| `data/journeys/claimChangeOfMind.js` | `data/journey.js` |
| `data/journeys/claimCompensation.js` | `data/journey.js` |
| `data/journeys/claimIssue.js` | `data/journey.js` |
| `data/journeys/claimWarranty.js` | `data/journey.js` |
| `data/journeys/happyPath.js` | `data/journey.js` |
| `data/journeys/initialOrder.js` | `data/journey.js` |
| `data/notifications/claims.js` | `data/notifications/index.js` |
| `data/notifications/index.js` | `lib/notifications.js` |
| `data/notifications/orders.js` | `data/notifications/index.js` |
| `data/notifications/shipment.js` | `data/notifications/index.js` |
| `data/orders/baseline.js` | `data/orders.js` |
| `data/orders/claims.js` | `data/orders.js` |
| `data/orders/compensation.js` | `data/orders.js` |
| `data/orders/warranty.js` | `data/orders.js` |
| `lib/edd.js` | `lib/eddSandbox.js` |
| `lib/eddSandbox.js` | `App.jsx` |
| `lib/journey.js` | `App.jsx` |

### Source-of-truth spine

_Internal edges among `lib/` + `data/` only. Component→lib edges live in the consumers table above (too many to draw)._

```mermaid
graph LR
  data_journey_js["data/journey.js"]
  data_journeys_cancellation_js["data/journeys/cancellation.js"]
  data_journeys_claimChangeOfMind_js["data/journeys/claimChangeOfMind.js"]
  data_journeys_claimCompensation_js["data/journeys/claimCompensation.js"]
  data_journeys_claimIssue_js["data/journeys/claimIssue.js"]
  data_journeys_claimWarranty_js["data/journeys/claimWarranty.js"]
  data_journeys_happyPath_js["data/journeys/happyPath.js"]
  data_journeys_initialOrder_js["data/journeys/initialOrder.js"]
  data_notifications_claims_js["data/notifications/claims.js"]
  data_notifications_index_js["data/notifications/index.js"]
  data_notifications_orders_js["data/notifications/orders.js"]
  data_notifications_shipment_js["data/notifications/shipment.js"]
  data_orders_js["data/orders.js"]
  data_orders_baseline_js["data/orders/baseline.js"]
  data_orders_claims_js["data/orders/claims.js"]
  data_orders_compensation_js["data/orders/compensation.js"]
  data_orders_warranty_js["data/orders/warranty.js"]
  lib_claims_js["lib/claims.js"]
  lib_countries_js["lib/countries.js"]
  lib_devices_js["lib/devices.js"]
  lib_edd_js["lib/edd.js"]
  lib_eddSandbox_js["lib/eddSandbox.js"]
  lib_events_js["lib/events.js"]
  lib_journey_js["lib/journey.js"]
  lib_notifications_js["lib/notifications.js"]
  lib_returns_js["lib/returns.js"]
  lib_statuses_js["lib/statuses.js"]
  data_journey_js --> data_journeys_initialOrder_js
  data_journey_js --> data_journeys_happyPath_js
  data_journey_js --> data_journeys_cancellation_js
  data_journey_js --> data_journeys_claimChangeOfMind_js
  data_journey_js --> data_journeys_claimWarranty_js
  data_journey_js --> data_journeys_claimIssue_js
  data_journey_js --> data_journeys_claimCompensation_js
  data_notifications_index_js --> data_notifications_orders_js
  data_notifications_index_js --> data_notifications_shipment_js
  data_notifications_index_js --> data_notifications_claims_js
  data_orders_js --> data_orders_baseline_js
  data_orders_js --> data_orders_claims_js
  data_orders_js --> data_orders_warranty_js
  data_orders_js --> data_orders_compensation_js
  lib_eddSandbox_js --> data_journey_js
  lib_eddSandbox_js --> lib_edd_js
  lib_journey_js --> data_journey_js
  lib_journey_js --> lib_countries_js
  lib_notifications_js --> data_notifications_index_js
  lib_notifications_js --> lib_claims_js
  lib_statuses_js --> lib_countries_js
```

_Generated by `scripts/codemap.mjs` — 88 modules, 24299 LOC. Re-run after structural changes; do not hand-edit between the markers._

<!-- codemap:generated:end -->
