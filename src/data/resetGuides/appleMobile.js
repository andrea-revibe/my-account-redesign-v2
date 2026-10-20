import { APPLE_REMOTE } from './remote'

// G1 — iPhone & iPad (Apple Find My / Activation Lock). Copy from the
// "Guided resets for returns and warranties" doc; menu names as Apple writes
// them. `{noun}` is filled from the variant (iPhone / iPad). The same steps for
// a return and a warranty; erasing is the customer's choice, at the end.
export default {
  id: 'apple_mobile',
  code: 'G1',
  label: 'iPhone & iPad',
  erase: 'optional',
  account: ['apple'],
  variants: [
    { id: 'iphone', label: 'iPhone', noun: 'iPhone', frame: 'phone', os: 'ios', category: 'iPhone', title: 'iPhone 13' },
    { id: 'ipad', label: 'iPad', noun: 'iPad', frame: 'tablet', os: 'ipados', category: 'Tablet', title: 'iPad Pro 11″' },
  ],
  steps: [
    {
      id: 'backup',
      title: 'Back up your {noun}',
      body: 'Back up anything you want to keep now. Whether it’s a return or a repair, the {noun} may be wiped — your data is your responsibility, and we can’t recover it.',
      path: ['Settings', '[your name]', 'iCloud', 'iCloud Backup', 'Back Up Now'],
      notes: [{ when: 'Not enough iCloud space', text: 'Back up to a Mac (Finder) or a Windows PC (Apple Devices app) instead.' }],
    },
    {
      id: 'stolen_off',
      title: 'Turn off Stolen Device Protection',
      body: 'Do this at home or another familiar place. Anywhere else it asks for Face ID or Touch ID, waits an hour, then asks again. Already off? Go to the next step.',
      path: ['Settings', 'Face ID & Passcode', 'Stolen Device Protection'],
      notes: [{ when: 'iOS 17.2 or earlier', text: 'It isn’t there — go to the next step.' }],
      mock: { iphone: 'ios_stolen_off', ipad: 'ipad_stolen_off' },
    },
    {
      id: 'sign_out',
      title: 'Sign out of your Apple Account',
      body: 'Open Settings, tap your name, then Sign Out. This turns off Find My and Activation Lock.',
      path: ['Settings', '[your name]', 'Sign Out'],
      notes: [
        { when: 'iOS 26 or later', text: 'If it offers to erase the {noun} as well, that’s optional — only choose it if you’ve backed up.' },
        { when: 'iOS 18 or earlier', text: 'Enter your Apple Account password, then tap Turn Off.' },
      ],
      mock: { iphone: 'ios_signout', ipad: 'ipad_signout' },
    },
    {
      id: 'passcode_off',
      title: 'Turn off Face ID and your passcode',
      body: 'Tap Turn Passcode Off and confirm. This turns off Face ID or Touch ID too, so there’s no passcode to share with us.',
      path: ['Settings', 'Face ID & Passcode', 'Turn Passcode Off'],
      notes: [{ when: 'Home button models', text: 'Settings › Touch ID & Passcode › Turn Passcode Off.' }],
      mock: { iphone: 'ios_passcode_off', ipad: 'ipad_passcode_off' },
    },
    {
      id: 'signed_out',
      revibe: true,
      title: 'Check you’re signed out',
      body: 'Open Settings. The top should say “Sign in to your {noun}” — no name, no photo, no email. Still see your name? Go back and sign out again.',
      mock: { iphone: 'ios_signed_out', ipad: 'ipad_signed_out' },
    },
    {
      id: 'erase',
      erase: true,
      title: 'Erase all content and settings',
      body: 'Tap Erase {noun}. If asked about an eSIM, choose to erase the eSIM profile — your carrier reactivates the plan on your new device.',
      path: ['Settings', 'General', 'Transfer or Reset {noun}', 'Erase All Content and Settings'],
      notes: [{ when: 'iOS 14 or earlier', text: 'Settings › General › Reset › Erase All Content and Settings.' }],
      mock: { iphone: 'ios_erase', ipad: 'ipad_erase' },
    },
    {
      id: 'hello',
      erase: true,
      revibe: true,
      title: 'Check for the “Hello” screen',
      body: 'You’re done when the setup screen (“Hello”) appears. Leave it there — don’t set it up again.',
      mock: { iphone: 'ios_hello', ipad: 'ipad_hello' },
    },
  ],
  remote: APPLE_REMOTE,
}
