// G2 — Samsung Galaxy & Android (Google device protection / FRP + Samsung
// account). Samsung-only steps are tagged `when: { variant: SAMSUNG }`; other
// brands get the generic Android menu names. The same steps for a return and a
// warranty; the factory reset is the customer's choice, at the end.
const SAMSUNG = ['samsung_phone']
const OTHER = ['other_android']

export default {
  id: 'android',
  code: 'G2',
  label: 'Android',
  erase: 'optional',
  account: ['google', 'samsung'],
  variants: [
    { id: 'samsung_phone', label: 'Samsung phone', noun: 'phone', frame: 'phone', os: 'android', category: 'Samsung phone', title: 'Samsung Galaxy S21' },
    { id: 'other_android', label: 'Other Android', noun: 'phone', frame: 'phone', os: 'android', category: 'Smartphone', title: 'Google Pixel 7' },
  ],
  steps: [
    {
      id: 'backup',
      when: { variant: SAMSUNG },
      title: 'Back up your {noun}',
      body: {
        return: 'Your data is your responsibility. Back up anything you want to keep now — once the {noun} leaves you, we can’t recover it.',
        repair: 'You’ll get this {noun} back, but a repair can wipe it. Back up now so you can restore everything — your data is your responsibility.',
      },
      path: ['Settings', 'Accounts and backup', 'Back up data'],
      notes: [{ when: 'Prefer a computer', text: 'Use Smart Switch to back up to a PC or Mac.' }],
    },
    {
      id: 'other_backup',
      when: { variant: OTHER },
      title: 'Back up your {noun}',
      body: {
        return: 'Your data is your responsibility. Back up anything you want to keep now — once the {noun} leaves you, we can’t recover it.',
        repair: 'You’ll get this {noun} back, but a repair can wipe it. Back up now so you can restore everything — your data is your responsibility.',
      },
      path: ['Settings', 'System', 'Backup', 'Back up now'],
      notes: [{ when: 'Menus differ by brand', text: 'Search Settings for “Backup”.' }],
    },
    {
      id: 'theft_off',
      when: { variant: SAMSUNG },
      title: 'Turn off Theft protection',
      body: 'Turn off Identity check and Security delay. Do this at home or another Safe place — anywhere else it asks for your fingerprint or face and makes you wait an hour. Already off? Go to the next step.',
      path: ['Settings', 'Security and privacy', 'Lost device protection', 'Theft protection', 'Identity check', 'Off'],
      notes: [{ when: 'One UI 6 or earlier', text: 'It isn’t there — go to the next step.' }],
    },
    {
      id: 'remove_google',
      when: { variant: SAMSUNG },
      title: 'Remove your Google account',
      body: 'Tap your Google account › Remove account › Remove account (on some models: ⋮ More options › Remove account). Repeat for every Google account. This turns off Google device protection.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts'],
      mock: { samsung_phone: 'sam_remove_google' },
      trouble: {
        label: 'Changed your Google password recently?',
        body: 'Wait 24 hours after a Google password change before you factory reset.',
      },
    },
    {
      id: 'remove_samsung',
      when: { variant: SAMSUNG },
      title: 'Remove your Samsung account',
      body: 'In the same list: Samsung account › Remove account › Remove account › Sign out › enter your Samsung account password › OK. This also turns off Find My Mobile.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts', 'Samsung account'],
      mock: { samsung_phone: 'sam_signout' },
    },
    {
      id: 'other_remove',
      when: { variant: OTHER },
      title: 'Remove every account',
      body: 'Tap each account › Remove account. Menus differ by brand. On Pixel, removing the Google Account deletes its backup, so back up first.',
      path: ['Settings', 'Passwords & accounts', '[your account]', 'Remove account'],
      notes: [{ when: 'Android 15 or later', text: 'If Identity Check is on, do this at home or another trusted place, or it asks for your fingerprint or face.' }],
    },
    {
      id: 'lock_off',
      when: { variant: SAMSUNG },
      title: 'Remove the screen lock and biometrics',
      body: 'Enter your PIN, pattern or password, choose Swipe, then confirm. This deletes your fingerprints and face recognition too, so there’s no PIN to share with us.',
      path: ['Settings', 'Lock screen and AOD', 'Screen lock and biometrics', 'Swipe'],
      mock: { samsung_phone: 'sam_lock_swipe' },
    },
    {
      id: 'other_lock_off',
      when: { variant: OTHER },
      title: 'Remove the screen lock and biometrics',
      body: 'Enter your PIN, pattern or password, then choose None or Swipe. This deletes your fingerprints and face unlock too. Menus differ by brand.',
      path: ['Settings', 'Security & privacy', 'Device unlock', 'Screen lock', 'Swipe'],
    },
    {
      id: 'accounts_empty',
      when: { variant: SAMSUNG },
      revibe: true,
      title: 'Check no accounts are left',
      body: 'The list should be empty — no Samsung account, no Google account. The top of Settings should show “Samsung account” with no name, photo or email.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts'],
      mock: { samsung_phone: 'sam_accounts_empty' },
    },
    {
      id: 'other_accounts_empty',
      when: { variant: OTHER },
      revibe: true,
      title: 'Check no accounts are left',
      body: 'The accounts list should be empty — no Google account, and no account from the phone’s brand.',
      path: ['Settings', 'Passwords & accounts'],
    },
    {
      id: 'factory_reset',
      erase: true,
      when: { variant: SAMSUNG },
      title: 'Factory data reset',
      body: 'Tap Reset (or Delete all). Always reset from Settings, never from the recovery menu — a recovery reset asks for the old Google account.',
      path: ['Settings', 'General management', 'Reset', 'Factory data reset'],
      notes: [{ when: 'Memory card', text: 'Take it out first — a factory reset doesn’t erase it.' }],
      mock: { samsung_phone: 'sam_reset' },
    },
    {
      id: 'welcome',
      erase: true,
      when: { variant: SAMSUNG },
      revibe: true,
      title: 'Check for the setup screen',
      body: 'The {noun} restarts by itself. You’re done when it shows the first setup screen — don’t sign in.',
      mock: { samsung_phone: 'sam_welcome' },
    },
    {
      id: 'other_reset',
      erase: true,
      when: { variant: OTHER },
      title: 'Erase all data',
      body: 'Run the factory reset from Settings. You’re done when the first setup screen appears — don’t sign in.',
      path: ['Settings', 'System', 'Reset options', 'Erase all data (factory reset)'],
    },
  ],
  remote: {
    steps: [
      {
        id: 'google_remote',
        title: 'Sign it out of your Google Account',
        body: 'In any browser, go to myaccount.google.com › Security › Your devices. Select the {noun} and choose Sign out — if it’s listed more than once, sign out of each one.',
        help: { label: 'Can’t sign in to your Google Account?', to: 'account_google' },
        mock: 'google_remote',
      },
      {
        id: 'samsung_remote',
        when: { variant: SAMSUNG },
        revibe: true,
        title: 'Remove it from your Samsung account',
        body: 'Go to account.samsung.com, open your devices, select the {noun} and remove it. This turns off Find My Mobile.',
        notes: [{ when: 'Want it wiped too', text: 'At smartthingsfind.samsung.com choose Erase data first. Only if you’ve backed up — your data is your responsibility.' }],
        help: { label: 'Can’t sign in to your Samsung account?', to: 'account_samsung' },
        mock: 'samsung_remote',
      },
    ],
  },
}
