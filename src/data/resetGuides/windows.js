// G3 — Windows laptop (Microsoft account + BitLocker). One brand-neutral guide,
// the same for a return and a warranty: a laptop can't be handed over without
// a password, so it's always erased (no PIN or password is shared when the claim is raised).
const STARTUP_PASSWORD = {
  label: 'Ever set a startup (BIOS) password?',
  body: 'Most people never do. If you did, tell us before pickup — we can’t remove it ourselves. Work laptops: ask your IT team.',
}
export default {
  id: 'windows',
  code: 'G3',
  label: 'Windows laptop',
  erase: 'required',
  account: ['microsoft'],
  variants: [
    { id: 'laptop', label: 'Windows laptop', noun: 'laptop', frame: 'laptop', os: 'windows', category: 'Laptop', title: 'Windows laptop' },
  ],
  steps: [
    {
      id: 'backup',
      title: 'Back up your {noun}',
      body: {
        return: 'Your data is your responsibility. Back up anything you want to keep now — the next steps erase the {noun}, and we can’t recover it.',
        repair: 'You’ll get this {noun} back, but the next steps erase it. Back up now so you can restore everything — your data is your responsibility.',
      },
      path: ['Settings', 'Accounts', 'Windows backup', 'Back up'],
      notes: [{ when: 'Large files', text: 'Copy them to an external drive or OneDrive too — Windows backup doesn’t keep everything.' }],
    },
    {
      id: 'find_my_device',
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
      title: 'Reset this PC',
      body: 'Choose Remove everything › Cloud download, and under Change settings turn Clean data on. This removes your PIN, password, fingerprint and face sign-in too. It can take an hour or two, and the screen can stay black for 15 minutes or more. Plug in the charger and don’t turn it off.',
      path: ['Settings', 'System', 'Recovery', 'Reset PC'],
      notes: [{ when: 'Windows 10', text: 'Settings › Update & Security › Recovery › under Reset this PC, select Get started.' }],
    },
    {
      id: 'setup_screen',
      revibe: true,
      title: 'Stop at the setup screen',
      body: 'You’re done on the laptop when it shows the region / language setup screen. Turn it off there — don’t sign in.',
      mock: 'win_setup',
    },
    {
      id: 'remove_device',
      title: 'Remove it from your Microsoft account',
      body: 'From any device: open account.microsoft.com/devices, pick the laptop, then More actions › Remove › tick “I’m ready to remove this device” › Remove.',
      path: ['account.microsoft.com/devices', 'the laptop', 'More actions', 'Remove'],
      frame: 'browser',
      trouble: STARTUP_PASSWORD,
    },
  ],
  remote: {
    steps: [
      {
        id: 'ms_open',
        title: 'Open your Microsoft account',
        body: 'In any browser, go to account.microsoft.com/devices and sign in. We erase the laptop when it arrives, so anything you haven’t backed up is lost.',
        path: ['account.microsoft.com/devices', 'Sign in'],
        frame: 'browser',
        help: { label: 'Can’t sign in to your Microsoft account?', to: 'account_microsoft' },
      },
      {
        id: 'ms_remove',
        revibe: true,
        title: 'Remove the laptop',
        body: 'Find the laptop and select Show details › More actions › Remove. Tick “I’m ready to remove this device”, then select Remove.',
        path: ['Show details', 'More actions', 'Remove'],
        frame: 'browser',
        trouble: STARTUP_PASSWORD,
      },
    ],
  },
}
