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
    { id: 'iphone', label: 'iPhone', noun: 'iPhone', frame: 'phone', os: 'ios', category: 'iPhone', title: 'iPhone 13' },
    { id: 'ipad', label: 'iPad', noun: 'iPad', frame: 'tablet', os: 'ipados', category: 'Tablet', title: 'iPad Pro 11″' },
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
      mock: { iphone: 'ios_wallet', ipad: 'ipad_wallet' },
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
      mock: { iphone: 'ios_findmy_off', ipad: 'ipad_findmy_off' },
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
      mock: { iphone: 'ios_passcode_off', ipad: 'ipad_passcode_off' },
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'passcode', icon: 'lock', title: 'I forgot my passcode', sub: 'Locked out, or “{noun} Unavailable” is showing', to: 'pc_recent' },
      { id: 'broken', icon: 'power', title: 'The screen’s broken or it won’t turn on', sub: 'Fix it from another device or a browser', to: 'remote' },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Apple Account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_apple' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent it to Revibe', sub: 'Fix it from another device or a browser', to: 'remote' },
    ],
    nodes: {
      pc_recent: {
        ask: 'Did you change your passcode in the last 3 days?',
        sub: 'If you still remember the old one, you can use it to get back in.',
        options: [
          { label: 'Yes, and I remember the old one', to: 'pc_previous' },
          { label: 'No', to: { return: 'pc_erase', repair: 'pc_repair' } },
        ],
      },
      pc_previous: {
        title: 'Get back in with your old passcode',
        steps: [
          { text: 'Enter a passcode until “{noun} Unavailable” appears.' },
          { text: 'Tap these at the bottom of the screen.', path: ['Forgot Passcode?', 'Enter Previous Passcode'] },
          { text: 'Enter your old passcode, then set a new one.' },
          { text: 'Unlock your {noun} and carry on with the guide.' },
        ],
        tip: 'Needs iOS 17 or later.',
        more: [{ label: 'Don’t see “Enter Previous Passcode”?', to: { return: 'pc_erase', repair: 'pc_repair' } }],
        resume: true,
      },
      pc_erase: {
        title: 'Erase your {noun} from the lock screen',
        steps: [
          { text: 'Enter a passcode until “{noun} Unavailable” appears.' },
          { text: 'Tap these at the bottom of the screen.', path: ['Forgot Passcode?', 'Start {noun} Reset'] },
          { text: 'Enter your Apple Account password to sign out.', help: { label: 'Don’t know it?', to: 'account_apple' } },
          { text: 'Tap Erase {noun} and wait while it erases.', path: ['Erase {noun}'] },
          { text: 'You’re done when the “Hello” setup screen appears. Leave it there — don’t set it up again.' },
        ],
        tip: 'Needs Wi-Fi or mobile data, and iOS 15.2 or later.',
        more: [{ label: 'No “Forgot Passcode?” button?', to: 'restore_model' }],
      },
      pc_repair: {
        title: 'Don’t erase your {noun}',
        body: 'Erasing it would delete your data. Continue, and we’ll tell you the next step before pickup.',
      },
      restore_model: {
        ask: 'Which {noun} do you have?',
        sub: 'Each model starts recovery mode with a different button.',
        options: [
          { when: { variant: ['iphone'] }, label: 'iPhone 8 or newer', sub: 'Includes iPhone SE (2nd and 3rd generation)', to: 'restore_side' },
          { when: { variant: ['iphone'] }, label: 'iPhone 7 or 7 Plus', to: 'restore_volume' },
          { when: { variant: ['iphone'] }, label: 'iPhone 6s or older', sub: 'Includes iPhone SE (1st generation)', to: 'restore_home' },
          { when: { variant: ['ipad'] }, label: 'No Home button', sub: 'Face ID, or Touch ID in the top button', to: 'restore_top' },
          { when: { variant: ['ipad'] }, label: 'Has a Home button', to: 'restore_home' },
        ],
      },
      restore_side: {
        title: 'Restore it with a computer',
        steps: [{ text: 'Turn the {noun} off. Then hold the side button and keep holding while you plug it into a Mac or PC.' }],
        then: 'restore',
      },
      restore_volume: {
        title: 'Restore it with a computer',
        steps: [{ text: 'Turn the {noun} off. Then hold the volume down button and keep holding while you plug it into a Mac or PC.' }],
        then: 'restore',
      },
      restore_home: {
        title: 'Restore it with a computer',
        steps: [{ text: 'Turn the {noun} off. Then hold the Home button and keep holding while you plug it into a Mac or PC.' }],
        then: 'restore',
      },
      restore_top: {
        title: 'Restore it with a computer',
        steps: [{ text: 'Turn the {noun} off. Then hold the top button and keep holding while you plug it into a Mac or PC.' }],
        then: 'restore',
      },
      restore: {
        steps: [
          { text: 'Let go when the recovery screen (a computer and a cable) appears.' },
          { text: 'On the computer, open your {noun} and choose Restore.', path: ['Restore'], note: 'Mac: in Finder. Windows PC: in the Apple Devices app.' },
          { text: 'Wait until the restore finishes and the {noun} restarts.' },
        ],
        then: 'remote',
      },
      remote: {
        title: { return: 'Erase it and remove it from Find My', repair: 'Remove it from Find My' },
        lead: 'A restore doesn’t remove Activation Lock. Finish with these steps',
        steps: [
          {
            text: 'On another iPhone or iPad, open Find My and select your {noun}.',
            path: ['Find My', 'Devices', '[your {noun}]'],
            note: 'No other Apple device? Sign in at icloud.com/find in any browser and choose All Devices.',
            help: { label: 'Can’t sign in?', to: 'account_apple' },
          },
          { modes: ['return'], text: 'Choose Erase This Device. Skip the phone number and message.', path: ['Erase This Device'] },
          { modes: ['return'], text: 'Once it shows as erased, choose Remove This Device, then Remove.', path: ['Remove This Device', 'Remove'] },
          { modes: ['repair'], text: 'Choose Remove This Device, then Remove. Don’t erase it — your data stays on it.', path: ['Remove This Device', 'Remove'] },
          { modes: ['return'], text: 'To be safe, change your Apple Account password afterwards.' },
        ],
        tip: {
          return: 'Once it’s erased and removed, Activation Lock is off straight away.',
          repair: 'If the {noun} is off or offline, removing it lifts Activation Lock straight away.',
        },
      },
    },
  },
}
