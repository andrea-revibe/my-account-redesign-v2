#!/usr/bin/env node
// Regenerates the GENERATED block of docs/code_map.md from the real source tree.
//
// What it emits (all derived from src/, never hand-edited):
//   - a module index: every src file with LOC, its exported symbols (+ line), and how many files import it
//   - a shared-core consumers table: for each lib/ and data/ module, the exact list of importers (blast radius)
//   - a mermaid graph of the lib/ + data/ spine (the cross-cutting source-of-truth layer)
//
// Curated prose (navigation "where is X", blast-radius narrative, agent protocol) lives OUTSIDE the
// markers and is preserved across runs. Run:  node scripts/codemap.mjs
//
// Parser is regex-based and relies on this repo's conventions (verified): every export is
// `export [default] [async] function|const|let|class Name`, all internal imports are relative.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DOC = join(ROOT, 'docs', 'code_map.md')
const START = '<!-- codemap:generated:start -->'
const END = '<!-- codemap:generated:end -->'

// ---- walk src ----
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, acc)
    else if (/\.(jsx?|mjs)$/.test(name)) acc.push(full)
  }
  return acc
}

const files = walk(SRC).sort()
const rel = (f) => relative(ROOT, f)

// ---- parse imports + exports ----
const EXPORT_RE =
  /^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/
const EXPORT_LIST_RE = /^export\s+\{([^}]+)\}/
const DEFAULT_ANON_RE = /^export\s+default\b/
const IMPORT_RE = /\bfrom\s+['"](\.[^'"]+)['"]/g

function resolveImport(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec)
  const cands = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    join(base, 'index.js'),
    join(base, 'index.jsx'),
  ]
  for (const c of cands) if (existsSync(c) && statSync(c).isFile()) return c
  return null
}

const model = new Map() // relPath -> { loc, exports:[{name,line}], imports:Set<relPath>, importers:Set }
for (const f of files) {
  model.set(rel(f), { loc: 0, exports: [], imports: new Set(), importers: new Set() })
}

for (const f of files) {
  const r = rel(f)
  const text = readFileSync(f, 'utf8')
  const lines = text.split('\n')
  const entry = model.get(r)
  entry.loc = lines.length
  lines.forEach((line, i) => {
    let m = EXPORT_RE.exec(line)
    if (m) entry.exports.push({ name: m[1], line: i + 1 })
    else if ((m = EXPORT_LIST_RE.exec(line))) {
      for (const part of m[1].split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim()
        if (name) entry.exports.push({ name, line: i + 1 })
      }
    } else if (DEFAULT_ANON_RE.test(line) && !EXPORT_RE.test(line)) {
      entry.exports.push({ name: 'default', line: i + 1 })
    }
  })
  let im
  while ((im = IMPORT_RE.exec(text))) {
    const target = resolveImport(f, im[1])
    if (target) entry.imports.add(rel(target))
  }
}
// reverse edges
for (const [r, e] of model) for (const dep of e.imports) model.get(dep)?.importers.add(r)

// ---- helpers ----
const short = (r) => r.replace(/^src\//, '')
const isShared = (r) => /^src\/(lib|data)\//.test(r)
const byImporters = (a, b) => model.get(b).importers.size - model.get(a).importers.size

// ---- module index ----
let out = ''
out += '### Module index\n\n'
out += '_Concept → file → symbol → line. Read the file + jump to the line; do not fan-out search for a symbol that is listed here. `In` = how many src files import this module._\n\n'
out += '| Module | LOC | In | Exports (line) |\n|---|--:|--:|---|\n'
for (const r of [...model.keys()].sort()) {
  const e = model.get(r)
  const exps =
    e.exports.length === 0
      ? '_(none)_'
      : e.exports.map((x) => `\`${x.name}\`·${x.line}`).join(', ')
  out += `| \`${short(r)}\` | ${e.loc} | ${e.importers.size} | ${exps} |\n`
}

// ---- shared-core consumers (blast radius) ----
out += '\n### Shared-core consumers (blast radius)\n\n'
out += '_Editing a `lib/` or `data/` module touches every file listed. Hand these importers to a planning agent before changing a signature or a data shape._\n\n'
out += '| Source-of-truth module | Consumers |\n|---|---|\n'
const sharedSorted = [...model.keys()].filter(isShared).sort(byImporters)
for (const r of sharedSorted) {
  const importers = [...model.get(r).importers].sort().map((i) => `\`${short(i)}\``)
  out += `| \`${short(r)}\` | ${importers.length ? importers.join(', ') : '_(none — leaf)_'} |\n`
}

// ---- mermaid spine (lib + data only) ----
out += '\n### Source-of-truth spine\n\n'
out += '_Internal edges among `lib/` + `data/` only. Component→lib edges live in the consumers table above (too many to draw)._\n\n'
out += '```mermaid\ngraph LR\n'
const spine = [...model.keys()].filter(isShared)
const idOf = (r) => short(r).replace(/[^A-Za-z0-9]/g, '_')
for (const r of spine) out += `  ${idOf(r)}["${short(r)}"]\n`
for (const r of spine) {
  for (const dep of model.get(r).imports) {
    if (isShared(dep)) out += `  ${idOf(r)} --> ${idOf(dep)}\n`
  }
}
out += '```\n'

// ---- stats footer ----
const totalLoc = [...model.values()].reduce((s, e) => s + e.loc, 0)
out += `\n_Generated by \`scripts/codemap.mjs\` — ${model.size} modules, ${totalLoc} LOC. Re-run after structural changes; do not hand-edit between the markers._\n`

// ---- splice into doc ----
const block = `${START}\n\n${out}\n${END}`
let doc
if (existsSync(DOC)) {
  const cur = readFileSync(DOC, 'utf8')
  if (cur.includes(START) && cur.includes(END)) {
    doc = cur.replace(new RegExp(`${START}[\\s\\S]*${END}`), block)
  } else {
    doc = `${cur.trimEnd()}\n\n${block}\n`
  }
} else {
  doc = `# Code map\n\n_Scaffold — replace this header with curated navigation before relying on it._\n\n${block}\n`
}
writeFileSync(DOC, doc)
console.log(`codemap: wrote ${rel(DOC)} (${model.size} modules, ${totalLoc} LOC)`)
