// G4 — MacBook (Apple Account / Activation Lock). Revibe erases every
// returned Mac, so the customer's must-do is signing out (that lifts Activation
// Lock); erasing is optional and only offered where macOS can do it from
// Settings — no Recovery, no key combinations.
const FIRMWARE = {
  label: 'Ever set a startup (firmware) password?',
  body: 'Most people never do. If you did, tell us before pickup — we can’t remove it ourselves.',
}

export default {
  id: 'mac',
  code: 'G4',
  label: 'MacBook',
  modes: ['return', 'repair'],
  privacy: true,
  account: ['apple'],
  variants: [
    { id: 'macbook', label: 'MacBook', noun: 'MacBook', frame: 'laptop', os: 'macos', category: 'Macbook', title: 'MacBook Air 13″' },
  ],
  steps: [
    {
      id: 'sign_out',
      modes: ['return', 'repair'],
      when: { data: ['private'] },
      title: 'Sign out of your Apple Account',
      body: 'Back up with Time Machine first. Signing out turns off Find My and Activation Lock. Sign out of iMessage too: Messages › Settings › iMessage › Sign Out.',
      path: ['System Settings', 'your name', 'Sign Out'],
      notes: [
        { when: 'Monterey, Big Sur, Catalina', text: 'System Preferences › Apple ID › Overview › Sign Out.' },
        { when: 'Mojave or earlier', text: 'System Preferences › iCloud › Sign Out. Also iTunes › Account › Authorizations › Deauthorize This Computer.' },
      ],
      mock: 'mac_signout',
    },
    {
      id: 'erase',
      modes: ['return'],
      title: 'Erase it — optional',
      body: 'We erase every Mac when it arrives, so you can skip this. To do it yourself, follow the path above and choose Erase All Content and Settings. Not there on your Mac? Skip this step.',
      path: ['System Settings', 'General', 'Transfer or Reset', 'Erase All Content and Settings'],
      notes: [{ when: 'Monterey', text: 'System Preferences menu in the menu bar › Erase All Content and Settings.' }],
      mock: 'mac_erase',
    },
    {
      id: 'repair_erase',
      modes: ['repair'],
      when: { data: ['private'] },
      title: 'Erase All Content and Settings',
      body: 'Choose it and follow the prompts.',
      path: ['System Settings', 'General', 'Transfer or Reset', 'Erase All Content and Settings'],
      notes: [
        { when: 'Monterey', text: 'System Preferences menu in the menu bar › Erase All Content and Settings.' },
        { when: 'Not there', text: 'Your Mac can’t erase itself from Settings. Go back and choose Keep my data — the repair still works.' },
      ],
      mock: 'mac_erase',
    },
    {
      id: 'power_off',
      modes: ['return', 'repair'],
      when: { data: ['private'] },
      final: true,
      title: 'Turn it off',
      body: 'If you erased it, it restarts to the setup assistant — don’t set it up. Hold the power button until the Mac turns off. If you skipped the erase, just shut it down.',
      mock: 'mac_welcome',
      trouble: FIRMWARE,
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
      id: 'repair_login',
      modes: ['repair'],
      when: { data: ['keep'] },
      final: true,
      revibe: true,
      title: 'Share a login for the repair',
      body: 'Our partner tests without you there. Enter your macOS login password below — or create a temporary admin user and give that password instead.',
      passcode: 'mac_login',
      trouble: FIRMWARE,
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'password', icon: 'lock', title: 'I forgot my login password', sub: 'I can’t get past the login window', to: 'mac_password' },
      { id: 'dead', icon: 'power', title: 'It won’t start, or nothing else works', to: { return: 'remote', repair: 'mac_repair' } },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Apple Account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_apple' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent it to Revibe', sub: 'Fix it from a browser', to: 'remote' },
    ],
    nodes: {
      mac_password: {
        title: 'Reset your login password',
        steps: [
          { text: 'Restart the Mac. At the login window, click the ? next to the password box.' },
          { text: 'Click Reset Password, or Restart and show password reset options.', path: ['Reset Password'] },
          { text: 'Sign in with your Apple Account, or enter your FileVault recovery key.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
          { text: 'Set a new password, log in and carry on with the guide.' },
        ],
        more: [{ label: 'No ? or reset option?', to: { return: 'remote', repair: 'mac_repair' } }],
        resume: true,
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
