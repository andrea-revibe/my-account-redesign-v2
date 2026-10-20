import { APPLE_REMOTE } from './remote'

// G4 — MacBook (Apple Account / Activation Lock). The same for a return and
// a warranty: macOS can't run without a login password and we never take one,
// so the Mac is always erased — from Settings only, no Recovery and no key
// combinations. Macs that can't erase from Settings skip it and we erase them
// on arrival.
const FIRMWARE = {
  label: 'Ever set a startup (firmware) password?',
  body: 'Most people never do. If you did, tell us before pickup — we can’t remove it ourselves.',
}

export default {
  id: 'mac',
  code: 'G4',
  label: 'MacBook',
  erase: 'required',
  account: ['apple'],
  variants: [
    { id: 'macbook', label: 'MacBook', noun: 'MacBook', frame: 'laptop', os: 'macos', category: 'Macbook', title: 'MacBook Air 13″' },
  ],
  steps: [
    {
      id: 'backup',
      title: 'Back up your {noun}',
      body: 'The next steps erase the {noun}. Back up anything you want to keep now — your data is your responsibility, and we can’t recover it.',
      path: ['System Settings', 'General', 'Time Machine', 'Back Up Now'],
      notes: [{ when: 'No backup drive', text: 'Turn on iCloud Drive with Desktop & Documents, or copy your files to a USB drive.' }],
    },
    {
      id: 'sign_out',
      title: 'Sign out of your Apple Account',
      body: 'Signing out turns off Find My and Activation Lock. Sign out of iMessage too: Messages › Settings › iMessage › Sign Out.',
      path: ['System Settings', 'your name', 'Sign Out'],
      notes: [
        { when: 'Monterey, Big Sur, Catalina', text: 'System Preferences › Apple ID › Overview › Sign Out.' },
        { when: 'Mojave or earlier', text: 'System Preferences › iCloud › Sign Out. Also iTunes › Account › Authorizations › Deauthorize This Computer.' },
      ],
      mock: 'mac_signout',
    },
    {
      id: 'signed_out',
      revibe: true,
      title: 'Check you’re signed out',
      body: 'The top of the System Settings sidebar should say “Sign in” — no name, no photo, no email. Still see your name? Go back and sign out again.',
      path: ['System Settings', 'Sign in'],
    },
    {
      id: 'erase',
      title: 'Erase All Content and Settings',
      body: 'Choose it and follow the prompts. This removes your login password and Touch ID too.',
      path: ['System Settings', 'General', 'Transfer or Reset', 'Erase All Content and Settings'],
      notes: [
        { when: 'Monterey', text: 'System Preferences menu in the menu bar › Erase All Content and Settings.' },
        { when: 'Not there', text: 'Older Macs can’t erase from Settings — skip this step and we’ll erase it when it arrives. Anything you haven’t backed up is lost.' },
      ],
      mock: 'mac_erase',
    },
    {
      id: 'power_off',
      title: 'Turn it off',
      body: 'It restarts to the setup assistant — don’t set it up. Hold the power button until the Mac turns off.',
      mock: 'mac_welcome',
      trouble: FIRMWARE,
    },
  ],
  remote: APPLE_REMOTE,
}
