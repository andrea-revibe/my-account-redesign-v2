import { RESET_GUIDE_BY_ID } from '../data/resetGuides'

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

export function cantUseFor(guide, mode, where) {
  if (!guide.cantUse) return []
  const m = effectiveMode(guide, mode)
  return (guide.cantUse[where] ?? []).filter((item) => fits(item, m, {}))
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
