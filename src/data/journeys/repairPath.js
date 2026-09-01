// The repair-and-ship-back tail, shared by every journey that can end in a
// repair rather than a refund.
//
// Extracted from claimWarranty.js when the returns redesign made a repair
// reachable from the issue journey too: the remedy screen offers refund | repair
// under standard warranty | repair accidental damage from one screen, so
// `claim_issue` needed a repair terminal it never had. Both journeys spread this
// array in rather than duplicating ~7 nodes (they already duplicate the head and
// the inbound-transit chain; this stops the divergence growing).
//
// Node ids are NOT namespaced per journey — `useJourney` resolves ids within the
// active journey's own `nodes` array, so the same ids appearing in two journeys
// is the established pattern here, not a collision.
//
// Adjacency matters: nodes without an explicit `next` fall through to the next
// entry in the journey's array, so this block must be spread as one contiguous
// run and kept in order.
//
// Two exports: the submit nodes a customer's remedy choice lands on, and the
// tail those both eventually run through.
//
// REPAIR_TAIL_NODES entry point is `claim_repair_quote`; terminal is
// `claim_device_returned`. Both submit nodes point at `claim_proof_accepted`,
// which each host journey defines itself.
import { repairQuoteSplit } from '../../lib/coverage'

export const REPAIR_SUBMIT_NODES = [
  {
    id: 'claim_submitted_warranty',
    label: 'Warranty claim submitted',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_proof_accepted', 'claim_docs_rejected', 'claim_cancelled'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'WrJrn1',
        claimStatusId: 'initiated',
        type: 'warranty',
        submittedAt: '25 May 2026 · 4:02 PM',
        milestones: { createdAt: '2026-05-25', docsClearedAt: '2026-05-25', asOf: '2026-05-25' },
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery_drain',
        issueDetails: {
          description:
            'Battery drains in under 4 hours of light use, even after a factory reset.',
          attachmentName: 'IMG_0710.jpg',
        },
        // Shape parity with the refund-flow mocks — warranty intake
        // doesn't collect a reason field, but ClaimDetailsSheet reads
        // it defensively in shared rows.
        reason: { value: 'other', otherText: '' },
        devicePrep: { option: 'reset', os: 'ios' },
        pickupDetails: {
          address: o.address,
          email: o.email,
          phone: o.phone,
        },
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Wednesday, 27 May',
          slot: '10 AM – 12 PM',
        },
        timeline: { initiated: '25 May · 4:02 PM' },
        // Placeholder repair window — refined once QC completes and the
        // claim advances to `under_repair`. Matches `buildClaim`'s
        // initial-submit shape (expectedCompletionFor('warranty')).
        repairWindow: {
          expectedComplete: 'Mon, 8 Jun',
          expectedCompleteLong: 'Monday, 8 June',
          note: "We'll confirm the exact repair window after inspection.",
        },
      },
    }),
  },
  // ----- Accidental-damage variant of the submit node. Same repair pipeline and
  //       the same `claim.created` event (the copy doesn't split by cause yet) —
  //       what differs is the entitlement frozen onto the claim: `cause:
  //       'accidental'` + `coverage` drive the "Revibe Care · accidental damage"
  //       arm label and the cover line on the tracking surfaces. Mirrors what
  //       `buildClaim` writes when the customer picks "Repair accidental
  //       damage" on the remedy screen. lib/coverage.js owns the semantics.
  {
    id: 'claim_submitted_warranty_accidental',
    label: 'Warranty claim submitted — accidental damage',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_proof_accepted', 'claim_docs_rejected', 'claim_cancelled'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'WrJrn1',
        claimStatusId: 'initiated',
        type: 'warranty',
        submittedAt: '25 May 2026 · 4:02 PM',
        milestones: { createdAt: '2026-05-25', docsClearedAt: '2026-05-25', asOf: '2026-05-25' },
        units: 1,
        remedy: 'accidental',
        // Raised inside the first year, so the standard warranty is still live —
        // but a fault the customer caused is only ever covered by Revibe Care.
        coverage: 'standard',
        cause: 'accidental',
        issueScope: 'not_working',
        issueSubtypeId: 'screen',
        issueDetails: {
          description:
            'Dropped it on tiles — the screen is cracked across the top third and the touch is dead in that strip.',
          attachmentName: 'IMG_0742.jpg',
        },
        reason: { value: 'other', otherText: '' },
        devicePrep: { option: 'reset', os: 'ios' },
        pickupDetails: {
          address: o.address,
          email: o.email,
          phone: o.phone,
        },
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Wednesday, 27 May',
          slot: '10 AM – 12 PM',
        },
        timeline: { initiated: '25 May · 4:02 PM' },
        repairWindow: {
          expectedComplete: 'Mon, 8 Jun',
          expectedCompleteLong: 'Monday, 8 June',
          note: "We'll confirm the exact repair window after inspection.",
        },
      },
    }),
  },
]

export const REPAIR_TAIL_NODES = [
  // ----- Repair cost confirmed. Placeholder for the accidental-damage cost
  //       check: Revibe Care covers repairs up to the market cap
  //       (ACCIDENTAL_DAMAGE_CAP in lib/coverage.js), so a quote has to clear
  //       that ceiling before any work starts. This node only models the
  //       *within-cover* outcome — the over-cap branch (quote the customer,
  //       accept / decline / return the device) is not built yet, so there is
  //       no customer surface and no card-state change here. Notification beat
  //       only; see docs/output/warranties_compensations.md.
  {
    id: 'claim_repair_quote',
    label: 'Repair cost confirmed — within cover',
    trigger: 'system',
    event: 'claim.repair.quoted',
    // Explicit rather than array-adjacent: the over-cap sibling below now sits
    // between this node and `claim_under_repair`, so fall-through would send
    // the within-cover path into the gate.
    next: ['claim_under_repair'],
    apply: (o) => o,
  },
  // ----- Over-cap outcome. The quote clears the market cap, so Revibe Care
  //       can't absorb the whole job and the claim pauses at `qc` behind
  //       `claim.repairQuote` — the sixth takeover surface (RepairQuoteCard).
  //       The claim's own `claimStatusId` deliberately does NOT move: this is a
  //       gate on the existing state, like the other five takeovers, not a new
  //       pipeline step. lib/coverage.js owns the split arithmetic.
  {
    id: 'claim_repair_quote_over_cap',
    label: 'Repair cost confirmed — over cover',
    trigger: 'system',
    event: 'claim.repair.quote_over_cap',
    next: ['claim_repair_excess_paid', 'claim_repair_declined'],
    apply: (o) => {
      const split = repairQuoteSplit(o, 1780)
      return {
        ...o,
        claim: {
          ...o.claim,
          repairQuote: {
            ...split,
            summary: 'Screen assembly, rear housing and camera module',
            quotedAt: '30 May · 9:40 AM',
            deadline: '2026-06-04',
            deadlineLabel: 'Respond by Thu, 4 Jun',
            paidAt: null,
            declinedAt: null,
          },
          actionRequired: {
            kind: 'repair_over_cap',
            deadline: '2026-06-04',
            deadlineLabel: 'Respond by Thu, 4 Jun',
          },
        },
      }
    },
  },
  // ----- Customer turns the quote down: the device ships home untouched, free
  //       of charge (they declined a price, they didn't raise a bad claim — so
  //       this is NOT the invalid-claim pay-return-shipping gate). `declinedAt`
  //       retires the takeover and rides along the ship-back tail, where the
  //       warranty card's headline / tone / explanation read it so nothing
  //       claims a repair that never happened.
  {
    id: 'claim_repair_declined',
    label: 'Repair declined — device returned unrepaired',
    trigger: 'customer',
    event: 'claim.repair.declined',
    next: ['claim_ship_back_created'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        repairQuote: {
          ...o.claim.repairQuote,
          declinedAt: '30 May · 6:18 PM',
        },
      },
    }),
  },
  // ----- Customer covers the excess, so the repair runs exactly as a
  //       within-cover one would. Deliberately array-adjacent to
  //       `claim_under_repair`: no explicit `next`, so it falls straight through
  //       and rejoins the happy tail.
  {
    id: 'claim_repair_excess_paid',
    label: 'Repair excess paid — repair approved',
    trigger: 'customer',
    event: 'claim.repair.excess_paid',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        repairQuote: {
          ...o.claim.repairQuote,
          paidAt: '30 May · 1:05 PM',
        },
      },
    }),
  },
  {
    id: 'claim_under_repair',
    label: 'Under repair',
    trigger: 'system',
    event: 'claim.repair.started',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'under_repair',
        timeline: { ...o.claim.timeline, under_repair: '30 May · 2:12 PM' },
        milestones: { ...o.claim.milestones, decidedAt: '2026-05-30', asOf: '2026-05-30' },
        // Sharpen the placeholder repair window now that QC has cleared and the
        // seller has committed to a fix. The note names the actual work, so it
        // follows what the customer declared: accidental damage is a screen
        // job, a defect on these mocks is the battery. Mirrors mock 89610.
        repairWindow: {
          expectedComplete: 'Mon, 8 Jun',
          expectedCompleteLong: 'Monday, 8 June',
          note:
            o.claim?.cause === 'accidental'
              ? 'Screen replacement — typically wraps up within 7–10 days.'
              : 'Battery replacement — typically wraps up within 7–10 days.',
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_created',
    label: 'Ship-back AWB created',
    trigger: 'system',
    event: 'claim.ship_back.created',
    // Ship-back country fork — the AWB-created node already set the repaired
    // unit's shipment in motion, so SA/Others skip the four granular ship-back
    // sub-statuses straight to device_returned (no detailed tracking). AE/ZA
    // walk them. country_split.md §6.
    next: [
      { id: 'claim_ship_back_arrived_destination', countries: ['AE', 'ZA'] },
      { id: 'claim_device_returned', countries: ['SA', 'Others'] },
    ],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'ship_back',
        timeline: { ...o.claim.timeline, ship_back: '8 Jun · 11:05 AM' },
        milestones: { ...o.claim.milestones, asOf: '2026-06-08' },
        shipBack: {
          courier: 'DHL Express',
          awb: '25193620',
          estimatedDelivery: 'Jun 12',
          estimatedDeliveryLong: 'Friday, 12 June',
          subStatusId: null,
          subTimeline: {},
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_arrived_destination',
    label: 'Ship-back arrived in destination country',
    trigger: 'system',
    event: 'claim.ship_back.arrived_destination',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'arrived_destination',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            arrived_destination: '10 Jun · 8:30 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_cleared_customs',
    label: 'Ship-back cleared customs',
    trigger: 'system',
    event: 'claim.ship_back.cleared_customs',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'cleared_customs',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            cleared_customs: '10 Jun · 11:15 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_forwarded_to_agent',
    label: 'Ship-back forwarded to third-party agent',
    trigger: 'system',
    event: 'claim.ship_back.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'forwarded_to_agent',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            forwarded_to_agent: '11 Jun · 4:45 PM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_out_for_delivery',
    label: 'Ship-back out for delivery',
    trigger: 'system',
    event: 'claim.ship_back.out_for_delivery',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'out_for_delivery',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            out_for_delivery: '12 Jun · 7:30 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_device_returned',
    label: 'Device returned',
    trigger: 'system',
    event: 'claim.device.returned',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'device_returned',
        timeline: { ...o.claim.timeline, device_returned: '12 Jun · 3:14 PM' },
        milestones: { ...o.claim.milestones, asOf: '2026-06-12' },
        shipBack: {
          ...o.claim.shipBack,
          deliveredOn: '2026-06-12',
          deliveredOnLong: 'Friday, 12 June',
          // Fresh NSYS condition report for the repaired unit we sent back —
          // the "Verified by NSYS" chip re-appears on the returned device.
          conditionReport: {
            url: 'https://www.nsys.com/',
            reportId: 'NSYS-WAR-89610-R2',
          },
        },
      },
    }),
  },
]
