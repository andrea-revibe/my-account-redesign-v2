// Account recovery per vendor, shown inside every guide's "I can't use my
// device" branch when the customer can't sign in — plus the last-resort
// route when nothing works. Keyed by the guide's `account` list.
export const ACCOUNT_RECOVERY = {
  apple: {
    name: 'Apple Account',
    recover: '“Forgot password?” on any Apple sign-in screen; or change it on another device already signed in; or iforgot.apple.com in Safari; or the Apple Support app › Support Tools › Reset Password › Help Someone Else (on a borrowed device).',
    limits: 'Without a trusted device or recovery details, recovery can take several days or more, and Apple Support can’t shorten it. Signing in during the wait cancels it.',
    nothingWorks: 'Send an Activation Lock support request at al-support.apple.com, with proof of purchase.',
  },
  google: {
    name: 'Google Account',
    recover: 'accounts.google.com/signin/recovery: answer every question, use a device and place you usually sign in from, and “Try another way” if a code can’t reach you.',
    limits: 'Work or school accounts: ask the administrator. Recently changed recovery details can take up to 7 days to work.',
    nothingWorks: 'Visit an authorised Samsung service centre with proof of purchase.',
  },
  samsung: {
    name: 'Samsung account',
    recover: 'Settings › Samsung account › Forgot password or don’t have an account? › Forgot ID or Forgot password; verify by email, security question, or recovery number or email.',
    limits: 'Works only with recovery details set up earlier. No access to the email or the phone: Samsung customer support.',
    nothingWorks: null,
  },
  microsoft: {
    name: 'Microsoft account',
    recover: '“I forgot my password” at the Windows sign-in screen, or account.live.com/ResetPassword.aspx; no verification option left: Microsoft’s sign-in helper.',
    limits: 'Microsoft support can’t send reset links or recover a local account password.',
    nothingWorks: 'Windows has no account lock that blocks a reset, but an encrypted drive needs the BitLocker key, and Microsoft can’t retrieve a lost one.',
  },
  playstation: {
    name: 'PlayStation account',
    recover: 'Account Management › Trouble Signing in? › Recover Your Account.',
    limits: 'A child account’s password is reset only by the family manager.',
    nothingWorks: 'Contact PlayStation through its Online Assistant.',
  },
}

export const NEVER_ASK =
  'Revibe will never ask for your Apple ID, Google, Samsung or Microsoft password.'
