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
    withYou: [
      { modes: ['single'], title: 'Lost or broken', body: 'Use the “already sent” steps — they don’t need to be nearby.' },
    ],
    sent: [
      { modes: ['single'], title: 'Remove them from Find My', body: 'Find My app › Devices (or Items) › your AirPods › Remove This Device › Remove, or icloud.com/find › the AirPods › Remove This Device. This also lifts Find My Lock, which Apple can’t remove for you.' },
      { modes: ['single'], title: 'Then forget them', body: 'Forget them in Bluetooth on your iPhone: AirPods still paired to it can reappear and lock again.' },
    ],
  },
}
