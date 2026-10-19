// G6 — AirPods. One flow: they belong to one Apple Account at a time, so
// removing them from Find My is the step that frees them; a reset alone
// doesn't.
export default {
  id: 'airpods',
  code: 'G6',
  label: 'AirPods',
  share: '0.6%',
  modes: ['single'],
  account: ['apple'],
  variants: [
    { id: 'airpods', label: 'AirPods / Pro', noun: 'AirPods', plural: true, frame: 'earbuds', category: 'Audio', title: 'AirPods Pro (2nd generation)' },
    { id: 'airpods_max', label: 'AirPods Max', noun: 'AirPods Max', plural: true, frame: 'earbuds', category: 'Audio', title: 'AirPods Max' },
  ],
  steps: [
    {
      id: 'remove_find_my',
      title: 'Remove them from Find My',
      body: 'Swipe up › Remove This Device › Remove. One device is enough, and the AirPods needn’t be connected. Optional: also Forget This Device in Settings › Bluetooth.',
      path: ['Find My', 'Devices', 'your AirPods', 'Remove This Device'],
      frame: 'phone',
    },
    {
      id: 'reset_buds',
      when: { variant: ['airpods'] },
      title: 'Reset them',
      body: 'Put both earbuds in the case, close the lid for 30 seconds, then open it. Hold the setup button on the back of the case for about 15 seconds, until the light flashes amber, then white.',
      notes: [
        { when: 'No button (AirPods 4, Pro 3)', text: 'Double-tap the front of the case while the light is on; again when it flashes white; a third time when it flashes faster; wait for amber, then white.' },
      ],
    },
    {
      id: 'reset_max',
      when: { variant: ['airpods_max'] },
      title: 'Reset them',
      body: 'Charge to at least 50%, then hold the listening mode button and the Digital Crown for 15 seconds, until the light flashes amber, then white.',
    },
    {
      id: 'pack',
      final: true,
      title: 'Clean and pack them',
      body: 'Clean them, and return both earbuds and the case.',
    },
  ],
  cantUse: {
    symptoms: [
      { id: 'lost', icon: 'power', title: 'They’re lost or broken', sub: 'They don’t need to be nearby', to: 'remote' },
      { id: 'account', icon: 'key', title: 'I can’t sign in to my Apple Account', sub: 'Forgot the password, or the code isn’t reaching me', to: 'account_apple' },
      { id: 'sent', icon: 'truck', title: 'I’ve already sent them to Revibe', sub: 'They don’t need to be nearby', to: 'remote' },
    ],
    nodes: {
      remote: {
        title: 'Remove them from Find My',
        steps: [
          { text: 'On your iPhone, open Find My and select your AirPods.', path: ['Find My', 'Devices', '[your AirPods]'], note: 'No iPhone to hand? Sign in at icloud.com/find in any browser.', help: { label: 'Can’t sign in?', to: 'account_apple' } },
          { text: 'Choose Remove This Device, then Remove.', path: ['Remove This Device', 'Remove'] },
          { text: 'On your iPhone, forget them in Bluetooth so they can’t reconnect and lock again.', path: ['Settings', 'Bluetooth', 'ⓘ', 'Forget This Device'] },
        ],
        tip: 'This also lifts Find My Lock, which Apple can’t remove for you.',
      },
    },
  },
}
