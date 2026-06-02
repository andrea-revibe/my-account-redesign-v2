import { AlertCircle } from 'lucide-react'

// Shared red validation message surfaced when the customer clicks Continue
// with a required input still missing. Visual mirrors the Review step's ack
// error so the soft-validation pattern reads the same everywhere.
export default function InlineError({ children, className = '' }) {
  return (
    <p
      className={`flex items-start gap-1.5 text-[11.5px] font-semibold text-danger leading-[1.4] animate-slideDown ${className}`}
    >
      <AlertCircle size={12} strokeWidth={2} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  )
}
