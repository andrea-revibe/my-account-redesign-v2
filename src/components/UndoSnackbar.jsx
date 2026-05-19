import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

// Demo-only undo affordance. Fires after a Step 7 'Back to my account'
// closes the returns flow with a fresh seeded claim. Auto-dismisses
// after ~8s; tapping Undo removes the seeded claim from App state so
// the order falls back to its baseline (delivered) card.
export default function UndoSnackbar({ message, onUndo, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-4 pointer-events-none z-40"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-[12px] bg-ink text-surface shadow-lg2 flex items-center gap-2 pl-3.5 pr-1.5 py-2 animate-slideUp">
        <CheckCircle2 size={16} strokeWidth={2} className="text-success shrink-0" />
        <span className="flex-1 text-[13.5px] font-medium leading-[1.35]">
          {message}
        </span>
        <button
          type="button"
          onClick={onUndo}
          className="h-8 px-3 rounded-full text-[12.5px] font-bold uppercase tracking-[0.06em] text-brand-bg hover:bg-white/10"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-full grid place-items-center text-muted hover:bg-white/10 shrink-0"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
