import { RESET_GUIDE_BY_ID, RECOVERY_NODES } from '../data/resetGuides'

// Pure selectors over the guide definitions in data/resetGuides/*. The sheet,
// Step 3 and the sandbox all go through these, so filtering (variant, erase
// choice) lives in one place.

// Every claim type runs the same steps. The mode only tunes copy — a warranty
// customer gets the device back, so the backup step leans harder on them.
export const RESET_MODES = {
  return: { label: 'Return', sub: 'change of mind · issue' },
  repair: { label: 'Warranty', sub: 'device comes back' },
}

export function guideById(id) {
  return RESET_GUIDE_BY_ID[id] ?? RESET_GUIDE_BY_ID.apple_mobile
}

// Compensation (customer keeps the device) gets no guide.
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

// Per-mode copy ({ return, repair }) on a step field; plain values pass through.
export const pick = (v, mode) =>
  v && typeof v === 'object' && !Array.isArray(v) ? v[mode] ?? v.return ?? null : v ?? null

export const ERASE_CHOICE = { id: 'erase_choice', choice: true }

// facts = { variant, erase } — erase: the customer opted into the optional
// erase. Order: must-dos, then (optional guides) the choice screen, then the
// erase steps when chosen.
export function stepsFor(guide, mode, facts = {}) {
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
