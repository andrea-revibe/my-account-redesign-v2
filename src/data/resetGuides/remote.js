// Remote unlink for every Apple device, two parallel routes the customer
// switches between: Find My on another iPhone or iPad, or icloud.com/find in
// a computer's browser. Same three steps either way — unlink only; removing
// an offline device lifts Activation Lock straight away, and erasing stays the
// customer's own call.
const ERASE_NOTE = {
  when: 'Want it wiped too',
  text: 'Choose Erase This Device first. Only if you’ve backed up — your data is your responsibility.',
}

export const APPLE_REMOTE = {
  routes: [
    {
      id: 'device',
      label: 'On another iPhone',
      steps: [
        {
          id: 'fm_open',
          title: 'Open Find My on another device',
          body: 'Use another iPhone or iPad signed in to your Apple Account, open Find My and tap Devices. If the {noun} is with you, turn it off first.',
          help: { label: 'Can’t sign in to your Apple Account?', to: 'account_apple' },
          mock: 'fm_devices',
        },
        {
          id: 'fm_remove',
          title: 'Choose Remove This Device',
          body: 'Tap your {noun}, scroll to the bottom of its card and tap Remove This Device. It may show as offline — that’s fine.',
          notes: [ERASE_NOTE],
          mock: 'fm_device',
        },
        {
          id: 'fm_confirm',
          revibe: true,
          title: 'Confirm Remove',
          body: 'Tap Remove. The {noun} is off your Apple Account and Activation Lock is lifted. To be safe, change your Apple Account password afterwards.',
          mock: 'fm_confirm',
        },
      ],
    },
    {
      id: 'web',
      label: 'In a browser',
      steps: [
        {
          id: 'web_open',
          title: 'Sign in at icloud.com/find',
          body: 'On any computer, go to icloud.com/find, sign in with your Apple Account and choose All Devices. If the {noun} is with you, turn it off first.',
          help: { label: 'Can’t sign in to your Apple Account?', to: 'account_apple' },
          mock: 'web_signin',
        },
        {
          id: 'web_remove',
          title: 'Choose Remove This Device',
          body: 'Select your {noun} in the list, then Remove This Device. It may show as offline — that’s fine.',
          notes: [ERASE_NOTE],
          mock: 'web_device',
        },
        {
          id: 'web_confirm',
          revibe: true,
          title: 'Confirm Remove',
          body: 'Select Remove. The {noun} is off your Apple Account and Activation Lock is lifted. To be safe, change your Apple Account password afterwards.',
          mock: 'web_confirm',
        },
      ],
    },
  ],
}
