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

export { INITIAL_ORDER }

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
    initialOrder: INITIAL_ORDER,
    nodes: CANCELLATION_NODES,
  },
  {
    id: 'claim_change_of_mind',
    label: 'Change-of-mind claim',
    initialOrder: {
      ...INITIAL_ORDER,
      paymentMethod: { type: 'bnpl', provider: 'tabby', brand: 'Tabby' },
      deviceOs: 'android',
      product: {
        name: 'Samsung Galaxy S21',
        variant: 'Phantom Black · 128 GB · Good',
        category_name: 'Samsung phone',
        image: '/iphone-midnight.png',
      },
    },
    nodes: CLAIM_COM_NODES,
  },
  {
    id: 'claim_issue',
    label: 'Issue / wrong-device claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_ISSUE_NODES,
  },
  {
    id: 'claim_warranty',
    label: 'Warranty claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_WARRANTY_NODES,
  },
  {
    id: 'claim_compensation',
    label: 'Compensation claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_COMPENSATION_NODES,
  },
]
