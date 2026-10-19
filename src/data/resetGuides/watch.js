// G5 — Apple Watch. One flow for Return and Repair: unpairing is Apple's
// requirement for both.
export default {
  id: 'watch',
  code: 'G5',
  label: 'Apple Watch',
  share: '0.3%',
  modes: ['single'],
  account: ['apple'],
  variants: [
    { id: 'apple_watch', label: 'Apple Watch', noun: 'Apple Watch', frame: 'watch', category: 'Watch', title: 'Apple Watch Series 8' },
  ],
  steps: [
    {
      id: 'unpair',
      title: 'Unpair it from your iPhone',
      body: 'Keep the iPhone and the watch close together. Tap ⓘ next to the watch › Unpair Apple Watch, then enter your Apple Account password. Unpairing erases the watch and removes Activation Lock.',
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
  cantUse: {
    symptoms: [
      { id: 'broken', icon: 'power', title: 'It’s broken, or I don’t have the paired iPhone', sub: 'Fix it from another device or a browser', to: 'remote' },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Apple Account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_apple' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent it to Revibe', sub: 'Fix it from another device or a browser', to: 'remote' },
    ],
    nodes: {
      remote: {
        title: 'Erase it and remove it from Find My',
        steps: [
          { text: 'On any iPhone signed in to your Apple Account, open Find My and select the watch.', path: ['Find My', 'Devices', '[your Apple Watch]'], note: 'No iPhone? Sign in at icloud.com/find in any browser and choose All Devices.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
          { text: 'Choose Erase This Device, then Erase.', path: ['Erase This Device', 'Erase'] },
          { text: 'Once it’s erased, choose Remove This Device.', path: ['Remove This Device'] },
        ],
        tip: 'This turns off Activation Lock.',
      },
    },
  },
}
