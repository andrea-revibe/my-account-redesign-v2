import { COUNTRIES, COUNTRY_CODES } from '../lib/countries'

// Country dimension for journey demos — orthogonal to the journey picker, so
// the same journey can be replayed under any country. Flips the capability
// flags in lib/countries.js (read by the cards) by setting order.country in
// App.jsx. Neutral/ink chrome to read as a different axis from the brand-toned
// journey chips. Shared by JourneyDevPanel + EddSandboxPanel.
export default function CountryPicker({ activeCountry, onSelectCountry }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-1.5">
        Country
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {COUNTRY_CODES.map((code) => {
          const active = code === activeCountry
          return (
            <button
              key={code}
              onClick={() => onSelectCountry(code)}
              title={COUNTRIES[code].label}
              className={
                'px-2 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition ' +
                (active
                  ? 'bg-ink text-white'
                  : 'bg-ink/[0.06] text-ink-2 hover:bg-ink/[0.1]')
              }
            >
              {code}
            </button>
          )
        })}
      </div>
    </div>
  )
}
