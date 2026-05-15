// Sub-issues shown under Step 1 → "Return for a refund or replacement". Two scopes:
//   not_working   — the device is faulty
//   wrong_device  — the unit doesn't match what was ordered
//
// Each entry carries the minimum evidence we ask of the customer.
// `tryFirst` is optional and used only where a quick self-check often
// resolves the symptom before a return is needed.

export const PROOF_GUIDE_LABEL = 'How to provide valid proof'

export const ISSUE_SCOPES = [
  {
    id: 'not_working',
    label: 'Device not working as expected',
    sub: 'Hardware fault, software bug, or accessory issue',
  },
  {
    id: 'wrong_device',
    label: 'I received the wrong device',
    sub: 'Colour, storage, language, or specs don’t match',
  },
]

export const NOT_WORKING_SUBTYPES = [
  {
    id: 'battery',
    label: 'Battery draining',
    need: 'A screenshot of Settings → Battery → Battery Health showing the current capacity %.',
  },
  {
    id: 'software',
    label: 'Software issue',
    need: 'A short video of the issue, filmed with another device. If it can’t be filmed, describe when it happens and an agent will follow up.',
  },
  {
    id: 'physical',
    label: 'Physical condition',
    need: 'A photo or short video of the damage, taken with another device. Show the affected area in good lighting.',
  },
  {
    id: 'screen',
    label: 'Screen issue',
    tryFirst:
      'If touch feels unresponsive, raise Touch sensitivity in Settings first — this fixes the issue for some screen protectors.',
    need: 'If it persists, a short video of the issue filmed with another device.',
  },
  {
    id: 'charger',
    label: 'Defective charger',
    tryFirst:
      'Use the charger that shipped with the device — third-party chargers can cause the same symptoms.',
    need: 'If charging still fails, a short video or photo taken with another device showing what happens.',
  },
  {
    id: 'overheating',
    label: 'Overheating',
    need: 'Tell us when it overheats (charging, gaming, idle?). Photos or a short video help if you have them.',
  },
  {
    id: 'camera',
    label: 'Camera issue',
    need: 'A short video showing the camera fault, filmed with another device.',
  },
  {
    id: 'microphone',
    label: 'Microphone issue',
    need: 'A short voice memo or video where the microphone problem is audible.',
  },
  {
    id: 'button',
    label: 'Button issue',
    need: 'A short video showing the unresponsive button, filmed with another device.',
  },
  {
    id: 'speaker',
    label: 'Speaker issue',
    need: 'A short video where the speaker fault is audible, filmed with another device.',
  },
  {
    id: 'software_updates',
    label: 'Software updates not available',
    tryFirst:
      'Check Settings → System → Software update first — updates can take a few days to reach every device.',
    need: 'If nothing appears, send a screenshot of that screen so we can check on our side.',
  },
  {
    id: 'language_not_supported',
    label: 'My language isn’t supported',
    need: 'A screenshot of Settings → Languages showing the options available on the device.',
  },
  {
    id: 'international_version',
    label: 'International version limitation',
    need: 'Tell us which feature is missing (e.g. Arabic input, a regional band). A screenshot of Settings → About or → Languages helps us confirm the variant.',
  },
  {
    id: 's_pen',
    label: 'S Pen not working or not attached',
    need: 'A short video showing the S Pen behaviour (or its absence), filmed with another device.',
  },
  {
    id: 'other_account',
    label: 'Phone is linked to another account',
    need: 'A screenshot of the lock or activation screen showing the account prompt.',
  },
  {
    id: 'other',
    label: 'Something else',
    need: 'Describe what’s going on in your own words on the next step — an agent will pick it up and reach out.',
  },
]

export const WRONG_DEVICE_SUBTYPES = [
  {
    id: 'wrong_language',
    label: 'Wrong language',
    need: 'A photo of the device showing the system language, taken with another device.',
  },
  {
    id: 'wrong_storage',
    label: 'Wrong storage',
    need: 'A screenshot of Settings → About phone showing total storage capacity.',
  },
  {
    id: 'wrong_specs',
    label: 'Wrong specs',
    need: 'A photo or screenshot showing the spec that doesn’t match — model number, RAM, region code, etc.',
  },
  {
    id: 'wrong_color',
    label: 'Wrong colour',
    need: 'A clear photo of the device taken with another device, with the colour visible.',
  },
]

export function findSubtype(id) {
  return (
    NOT_WORKING_SUBTYPES.find((s) => s.id === id) ||
    WRONG_DEVICE_SUBTYPES.find((s) => s.id === id) ||
    null
  )
}

export function scopeForSubtype(id) {
  if (NOT_WORKING_SUBTYPES.some((s) => s.id === id)) return 'not_working'
  if (WRONG_DEVICE_SUBTYPES.some((s) => s.id === id)) return 'wrong_device'
  return null
}
