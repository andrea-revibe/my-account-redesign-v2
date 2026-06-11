import { useState } from 'react'
import ResetGuideSheet from './ClaimFlow/ResetGuideSheet'
import { deviceTypeForCategory } from '../lib/devices'

// Dev-only reset-guide previewer for JourneyDevPanel (journey mode only): opens
// ResetGuideSheet at its intro for any production device category, running the
// real lib/devices.js category→guide resolution — the same mapping Step 3 seeds
// from order.category_name — so the five guide variants are reachable without
// hunting for an order of the right category and walking the claim flow.
//
// Two resolutions aren't 1:1 and are surfaced deliberately:
//   • Tablet is OS-ambiguous (deviceTypeForCategory → 'tablet'), so it reveals
//     the same Apple/Android disambiguation Step 3's TabletPicker uses →
//     'ipad' / 'android_tablet'.
//   • Laptop (Windows) has no guide yet and falls back to the iPhone guide.
// Neutral/ink chrome to read as an auxiliary tool, matching CountryPicker.
const CATEGORIES = [
  { label: 'iPhone', category: 'iPhone' },
  { label: 'MacBook', category: 'Macbook' },
  { label: 'Samsung', category: 'Samsung phone' },
  { label: 'Tablet', category: 'Tablet' },
  { label: 'Laptop', category: 'Laptop' },
]

const CHIP =
  'px-2 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition '
const CHIP_IDLE = 'bg-ink/[0.06] text-ink-2 hover:bg-ink/[0.1]'
const CHIP_ACTIVE = 'bg-ink text-white'

export default function ResetGuidePicker() {
  // device = the guide variant currently open (null = closed).
  // tabletOpen = the Tablet chip's Apple/Android sub-row is showing.
  const [device, setDevice] = useState(null)
  const [tabletOpen, setTabletOpen] = useState(false)

  const onCategory = (category) => {
    const resolved = deviceTypeForCategory(category)
    // Tablet can't be resolved from the category alone — reveal the chooser
    // instead of opening (Step 3 does the same), rather than guessing an OS.
    if (resolved === 'tablet') {
      setTabletOpen((v) => !v)
      return
    }
    setTabletOpen(false)
    setDevice(resolved)
  }

  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-1.5">
        Reset guide
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((c) => {
          const active =
            deviceTypeForCategory(c.category) === 'tablet' && tabletOpen
          return (
            <button
              key={c.label}
              onClick={() => onCategory(c.category)}
              className={CHIP + (active ? CHIP_ACTIVE : CHIP_IDLE)}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {tabletOpen && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-0.5">
          <span className="text-[10px] font-medium text-muted">Tablet:</span>
          <button onClick={() => setDevice('ipad')} className={CHIP + CHIP_IDLE}>
            Apple
          </button>
          <button
            onClick={() => setDevice('android_tablet')}
            className={CHIP + CHIP_IDLE}
          >
            Android
          </button>
        </div>
      )}

      <div className="mt-1.5 text-[10px] text-muted leading-snug">
        Tablet asks Apple/Android · Laptop (Windows) uses the iPhone guide.
      </div>

      {device && (
        <ResetGuideSheet
          device={device}
          onDone={() => setDevice(null)}
          onClose={() => setDevice(null)}
        />
      )}
    </div>
  )
}
