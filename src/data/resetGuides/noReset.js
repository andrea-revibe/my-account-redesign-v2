// Items with no account lock (accessories, JBL, EarPods, controllers,
// non-Apple smartwatches, PS2): a packing note only — Step 3 renders it as a
// card instead of the guide launcher.
export default {
  id: 'no_reset',
  code: '—',
  label: 'No reset',
  account: [],
  variants: [
    { id: 'accessory', label: 'Accessory', noun: 'item', frame: 'box', category: 'Accessories', title: 'USB-C 20W Charger' },
    { id: 'audio', label: 'JBL speaker', noun: 'item', frame: 'box', category: 'Audio', title: 'JBL Flip 6' },
    { id: 'controller', label: 'Controller', noun: 'item', frame: 'box', category: 'Gaming', title: 'DualSense Controller' },
  ],
  steps: [
    {
      id: 'pack',
      final: true,
      title: 'No reset needed',
      body: 'This item has no account to unlink. Remove your own items, and pack everything that came in the box.',
    },
  ],
}
