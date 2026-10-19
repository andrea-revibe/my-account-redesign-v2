import { RESET_GUIDE_BY_ID, RECOVERY_NODES } from '../data/resetGuides'

// Pure selectors over the guide definitions in data/resetGuides/*. The sheet,
// Step 3 and the sandbox all go through these, so filtering (mode, variant,
// Mac chip) lives in one place.

export const RESET_MODES = {
  return: { label: 'Return', sub: 'change of mind · issue' },
  repair: { label: 'Repair', sub: 'warranty' },
  single: { label: 'Single mode', sub: 'same steps for return and repair' },
}

export function guideById(id) {
  return RESET_GUIDE_BY_ID[id] ?? RESET_GUIDE_BY_ID.apple_mobile
}

// Return mode erases the device; Repair mode keeps the data and only lifts the
// locks. Compensation (customer keeps the device) gets no guide.
export function modeForClaimType(claimType) {
  if (claimType === 'warranty') return 'repair'
  if (claimType === 'change_of_mind' || claimType === 'issue') return 'return'
  return null
}

export function isSingleMode(guide) {
  return guide.modes.includes('single')
}

export function effectiveMode(guide, mode) {
  return isSingleMode(guide) ? 'single' : mode === 'repair' ? 'repair' : 'return'
}

export function variantFor(guide, variantId) {
  return guide.variants.find((v) => v.id === variantId) ?? guide.variants[0]
}

const fits = (item, mode, facts) => {
  if (item.modes && mode !== 'single' && !item.modes.includes(mode)) return false
  const w = item.when
  if (!w) return true
  if (w.variant && !w.variant.includes(facts.variant)) return false
  if (w.chip && !w.chip.includes(facts.chip)) return false
  return true
}

// facts = { variant, chip } — the catalogue variant and the G4 chip answer.
// An unanswered chip counts as the majority path (2012–2017 Intel).
export function stepsFor(guide, mode, facts = {}) {
  const m = effectiveMode(guide, mode)
  const f = { variant: variantFor(guide, facts.variant).id, chip: facts.chip ?? 'intel_old' }
  return guide.steps.filter((s) => fits(s, m, f))
}

// "I can't use my device" as a small graph: symptoms open nodes, a node either
// asks one question (`ask` + `options`) or is a fix (`steps`). Any field may be
// per-mode ({ return, repair }); `then` appends another fix's steps with
// continuous numbering, so the customer never gets sent to another section.
const pick = (v, mode) => (v && typeof v === 'object' && !Array.isArray(v) ? v[mode] ?? null : v ?? null)

const ENTRY_SYMPTOM = { sent: 'sent', recovery: 'account' }

export function symptomsFor(guide, mode, facts = {}) {
  const m = effectiveMode(guide, mode)
  const f = { variant: variantFor(guide, facts.variant).id }
  return (guide.cantUse?.symptoms ?? [])
    .filter((s) => fits(s, m, f))
    .map((s) => ({ ...s, to: pick(s.to, m) }))
    .filter((s) => s.to)
}

// initialView → the node trail the sheet opens on ([] = the symptom picker).
export function cantUseEntry(guide, mode, initialView, facts = {}) {
  const s = symptomsFor(guide, mode, facts).find((x) => x.id === ENTRY_SYMPTOM[initialView])
  return s ? [s.to] : []
}

function rawNode(guide, id) {
  return guide.cantUse?.nodes?.[id] ?? RECOVERY_NODES[id] ?? null
}

export function resolveNode(guide, mode, id, facts = {}) {
  const m = effectiveMode(guide, mode)
  const f = { variant: variantFor(guide, facts.variant).id }
  const raw = rawNode(guide, id)
  if (!raw) return null
  const links = (list) =>
    (list ?? []).filter((o) => fits(o, m, f)).map((o) => ({ ...o, to: pick(o.to, m) })).filter((o) => o.to)
  const node = {
    id,
    ask: pick(raw.ask, m),
    sub: pick(raw.sub, m),
    title: pick(raw.title, m),
    body: pick(raw.body, m),
    tip: pick(raw.tip, m),
    resume: !!raw.resume,
    options: links(raw.options),
    more: links(raw.more),
  }
  if (node.ask) return node
  const steps = (raw.steps ?? []).filter((s) => fits(s, m, f))
  const seen = new Set([id])
  let next = pick(raw.then, m)
  while (next && !seen.has(next)) {
    seen.add(next)
    const t = rawNode(guide, next)
    if (!t) break
    const lead = pick(t.lead, m)
    if (lead) steps.push({ section: lead })
    steps.push(...(t.steps ?? []).filter((s) => fits(s, m, f)))
    node.tip = node.tip ?? pick(t.tip, m)
    node.more = node.more.length ? node.more : links(t.more)
    next = pick(t.then, m)
  }
  node.steps = steps
  return node
}

// `{is}` agrees with plural nouns ("Your AirPods are…").
export function fillNoun(text, noun, plural = false) {
  return text ? text.replaceAll('{noun}', noun).replaceAll('{is}', plural ? 'are' : 'is') : text
}

export const PASSCODE_KINDS = {
  windows_pin: { label: 'Temporary Windows PIN', placeholder: 'Your temporary PIN', min: 4 },
  mac_login: { label: 'Mac login password', placeholder: 'Login or temporary admin password', min: 1 },
}

// Soft check for the Repair-mode secure passcode field. Empty is allowed (the
// field is a fallback); anything that looks like an email is rejected so an
// account username/password pair never lands here.
export function passcodeError(value, kind) {
  const v = (value ?? '').trim()
  if (!v) return null
  if (/@/.test(v)) {
    return 'That looks like an email address. Enter the device PIN or login password — never your account details.'
  }
  const min = PASSCODE_KINDS[kind]?.min ?? 1
  if (v.length < min) return `Use at least ${min} characters.`
  return null
}
