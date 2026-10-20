import { APPLE_REMOTE } from './remote'

// G5 — Apple Watch. One flow for every claim type: unpairing erases the watch
// and lifts Activation Lock, and the iPhone backs it up first.
export default {
  id: 'watch',
  code: 'G5',
  label: 'Apple Watch',
  account: ['apple'],
  variants: [
    { id: 'apple_watch', label: 'Apple Watch', noun: 'Apple Watch', frame: 'watch', category: 'Watch', title: 'Apple Watch Series 8' },
  ],
  steps: [
    {
      id: 'unpair',
      title: 'Unpair it from your iPhone',
      body: 'Keep the iPhone and the watch close together. Tap ⓘ next to the watch › Unpair Apple Watch, then enter your Apple Account password. Your iPhone backs the watch up first, then unpairing erases it and removes Activation Lock.',
      path: ['Apple Watch app', 'My Watch', 'All Watches', 'ⓘ', 'Unpair Apple Watch'],
      frame: 'phone',
      notes: [
        { when: 'Cellular models', text: 'Tap Remove Cellular Plan, then cancel the plan with your carrier (fees may apply).' },
        { when: 'watchOS 27 + iOS 27, repair', text: 'Instead of unpairing, you can turn on Ready for Repair or Trade In from the paired iPhone.' },
      ],
      trouble: {
        label: 'No iPhone at hand?',
        body: 'On the watch: Settings › General › Reset › Erase All Content and Settings › Erase All. This doesn’t remove Activation Lock, so also go to icloud.com/find › the watch › Remove This Device.',
      },
    },
    {
      id: 'pairing_screen',
      final: true,
      revibe: true,
      title: 'Check for the pairing screen',
      body: 'You’re done when the watch shows its pairing screen. Include the charger; for a repair, remove the band.',
    },
  ],
  remote: APPLE_REMOTE,
}
