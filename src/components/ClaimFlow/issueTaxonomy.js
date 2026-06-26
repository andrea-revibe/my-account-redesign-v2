// Issue taxonomy for the redesigned device-fault + wrong-item branches.
// Six recognisable categories → ≤5 specific issues each (RETURNS-FLOW-SPEC §4
// branch B), replacing the old ~16-item flat dropdown. Each specific issue
// carries the evidence contract the downstream `evidence` step + IssueEvidence
// read (`need` / `mediaType` / `proofGuideUrl` / `examples` / `tryFirst`) — the
// same shape the old issueSubtypes entries had, so the evidence surface keeps
// working. `scope` ('not_working' | 'wrong_device') is preserved for buildClaim
// + the review summary.
//
// A charger is an accessory, so it is NOT in here — it lives in the
// compensation branch (keep the device, get compensated).
import {
  BatteryMedium,
  Smartphone,
  Camera,
  Cpu,
  Lock,
  MoreHorizontal,
} from 'lucide-react'
import { deviceOsForOrder } from '../../lib/devices'

export const PROOF_GUIDE_LABEL = 'How to provide valid proof'

// Fallback help-centre article for issues without a more specific guide.
export const DEFAULT_PROOF_GUIDE_URL =
  'https://help.revibe.me/en-US/how-to-show-us-your-issue-960883'

// Shared help-centre article covering microphone / speaker / camera / button faults.
const HARDWARE_PROOF_GUIDE_URL =
  'https://help.revibe.me/en-US/hardware-issue-(microphone--speaker-(audio)--camera--buttons)-960927?_gl=1*17pnefx*_gcl_au*MTU2NDEzOTE4NC4xNzMzOTgyMTY1*FPAU*MTU2NDEzOTE4NC4xNzMzOTgyMTY1*_ga*MTk2ODQ5NzkxNC4xNzMzOTgyMTY2*_ga_96V2M67WKP*MTczNDUxNDczNS4yLjEuMTczNDUxNjcwMS4wLjAuMTYzOTc5MzY0NA..*_fplc*VGI1bGF5YUI1SWxWcDBOQ3JxSzlnJTJGWFNJUDZYMlc1b0w2aExFTlk5ZFp3VmV4QkJJY3NkJTJGNzhXcHl6dnlJSmZ3U0lHUnpBRU54bWdXWlJOMldrV2I3b0clMkJyeElqMkZURWtGaThYQWJPWTZBcnhWak5lOFJTTnZoayUyQkpPY1ElM0QlM0Q.'

const BATTERY_PROOF_GUIDE_URL =
  'https://help.revibe.me/en-US/battery-draining-960854?_gl=1*1m6h8ve*_gcl_au*MTU2NDEzOTE4NC4xNzMzOTgyMTY1*FPAU*MTU2NDEzOTE4NC4xNzMzOTgyMTY1*_ga*MTk2ODQ5NzkxNC4xNzMzOTgyMTY2*_ga_96V2M67WKP*MTczNDUxNDczNS4yLjEuMTczNDUxNjcwMS4wLjAuMTYzOTc5MzY0NA..*_fplc*VGI1bGF5YUI1SWxWcDBOQ3JxSzlnJTJGWFNJUDZYMlc1b0w2aExFTlk5ZFp3VmV4QkJJY3NkJTJGNzhXcHl6dnlJSmZ3U0lHUnpBRU54bWdXWlJOMldrV2I3b0clMkJyeElqMkZURWtGaThYQWJPWTZBcnhWak5lOFJTTnZoayUyQkpPY1ElM0QlM0Q.'

const CONDITION_GUIDE_URL =
  'https://help.revibe.me/en-US/what-are-revibe-device-conditions-352750'

const BATTERY_EXAMPLES = [
  {
    caption:
      'Two photos taken about an hour apart, showing how fast the battery % drops.',
    images: [
      '/proof/battery-draining/battery-draining-timestamp1.png',
      '/proof/battery-draining/battery-draining-timstamp2.png',
    ],
  },
  {
    caption:
      'The Battery Health screen — capacity %, plus any “battery isn’t genuine” warning.',
    images: ['/proof/battery-draining/battery-health-report.png'],
  },
]

// Bespoke proof for the previous-owner passcode lock. Placeholder art today —
// swap in the real lock-screen captures.
const PASSCODE_EXAMPLES = [
  {
    caption:
      'The login screen asking for the password — clear enough that the prompt and any account name are readable.',
    images: [
      '/proof/account-lock/account-lock.png',
      '/proof/account-lock/account-lock2.png',
    ],
  },
]

// Bespoke proof for overheating — the iOS temperature-warning screen is the
// clearest capturable symptom. Still optional (see proofOptional on the issue);
// shown with an "Optional" chip.
const OVERHEAT_EXAMPLES = [
  {
    caption:
      'A temperature warning screen like this is ideal — but only if one appears. Otherwise just tell us when it overheats.',
    images: ['/proof/overheating/overheating.png'],
  },
]

// One "golden example" per category: the fallback proof shown when a specific
// issue has no bespoke `examples` of its own (resolved by evidenceSubFor). The
// caption leads with the one thing that makes proof verifiable for that *kind*
// of issue (up-close damage, the on-screen error, the lock prompt…). Placeholder
// art today — swap in real reference photos under public/proof/golden/.
const GOLDEN_BATTERY = {
  caption:
    'A short video filmed with another device showing the symptom — what happens when you plug it in, or a close-up of any swelling. Keep the cable, port and screen in frame.',
  images: ['/proof/golden/battery.png'],
}
const GOLDEN_SCREEN_BODY = {
  caption:
    'Up close and well-lit, from a few angles — fill the frame with the crack, scratch or gap so an agent can confirm the exact damage.',
  images: [
    '/proof/golden/screen-body.png',
    '/proof/golden/screen-body2.png',
    '/proof/golden/screen-body3.png',
  ],
}
const GOLDEN_CAMERA_AUDIO = {
  caption:
    'A short video where the fault is visible or audible — e.g. filming a call so we can hear the mic or speaker problem.',
  images: ['/proof/golden/camera-audio2.png'],
}
const GOLDEN_SOFTWARE = {
  caption:
    'Capture the symptom on screen — film the feature failing (here, a contactless / NFC scan) or screenshot the actual error message.',
  images: ['/proof/golden/software.png', '/proof/golden/software2.png'],
}
const GOLDEN_ACCOUNT_LOCK = {
  caption:
    'A clear photo or screenshot of the exact lock or account prompt the device shows on startup — readable enough to see the account name.',
  images: ['/proof/account-lock/account-lock2.png'],
}

// `something_else` is a category, not a list of radios — it's a free-text
// capture (and, in production, a switch-trigger point). Modelled with
// `freeText: true` so the specific screen renders a textarea instead.
export const ISSUE_CATEGORIES = [
  {
    id: 'battery_power',
    label: 'Battery, charging & heat',
    icon: BatteryMedium,
    goldenExample: GOLDEN_BATTERY,
    issues: [
      {
        id: 'battery_drain',
        label: 'Battery drains too fast',
        mediaType: 'photo',
        need: 'A screenshot of Settings → Battery → Battery Health showing the current capacity %, plus two photos of the battery percentage taken about an hour apart so we can see how fast it drains.',
        proofGuideUrl: BATTERY_PROOF_GUIDE_URL,
        examples: BATTERY_EXAMPLES,
      },
      {
        id: 'wont_charge',
        label: "Won't charge or won't turn on",
        mediaType: 'video',
        tryFirst:
          'Try the charger that shipped with the device, in a different socket — a faulty cable can cause the same symptom.',
        need: 'If it still won’t charge or power on, a short video filmed with another device showing what happens when you plug it in.',
      },
      {
        id: 'overheat',
        label: 'Gets too hot in use',
        mediaType: 'photo',
        proofOptional: true,
        need: 'Tell us when it overheats (charging, gaming, idle?). This one is hard to capture, so proof isn’t required — but a photo of any error or warning screen, or a short video, helps if you have one.',
        examples: OVERHEAT_EXAMPLES,
      },
      {
        id: 'power_other',
        label: 'Something else with power',
        mediaType: 'both',
        need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
      },
    ],
  },
  {
    id: 'screen_body',
    label: 'Screen & physical condition',
    icon: Smartphone,
    goldenExample: GOLDEN_SCREEN_BODY,
    issues: [
      {
        id: 'screen',
        label: 'Screen (cracked / lines / touch)',
        mediaType: 'video',
        tryFirst:
          'If touch feels unresponsive, raise Touch sensitivity in Settings first — this fixes the issue for some screen protectors.',
        need: 'If it persists, a short video of the issue filmed with another device.',
      },
      {
        id: 'body',
        label: 'Body damage or scratches',
        mediaType: 'photo',
        need: 'A photo or short video of the damage, taken with another device. Show the affected area in good lighting.',
        proofGuideUrl: CONDITION_GUIDE_URL,
      },
      {
        id: 'button',
        label: "A button isn't working",
        mediaType: 'video',
        need: 'A short video showing the unresponsive button, filmed with another device.',
        proofGuideUrl: HARDWARE_PROOF_GUIDE_URL,
      },
      {
        id: 'spen',
        label: 'S Pen not working / not attached',
        mediaType: 'video',
        samsungOnly: true,
        need: 'A short video showing the S Pen behaviour (or its absence), filmed with another device.',
      },
      {
        id: 'body_other',
        label: 'Something else with the body',
        mediaType: 'both',
        need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
      },
    ],
  },
  {
    id: 'camera_audio',
    label: 'Camera, mic & speaker',
    icon: Camera,
    goldenExample: GOLDEN_CAMERA_AUDIO,
    issues: [
      {
        id: 'camera',
        label: 'Camera issue',
        mediaType: 'video',
        need: 'A short video showing the camera fault, filmed with another device.',
        proofGuideUrl: HARDWARE_PROOF_GUIDE_URL,
      },
      {
        id: 'mic',
        label: 'Microphone issue',
        mediaType: 'video',
        need: 'A short video where the microphone problem is audible — film it so we can hear the fault.',
        proofGuideUrl: HARDWARE_PROOF_GUIDE_URL,
      },
      {
        id: 'speaker',
        label: 'Speaker issue',
        mediaType: 'video',
        need: 'A short video where the speaker fault is audible, filmed with another device.',
        proofGuideUrl: HARDWARE_PROOF_GUIDE_URL,
      },
      {
        id: 'av_other',
        label: 'Something else with audio or camera',
        mediaType: 'both',
        need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
      },
    ],
  },
  {
    id: 'software_region',
    label: 'Software & region',
    icon: Cpu,
    goldenExample: GOLDEN_SOFTWARE,
    issues: [
      {
        id: 'software_bug',
        label: 'Software bug or glitch',
        mediaType: 'video',
        need: 'A short video of the issue, filmed with another device. If it can’t be filmed, describe when it happens and an agent will follow up.',
      },
      {
        id: 'no_updates',
        label: 'Software updates not available',
        mediaType: 'photo',
        tryFirst:
          'Check Settings → System → Software update first — updates can take a few days to reach every device.',
        need: 'If nothing appears, send a screenshot of that screen so we can check on our side.',
      },
      {
        id: 'language',
        label: "My language isn't supported",
        mediaType: 'photo',
        need: 'A screenshot of Settings → Languages showing the options available on the device.',
      },
      {
        id: 'intl_version',
        label: 'International-version limitation',
        mediaType: 'photo',
        need: 'Tell us which feature is missing (e.g. Arabic input, a regional band). A screenshot of Settings → About or → Languages helps us confirm the variant.',
      },
      {
        id: 'sw_other',
        label: 'Something else with software',
        mediaType: 'both',
        need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
      },
    ],
  },
  {
    id: 'account_lock',
    label: 'Account & activation lock',
    icon: Lock,
    goldenExample: GOLDEN_ACCOUNT_LOCK,
    issues: [
      {
        id: 'linked_account',
        label: 'Linked to another account',
        // Brand-conditional copy resolved in resolveNeed / labelFor below
        // (iCloud on Apple, Google on Android).
        mediaType: 'photo',
        need: 'A screenshot of the lock or activation screen showing the account prompt.',
      },
      {
        id: 'prev_owner_pw',
        label: "Asks for a previous owner's password",
        mediaType: 'photo',
        need: 'A photo or screenshot of the screen asking for the password, so we can see exactly what it requests.',
        coverage:
          "We cover devices that arrive asking for a previous owner's passcode — as long as the prompt is visible in your proof and there's no physical damage.",
        tryFirst:
          "Try the common factory passcodes first — 1111, 0000 or 1234. If none unlock it, continue and we'll take it from here.",
        examples: PASSCODE_EXAMPLES,
      },
      {
        id: 'lock_other',
        label: 'Something else with the account',
        mediaType: 'both',
        need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
      },
    ],
  },
  {
    id: 'something_else',
    label: 'Something else',
    icon: MoreHorizontal,
    freeText: true,
    issues: [],
  },
]

// Wrong-item branch details (scope 'wrong_device'). RETURNS-FLOW-SPEC §4
// branch C.
export const WRONG_ITEM_DETAILS = [
  {
    id: 'wrong_colour',
    label: 'Wrong colour',
    mediaType: 'photo',
    need: 'A clear photo of the device taken with another device, with the colour visible.',
  },
  {
    id: 'wrong_storage',
    label: 'Wrong storage',
    mediaType: 'photo',
    need: 'A screenshot of Settings → About phone showing total storage capacity.',
  },
  {
    id: 'wrong_specs',
    label: 'Wrong specs or model',
    mediaType: 'photo',
    need: 'A photo or screenshot showing the spec that doesn’t match — model number, RAM, region code, etc.',
  },
  {
    id: 'wrong_region',
    label: 'Wrong language / region version',
    mediaType: 'photo',
    need: 'A photo of the device showing the system language, taken with another device.',
  },
]

// The fixed id used when the customer picks the free-text "Something else"
// category.
export const SOMETHING_ELSE_ID = 'something_else'

const SOMETHING_ELSE_ENTRY = {
  id: SOMETHING_ELSE_ID,
  label: 'Something else',
  mediaType: 'both',
  need: 'Describe what’s going on in your own words — an agent will pick it up and reach out. Add a photo or video if you have one.',
}

const ALL_ISSUES = [
  ...ISSUE_CATEGORIES.flatMap((c) => c.issues),
  ...WRONG_ITEM_DETAILS,
  SOMETHING_ELSE_ENTRY,
]

export function categoryById(id) {
  return ISSUE_CATEGORIES.find((c) => c.id === id) || null
}

export function findSpecificIssue(id) {
  return ALL_ISSUES.find((s) => s.id === id) || null
}

// The category a specific issue belongs to — used to resolve the category
// "golden example" fallback. Returns null for wrong-item details and the
// free-text something_else entry, which carry no category golden (they fall
// through to the universal checklist).
export function categoryForIssue(id) {
  return ISSUE_CATEGORIES.find((c) => c.issues.some((i) => i.id === id)) || null
}

// Scope the issue belongs to — the contract buildClaim + the review summary
// preserve.
export function scopeForIssue(id) {
  if (WRONG_ITEM_DETAILS.some((s) => s.id === id)) return 'wrong_device'
  return 'not_working'
}

function isSamsung(order) {
  const category = order?.product?.category_name ?? order?.category_name ?? ''
  return /samsung|galaxy/i.test(category)
}

// The specific issues to show for a category, filtered by device (S Pen only
// on Samsung — AC8).
export function visibleIssuesFor(categoryId, order) {
  const cat = categoryById(categoryId)
  if (!cat) return []
  return cat.issues.filter((i) => !i.samsungOnly || isSamsung(order))
}

// Display label, adapted by device where the spec calls for it (iCloud vs
// Google account lock — AC8).
export function labelForIssue(issue, order) {
  if (!issue) return ''
  if (issue.id === 'linked_account') {
    return deviceOsForOrder(order) === 'ios'
      ? 'Linked to another Apple Account (iCloud)'
      : 'Linked to another Google account'
  }
  return issue.label
}

// Evidence `need` copy, adapted by device for the account-lock case.
export function resolveNeed(issue, order) {
  if (!issue) return null
  if (issue.id === 'linked_account') {
    return deviceOsForOrder(order) === 'ios'
      ? 'A photo of the Activation Lock screen showing the “iPhone is linked to an Apple Account” prompt.'
      : 'A photo of the Factory Reset Protection screen showing the Google account it’s asking for.'
  }
  return issue.need
}

// The IssueEvidence-ready `sub` object for a chosen specific issue, with copy
// resolved for the order's device and the proof examples resolved via the
// tiered fallback: the issue's own bespoke `examples` if it has any, else its
// category's `goldenExample`, else none (the universal checklist still shows).
// `exampleKind` lets the card label the strip ('specific' vs 'golden').
export function evidenceSubFor(issueId, order) {
  const issue = findSpecificIssue(issueId)
  if (!issue) return null
  const bespoke = issue.examples?.length ? issue.examples : null
  const golden = bespoke ? null : categoryForIssue(issueId)?.goldenExample || null
  return {
    ...issue,
    need: resolveNeed(issue, order),
    label: labelForIssue(issue, order),
    examples: bespoke || (golden ? [golden] : []),
    exampleKind: bespoke ? 'specific' : golden ? 'golden' : null,
  }
}
