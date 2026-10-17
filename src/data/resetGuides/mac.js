// G4 — MacBook (Apple Account / Activation Lock on Apple silicon + T2). The
// guide opens on a chip question: the erase path differs by chip and most of
// our stock is 2012–2017 Intel, which takes the Recovery (manual) path.
const MODERN = ['apple_silicon', 'intel_t2']

export default {
  id: 'mac',
  code: 'G4',
  label: 'MacBook',
  share: '3%',
  modes: ['return', 'repair'],
  account: ['apple'],
  variants: [
    { id: 'macbook', label: 'MacBook', noun: 'MacBook', frame: 'laptop', category: 'Macbook', title: 'MacBook Air 13″' },
  ],
  branch: {
    key: 'chip',
    question: 'Which chip does your Mac have?',
    hint: 'Apple menu › About This Mac. “Chip: Apple M…” is Apple silicon. “Processor: Intel” is Intel — only MacBook Air and Pro from 2018–2020 also have a T2.',
    options: [
      { id: 'apple_silicon', label: 'Apple silicon', sub: 'Chip: Apple M1 or later' },
      { id: 'intel_t2', label: 'Intel with T2', sub: 'MacBook Air / Pro, 2018–2020' },
      { id: 'intel_old', label: 'Intel, 2012–2017', sub: 'Most MacBooks we sell' },
    ],
  },
  steps: [
    {
      id: 'sign_out',
      modes: ['return'],
      title: 'Sign out of your Apple Account',
      body: 'Back up with Time Machine first. Then sign out, and sign out of iMessage too: Messages › Settings › iMessage › Sign Out.',
      path: ['System Settings', 'your name', 'Sign Out'],
      notes: [
        { when: 'Monterey, Big Sur, Catalina', text: 'System Preferences › Apple ID › Overview › Sign Out.' },
        { when: 'Mojave or earlier', text: 'System Preferences › iCloud › Sign Out. Also iTunes › Account › Authorizations › Deauthorize This Computer.' },
      ],
      mock: 'mac_signout',
    },
    {
      id: 'erase_modern',
      modes: ['return'],
      when: { chip: MODERN },
      title: 'Erase All Content and Settings',
      body: 'When it finishes, press and hold the power button until the Mac turns off.',
      path: ['System Settings', 'General', 'Transfer or Reset', 'Erase All Content and Settings'],
      notes: [
        { when: 'Monterey', text: 'System Preferences menu in the menu bar › Erase All Content and Settings.' },
        { when: 'Older than Monterey', text: 'Use the Recovery path: shut down, then hold Command-R at power-on › Disk Utility › Erase › Reinstall macOS.' },
      ],
      mock: 'mac_erase',
    },
    {
      id: 'erase_recovery',
      modes: ['return'],
      when: { chip: ['intel_old'] },
      title: 'Erase in macOS Recovery',
      body: 'Shut down, press the power button and immediately hold Command-R until the Apple logo or a spinning globe appears. Then Disk Utility › Macintosh HD › Erase (APFS or Mac OS Extended (Journaled)) › quit Disk Utility › Reinstall macOS. Use home Wi-Fi or Ethernet. The Mac can restart several times.',
      path: ['Command-R', 'Disk Utility', 'Erase', 'Reinstall macOS'],
    },
    {
      id: 'firmware',
      modes: ['return'],
      when: { chip: ['intel_t2', 'intel_old'] },
      title: 'Turn off any firmware password',
      body: 'Only if one is set. If it’s forgotten, only Apple or an authorised provider can remove it, with proof of purchase.',
      path: ['Recovery', 'Utilities', 'Startup Security Utility'],
    },
    {
      id: 'nvram',
      modes: ['return'],
      when: { chip: ['intel_t2', 'intel_old'] },
      title: 'Reset NVRAM',
      body: 'Shut down, then turn on holding Option-Command-P-R for about 20 seconds.',
    },
    {
      id: 'setup_assistant',
      modes: ['return'],
      final: true,
      title: 'Stop at the setup assistant',
      body: 'You’re done when the setup assistant appears. Press Command-Q to shut down.',
      mock: 'mac_welcome',
    },
    {
      id: 'find_my_mac_off',
      modes: ['repair'],
      title: 'Turn off Find My Mac',
      body: 'Back up first. Turn off Find My Mac, then enter your Apple Account password.',
      path: ['System Settings', 'your name', 'iCloud', 'See All', 'Find My Mac', 'Off'],
      notes: [{ when: 'macOS 27 or later', text: 'Turn on Ready for Repair or Trade-In instead.' }],
      mock: 'mac_signout',
    },
    {
      id: 'repair_firmware',
      modes: ['repair'],
      when: { chip: ['intel_t2', 'intel_old'] },
      title: 'Turn off any firmware password',
      body: 'Only if one is set: start up in Recovery and turn it off. If it’s forgotten, only Apple or an authorised provider can remove it, with proof of purchase.',
      path: ['Recovery', 'Utilities', 'Startup Security Utility'],
    },
    {
      id: 'repair_login',
      modes: ['repair'],
      final: true,
      revibe: true,
      title: 'Share a login for the repair',
      body: 'Our partner tests without you there. Enter your macOS login password below — or create a temporary admin user and give that password instead.',
      passcode: 'mac_login',
    },
  ],
  cantUse: {
    withYou: [
      { modes: ['return', 'repair'], title: 'Forgot the login password', body: 'Restart, click the ? at the login window › Reset Password (or Restart and show password reset options), then use your Apple Account or FileVault recovery key. From macOS Recovery: Forgot all passwords?' },
      { modes: ['return'], title: 'Nothing else works', body: 'Start up in macOS Recovery › Recovery Assistant › Erase Mac › Erase Mac. Afterwards an Activate Mac window asks for the Apple Account: Activation Lock stays until you sign in or remove the Mac remotely.' },
    ],
    sent: [
      { modes: ['return'], title: 'Erase and remove it', body: 'icloud.com/find › All Devices › the Mac › Erase This Device › Remove This Device.' },
      { modes: ['repair'], title: 'Remove it', body: 'icloud.com/find › All Devices › the Mac › Remove This Device. Skip Erase.' },
      { modes: ['return', 'repair'], title: 'What this does', body: 'An offline Mac is removed and Activation Lock comes off at once; an online one can only be marked Ready for Repair or Trade In for 30 days.' },
    ],
  },
}
