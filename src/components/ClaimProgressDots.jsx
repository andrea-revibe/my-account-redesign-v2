import { Check } from 'lucide-react'

// Tone palette shared with ClaimCard / WarrantyClaimCard. Keep in sync.
const TONE = {
  warn:    { text: 'text-warn',    bg: 'bg-warn' },
  brand:   { text: 'text-brand',   bg: 'bg-brand' },
  success: { text: 'text-success', bg: 'bg-success' },
}

const GLOW = {
  warn: 'shadow-[0_0_0_4px_rgb(255,242,221)]',
  brand: 'shadow-[0_0_0_4px_rgb(243,237,251)]',
  success: 'shadow-[0_0_0_4px_rgb(216,239,225)]',
}

// Single source of truth for the horizontal claim-progress dot strip used by
// ClaimCard (refund / compensation), WarrantyClaimCard, and InvalidClaimCard's
// return-shipment surface, so the three can't drift. Caller supplies the step
// list, the current index, an id→timestamp `stamps` map (the return surface
// merges claim + return-shipment timelines), and the tone driving the
// fill/glow. Timestamps split on ' · ' into a date line + time line.
export default function ClaimProgressDots({ steps, curIdx, stamps = {}, tone = 'warn' }) {
  const t = TONE[tone] || TONE.warn

  return (
    <ol className="flex items-start justify-between gap-0.5">
      {steps.map((s, i) => {
        const reached = i <= curIdx
        const isCurrent = i === curIdx
        const ts = reached ? stamps[s.id] : null
        let date = ''
        let time = ''
        if (ts) {
          const parts = String(ts).split(' · ')
          date = parts[0] || ''
          time = parts[1] || ''
        }
        return (
          <li
            key={s.id}
            className="flex-1 flex flex-col items-center text-center relative min-w-0"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[9px] right-1/2 w-full h-[2px] ${
                  reached ? t.bg : 'bg-line'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-[18px] h-[18px] rounded-full border-2 ${
                reached
                  ? `${t.bg} border-transparent text-white`
                  : 'bg-surface border-line text-muted'
              } ${isCurrent ? GLOW[tone] || GLOW.warn : ''}`}
            >
              {i < curIdx && <Check size={10} strokeWidth={3} />}
            </span>
            <span
              className={`mt-1.5 text-[9.5px] leading-[1.2] px-0.5 ${
                isCurrent
                  ? `${t.text} font-bold`
                  : reached
                    ? 'text-ink font-medium'
                    : 'text-muted font-medium'
              }`}
            >
              {s.short}
            </span>
            <span
              className={`mt-1 text-[9px] leading-[1.25] tabular-nums min-h-[22px] ${
                reached ? 'text-ink-2' : 'text-muted/50'
              }`}
            >
              {date && (
                <>
                  {date}
                  {time && (
                    <>
                      <br />
                      {time}
                    </>
                  )}
                </>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
