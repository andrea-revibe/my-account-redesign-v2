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
//   4. Writes docs/process/freshness-report.md and prints a summary.
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
md += `- **code_map.md:** ${codeMapWasStale ? '⚠️ was stale — regenerated this run (commit it)' : '✅ current'}\n`
md += `- **Docs flagged for re-verification:** ${stale.length}\n`
md += `- **Mapping warnings (dead \`covers\` paths):** ${mappingWarnings.length}\n`
md += `- **CLAUDE.md Mental models budget:** ${budget.skipped ? '—' : budget.ok ? `✅ ${budget.sectionChars}/${MENTAL_MODELS_SECTION_BUDGET} chars` : `⚠️ over budget (${budget.sectionChars}/${MENTAL_MODELS_SECTION_BUDGET} chars, ${budget.overlong.length} multi-line bullet(s))`}\n\n`

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
console.log(`\nwrote ${relative(ROOT, REPORT)} · ${stale.length} doc(s) to re-verify`)

if (!budget.skipped && !budget.ok) {
  console.log(`\n✗ CLAUDE.md Mental models over budget — collapse entries to one-line pointers (see report)`)
  process.exitCode = 1
}
