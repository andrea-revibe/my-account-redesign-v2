import { useState } from 'react'
import { Star, Check } from 'lucide-react'

// Mock NPS survey shown inline on the claim confirmation screen (Step 7). Stands
// in for a Typeform embed — no network, no backend: tapping a score flips to a
// local thank-you state. When the real form is wired, swap the scale block for
// Typeform's <Widget id={…} hidden={{ claim_ref, claim_type }} />.
export default function NpsSurvey({ className = '' }) {
  const [score, setScore] = useState(null)

  return (
    <section
      className={`rounded-[14px] border border-brand/30 bg-brand-bg px-4 py-4 ${className}`}
    >
      {score === null ? (
        <>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-brand-bg text-brand grid place-items-center shrink-0">
              <Star size={14} strokeWidth={1.75} />
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
              Quick one
            </span>
          </div>
          <p className="mt-2.5 text-[14px] font-semibold text-ink leading-[1.35]">
            How was your experience in raising a claim with Revibe?
          </p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setScore(n)}
                className="flex-1 min-w-0 h-10 rounded-[10px] border border-line bg-surface text-[14px] font-semibold text-ink tabular-nums transition-colors hover:border-brand active:bg-brand active:text-white"
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-success-bg text-success grid place-items-center shrink-0">
            <Check size={15} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-ink">
              Thanks for the feedback!
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted leading-[1.45]">
              You rated us {score}/5 — it helps us make returns better.
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
