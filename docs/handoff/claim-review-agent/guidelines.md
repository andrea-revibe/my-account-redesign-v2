# Claim Proof Review Guidelines

**The policy this agent reviews against.** This is the source-of-truth rubric for deciding
whether a customer's *raise-a-claim → issue* submission has provided **proof that a genuine,
good-faith effort was made to evidence the claim**. It pairs with `system_prompt.md` (the
agent's operating instructions + output schema) and the `proof/` image library (the canonical
references you compare submissions against).

> **Calibration: balanced.** A genuine effort *passes the gate* even when imperfect — but you
> still record every quality gap so a human or a follow-up message can ask for better. You are
> **not** matching the golden standard pixel-for-pixel (too strict) and you are **not** waving
> through anything non-blank (too lenient). Reward honest effort; flag the gaps; only **fail**
> for non-effort, the wrong subject, or a clear issue mismatch. See §2.

> **Derived from the live flow.** The per-issue asks, media types, golden mappings, and the
> universal checklist below are extracted from `src/components/ClaimFlow/issueTaxonomy.js` and
> `src/components/ClaimFlow/IssueEvidence.jsx` (the source of truth the customer-facing flow
> renders). If those change, re-sync §3–§5 here. The bundled images are a point-in-time copy of
> `public/proof/`.

---

## 0. The job in one line

For each submission you receive **the claimed issue + the customer's description + their uploaded
photos/videos**. Decide: *did this customer make a genuine effort to evidence the issue they're
claiming?* Emit a **verdict (pass / borderline / fail)**, the **gaps** that hold it back, and a
short **rationale**. You are a triage layer — a human makes the final money decision; your job is
to separate clear-good and clear-bad from the genuinely-ambiguous, and to tell the human *why*.

---

## 1. The two-part proof standard

Every issue submission is judged against **two** proof concepts. Keep them distinct — a customer
can satisfy one and miss the other.

| | What it proves | Source | Required? |
|---|---|---|---|
| **Issue-specific proof** | The *specific fault being claimed* is real and visible/audible (the cracked screen, the draining battery, the lock prompt). | Per-issue `need` line (§5) + golden example for the category (§4). | Yes, **unless** the issue is marked *proof-optional* or *free-text* (§6). |
| **Universal minimum-required** | The device wasn't **tampered with** and is **packed safely** for return — true for *every* claim regardless of issue. | The 4-item checklist (§3). | Always expected. Missing items are a gap, not always a hard fail — see §2. |

A strong submission shows **both**: it evidences the claimed fault *and* shows the device is intact
+ packed. A submission that only does one is **borderline** at best.

---

## 2. The genuine-effort rubric (balanced)

Decide the verdict in this order. Stop at the first that applies.

### FAIL — not a genuine effort, or the claim doesn't hold up
- **No usable media** where media is required: no files, corrupt/unopenable, a blank/black frame, a
  screenshot of an unrelated app, a stock/internet image, or a duplicate of an example you provided.
- **Wrong subject entirely:** the media shows a different device, someone else's screen, or nothing
  related to the claimed fault (e.g. claim is "cracked screen", photo is of a charger box).
- **Clear issue mismatch:** the proof contradicts the claim (claim "won't turn on" but the video
  shows the device on and working; claim "wrong colour" but it's the ordered colour).
- **Evidence of bad faith:** signs of staged/induced damage, edited/photoshopped screens, or proof
  that the damage is customer-caused in a way the claim denies.

### BORDERLINE — effort is visible but the proof is incomplete or unclear
- Genuine attempt, but the **one shot that would confirm the fault is missing or unreadable** (e.g.
  battery claim with a description but no Battery Health screenshot; crack claim too blurry/far to
  confirm).
- **Issue-specific proof present but minimum-required largely absent** (device intact/packing not
  shown at all), or vice-versa.
- **Ambiguous match:** the media is plausibly the claimed fault but you can't be confident (low
  light, partial frame, fault not clearly triggered on camera).
- Anything you'd want a human to glance at before approving.

### PASS — a genuine effort that evidences the claim
- The **claimed fault is visible/audible** in the media (meets the issue's `need`, §5), **and**
- the device looks **untampered** and the universal items are **substantially** shown (§3) — minor
  gaps are fine to *record* without dropping to borderline, **and**
- **no contradiction** between proof and claim.
- Imperfections (slightly soft focus, one universal shot missing but the rest clearly fine, extra
  irrelevant photos) are **logged as gaps** but do **not** by themselves block a pass.

**Proof-optional issues** (e.g. overheating, §6): a clear, specific *description* of when the fault
occurs **passes** even with no media. Absence of media is **not** a gap for these.

**Free-text issues** ("Something else…"): there is no fixed `need`. Pass if the description is a
genuine, specific account of a real problem; media is a bonus, never required. Route to a human.

---

## 3. The universal minimum-required checklist

Shown to **every** customer regardless of issue. Confirms the device wasn't tampered with and is
packed safely. Compare the customer's general device shots against these four references.

| # | Item | What it must show | Reference image |
|---|---|---|---|
| 1 | **Screen** | The full front of the device — no cracks, scratches, or marks. | `proof/minimum-required/minimum-required-proof2.jpg` |
| 2 | **Back & camera** | The back of the device and the camera lenses, undamaged. | `proof/minimum-required/minimum-required-proof4.jpeg` |
| 3 | **Accessories** | Everything that came with the device (e.g. the charging cable). | `proof/minimum-required/minimum-required-proof.jpg` |
| 4 | **Packed safely** | Wrapped in the original plastic sleeve or other protective material. | `proof/minimum-required/minimum-required-proof3.jpeg` |

> **Reading the screen item against a damage claim.** For a *screen-damage* or *body-damage* claim
> the "no cracks" framing of item 1 is the baseline, not a contradiction — the customer is showing
> the damage *as* the fault. Don't fail a crack claim for "screen shows cracks." The screen item is
> about ruling out *tampering / unrelated new damage*, not denying the claimed fault.

Mark each of the four as **present / unclear / missing** in your output.

---

## 4. Golden proofs — what "the bar" looks like, per category

The **golden example** is the single reference that defines acceptable issue-specific proof for an
entire category, when the specific issue has no bespoke samples of its own. It always leads with the
*one thing that makes the proof verifiable* for that kind of fault. Use these as your mental
yardstick for "good" — **not** as a strict template to match.

| Category | The bar (what makes it verifiable) | Golden reference |
|---|---|---|
| **Battery, charging & heat** | A short video filmed with another device showing the symptom — what happens when you plug it in, or a close-up of any swelling. Keep the cable, port and screen in frame. | `proof/golden/battery.png` |
| **Screen & physical condition** | Up close and well-lit, from a few angles — fill the frame with the crack, scratch or gap so an agent can confirm the exact damage. | `proof/golden/screen-body.png`, `screen-body2.png`, `screen-body3.png` |
| **Camera, mic & speaker** | A short video where the fault is visible or audible — e.g. filming a call so we can hear the mic or speaker problem. | `proof/golden/camera-audio2.png` |
| **Software & region** | Capture the symptom on screen — film the feature failing (e.g. a contactless / NFC scan) or screenshot the actual error message. | `proof/golden/software.png`, `software2.png` |
| **Account & activation lock** | A clear photo or screenshot of the exact lock or account prompt the device shows on startup — readable enough to see the account name. | `proof/account-lock/account-lock2.png` |
| **Something else** | *(no golden — free-text; judge the description, see §6)* | — |

### Bespoke "best-case" examples (issue-specific, richer than the golden)

A few issues ship their own worked examples — these are the *ideal* submission for that exact issue.

| Issue | Ideal proof | Reference image(s) |
|---|---|---|
| **Battery drains too fast** | Two photos taken ~an hour apart showing how fast the battery % drops. | `proof/battery-draining/battery-draining-timestamp1.png`, `battery-draining-timstamp2.png` |
| **Battery drains too fast** | The Battery Health screen — capacity %, plus any "battery isn't genuine" warning. | `proof/battery-draining/battery-health-report.png` |
| **Asks for a previous owner's password** | The login screen asking for the password — clear enough that the prompt and any account name are readable. | `proof/account-lock/account-lock.png`, `account-lock2.png` |
| **Gets too hot in use** *(proof-optional)* | A temperature-warning screen — ideal *if one appears*, otherwise a description is enough. | `proof/overheating/overheating.png` |

---

## 5. Per-issue evidence contract (the `need` for every issue)

What the customer was *asked* to provide. Judge their proof against the matching row. `media`
column: **photo / video / both** (`both` = describe + optional media). The golden for the issue's
category (§4) is the fallback yardstick when no bespoke example exists.

### Device not working (scope: `not_working`)

**Battery, charging & heat**
| Issue | media | The ask (`need`) |
|---|---|---|
| Battery drains too fast | photo | Screenshot of *Settings → Battery → Battery Health* showing capacity %, **plus** two photos of the battery % taken ~an hour apart. |
| Won't charge / won't turn on | video | If the supplied charger in another socket doesn't help, a short video (filmed on another device) of what happens when plugged in. |
| Gets too hot in use | photo | **Proof-optional.** Tell us *when* it overheats; a photo of any warning screen or a short video helps if available. |
| Something else with power | both | Describe it on the next step — an agent picks it up. |

**Screen & physical condition**
| Issue | media | The ask (`need`) |
|---|---|---|
| Screen (cracked / lines / touch) | video | A short video of the issue filmed with another device. |
| Body damage or scratches | photo | A photo or short video of the damage, another device, good lighting. |
| A button isn't working | video | A short video showing the unresponsive button. |
| S Pen not working / not attached | video | *(Samsung only)* A short video showing the S Pen behaviour or its absence. |
| Something else with the body | both | Describe it on the next step. |

**Camera, mic & speaker**
| Issue | media | The ask (`need`) |
|---|---|---|
| Camera issue | video | A short video showing the camera fault. |
| Microphone issue | video | A short video where the mic problem is **audible**. |
| Speaker issue | video | A short video where the speaker fault is **audible**. |
| Something else with audio or camera | both | Describe it on the next step. |

**Software & region**
| Issue | media | The ask (`need`) |
|---|---|---|
| Software bug or glitch | video | A short video; if it can't be filmed, describe when it happens. |
| Software updates not available | photo | After checking *Settings → System → Software update*, a screenshot of that screen. |
| My language isn't supported | photo | A screenshot of *Settings → Languages* showing available options. |
| International-version limitation | photo | Say which feature is missing; a screenshot of *Settings → About* / *Languages* helps confirm the variant. |
| Something else with software | both | Describe it on the next step. |

**Account & activation lock**
| Issue | media | The ask (`need`) |
|---|---|---|
| Linked to another account | photo | A screenshot of the lock/activation screen showing the account prompt. *(Copy adapts: iCloud on Apple, Google on Android.)* |
| Asks for a previous owner's password | photo | A photo/screenshot of the screen asking for the password. **Coverage rule:** covered *if the prompt is visible in the proof and there's no physical damage*. |
| Something else with the account | both | Describe it on the next step. |

**Something else** — free-text category, no fixed `need`. Judge the description (§6).

### Wrong device received (scope: `wrong_device`)
| Issue | media | The ask (`need`) |
|---|---|---|
| Wrong colour | photo | A clear photo (another device) with the colour visible. |
| Wrong storage | photo | A screenshot of *Settings → About phone* showing total storage capacity. |
| Wrong specs or model | photo | A photo/screenshot showing the mismatched spec — model number, RAM, region code, etc. |
| Wrong language / region version | photo | A photo of the device showing the system language. |

---

## 6. Special rules & edge cases

- **Proof-optional issues** (`overheat`, and any `proofOptional` issue): media is *not* required. A
  specific description of when/how the fault occurs is sufficient to **pass**. Don't log "no media"
  as a gap. A warning-screen capture, if present, strengthens it.
- **Free-text / "Something else"** (`freeText` category, all `*_other` issues, `media: both`): no
  fixed proof. Pass on a genuine, specific description; media is a bonus. These are **always**
  routed to a human — set low confidence on any auto-leaning verdict.
- **`tryFirst` self-checks** (e.g. "try the supplied charger first", "try factory passcodes 1111 /
  0000 / 1234", "raise Touch sensitivity"): these are customer pre-steps, **not** proof
  requirements. Never fail a claim for not documenting a tryFirst step — but if the description
  shows they *did* troubleshoot, that's positive genuine-effort signal.
- **Previous-owner-password coverage** (`prev_owner_pw`): covered **only if** the password/lock
  prompt is visible in the proof **and** there's no physical damage. A claim with no readable prompt
  is *borderline* (ask for the prompt shot); visible physical damage alongside it is a *fail signal*
  for this specific coverage.
- **Brand-adapted asks** (`linked_account`): the expected screen differs by OS — *Activation Lock /
  "iPhone is linked to an Apple Account"* on iOS, *Factory Reset Protection / Google account* on
  Android. Match the proof to the device's OS, not to one fixed screen.
- **Condition-graded devices:** a device sold as graded (not "excellent") may legitimately show
  cosmetic wear that is **not** the claimed fault. Don't treat pre-existing graded wear as a
  contradiction or as customer-caused damage.
- **Media-type leniency:** if an issue asks for a *video* but the fault is fully evidenced by a clear
  *photo* (or vice-versa), don't fail on format alone — judge whether the fault is actually
  demonstrated. Note the format mismatch as a minor gap.
- **More is fine:** extra, irrelevant, or duplicate photos are not a problem on their own — just
  don't let them substitute for the one shot that confirms the fault.

---

## 7. Gap taxonomy — the structured gaps to emit

When the verdict is **borderline** or **pass-with-gaps**, list gaps using these `type` values so
downstream tooling and customer follow-ups stay consistent. Each gap carries a `severity`:
**`blocker`** (the reason it isn't a clean pass) or **`quality`** (logged, doesn't block).

| `type` | Meaning |
|---|---|
| `missing_issue_proof` | The issue-specific shot that confirms the fault is absent. |
| `unreadable` | Present but too blurry / dark / far / low-res to confirm. |
| `wrong_medium` | Photo where a video is needed to show the fault (or vice-versa). |
| `fault_not_demonstrated` | Media is of the right device but the fault isn't actually triggered/visible/audible. |
| `missing_minimum_screen` | Universal item 1 (front screen) not shown. |
| `missing_minimum_back` | Universal item 2 (back & camera) not shown. |
| `missing_minimum_accessories` | Universal item 3 (accessories) not shown. |
| `missing_minimum_packing` | Universal item 4 (safe packing) not shown. |
| `prompt_not_readable` | Account/lock prompt present but the account name / text isn't legible. |
| `description_too_vague` | Free-text/optional-proof case where the description lacks specifics. |
| `possible_mismatch` | Proof may contradict the claim — flag for a human. |
| `other` | Anything not covered above; explain in `detail`. |

---

## 8. Image manifest — every bundled reference

All paths relative to this handoff folder. These are a snapshot of `public/proof/` in the live flow.

| File | Role | Caption / what it shows |
|---|---|---|
| `proof/minimum-required/minimum-required-proof2.jpg` | Universal #1 | Screen — full front, no cracks/scratches. |
| `proof/minimum-required/minimum-required-proof4.jpeg` | Universal #2 | Back & camera — undamaged. |
| `proof/minimum-required/minimum-required-proof.jpg` | Universal #3 | Accessories — everything included (e.g. cable). |
| `proof/minimum-required/minimum-required-proof3.jpeg` | Universal #4 | Packed safely — protective wrap. |
| `proof/golden/battery.png` | Golden — Battery/heat | Symptom video still; cable/port/screen in frame. |
| `proof/golden/screen-body.png` | Golden — Screen/body | Up-close, well-lit damage (angle 1). |
| `proof/golden/screen-body2.png` | Golden — Screen/body | Up-close damage (angle 2). |
| `proof/golden/screen-body3.png` | Golden — Screen/body | Up-close damage (angle 3). |
| `proof/golden/camera-audio2.png` | Golden — Camera/mic/speaker | Fault visible/audible (e.g. filmed call). |
| `proof/golden/software.png` | Golden — Software/region | On-screen symptom / failing feature (1). |
| `proof/golden/software2.png` | Golden — Software/region | Error message / failing feature (2). |
| `proof/account-lock/account-lock2.png` | Golden — Account lock **+** bespoke | Lock/account prompt, account name readable. |
| `proof/account-lock/account-lock.png` | Bespoke — prev-owner password | Login screen requesting the password. |
| `proof/battery-draining/battery-draining-timestamp1.png` | Bespoke — battery drain | Battery % at time A. |
| `proof/battery-draining/battery-draining-timstamp2.png` | Bespoke — battery drain | Battery % ~an hour later (drop visible). |
| `proof/battery-draining/battery-health-report.png` | Bespoke — battery drain | Battery Health capacity % screen. |
| `proof/overheating/overheating.png` | Bespoke — overheat (optional) | iOS temperature-warning screen. |

> Filename note: `battery-draining-timstamp2.png` is spelled exactly as in the repo (missing the
> "e") — keep it verbatim if you reference paths programmatically.
