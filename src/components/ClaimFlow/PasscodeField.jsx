import { useState } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import InlineError from './InlineError'
import { PASSCODE_KINDS } from '../../lib/resetGuides'
import { NEVER_ASK } from '../../data/resetGuides'

// Repair-mode fallback only (Windows PIN, Mac login): a masked field the
// assigned repair partner alone would see. Validation is the caller's
// (passcodeError) so the sheet can block "next" on an email-like value.
export default function PasscodeField({ kind, value, onChange, error }) {
  const [shown, setShown] = useState(false)
  const meta = PASSCODE_KINDS[kind]
  return (
    <div className="mt-4 w-full max-w-[320px] text-left">
      <label className="block text-[12px] font-semibold text-ink mb-1.5">
        {meta.label} <span className="font-normal text-muted">· optional</span>
      </label>
      <div
        className={`flex items-center gap-2 rounded-[12px] border-[1.5px] bg-surface px-3 h-11 ${
          error ? 'border-danger' : 'border-line focus-within:border-brand'
        }`}
      >
        <Lock size={15} strokeWidth={2} className="text-muted shrink-0" />
        <input
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={meta.placeholder}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? 'Hide' : 'Show'}
          className="text-muted hover:text-ink"
        >
          {shown ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
        </button>
      </div>
      {error && <InlineError className="mt-1.5 ml-1">{error}</InlineError>}
      <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-2">
        <ShieldCheck size={13} strokeWidth={2} className="text-success shrink-0 mt-px" />
        <span>
          Encrypted, seen only by the repair partner, deleted when the claim closes.{' '}
          <span className="font-semibold text-ink">{NEVER_ASK}</span>
        </span>
      </p>
    </div>
  )
}
