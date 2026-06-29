# Claim Proof Review Agent — Handoff

A self-contained brief for an **LLM agent that reviews customer *raise-a-claim → issue* submissions
against Revibe's proof policy.** When a customer claims their device is faulty or wrong, they pick an
issue, describe it, and upload photos/videos. This agent decides whether they made a **genuine,
good-faith effort to evidence the claim**, and outputs a structured verdict a human can act on.

> Unlike the other folders in `docs/handoff/` (which brief *design/build agents working inside this
> repo*), this one briefs a **runtime agent that reviews live submissions**. Nothing here edits the
> prototype; it's a portable spec + reference library you can lift into wherever the agent runs.

## What's in here

| File | Purpose |
|---|---|
| **`system_prompt.md`** | The agent's operating instructions: its role, the submission it receives, the step-by-step review procedure, the calibration, and the JSON output schema. Start an implementation here. |
| **`guidelines.md`** | The **policy** the agent applies — the heart of the handoff. The two-part proof standard, the balanced genuine-effort rubric (pass/borderline/fail tests), the universal minimum-required checklist, the golden proofs per category, the per-issue ask for all issues, special-case rules, the gap taxonomy, and the image manifest. |
| **`proof/`** | The **reference image library** — a point-in-time copy of `public/proof/` from the live flow: `golden/` (category yardsticks), `minimum-required/` (the universal 4-shot checklist), and the bespoke per-issue examples (`battery-draining/`, `account-lock/`, `overheating/`). 17 images. |

## How the agent works (the short version)

1. It receives the **full submission**: the claimed issue (category + issue + scope + media type),
   the customer's **description**, and the **uploaded proof**, plus order/device context when
   available.
2. It looks up the **specific ask** for that issue and the **golden** reference for its category, and
   compares the proof against both the issue-specific standard and the universal minimum-required
   checklist.
3. It applies the **balanced** genuine-effort rubric and emits a **verdict (pass / borderline /
   fail)** with a structured list of **gaps**, a **rationale**, an optional **follow-up message**, a
   **confidence**, and a **route-to-human** flag.

**Calibration is balanced:** a genuine effort passes the gate even when imperfect (gaps are logged
for follow-up); only non-effort, the wrong subject, or a claim the proof contradicts fails; anything
ambiguous goes borderline and routes to a human. The agent triages — a human makes the final money
decision.

## The decisions baked in (settled with the owner)

| Decision | Choice |
|---|---|
| **Output** | Pass / borderline / fail verdict **+** structured gaps + rationale (human-in-the-loop triage). |
| **Inputs** | Full submission — issue type + customer description + uploaded proof images. |
| **Reference set** | All three image tiers — golden + minimum-required + bespoke per-issue examples. |
| **Strictness** | Balanced — genuine effort passes; quality gaps flagged for follow-up. |

## Provenance & keeping it fresh

The policy in `guidelines.md` §3–§5 is **derived from the live flow's source of truth**:
`src/components/ClaimFlow/issueTaxonomy.js` (the per-issue `need` / `mediaType` / `examples` / golden
mapping) and `src/components/ClaimFlow/IssueEvidence.jsx` (the universal `MINIMUM_PROOF_ITEMS`). The
`proof/` images are a snapshot of `public/proof/`. If the issue taxonomy, the per-issue asks, the
golden mappings, or the proof images change in the app, **re-sync §3–§5 and re-copy `proof/`** so the
agent reviews against current policy.
