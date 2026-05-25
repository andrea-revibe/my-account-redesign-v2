import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'

const PROVIDER_LABELS = {
  tabby: 'Tabby',
  tamara: 'Tamara',
}

export function bnplProviderLabel(provider) {
  return PROVIDER_LABELS[provider] || 'your buy-now-pay-later provider'
}

export function isBnpl(order) {
  return order?.paymentMethod?.type === 'bnpl'
}

export default function BnplDisclaimerTooltip({
  provider,
  align = 'center',
  iconClassName = 'text-muted hover:text-ink',
  stopPropagation,
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
    }
  }, [open])

  const anchor =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-1/2 -translate-x-1/2'

  const label = bnplProviderLabel(provider)
  const named = PROVIDER_LABELS[provider]

  return (
    <span ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={`About refunds via ${label}`}
        aria-expanded={open}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`w-5 h-5 -m-0.5 inline-flex items-center justify-center ${iconClassName}`}
      >
        <Info size={14} strokeWidth={1.75} />
      </button>
      {open && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 'min(260px, calc(100vw - 2rem))' }}
          className={`absolute ${anchor} top-full mt-2 w-[260px] z-20 rounded-[10px] border border-line bg-surface shadow-lg2 p-3 text-[12px] leading-[1.45] text-ink-2 font-normal normal-case tracking-normal text-left whitespace-normal`}
        >
          {named ? (
            <>
              {named} may charge additional fees on refunded purchases. Check
              your {named} account for details.
            </>
          ) : (
            <>
              Your buy-now-pay-later provider may charge additional fees on
              refunded purchases. Check your provider account for details.
            </>
          )}
        </span>
      )}
    </span>
  )
}
