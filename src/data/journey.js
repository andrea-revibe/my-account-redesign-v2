// Journey mode — opt-in demo where a single order replays through one
// lifecycle, advanced step-by-step via the JourneyDevPanel. Each node's
// `apply(order)` returns the order's full shape *at that node* (merging onto
// the previous state), so the App can replay from each journey's
// `initialOrder` to any visited node without keeping intermediate copies.
//
// `trigger` / `event` are documentation fields: they're surfaced by the dev
// panel and exported into docs/output/journey_backend_spec.md so the
// prototype doubles as a backend-event spec for production engineering.
//
// Branching: a node may declare `next: [...nodeIds]`. When set, those are
// the legal forward transitions from that node. When omitted, the default
// is "next node in the array order" — keeps linear journeys terse. Terminal
// nodes must explicitly set `next: []` if they aren't last in the array.
//
// Order routing in App.jsx is data-driven — moving statusId / subStatusId /
// state / cancellation* / claim through these nodes is enough to walk the
// order through InProgressCard → OrderCard → PastOrderCard etc. with no
// journey-specific branches in the rendering tree.
import { INITIAL_ORDER } from './journeys/initialOrder'
import { HAPPY_PATH_NODES } from './journeys/happyPath'
import { CANCELLATION_NODES } from './journeys/cancellation'
import { CLAIM_COM_NODES } from './journeys/claimChangeOfMind'
import { CLAIM_WARRANTY_NODES } from './journeys/claimWarranty'
import { CLAIM_ISSUE_NODES } from './journeys/claimIssue'
import { CLAIM_COMPENSATION_NODES } from './journeys/claimCompensation'
import {
  withInTransitClaim,
  IN_TRANSIT_ENTRY_STAGES,
} from './journeys/inTransitClaim'

export { INITIAL_ORDER }

// Each claim journey also lets the customer raise the claim from the in-flight
// hero (before delivery), gated by a silent agent delivery-confirmation step.
// Grafted on here so the branch is identical across all four — see
// journeys/inTransitClaim.js. `submitNodeIds` are that journey's existing
// post-delivery submission nodes; the confirmed branch reuses them so the
// wallet/card / compensation-subtype fork is preserved.
const inTransit = (nodes, submitNodeIds) =>
  withInTransitClaim(nodes, {
    entryStageIds: IN_TRANSIT_ENTRY_STAGES,
    submitNodeIds,
  })

export const JOURNEYS = [
  {
    id: 'happy_path',
    label: 'Happy path',
    initialOrder: INITIAL_ORDER,
    nodes: HAPPY_PATH_NODES,
  },
  // Sandbox journey — no node graph. Inputs (market + four dates) live in
  // useEddSandbox; the dev panel branches on `kind: 'sandbox'` and renders
  // EddSandboxPanel instead of the Next-button JourneyDevPanel. See
  // src/lib/edd.js for the underlying model.
  {
    id: 'dynamic_edd',
    label: 'Dynamic EDD',
    kind: 'sandbox',
    initialOrder: INITIAL_ORDER,
    nodes: [],
  },
  {
    id: 'cancellation',
    label: 'Cancellation',
    // Split-paid (card + gift card): the original-payment refund fork pays
    // back along the same split (card → card, gift card → Wallet); the wallet
    // fork stays whole-to-wallet. The split is derived from `paymentSplit` by
    // the refund surfaces + lib/wallet, so the existing nodes need no changes.
    initialOrder: { ...INITIAL_ORDER, paymentSplit: { card: 343, giftCard: 686 } },
    nodes: CANCELLATION_NODES,
  },
  {
    id: 'claim_change_of_mind',
    label: 'Change-of-mind claim',
    initialOrder: {
      ...INITIAL_ORDER,
      paymentMethod: { type: 'bnpl', provider: 'tabby', brand: 'Tabby' },
      // Split-paid (Tabby BNPL + gift card): the original-payment refund fork
      // pays the BNPL portion back to Tabby and the gift-card portion to the
      // Wallet; the wallet fork stays whole-to-wallet. Derived from
      // `paymentSplit` — the card/original nodes need no changes.
      paymentSplit: { card: 343, giftCard: 686 },
      deviceOs: 'android',
      product: {
        name: 'Samsung Galaxy S21',
        variant: 'Phantom Black · 128 GB · Good',
        category_name: 'Samsung phone',
        image: '/iphone-cutout.png',
      },
    },
    nodes: inTransit(CLAIM_COM_NODES, [
      'claim_submitted_wallet',
      'claim_submitted_card',
    ]),
  },
  {
    id: 'claim_issue',
    label: 'Issue / wrong-device claim',
    initialOrder: INITIAL_ORDER,
    nodes: inTransit(CLAIM_ISSUE_NODES, [
      'claim_submitted_wallet',
      'claim_submitted_card',
    ]),
  },
  {
    id: 'claim_warranty',
    label: 'Warranty claim',
    initialOrder: INITIAL_ORDER,
    nodes: inTransit(CLAIM_WARRANTY_NODES, ['claim_submitted_warranty']),
  },
  {
    id: 'claim_compensation',
    label: 'Compensation claim',
    initialOrder: INITIAL_ORDER,
    nodes: inTransit(CLAIM_COMPENSATION_NODES, [
      'claim_submitted_shipping_refund',
      'claim_submitted_charger',
    ]),
  },
]
