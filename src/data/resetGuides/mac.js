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
  privacy: true,
  account: ['apple'],
  variants: [
    { id: 'macbook', label: 'MacBook', noun: 'MacBook', frame: 'laptop', os: 'macos', category: 'Macbook', title: 'MacBook Air 13″' },
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
      modes: ['return', 'repair'],
      when: { data: ['private'] },
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
      modes: ['return', 'repair'],
      when: { chip: MODERN, data: ['private'] },
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
      modes: ['return', 'repair'],
      when: { chip: ['intel_old'], data: ['private'] },
      title: 'Erase in macOS Recovery',
      body: 'Shut down, press the power button and immediately hold Command-R until the Apple logo or a spinning globe appears. Then Disk Utility › Macintosh HD › Erase (APFS or Mac OS Extended (Journaled)) › quit Disk Utility › Reinstall macOS. Use home Wi-Fi or Ethernet. The Mac can restart several times.',
      path: ['Command-R', 'Disk Utility', 'Erase', 'Reinstall macOS'],
    },
    {
      id: 'firmware',
      modes: ['return', 'repair'],
      when: { chip: ['intel_t2', 'intel_old'], data: ['private'] },
      title: 'Turn off any firmware password',
      body: 'Only if one is set. If it’s forgotten, only Apple or an authorised provider can remove it, with proof of purchase.',
      path: ['Recovery', 'Utilities', 'Startup Security Utility'],
    },
    {
      id: 'nvram',
      modes: ['return', 'repair'],
      when: { chip: ['intel_t2', 'intel_old'], data: ['private'] },
      title: 'Reset NVRAM',
      body: 'Shut down, then turn on holding Option-Command-P-R for about 20 seconds.',
    },
    {
      id: 'setup_assistant',
      modes: ['return', 'repair'],
      when: { data: ['private'] },
      final: true,
      title: 'Stop at the setup assistant',
      body: 'You’re done when the setup assistant appears. Press Command-Q to shut down.',
      mock: 'mac_welcome',
    },
    {
      id: 'find_my_mac_off',
      modes: ['repair'],
      when: { data: ['keep'] },
      title: 'Turn off Find My Mac',
      body: 'Back up first. Turn off Find My Mac, then enter your Apple Account password.',
      path: ['System Settings', 'your name', 'iCloud', 'See All', 'Find My Mac', 'Off'],
      notes: [{ when: 'macOS 27 or later', text: 'Turn on Ready for Repair or Trade-In instead.' }],
    },
    {
      id: 'repair_firmware',
      modes: ['repair'],
      when: { chip: ['intel_t2', 'intel_old'], data: ['keep'] },
      title: 'Turn off any firmware password',
      body: 'Only if one is set: start up in Recovery and turn it off. If it’s forgotten, only Apple or an authorised provider can remove it, with proof of purchase.',
      path: ['Recovery', 'Utilities', 'Startup Security Utility'],
    },
    {
      id: 'repair_login',
      modes: ['repair'],
      when: { data: ['keep'] },
      final: true,
      revibe: true,
      title: 'Share a login for the repair',
      body: 'Our partner tests without you there. Enter your macOS login password below — or create a temporary admin user and give that password instead.',
      passcode: 'mac_login',
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'password', icon: 'lock', title: 'I forgot my login password', sub: 'I can’t get past the login window', to: 'mac_password' },
      { id: 'dead', icon: 'power', title: 'It won’t start, or nothing else works', to: { return: 'mac_erase', repair: 'mac_repair' } },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Apple Account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_apple' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent it to Revibe', sub: 'Fix it from a browser', to: 'remote' },
    ],
    nodes: {
      mac_password: {
        title: 'Reset your login password',
        steps: [
          { text: 'Restart the Mac. At the login window, click the ? next to the password box.' },
          { text: 'Click Reset Password, or Restart and show password reset options.', path: ['Reset Password'], note: 'Starting from macOS Recovery instead? Choose Forgot all passwords?' },
          { text: 'Sign in with your Apple Account, or enter your FileVault recovery key.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
          { text: 'Set a new password, log in and carry on with the guide.' },
        ],
        more: [{ label: 'No ? or reset option?', to: { return: 'mac_erase', repair: 'mac_repair' } }],
        resume: true,
      },
      mac_erase: {
        title: 'Erase it from macOS Recovery',
        steps: [
          { text: 'Start up in macOS Recovery.', note: 'Apple silicon: hold the power button until “Loading startup options” appears. Intel: hold Command-R while it starts.' },
          { text: 'Open Recovery Assistant, then choose Erase Mac.', path: ['Recovery Assistant', 'Erase Mac'] },
          { text: 'Click Erase Mac again to confirm.', path: ['Erase Mac'] },
          { text: 'When it restarts, an Activate Mac window asks for your Apple Account. Sign in to finish.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
        ],
        tip: 'Activation Lock stays on until you sign in at that window or remove the Mac remotely.',
        more: [{ label: 'Remove it remotely instead', to: 'remote' }],
      },
      mac_repair: {
        title: 'Don’t erase your {noun}',
        body: 'Erasing it would delete your data. Continue, and we’ll tell you the next step before pickup.',
      },
      remote: {
        title: { return: 'Erase it and remove it from Find My', repair: 'Remove it from Find My' },
        steps: [
          { text: 'In any browser, go to icloud.com/find and sign in.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
          { text: 'Choose All Devices, then your Mac.', path: ['All Devices', '[your Mac]'] },
          { modes: ['return'], text: 'Choose Erase This Device and confirm.', path: ['Erase This Device'] },
          { modes: ['return'], text: 'Then choose Remove This Device.', path: ['Remove This Device'] },
          { modes: ['repair'], text: 'Choose Remove This Device. Don’t erase it — your data stays on it.', path: ['Remove This Device'] },
        ],
        tip: 'If the Mac is offline, Activation Lock comes off straight away. If it’s online, it’s only marked Ready for Repair or Trade In for 30 days.',
      },
    },
  },
}
