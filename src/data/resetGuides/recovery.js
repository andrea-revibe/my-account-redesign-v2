// Per vendor: the account's name and the last-resort route when nothing works,
// shown under every "I can't use my device" fix. Keyed by the guide's `account`
// list.
export const ACCOUNT_RECOVERY = {
  apple: {
    name: 'Apple Account',
    nothingWorks: 'Send an Activation Lock support request at al-support.apple.com, with proof of purchase.',
  },
  google: {
    name: 'Google Account',
    nothingWorks: 'Visit an authorised Samsung service centre with proof of purchase.',
  },
  samsung: {
    name: 'Samsung account',
    nothingWorks: null,
  },
  microsoft: {
    name: 'Microsoft account',
    nothingWorks: 'Windows has no account lock that blocks a reset, but an encrypted drive needs the BitLocker key, and Microsoft can’t retrieve a lost one.',
  },
  playstation: {
    name: 'PlayStation account',
    nothingWorks: 'Contact PlayStation through its Online Assistant.',
  },
}

// The same recoveries as step-by-step nodes, reachable from any guide's
// "I can't use my device" flow (the account symptom, or a step's help link).
export const RECOVERY_NODES = {
  account_apple: {
    ask: 'Do you have another iPhone, iPad or Mac signed in to the same Apple Account?',
    sub: 'That’s the fastest way back in.',
    options: [
      { label: 'Yes', sub: 'Change the password from that device', to: 'account_apple_device' },
      { label: 'No', sub: 'Reset it from a browser or a borrowed iPhone', to: 'account_apple_web' },
    ],
  },
  account_apple_device: {
    title: 'Set a new Apple Account password',
    steps: [
      { text: 'On the other device, open Settings and tap your name.', path: ['Settings', '[your name]'] },
      { text: 'Tap Sign-In & Security, then Change Password.', path: ['Sign-In & Security', 'Change Password'] },
      { text: 'Enter that device’s passcode, then choose a new password.' },
      { text: 'Come back here and use the new password.' },
    ],
    resume: true,
  },
  account_apple_web: {
    title: 'Reset your Apple Account password',
    steps: [
      { text: 'In any browser, go to iforgot.apple.com.', note: 'On a borrowed iPhone, use the Apple Support app instead: Support Tools › Reset Password › Help Someone Else.' },
      { text: 'Enter the email address or phone number you sign in with.' },
      { text: 'Confirm your phone number, then follow the steps to set a new password.' },
      { text: 'Come back here and use the new password.' },
    ],
    tip: 'Without a trusted device or recovery details, Apple may need several days to verify you, and Apple Support can’t shorten it. Signing in during the wait cancels it.',
    resume: true,
  },
  account_google: {
    title: 'Recover your Google Account',
    steps: [
      { text: 'In a browser on a phone or computer you usually sign in from, go to accounts.google.com/signin/recovery.' },
      { text: 'Enter your Gmail address or phone number.' },
      { text: 'Answer every question, even if you have to guess.' },
      { text: 'If a code can’t reach you, tap Try another way.', path: ['Try another way'] },
      { text: 'Set a new password, then come back here.' },
    ],
    tip: 'Work or school account: ask your administrator. Recovery details changed recently can take up to 7 days to work.',
    resume: true,
  },
  account_samsung: {
    title: 'Recover your Samsung account',
    steps: [
      { text: 'In a browser, go to account.samsung.com and tap Sign in.' },
      { text: 'Tap Forgot ID or password, then Reset password.', path: ['Forgot ID or password', 'Reset password'] },
      { text: 'Verify with your email, security question, or recovery phone number.' },
      { text: 'Set a new password, then come back here.' },
    ],
    tip: 'This only works with recovery details you set up earlier. No access to that email or phone? Contact Samsung customer support.',
    resume: true,
  },
  account_microsoft: {
    title: 'Reset your Microsoft account password',
    steps: [
      { text: 'In a browser, go to account.live.com/ResetPassword.aspx — or select I forgot my password on the Windows sign-in screen.' },
      { text: 'Enter your Microsoft account email, phone number or Skype name.' },
      { text: 'Get a code by email or text and enter it.' },
      { text: 'Set a new password, then come back here.' },
    ],
    tip: 'No verification option left? Use Microsoft’s sign-in helper. Microsoft support can’t send reset links.',
    resume: true,
  },
  account_playstation: {
    title: 'Recover your PlayStation account',
    steps: [
      { text: 'In a browser, go to playstation.com and select Sign In.' },
      { text: 'Select Trouble signing in?, then Recover Your Account.', path: ['Trouble signing in?', 'Recover Your Account'] },
      { text: 'Open the email PlayStation sends and set a new password.' },
    ],
    tip: 'A child account’s password can only be reset by the family manager.',
    then: 'ps_deactivate',
  },
}

export const NEVER_ASK =
  'Revibe will never ask for your Apple ID, Google, Samsung or Microsoft password.'
