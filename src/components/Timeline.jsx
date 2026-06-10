import { Check } from 'lucide-react'

// Unified step-progress timeline — the single source of truth for every
// timeline in the UI. One component, two orientations, four tones, plus an
// on-dark (hero) palette. Replaces every hand-rolled dot strip: the order
// status timelines (collapsed DotBar / hero / in-progress / past), the claim /
// warranty / return progress strips, the shipping + cancellation sub-timelines,
// and the inbound/return transit dropdowns.
//
// Settled design (docs/handoff/timeline/design.md):
//   completed (i < currentIndex) = solid tone dot + white check, full connector
//   current   (i === currentIndex) = hollow toned ring, no check, pulsing;
//                                     its outgoing connector fills ¾ ("in transit")
//   future    (i > currentIndex) = grey hollow ring, grey connector
// The pulse (glow ring + connector opacity) and the ¾ partial fill are the two
// net-new pieces; both gated behind motion-reduce (static 4px ring fallback)
// via the timelinePulse / timelineConnPulse keyframes in tailwind.config.js.
//
// Modes:
//   onDark   — white-on-gradient palette for HeroCard (tone is ignored).
//   complete — terminal: every step renders done (checks), no current/pulse.
//   frozen   — the current step is a solid marker (no check/pulse/¾): a stopped
//              timeline, e.g. a cancelled order's freeze point.

const TONE = {
  brand: { fill: 'bg-brand', border: 'border-brand', text: 'text-brand', glow: 'rgb(243,237,251)' },
  warn: { fill: 'bg-warn', border: 'border-warn', text: 'text-warn', glow: 'rgb(255,242,221)' },
  success: { fill: 'bg-success', border: 'border-success', text: 'text-success', glow: 'rgb(230,246,240)' },
  danger: { fill: 'bg-danger', border: 'border-danger', text: 'text-danger', glow: 'rgb(253,232,235)' },
}

const DARK_GLOW = 'rgba(255,255,255,0.18)'

const SIZE = {
  horizontal: { dot: 20, check: 11 },
  vertical: { dot: 28, check: 14 },
  dense: { dot: 16, check: 9 },
}

function resolveState(i, currentIndex, last, complete, frozen) {
  if (complete) return 'done'
  if (i < currentIndex) return 'done'
  if (i === currentIndex) {
    if (frozen) return 'frozen'
    // Reaching the final step means the journey is finished → render it
    // filled with a check (complete), not as a pulsing "current" step.
    if (currentIndex >= last) return 'done'
    return 'current'
  }
  return 'future'
}

// Outgoing connector for step i (toward i+1): full | active (¾) | none.
function connFill(i, currentIndex, last, complete, frozen) {
  if (complete) return 'full'
  if (i < currentIndex) return 'full'
  if (i === currentIndex && currentIndex < last) return frozen ? 'none' : 'active'
  return 'none'
}

function Dot({ state, tone, dot, check, onDark }) {
  const t = TONE[tone] || TONE.brand
  const base =
    'box-border rounded-full grid place-items-center shrink-0 relative z-[2] border-2'
  let cls
  let style = { width: dot, height: dot }
  if (state === 'done' || state === 'frozen') {
    cls = onDark
      ? `${base} bg-white border-white text-brand`
      : `${base} ${t.fill} ${t.border} text-white`
  } else if (state === 'current') {
    const glow = onDark ? DARK_GLOW : t.glow
    cls = onDark
      ? `${base} bg-transparent border-white shadow-[0_0_0_4px_var(--tl-glow)] motion-safe:animate-timelinePulse`
      : `${base} bg-surface ${t.border} shadow-[0_0_0_4px_var(--tl-glow)] motion-safe:animate-timelinePulse`
    style = { ...style, '--tl-glow': glow }
  } else {
    cls = onDark
      ? `${base} bg-transparent border-white/40 text-white/60`
      : `${base} bg-surface border-line text-muted`
  }
  return (
    <span className={cls} style={style}>
      {state === 'done' && <Check style={{ width: check, height: check }} strokeWidth={3} />}
    </span>
  )
}

// The tone fill over the grey connector track. full = 100%, active = 75%
// (the ¾ in-transit segment, pulsing), none = bare track.
function ConnectorFill({ orientation, fill, tone, onDark }) {
  if (fill === 'none') return null
  const t = TONE[tone] || TONE.brand
  const active = fill === 'active'
  const pct = active ? '75%' : '100%'
  const dim = orientation === 'horizontal' ? { width: pct } : { height: pct }
  return (
    <span
      aria-hidden
      className={`absolute top-0 left-0 rounded-full ${onDark ? 'bg-white' : t.fill} ${
        orientation === 'horizontal' ? 'h-full' : 'w-full'
      } ${active ? 'motion-safe:animate-timelineConnPulse' : ''}`}
      style={dim}
    />
  )
}

export default function Timeline({
  orientation = 'horizontal',
  tone = 'brand',
  steps = [],
  currentIndex = 0,
  stamps = {},
  dense = false,
  onDark = false,
  complete = false,
  frozen = false,
  toneForStep,
}) {
  const last = steps.length - 1
  const sz = orientation === 'horizontal' ? SIZE.horizontal : dense ? SIZE.dense : SIZE.vertical
  const toneAt = (i, state) => toneForStep?.(i, state) ?? tone
  const track = onDark ? 'bg-white/[.22]' : 'bg-line'

  if (orientation === 'horizontal') {
    const hasStamps = steps.some((s) => stamps[s.id])
    return (
      <ol className="flex items-start">
        {steps.map((s, i) => {
          const state = resolveState(i, currentIndex, last, complete, frozen)
          const tn = toneAt(i, state)
          const t = TONE[tn] || TONE.brand
          const stamp = stamps[s.id]
          return (
            <li
              key={s.id}
              className="relative flex-1 min-w-0 flex flex-col items-center text-center"
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {i < last && (
                <span
                  aria-hidden
                  className={`absolute top-[9px] h-[2px] z-[1] ${track}`}
                  // Span only the gap between this dot's right edge and the
                  // next dot's left edge (dot = 20px → 10px radius), so the
                  // line never runs under a dot — the hollow current ring on
                  // the dark hero would otherwise show the line through its
                  // transparent centre.
                  style={{ left: 'calc(50% + 10px)', width: 'calc(100% - 20px)' }}
                >
                  <ConnectorFill
                    orientation="horizontal"
                    fill={connFill(i, currentIndex, last, complete, frozen)}
                    tone={tn}
                    onDark={onDark}
                  />
                </span>
              )}
              <Dot state={state} tone={tn} dot={sz.dot} check={sz.check} onDark={onDark} />
              <span
                className={`mt-2 px-0.5 text-[11px] leading-[1.25] [text-wrap:balance] ${
                  hasStamps ? 'min-h-[28px]' : ''
                } ${
                  state === 'current'
                    ? onDark
                      ? 'text-white font-bold'
                      : `${t.text} font-bold`
                    : state === 'future'
                      ? onDark
                        ? 'text-white/60 font-medium'
                        : 'text-muted font-medium'
                      : onDark
                        ? 'text-white/90 font-medium'
                        : 'text-ink font-medium'
                }`}
              >
                {s.short || s.shortLabel || s.label}
              </span>
              {stamp && (
                <span
                  className={`mt-[3px] text-[10px] leading-[1.3] tabular-nums whitespace-nowrap ${
                    onDark ? 'text-white/65' : 'text-ink-2'
                  }`}
                >
                  {String(stamp)
                    .split(' · ')
                    .map((p, k) => (
                      <span key={k} className="block">
                        {p}
                      </span>
                    ))}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const state = resolveState(i, currentIndex, last, complete, frozen)
        const tn = toneAt(i, state)
        const t = TONE[tn] || TONE.brand
        const stamp = stamps[s.id]
        return (
          <li
            key={s.id}
            className="flex gap-3"
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <Dot state={state} tone={tn} dot={sz.dot} check={sz.check} onDark={onDark} />
              {i < last && (
                <span
                  aria-hidden
                  className={`relative w-[2px] flex-1 my-[3px] min-h-[22px] ${track}`}
                >
                  <ConnectorFill
                    orientation="vertical"
                    fill={connFill(i, currentIndex, last, complete, frozen)}
                    tone={tn}
                    onDark={onDark}
                  />
                </span>
              )}
            </div>
            <div className={`flex-1 ${i === last ? '' : dense ? 'pb-3' : 'pb-4'}`}>
              <div
                className={`${dense ? 'text-[12.5px]' : 'text-[13px]'} leading-[1.3] ${
                  state === 'current'
                    ? onDark
                      ? 'text-white font-bold'
                      : `${t.text} font-bold`
                    : state === 'future'
                      ? onDark
                        ? 'text-white/75'
                        : 'text-muted'
                      : onDark
                        ? 'text-white'
                        : 'text-ink'
                }`}
              >
                {s.label}
              </div>
              {stamp && (
                <div
                  className={`mt-0.5 text-[11px] leading-[1.3] tabular-nums ${
                    onDark ? 'text-white/55' : 'text-muted'
                  }`}
                >
                  {stamp}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
