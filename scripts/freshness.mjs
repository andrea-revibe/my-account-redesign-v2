#!/usr/bin/env node
// Weekly / ad-hoc doc-freshness check. Report-only: it never edits doc prose or
// bumps a `verified_against` marker — only an agent/human who re-verifies a flagged
// doc does that. See docs/process/collaboration_strategy.md (P4) + docs/README.md
// "Doc tiers & review strategy".
//
// What it does each run:
//   1. Regenerates docs/code_map.md (runs codemap.mjs) and reports whether it was stale.
//   2. For each docs/output/*.md with `status: live` frontmatter, checks git for commits
//      touching its `covers:` paths since `verified_against` — those are docs to re-verify.
//      `status: frozen | archived` docs are skipped; docs with no frontmatter are flagged.
//   3. Warns on `covers:` paths that no longer exist (stale mapping).
//   4. Checks CHANGELOG.md via git blame: committed bullets still under
//      `## Unreleased` have shipped (merged via git outside this loop) and
//      should be rolled into dated sections — warns when too many linger
//      (nudge to run /doc-compact). Report-only, never a hard fail.
//   5. Validates .claude/skills/*/SKILL.md references — cited paths, `npm run`
//      scripts, and canonical anchors (CLAUDE.md "## Doc update protocol",
//      code_map.md "Where is X") must resolve; flags any skill that re-embeds
//      the doc-update triage table instead of referencing CLAUDE.md. A broken
//      reference is a hard fail (exit 1), like the Mental models budget check.
//   6. Writes docs/process/freshness-report.md and prints a summary.
//
// Run:  npm run freshness   (or: node scripts/freshness.mjs)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_DIR = join(ROOT, 'docs', 'output')
const CODE_MAP = 'docs/code_map.md'
const REPORT = join(ROOT, 'docs', 'process', 'freshness-report.md')

// CLAUDE.md is the always-on context tax. The Mental models section grows by one
// bullet per feature; without a ceiling it balloons (instruction dilution + cost).
// Budget: each bullet stays a one-line pointer; the section as a whole stays bounded.
// Over budget → demote mechanics to docs/output/* and collapse to a one-liner.
const CLAUDE_MD = 'CLAUDE.md'
const MENTAL_MODELS_SECTION_BUDGET = 6000 // chars, "## Mental models" → next "## "
const MENTAL_MODELS_BULLET_BUDGET = 500 // chars per "- " bullet (a paragraph blows this)

// Skills (.claude/skills/*/SKILL.md) reference canonical sources (CLAUDE.md,
// code_map.md, package.json scripts) rather than copying facts out of them. This
// check guards those references: a cited path/script that no longer resolves, or
// a skill that has re-embedded the doc-update triage table (drift regression).
// The CHANGELOG `## Unreleased` heading is not a reliable "released?" signal:
// changes are committed/merged via git outside the agent loop, so committed
// entries linger under it. Git blame is the truth — a bullet with a real commit
// hash has shipped and should be rolled into a dated section by /doc-compact.
const CHANGELOG = 'CHANGELOG.md'
const CHANGELOG_STAGING_BUDGET = 10 // committed bullets lingering under ## Unreleased before nagging

const SKILLS_DIR = join(ROOT, '.claude', 'skills')
// Bare root files we DO resolve (no directory component). Bare component names
// like `App.jsx` / `Timeline.jsx` are referenced by name (locate via code_map),
// not as paths — so they're intentionally not checked here.
const KNOWN_ROOT_FILES = new Set(['CLAUDE.md', 'package.json', 'CHANGELOG.md', 'tailwind.config.js'])

function checkMentalModelsBudget() {
  const text = readFileSync(join(ROOT, CLAUDE_MD), 'utf8')
  const start = text.indexOf('\n## Mental models')
  if (start === -1) return { ok: true, skipped: true }
  const after = text.indexOf('\n## ', start + 1)
  const section = text.slice(start + 1, after === -1 ? undefined : after)
  const sectionChars = section.length
  const overlong = section
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => ({ len: l.length, label: l.slice(0, 64) }))
    .filter((b) => b.len > MENTAL_MODELS_BULLET_BUDGET)
  return {
    ok: sectionChars <= MENTAL_MODELS_SECTION_BUDGET && overlong.length === 0,
    sectionChars,
    overlong,
  }
}

function checkChangelogStaging() {
  const path = join(ROOT, CHANGELOG)
  if (!existsSync(path)) return { skipped: true }
  const lines = readFileSync(path, 'utf8').split('\n')
  const start = lines.findIndex((l) => l.trim() === '## Unreleased')
  if (start === -1) return { skipped: true }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break }
  }
  const lo = start + 2 // 1-indexed first line after the heading
  const hi = end // 1-indexed last line before the next heading
  if (hi < lo) return { skipped: false, committed: 0, total: 0 }
  let blame
  try {
    blame = execFileSync('git', ['blame', '-L', `${lo},${hi}`, '--', CHANGELOG], {
      cwd: ROOT,
      encoding: 'utf8',
    })
  } catch {
    return { skipped: true }
  }
  let committed = 0
  let total = 0
  for (const raw of blame.split('\n')) {
    const m = raw.match(/^(\^?[0-9a-f]+)\b.*?\)\s?(.*)$/)
    if (!m) continue
    if (!m[2].trim().startsWith('- ')) continue
    total++
    if (!/^0{8,}$/.test(m[1].replace('^', ''))) committed++
  }
  return { skipped: false, committed, total, overBudget: committed >= CHANGELOG_STAGING_BUDGET }
}

function checkSkillReferences() {
  if (!existsSync(SKILLS_DIR)) return { skipped: true, count: 0, problems: [] }
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const scripts = new Set(Object.keys(pkg.scripts || {}))
  const claudeMd = readFileSync(join(ROOT, CLAUDE_MD), 'utf8')
  const codeMap = existsSync(join(ROOT, CODE_MAP)) ? readFileSync(join(ROOT, CODE_MAP), 'utf8') : ''

  const skillFiles = []
  for (const name of readdirSync(SKILLS_DIR)) {
    const sf = join(SKILLS_DIR, name, 'SKILL.md')
    if (statSync(join(SKILLS_DIR, name)).isDirectory() && existsSync(sf)) skillFiles.push(sf)
  }

  const problems = []
  for (const file of skillFiles.sort()) {
    const rel = relative(ROOT, file)
    const text = readFileSync(file, 'utf8')
    const ticks = [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim())

    // cited paths — known root files, or paths concrete enough to resolve: skip
    // globs / placeholders / `file·line` notation; strip a #anchor or trailing
    // slash; require a file extension or ≥2 segments so single-segment shorthand
    // like `lib/` / `data/` (meaning src/lib, src/data in blast-radius prose) is
    // not mistaken for a literal path.
    for (const tok of ticks) {
      if (/[*<>·\s]/.test(tok)) continue
      const p = tok.replace(/#.*$/, '').replace(/\/$/, '')
      const segments = p.split('/').filter(Boolean).length
      const concrete = KNOWN_ROOT_FILES.has(p) || /\.\w+$/.test(p) || segments >= 2
      if (!concrete || !(p.includes('/') || KNOWN_ROOT_FILES.has(p))) continue
      if (!existsSync(join(ROOT, p))) problems.push({ rel, severity: 'error', detail: `dead path \`${tok}\`` })
    }

    for (const m of text.matchAll(/npm run ([\w-]+)/g)) {
      if (!scripts.has(m[1])) problems.push({ rel, severity: 'error', detail: `unknown script \`npm run ${m[1]}\`` })
    }

    if (/Doc update protocol/i.test(text) && !claudeMd.includes('## Doc update protocol'))
      problems.push({ rel, severity: 'error', detail: 'references CLAUDE.md "## Doc update protocol" — heading missing' })
    if (/Where is X/.test(text) && !codeMap.includes('Where is X'))
      problems.push({ rel, severity: 'error', detail: 'references code_map.md "Where is X" — section missing' })

    if (text.includes('| Change | Update |'))
      problems.push({ rel, severity: 'warn', detail: 're-embeds the doc-update triage table — reference CLAUDE.md instead' })
  }
  return { skipped: false, count: skillFiles.length, problems }
}

const git = (args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
const gitOk = (args) => {
  try {
    execFileSync('git', args, { cwd: ROOT, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// ---- collect output docs ----
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (name.endsWith('.md')) acc.push(full)
  }
  return acc
}

// ---- minimal frontmatter parser (status / verified_against / covers list) ----
function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null
  const end = text.indexOf('\n---', 4)
  if (end === -1) return null
  const body = text.slice(4, end)
  const fm = { covers: [] }
  let inCovers = false
  for (const raw of body.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    const item = line.match(/^\s*-\s+(.+)$/)
    if (inCovers && item) {
      fm.covers.push(item[1].trim())
      continue
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (kv) {
      inCovers = kv[1] === 'covers'
      if (!inCovers) fm[kv[1]] = kv[2].trim()
    }
  }
  return fm
}

const HEAD = git(['rev-parse', '--short', 'HEAD'])
const stamp = new Date().toISOString().slice(0, 10)

// ---- 1. regenerate code map, detect drift ----
execFileSync('node', [join(ROOT, 'scripts', 'codemap.mjs')], {
  cwd: ROOT,
  stdio: 'ignore',
})
const codeMapWasStale = !gitOk(['diff', '--quiet', '--', CODE_MAP])

// ---- 2. per-doc freshness ----
const results = []
for (const file of walk(OUTPUT_DIR).sort()) {
  const rel = relative(ROOT, file)
  const fm = parseFrontmatter(readFileSync(file, 'utf8'))
  if (!fm) {
    results.push({ rel, state: 'UNMARKED' })
    continue
  }
  if (fm.status && fm.status !== 'live') {
    results.push({ rel, state: fm.status.toUpperCase(), baseline: fm.verified_against })
    continue
  }
  const baseline = fm.verified_against
  const missing = fm.covers.filter((p) => !existsSync(join(ROOT, p)))
  if (!baseline || !gitOk(['cat-file', '-e', `${baseline}^{commit}`])) {
    results.push({ rel, state: 'NO-BASELINE', baseline, covers: fm.covers, missing })
    continue
  }
  const range = `${baseline}..HEAD`
  const log = git([
    'log',
    range,
    '--pretty=format:%h %ad %s',
    '--date=short',
    '--',
    ...fm.covers,
  ])
  const commits = log ? log.split('\n').filter(Boolean) : []
  const filesChanged = commits.length
    ? git(['diff', '--name-only', range, '--', ...fm.covers]).split('\n').filter(Boolean)
    : []
  results.push({
    rel,
    state: commits.length ? 'STALE' : 'FRESH',
    baseline,
    covers: fm.covers,
    missing,
    commits,
    filesChanged,
  })
}

// ---- 3. build report ----
const badge = { FRESH: '✅', STALE: '⚠️', FROZEN: '🧊', ARCHIVED: '📦', UNMARKED: '❓', 'NO-BASELINE': '❓' }
const stale = results.filter((r) => r.state === 'STALE')
const mappingWarnings = results.filter((r) => r.missing && r.missing.length)

let md = `# Doc freshness report\n\n`
md += `_Generated by \`npm run freshness\` on ${stamp} · HEAD \`${HEAD}\`. Report-only — re-verify the flagged docs against the changed code, then bump their \`verified_against\` to \`${HEAD}\`._\n\n`
const budget = checkMentalModelsBudget()
const changelog = checkChangelogStaging()
const skills = checkSkillReferences()
const skillErrors = skills.problems.filter((p) => p.severity === 'error')
const skillWarns = skills.problems.filter((p) => p.severity === 'warn')
md += `- **code_map.md:** ${codeMapWasStale ? '⚠️ was stale — regenerated this run (commit it)' : '✅ current'}\n`
md += `- **Docs flagged for re-verification:** ${stale.length}\n`
md += `- **Mapping warnings (dead \`covers\` paths):** ${mappingWarnings.length}\n`
md += `- **CLAUDE.md Mental models budget:** ${budget.skipped ? '—' : budget.ok ? `✅ ${budget.sectionChars}/${MENTAL_MODELS_SECTION_BUDGET} chars` : `⚠️ over budget (${budget.sectionChars}/${MENTAL_MODELS_SECTION_BUDGET} chars, ${budget.overlong.length} multi-line bullet(s))`}\n`
md += `- **CHANGELOG rollup:** ${changelog.skipped ? '—' : changelog.overBudget ? `⚠️ ${changelog.committed} committed bullet(s) lingering under \`## Unreleased\` (≥${CHANGELOG_STAGING_BUDGET}) — run \`/doc-compact\`` : `✅ ${changelog.committed} committed of ${changelog.total} staged`}\n`
md += `- **Skill references (${skills.count} skill(s)):** ${skills.skipped ? '—' : skillErrors.length ? `❌ ${skillErrors.length} broken` : skillWarns.length ? `⚠️ ${skillWarns.length} warning(s)` : '✅ all resolve'}\n\n`

if (skills.problems.length) {
  md += `## Skill references\n\n_Skills reference canonical sources (CLAUDE.md, code_map.md, package.json) — these stopped resolving. Fix the reference or restore the anchor; never re-embed the triage table._\n\n`
  for (const p of skills.problems) md += `- ${p.severity === 'error' ? '❌' : '⚠️'} \`${p.rel}\`: ${p.detail}\n`
  md += `\n`
}

if (!budget.skipped && !budget.ok) {
  md += `## CLAUDE.md Mental models over budget\n\n`
  md += `_Demote mechanics to \`docs/output/*\` and collapse each entry to a one-line pointer (claim/trap + doc link)._\n\n`
  if (budget.sectionChars > MENTAL_MODELS_SECTION_BUDGET) {
    md += `- Section is ${budget.sectionChars} chars (budget ${MENTAL_MODELS_SECTION_BUDGET}).\n`
  }
  for (const b of budget.overlong) {
    md += `- Bullet ${b.len} chars (budget ${MENTAL_MODELS_BULLET_BUDGET}): \`${b.label}…\`\n`
  }
  md += `\n`
}

md += `## Docs\n\n| Doc | State | Verified at | Commits since | Files changed |\n|---|---|---|--:|--:|\n`
for (const r of results) {
  md += `| \`${r.rel}\` | ${badge[r.state] ?? ''} ${r.state} | ${r.baseline ?? '—'} | ${r.commits ? r.commits.length : '—'} | ${r.filesChanged ? r.filesChanged.length : '—'} |\n`
}

if (stale.length) {
  md += `\n## Re-verify these\n\n`
  for (const r of stale) {
    md += `### \`${r.rel}\` — ${r.commits.length} commit(s) since \`${r.baseline}\`\n\n`
    md += `Changed files under its \`covers\`:\n`
    for (const f of r.filesChanged) md += `- \`${f}\`\n`
    md += `\nCommits:\n`
    for (const c of r.commits) md += `- ${c}\n`
    md += `\n`
  }
}

if (mappingWarnings.length) {
  md += `\n## Mapping warnings\n\n_These \`covers:\` paths no longer exist — update the doc's frontmatter._\n\n`
  for (const r of mappingWarnings) {
    md += `- \`${r.rel}\`: ${r.missing.map((m) => `\`${m}\``).join(', ')}\n`
  }
}

writeFileSync(REPORT, md)

// ---- 4. stdout summary ----
console.log(`\nfreshness — HEAD ${HEAD} · ${stamp}`)
console.log(`code_map.md: ${codeMapWasStale ? 'STALE → regenerated (commit it)' : 'current'}`)
for (const r of results) {
  const extra =
    r.state === 'STALE' ? ` (${r.commits.length} commit(s), ${r.filesChanged.length} file(s))` : ''
  console.log(`  ${(badge[r.state] ?? ' ')} ${r.state.padEnd(11)} ${r.rel}${extra}`)
}
if (mappingWarnings.length) {
  console.log(`\n⚠ dead covers paths in ${mappingWarnings.length} doc(s) — see report`)
}
if (!budget.skipped) {
  console.log(
    `CLAUDE.md Mental models: ${budget.ok ? '✅' : '⚠️'} ${budget.sectionChars}/${MENTAL_MODELS_SECTION_BUDGET} chars` +
      (budget.overlong.length ? ` · ${budget.overlong.length} bullet(s) over ${MENTAL_MODELS_BULLET_BUDGET}` : '')
  )
}
if (!changelog.skipped) {
  console.log(
    `CHANGELOG rollup: ${changelog.overBudget ? '⚠️' : '✅'} ${changelog.committed} committed bullet(s) lingering under ## Unreleased` +
      (changelog.overBudget ? ` (≥${CHANGELOG_STAGING_BUDGET}) — run /doc-compact` : '')
  )
}
if (!skills.skipped) {
  console.log(
    `Skill references: ${skillErrors.length ? '❌' : skillWarns.length ? '⚠️' : '✅'} ${skills.count} skill(s)` +
      (skillErrors.length ? ` · ${skillErrors.length} broken` : '') +
      (skillWarns.length ? ` · ${skillWarns.length} warning(s)` : '')
  )
  for (const p of skills.problems) console.log(`  ${p.severity === 'error' ? '❌' : '⚠️'} ${p.rel}: ${p.detail}`)
}
console.log(`\nwrote ${relative(ROOT, REPORT)} · ${stale.length} doc(s) to re-verify`)

if ((!budget.skipped && !budget.ok) || skillErrors.length) {
  if (!budget.skipped && !budget.ok)
    console.log(`\n✗ CLAUDE.md Mental models over budget — collapse entries to one-line pointers (see report)`)
  if (skillErrors.length)
    console.log(`\n✗ ${skillErrors.length} broken skill reference(s) — fix the cited path/script/anchor (see report)`)
  process.exitCode = 1
}
