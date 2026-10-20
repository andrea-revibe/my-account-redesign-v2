import { RESET_GUIDE_BY_ID, RECOVERY_NODES } from '../data/resetGuides'

// Pure selectors over the guide definitions in data/resetGuides/*. The sheet,
// Step 3 and the sandbox all go through these, so filtering (variant, erase
// choice) lives in one place.

export function guideById(id) {
  return RESET_GUIDE_BY_ID[id] ?? RESET_GUIDE_BY_ID.apple_mobile
}

// Every claim type runs the same guide, word for word. The mode only matters
// to the claim-flow chrome around it (Step 3 heading); compensation (customer
// keeps the device) gets no guide.
export function modeForClaimType(claimType) {
  if (claimType === 'warranty') return 'repair'
  if (claimType === 'change_of_mind' || claimType === 'issue') return 'return'
  return null
}

export function variantFor(guide, variantId) {
  return guide.variants.find((v) => v.id === variantId) ?? guide.variants[0]
}

// `erase` on the guide: 'optional' asks the customer after the must-do steps
// (steps flagged `erase: true` run only if they opt in); 'required' means the
// erase steps are ordinary must-dos; absent = nothing to erase.
export function eraseFor(guide) {
  return guide.erase ?? null
}

const fits = (item, facts) => {
  const w = item.when
  if (!w?.variant) return true
  return w.variant.includes(facts.variant)
}

export const ERASE_CHOICE = { id: 'erase_choice', choice: true }

// facts = { variant, erase } — erase: the customer opted into the optional
// erase. Order: must-dos, then (optional guides) the choice screen, then the
// erase steps when chosen.
export function stepsFor(guide, facts = {}) {
  const f = { variant: variantFor(guide, facts.variant).id }
  const all = guide.steps.filter((s) => fits(s, f))
  if (eraseFor(guide) !== 'optional') return all
  const must = all.filter((s) => !s.erase)
  return [...must, ERASE_CHOICE, ...(facts.erase ? all.filter((s) => s.erase) : [])]
}

// "I can't use my device": the customer can't unlock it, it's broken, or it's
// already with us. One remote-unlink carousel per guide (`guide.remote.steps`,
// same step shape as the on-device steps), the same for every claim type.
// A remote may offer parallel routes (`routes: [{ id, label, steps }]`, e.g.
// Apple's Find My app vs icloud.com) that the customer switches between;
// a plain `steps` list is a single unnamed route.
export function remoteRoutesFor(guide) {
  const r = guide.remote
  if (!r) return []
  return r.routes ?? [{ id: 'default', label: null, steps: r.steps ?? [] }]
}

// facts = { variant, route } — route defaults to the first.
export function remoteStepsFor(guide, facts = {}) {
  const f = { variant: variantFor(guide, facts.variant).id }
  const routes = remoteRoutesFor(guide)
  const route = routes.find((r) => r.id === facts.route) ?? routes[0]
  return (route?.steps ?? []).filter((s) => fits(s, f))
}

// Account recovery, reached from a step's `help` link: a fix node (`steps`,
// where a `{ section }` item is a sub-heading) or a question (`ask` +
// `options`). `then` appends another node's steps with continuous numbering.
export function resolveNode(guide, id, facts = {}) {
  const f = { variant: variantFor(guide, facts.variant).id }
  const raw = RECOVERY_NODES[id]
  if (!raw) return null
  const links = (list) => (list ?? []).filter((o) => fits(o, f))
  const node = {
    id,
    ask: raw.ask ?? null,
    sub: raw.sub ?? null,
    title: raw.title ?? null,
    body: raw.body ?? null,
    tip: raw.tip ?? null,
    resume: !!raw.resume,
    options: links(raw.options),
    more: links(raw.more),
  }
  if (node.ask) return node
  const steps = (raw.steps ?? []).filter((s) => fits(s, f))
  const seen = new Set([id])
  let next = raw.then
  while (next && !seen.has(next)) {
    seen.add(next)
    const t = RECOVERY_NODES[next]
    if (!t) break
    if (t.lead) steps.push({ section: t.lead })
    steps.push(...(t.steps ?? []).filter((s) => fits(s, f)))
    node.tip = node.tip ?? t.tip ?? null
    node.more = node.more.length ? node.more : links(t.more)
    next = t.then
  }
  node.steps = steps
  return node
}

// `{is}` agrees with plural nouns ("Your AirPods are…").
export function fillNoun(text, noun, plural = false) {
  return text ? text.replaceAll('{noun}', noun).replaceAll('{is}', plural ? 'are' : 'is') : text
}

// ResetFailedCard: the device is locked at Revibe, so the customer shares how
// to unlock it (never at submit — only here). One field per guide; `kinds`
// gives the input type(s), `required: false` lets the customer leave it empty.
// AirPods / PlayStation have no screen lock to share.
const PIN = (min, max) => ({ id: 'pin', label: 'PIN', input: 'numeric', min, max, placeholder: `${min}–${max} digits` })
export const UNLOCK_FIELDS = {
  apple_mobile: {
    label: 'Device passcode',
    short: 'passcode',
    required: true,
    kinds: [{ id: 'passcode', input: 'numeric', min: 4, max: 6, placeholder: '4- or 6-digit passcode' }],
    hint: 'The passcode you unlock the {noun} with — not your Apple Account password.',
  },
  watch: {
    label: 'Watch passcode',
    short: 'passcode',
    required: true,
    kinds: [{ id: 'passcode', input: 'numeric', min: 4, max: 10, placeholder: '4–10 digits' }],
    hint: 'The passcode you unlock the watch with — not your Apple Account password.',
  },
  android: {
    label: 'Screen lock',
    short: 'screen lock',
    required: true,
    kinds: [
      PIN(4, 16),
      { id: 'password', label: 'Password', input: 'text', min: 4, placeholder: 'Your screen-lock password' },
      { id: 'pattern', label: 'Pattern', input: 'pattern', min: 4 },
    ],
    hint: 'What you unlock the phone with — not your Google or Samsung password.',
  },
  mac: {
    label: 'Mac login password',
    short: 'password',
    required: true,
    kinds: [{ id: 'password', input: 'text', min: 1, placeholder: 'Your Mac login password' }],
    hint: 'The password you log in to the Mac with — not your Apple Account password.',
  },
  windows: {
    label: 'Windows PIN or local password',
    short: 'PIN or password',
    required: false,
    kinds: [{ id: 'password', input: 'text', min: 4, placeholder: 'PIN or local account password' }],
    hint: 'Not your Microsoft account password — we never ask for that. Only sign in with it? Leave this empty: removing the laptop from your account is enough, and we’ll erase it.',
  },
}

export function unlockFieldFor(guideId) {
  return UNLOCK_FIELDS[guideId] ?? null
}

// Soft check for the shared unlock code. Empty → required message (or null
// when optional); an email is always rejected so account credentials never
// land here.
export function unlockError(value, field, kind) {
  const v = (value ?? '').trim()
  if (!v) return field.required ? `Enter your ${field.short}.` : null
  if (kind.input !== 'pattern' && /@/.test(v)) {
    return 'That looks like an email address. Enter the device’s own code — never your account details.'
  }
  if (kind.input === 'numeric' && !/^\d+$/.test(v)) return 'Use numbers only.'
  if (kind.input === 'pattern' && v.length < kind.min) return `Connect at least ${kind.min} dots.`
  if (kind.input !== 'pattern' && v.length < kind.min) return `Use at least ${kind.min} characters.`
  return null
}

// What the customer confirms they removed, per guide account.
export function unlinkAckLabel(guide, variantId) {
  if (guide.id === 'playstation') return 'I’ve deactivated it on my PlayStation account'
  if (guide.id === 'android')
    return variantId === 'samsung_phone'
      ? 'I’ve removed it from my Google and Samsung accounts'
      : 'I’ve removed it from my Google Account'
  if (guide.id === 'windows') return 'I’ve removed it from my Microsoft account'
  return 'I’ve removed it from my Apple Account'
}
