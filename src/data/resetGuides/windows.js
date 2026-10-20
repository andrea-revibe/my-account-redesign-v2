// G3 — Windows laptop (Microsoft account + BitLocker). One brand-neutral guide.
// Windows has no Activation Lock and Revibe erases every returned laptop, so a
// customer who can't get in only removes it from their Microsoft account.
const STARTUP_PASSWORD = {
  label: 'Ever set a startup (BIOS) password?',
  body: 'Most people never do. If you did, tell us before pickup — we can’t remove it ourselves. Work laptops: ask your IT team.',
}
export default {
  id: 'windows',
  code: 'G3',
  label: 'Windows laptop',
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
      trouble: STARTUP_PASSWORD,
    },
    {
      id: 'repair_bitlocker',
      modes: ['repair'],
      final: true,
      title: 'Have your recovery key ready',
      body: 'If the drive is encrypted, a board or firmware change can trigger BitLocker recovery, and the repairer will need the key. Find it at aka.ms/myrecoverykey.',
      path: ['aka.ms/myrecoverykey', 'BitLocker recovery keys', 'Key for this laptop'],
      frame: 'browser',
      trouble: STARTUP_PASSWORD,
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'signin', icon: 'lock', title: 'I can’t sign in to Windows', sub: 'Forgot the PIN or password', to: 'win_signin' },
      { id: 'dead', icon: 'power', title: 'It won’t start', to: { return: 'win_as_is', repair: 'win_repair' } },
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
        more: [{ modes: ['return'], label: 'Still can’t sign in?', to: 'win_as_is' }],
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
        more: [{ modes: ['return'], label: 'Still can’t sign in?', to: 'win_as_is' }],
        resume: true,
      },
      win_as_is: {
        title: 'Send it as it is',
        body: 'You don’t need to get into it — we erase every laptop when it arrives.',
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
