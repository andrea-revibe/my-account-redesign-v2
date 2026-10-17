// G1 — iPhone & iPad (Apple Find My / Activation Lock). Copy from the
// "Guided resets for returns and warranties" doc; menu names as Apple writes
// them. `{noun}` is filled from the variant (iPhone / iPad).
export default {
  id: 'apple_mobile',
  code: 'G1',
  label: 'iPhone & iPad',
  share: '64%',
  modes: ['return', 'repair'],
  account: ['apple'],
  variants: [
    { id: 'iphone', label: 'iPhone', noun: 'iPhone', frame: 'phone', category: 'iPhone', title: 'iPhone 13' },
    { id: 'ipad', label: 'iPad', noun: 'iPad', frame: 'tablet', category: 'Tablet', title: 'iPad Pro 11″' },
  ],
  steps: [
    {
      id: 'sign_out',
      modes: ['return'],
      title: 'Sign out of your Apple Account',
      body: 'Open Settings, tap your name, then Sign Out.',
      path: ['Settings', '[your name]', 'Sign Out'],
      notes: [
        { when: 'iOS 26 or later', text: 'Choose Erase this {noun}. This signs out and erases in one go — skip the next step.' },
        { when: 'iOS 18 or earlier', text: 'Enter your Apple Account password, then tap Turn Off.' },
      ],
      mock: { iphone: 'ios_signout', ipad: 'ipad_signout' },
      trouble: {
        label: 'It won’t let me turn off Find My',
        body: 'Stolen Device Protection blocks it away from a familiar location: Face ID or Touch ID, a one-hour security delay, then Face ID or Touch ID again. Turn it off at home under Settings › Face ID & Passcode › Stolen Device Protection.',
      },
    },
    {
      id: 'erase',
      modes: ['return'],
      title: 'Erase all content and settings',
      body: 'Enter your passcode, then tap Erase {noun}. If asked about an eSIM, choose to erase the eSIM profile — your carrier reactivates the plan on your new device.',
      path: ['Settings', 'General', 'Transfer or Reset {noun}', 'Erase All Content and Settings'],
      notes: [{ when: 'iOS 14 or earlier', text: 'Settings › General › Reset › Erase All Content and Settings.' }],
      mock: { iphone: 'ios_erase', ipad: 'ipad_erase' },
    },
    {
      id: 'hello',
      modes: ['return'],
      final: true,
      revibe: true,
      title: 'Check for the “Hello” screen',
      body: 'You’re done when the setup screen (“Hello”) appears. Leave it there — don’t set it up again.',
      mock: { iphone: 'ios_hello', ipad: 'ipad_hello' },
    },
    {
      id: 'repair_prep',
      modes: ['repair'],
      title: 'Back up and clear Wallet',
      body: 'Back up your {noun}. Turn off Apple Cash and remove your cards from Wallet. If Settings shows a “Finish Repair” item from an earlier repair, complete it first.',
      path: ['Settings', 'Wallet & Apple Pay'],
    },
    {
      id: 'find_my_off',
      modes: ['repair'],
      title: 'Turn off Find My',
      body: 'This lifts Activation Lock so the repairer can test the device. Your data stays on it.',
      path: ['Settings', '[your name]', 'Find My', 'Find My {noun}', 'Off'],
      notes: [
        { when: 'iOS 27 or later', text: 'You can instead open the Find My app › select the device › More › Repair or Trade In › Enable. Find My stays on during the repair.' },
      ],
      mock: { iphone: 'ios_signout', ipad: 'ipad_signout' },
      trouble: {
        label: 'It won’t let me turn it off',
        body: 'Stolen Device Protection needs Face ID or Touch ID, a one-hour delay, then Face ID or Touch ID again away from a familiar location. Do it at home before pickup day.',
      },
    },
    {
      id: 'passcode_off',
      modes: ['repair'],
      final: true,
      revibe: true,
      title: 'Turn your passcode off',
      body: 'Apple says not to share your passcode, and its repairers won’t ask for it. Turn it off for the repair instead, and turn it back on when the device is back.',
      path: ['Settings', 'Face ID & Passcode', 'Turn Passcode Off'],
    },
  ],
  cantUse: {
    withYou: [
      { modes: ['return', 'repair'], title: 'Changed the passcode in the last 72 hours?', body: 'iOS 17 or later: tap Forgot Passcode? › Enter Previous Passcode, then set a new one.' },
      { modes: ['return'], title: 'Forgot the passcode', body: 'On the “{noun} Unavailable” screen tap Forgot Passcode? › Start {noun} Reset › enter your Apple Account password › Erase {noun}. Needs iOS 15.2 or later, Find My on, and Wi-Fi or mobile data.' },
      { modes: ['return'], title: 'No “Forgot Passcode?” option', body: 'Reset with a computer: turn the {noun} off, connect it, and hold the side button (Face ID models, iPhone 8, SE 2nd/3rd gen), volume down (iPhone 7) or Home (iPhone 6s and earlier) until the recovery screen appears › Mac: Finder › Restore; Windows: Apple Devices app › Restore. A computer restore doesn’t remove Activation Lock — also do the “already sent” steps.' },
      { modes: ['repair'], title: 'Forgot the passcode', body: 'Don’t erase it — your data would be lost. Continue and we’ll advise on the next step.' },
      { modes: ['return', 'repair'], title: 'Broken screen, or it won’t turn on', body: 'Use the “already sent” steps from another device. A device that won’t turn on is offline, so removing it clears Activation Lock at once.' },
    ],
    sent: [
      { modes: ['return'], title: 'Erase and remove it from Find My', body: 'On another iPhone or iPad: Find My › Devices › the {noun} › More › Erase (no phone number or message) › when erased, Remove This Device › Remove. Or at icloud.com/find › All Devices › the {noun} › Erase This Device › Remove This Device.' },
      { modes: ['repair'], title: 'Remove it from Find My', body: 'At icloud.com/find or in the Find My app, choose Remove This Device only — skip Erase. It works while the device is offline.' },
      { modes: ['return', 'repair'], title: 'What this does', body: 'Erased and removed: Activation Lock is off at once. Online and not erased: it can only be marked Ready for Repair or Trade In for 30 days.' },
      { modes: ['return'], title: 'Then change your password', body: 'Change your Apple Account password once the device is removed.' },
    ],
  },
}
