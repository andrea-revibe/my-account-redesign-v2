// G2 — Samsung Galaxy & Android (Google device protection / FRP + Samsung
// account). Samsung-only steps are tagged `when: { variant: SAMSUNG }`; other
// brands get the generic Android menu names.
const SAMSUNG = ['samsung_phone', 'samsung_tablet']

export default {
  id: 'android',
  code: 'G2',
  label: 'Android',
  share: '15%',
  modes: ['return', 'repair'],
  account: ['google', 'samsung'],
  variants: [
    { id: 'samsung_phone', label: 'Samsung phone', noun: 'phone', frame: 'phone', category: 'Samsung phone', title: 'Samsung Galaxy S21' },
    { id: 'samsung_tablet', label: 'Samsung tablet', noun: 'tablet', frame: 'tablet', category: 'Tablet', title: 'Samsung Galaxy Tab S8' },
    { id: 'other_android', label: 'Other Android', noun: 'phone', frame: 'phone', category: 'Smartphone', title: 'Google Pixel 7' },
  ],
  steps: [
    {
      id: 'remove_google',
      modes: ['return'],
      when: { variant: SAMSUNG },
      title: 'Remove your Google account',
      body: 'Tap your Google account › Remove account › Remove account (on some models: ⋮ More options › Remove account). Repeat for every Google account. This turns off Google device protection.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts'],
      mock: { samsung_phone: 'sam_remove_google', samsung_tablet: 'tab_remove_google' },
      trouble: {
        label: 'Changed your Google password recently?',
        body: 'Wait 24 hours after a Google password change before you factory reset.',
      },
    },
    {
      id: 'remove_samsung',
      modes: ['return'],
      when: { variant: SAMSUNG },
      title: 'Remove your Samsung account',
      body: 'In the same list: Samsung account › Remove account › Remove account › Sign out › enter your Samsung account password › OK. This also turns off Find My Mobile.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts', 'Samsung account'],
      mock: { samsung_phone: 'sam_signout', samsung_tablet: 'tab_signout' },
      trouble: {
        label: 'It asks for my fingerprint and a delay',
        body: 'Theft protection (One UI 7 and later): away from a Safe place, turning off Find My Mobile needs your fingerprint or face plus a one-hour Security delay. Do this at home before pickup day.',
      },
    },
    {
      id: 'factory_reset',
      modes: ['return'],
      when: { variant: SAMSUNG },
      title: 'Factory data reset',
      body: 'Tap Reset (or Delete all) and enter your PIN, pattern or password. Always reset from Settings, never from the recovery menu — a recovery reset asks for the old Google account.',
      path: ['Settings', 'General management', 'Reset', 'Factory data reset'],
      notes: [{ when: 'Memory card', text: 'Take it out first — a factory reset doesn’t erase it.' }],
      mock: { samsung_phone: 'sam_reset', samsung_tablet: 'tab_reset' },
    },
    {
      id: 'welcome',
      modes: ['return'],
      when: { variant: SAMSUNG },
      final: true,
      revibe: true,
      title: 'Check for the setup screen',
      body: 'The {noun} restarts by itself. You’re done when it shows the first setup screen — don’t sign in.',
      mock: { samsung_phone: 'sam_welcome', samsung_tablet: 'tab_welcome' },
    },
    {
      id: 'other_remove',
      modes: ['return'],
      when: { variant: ['other_android'] },
      title: 'Remove every account',
      body: 'Tap each account › Remove account. Menus differ by brand. On Pixel, removing the Google Account deletes its backup, so back up first.',
      path: ['Settings', 'Passwords & accounts', 'the account', 'Remove account'],
    },
    {
      id: 'other_reset',
      modes: ['return'],
      when: { variant: ['other_android'] },
      final: true,
      title: 'Erase all data',
      body: 'Run the factory reset from Settings. You’re done when the first setup screen appears — don’t sign in.',
      path: ['Settings', 'System', 'Reset options', 'Erase all data (factory reset)'],
    },
    {
      id: 'repair_accounts',
      modes: ['repair'],
      title: 'Back up, then remove your accounts',
      body: 'Back up, then remove your Google and Samsung accounts, so a reset during the repair won’t lock the {noun}.',
      path: ['Settings', 'Accounts and backup', 'Manage accounts'],
      notes: [{ when: 'Other brands', text: 'Settings › Passwords & accounts › the account › Remove account.' }],
      mock: { samsung_phone: 'sam_remove_google', samsung_tablet: 'tab_remove_google' },
    },
    {
      id: 'repair_lock_off',
      modes: ['repair'],
      final: true,
      title: 'Turn the screen lock off',
      body: 'Enter your PIN, pattern or password, then choose Swipe. Samsung’s repair advice: no passcode needs to be shared.',
      path: ['Settings', 'Lock screen and AOD', 'Screen lock and biometrics', 'Swipe'],
    },
  ],
  cantUse: {
    withYou: [
      { modes: ['return', 'repair'], title: 'Changed the screen lock in the last 72 hours?', body: 'One UI 6.1 or later: after 5 wrong tries tap Forgot PIN/password/pattern? › enter the previous lock › set a new one. Works once per lock type.' },
      { modes: ['return'], title: 'Forgot the lock', body: 'The {noun} has to be erased. Samsung: smartthingsfind.samsung.com › the device › Erase data › Erase. Or Google Find Hub › the device › Factory reset. Setup then asks for your Google Account — sign in once to finish, then remove the account and reset from Settings.' },
      { modes: ['repair'], title: 'Forgot the lock and the previous one', body: 'Don’t erase it. Samsung says to have the reset done at a service centre — continue and we’ll arrange it.' },
      { modes: ['return', 'repair'], title: 'Broken screen, or it won’t turn on', body: 'Use the “already sent” steps.' },
    ],
    sent: [
      { modes: ['return', 'repair'], title: 'Sign it out of your Google Account', body: 'Google Account › Security › Your devices › Manage all devices › the device › Sign out (every session with that device name).' },
      { modes: ['return', 'repair'], title: 'Samsung: erase it remotely', body: 'smartthingsfind.samsung.com › the device › Erase data, if it will come online.' },
      { modes: ['return', 'repair'], title: 'Good to know', body: 'Google doesn’t say either step lifts device protection, so a device still locked at inspection usually needs your Google sign-in, or a Samsung service centre with proof of purchase.' },
    ],
  },
}
