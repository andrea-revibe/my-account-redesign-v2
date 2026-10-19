// G3 — Windows laptop (Microsoft account + BitLocker). One brand-neutral guide:
// the BIOS step names the common setup keys instead of one per manufacturer.
export default {
  id: 'windows',
  code: 'G3',
  label: 'Windows laptop',
  share: '16%',
  modes: ['return', 'repair'],
  privacy: true,
  account: ['microsoft'],
  variants: [
    { id: 'laptop', label: 'Windows laptop', noun: 'laptop', frame: 'laptop', os: 'windows', category: 'Laptop', title: 'Windows laptop' },
  ],
  steps: [
    {
      id: 'find_my_device',
      modes: ['return'],
      revibe: true,
      title: 'Turn off Find my device',
      body: 'Switch Find my device off before you reset.',
      path: ['Settings', 'Privacy & security', 'Find my device', 'Off'],
      notes: [{ when: 'Windows 10', text: 'Settings › Update & Security › Find my device.' }],
      trouble: {
        label: 'Is the drive encrypted?',
        body: 'If BitLocker or Device encryption is on, open your recovery key now at aka.ms/myrecoverykey from another device. Work or school laptops: aka.ms/aadrecoverykey, or ask your IT team.',
      },
    },
    {
      id: 'reset_pc',
      modes: ['return', 'repair'],
      when: { data: ['private'] },
      title: 'Reset this PC',
      body: 'Choose Remove everything › Cloud download, and under Change settings turn Clean data on. It can take an hour or two, and the screen can stay black for 15 minutes or more. Plug in the charger and don’t turn it off.',
      path: ['Settings', 'System', 'Recovery', 'Reset PC'],
      notes: [{ when: 'Windows 10', text: 'Settings › Update & Security › Recovery › under Reset this PC, select Get started.' }],
    },
    {
      id: 'repair_pin',
      modes: ['repair'],
      when: { data: ['keep'] },
      title: 'Set a temporary PIN',
      body: 'Back up first. Then set a temporary Windows Hello PIN and enter it below. A PIN only unlocks this one laptop — it isn’t your Microsoft account password. Change it back after the repair.',
      path: ['Settings', 'Accounts', 'Sign-in options', 'PIN (Windows Hello)', 'Change PIN'],
      passcode: 'windows_pin',
    },
    {
      id: 'bios',
      modes: ['return', 'repair'],
      title: 'Remove any BIOS / UEFI password',
      body: 'Only if you set one. Restart the laptop and tap its setup key as soon as the logo appears — usually F2, F1, F10, Del or Esc, and the logo screen often says which. Clear the password there. Forgotten it? Contact the manufacturer.',
      notes: [{ when: 'No F-keys', text: 'Hold volume-up while you press and release Power, and keep holding until the setup screen appears.' }],
    },
    {
      id: 'setup_screen',
      modes: ['return', 'repair'],
      when: { data: ['private'] },
      revibe: true,
      title: 'Stop at the setup screen',
      body: 'You’re done on the laptop when it shows the region / language setup screen. Turn it off there — don’t sign in.',
      mock: 'win_setup',
    },
    {
      id: 'remove_device',
      modes: ['return'],
      final: true,
      title: 'Remove it from your Microsoft account',
      body: 'From any device: open account.microsoft.com/devices, pick the laptop, then More actions › Remove › tick “I’m ready to remove this device” › Remove.',
      path: ['account.microsoft.com/devices', 'the laptop', 'More actions', 'Remove'],
      frame: 'browser',
    },
    {
      id: 'repair_bitlocker',
      modes: ['repair'],
      final: true,
      title: 'Have your recovery key ready',
      body: 'If the drive is encrypted, a board or firmware change can trigger BitLocker recovery, and the repairer will need the key. Find it at aka.ms/myrecoverykey.',
      path: ['aka.ms/myrecoverykey', 'BitLocker recovery keys', 'Key for this laptop'],
      frame: 'browser',
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'signin', icon: 'lock', title: 'I can’t sign in to Windows', sub: 'Forgot the PIN or password', to: 'win_signin' },
      { id: 'dead', icon: 'power', title: 'It won’t start', to: { return: 'win_wont_start', repair: 'win_repair' } },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Microsoft account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_microsoft' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent it to Revibe', sub: 'Fix it from a browser', to: 'remote' },
    ],
    nodes: {
      win_signin: {
        ask: 'How do you sign in to Windows?',
        options: [
          { label: 'With a PIN', sub: 'A short number', to: 'win_pin' },
          { label: 'With a Microsoft account password', sub: 'An email address shows on the sign-in screen', to: 'account_microsoft' },
          { label: 'With a local account password', sub: 'Just a name, no email address', to: 'win_local' },
        ],
      },
      win_pin: {
        title: 'Reset your PIN',
        steps: [
          { text: 'On the sign-in screen, select I forgot my PIN under the PIN box.', path: ['I forgot my PIN'], note: 'Only shows for Microsoft accounts. With a local account, sign in with your password instead.' },
          { text: 'Confirm it’s you with your Microsoft account password or a code.', help: { label: 'Can’t sign in?', to: 'account_microsoft' } },
          { text: 'Set a new PIN, sign in and carry on with the guide.' },
        ],
        more: [{ modes: ['return'], label: 'Still can’t sign in?', to: 'win_reset' }],
        resume: true,
      },
      win_local: {
        title: 'Reset your local password',
        steps: [
          { text: 'Enter any password once, then select OK.' },
          { text: 'Select Reset password.', path: ['Reset password'] },
          { text: 'Answer your security questions and set a new password.' },
          { text: 'Sign in and carry on with the guide.' },
        ],
        more: [{ modes: ['return'], label: 'Still can’t sign in?', to: 'win_reset' }],
        resume: true,
      },
      win_reset: {
        title: 'Reset it from the sign-in screen',
        steps: [
          { text: 'On the sign-in screen, hold Shift while you select Power, then Restart.', path: ['Power', 'Restart'] },
          { text: 'Choose Troubleshoot, then Reset this PC.', path: ['Troubleshoot', 'Reset this PC'] },
        ],
        then: 'win_reset_tail',
      },
      win_wont_start: {
        title: 'Reset it from the recovery screen',
        steps: [
          { text: 'Turn it on, and hold the power button to switch it off as soon as the logo appears. Do this twice.' },
          { text: 'Turn it on a third time — Windows opens its recovery screen by itself.' },
          { text: 'Choose Troubleshoot, then Reset this PC.', path: ['Troubleshoot', 'Reset this PC'] },
        ],
        then: 'win_reset_tail',
      },
      win_reset_tail: {
        steps: [
          { text: 'Choose Remove everything and follow the prompts.', path: ['Remove everything'] },
          { text: 'Stop when the region / language setup screen appears, and turn it off there.' },
        ],
        tip: 'If the drive is encrypted, it asks for a BitLocker recovery key. Find it at aka.ms/myrecoverykey.',
        then: 'remote',
      },
      win_repair: {
        title: 'Don’t reset your {noun}',
        body: 'Resetting it would delete your data. Continue, and we’ll tell you the next step before pickup.',
      },
      remote: {
        title: 'Remove it from your Microsoft account',
        lead: 'Then remove it from your Microsoft account',
        steps: [
          { text: 'In any browser, go to account.microsoft.com/devices and sign in.', help: { label: 'Can’t sign in?', to: 'account_microsoft' } },
          { text: 'Find the {noun} and select Show details.', path: ['Show details'] },
          { text: 'Select More actions, then Remove.', path: ['More actions', 'Remove'] },
          { text: 'Tick “I’m ready to remove this device”, then select Remove.', path: ['Remove'] },
        ],
        tip: 'If the drive is encrypted, our partner may also need the BitLocker key — find it at aka.ms/myrecoverykey.',
      },
    },
  },
}
