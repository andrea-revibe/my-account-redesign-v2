import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, MessageCircle, Mail, Maximize2, X } from 'lucide-react'
import { notificationFor } from '../lib/notifications'

// Customer-notification preview — stacks above the JourneyDevPanel in journey
// mode. Shows the WhatsApp / Email message the customer receives at the current
// node's backend `event`, with a channel toggle to preview each. Content is
// looked up from `lib/notifications.js`; events with no message render an
// explicit empty state (intermediate logistics steps are intentionally silent).
//
// `channel` lives here (not lifted) so the chosen channel persists as the
// stakeholder advances the journey — the component is never remounted. The
// inner content carries `key={event}` so each advance re-triggers the
// slide-in, reading as "a new notification just arrived."
const NOTIF_ANIM_CSS = `
@keyframes notifIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
`

// Coverage badge styling, keyed by the status from notificationFor.
const STATUS_BADGE = {
  live: { label: 'Live', cls: 'bg-success/10 text-success' },
  new: { label: 'New', cls: 'bg-brand/10 text-brand' },
  changed: { label: 'Changed', cls: 'bg-accent/10 text-accent' },
  missing: { label: 'Missing', cls: 'bg-red-50 text-red-600' },
  silent: { label: 'Silent', cls: 'bg-line-2 text-muted' },
}

export default function JourneyNotificationPanel({ event, order }) {
  const [channel, setChannel] = useState('whatsapp')
  const [lightbox, setLightbox] = useState(false)
  const notif = notificationFor(event, order)
  const hasCopy = notif.whatsapp || notif.email

  return (
    <div className="w-full bg-surface border border-line rounded-2xl shadow-lg p-4">
      <style>{NOTIF_ANIM_CSS}</style>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
          <Bell size={12} strokeWidth={2.5} />
          Customer receives
          <StatusBadge status={notif.status} />
        </div>
        <div className="flex items-center gap-1">
          <ChannelPill
            label="WhatsApp"
            icon={MessageCircle}
            active={channel === 'whatsapp'}
            onClick={() => setChannel('whatsapp')}
          />
          <ChannelPill
            label="Email"
            icon={Mail}
            active={channel === 'email'}
            onClick={() => setChannel('email')}
          />
        </div>
      </div>

      <div
        key={event}
        style={{ animation: 'notifIn 0.3s cubic-bezier(0.32,0.72,0,1)' }}
      >
        {!hasCopy ? (
          notif.status === 'missing' ? (
            <div className="rounded-xl bg-red-50 text-red-600 text-[12px] px-3 py-4 text-center">
              No comm here yet — gap to fill.
            </div>
          ) : (
            <div className="rounded-xl bg-line-2/60 text-muted text-[12px] px-3 py-4 text-center">
              No notification sent at this step.
            </div>
          )
        ) : channel === 'whatsapp' ? (
          <div className="rounded-xl rounded-tl-sm bg-green-50 px-3 py-2.5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[11px] font-bold text-success">Revibe</span>
              <span className="text-[10px] text-muted">· WhatsApp</span>
            </div>
            <p className="text-[13px] text-ink leading-snug">{notif.whatsapp}</p>
          </div>
        ) : (
          <button
            onClick={() => setLightbox(true)}
            className="w-full text-left rounded-xl bg-surface border border-line px-3 py-2.5 hover:border-brand/40 hover:bg-brand/5 transition group"
          >
            <div className="text-[10px] text-muted mb-1">From: Revibe</div>
            <p className="text-[13px] font-semibold text-ink leading-snug mb-1">
              {notif.email.subject}
            </p>
            <p className="text-[12px] text-muted leading-snug">{notif.email.body}</p>
            <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-brand">
              <Maximize2 size={11} strokeWidth={2.5} />
              Tap to view the full email
            </div>
          </button>
        )}
      </div>

      {lightbox && (
        <EmailLightbox
          src={notif?.email?.screenshot}
          subject={notif?.email?.subject}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  )
}

// Full-size email render, opened from the email preview. Matches the app's
// sheet chrome (scrim + Escape-to-close) but renders via a portal so it sits
// above the fixed panel stack regardless of stacking context. The screenshot
// assets may not exist yet — `onError` swaps to a placeholder so paths can be
// wired ahead of the images being dropped into public/emails/.
function EmailLightbox({ src, subject, onClose }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 animate-fadeIn"
      />
      <div className="relative my-auto w-full max-w-[480px]">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-surface border border-line shadow-md grid place-items-center text-muted hover:text-ink"
        >
          <X size={16} strokeWidth={2.25} />
        </button>
        {src && !failed ? (
          <img
            src={src}
            alt={subject ? `Email: ${subject}` : 'Revibe email'}
            onError={() => setFailed(true)}
            className="w-full rounded-2xl shadow-2xl bg-white"
          />
        ) : (
          <div className="rounded-2xl bg-surface shadow-2xl p-8 text-center">
            <Mail size={28} strokeWidth={1.75} className="mx-auto text-muted mb-3" />
            <p className="text-[14px] font-semibold text-ink mb-1">
              Email screenshot coming soon
            </p>
            <p className="text-[12px] text-muted leading-snug">
              Drop the render at{' '}
              <code className="text-[11px] font-mono text-ink">
                public{src ?? '/emails/…'}
              </code>{' '}
              to preview it here.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function StatusBadge({ status }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.silent
  return (
    <span
      className={
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.06em] ' +
        badge.cls
      }
    >
      {badge.label}
    </span>
  )
}

// Icon-only toggle — the active channel is filled, so the label is redundant
// in the row; it survives as aria-label/title for hover + a11y.
function ChannelPill({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        'inline-flex items-center justify-center w-7 h-7 rounded-full transition ' +
        (active ? 'bg-brand text-white' : 'bg-brand/10 text-brand hover:bg-brand/15')
      }
    >
      <Icon size={13} strokeWidth={2.5} />
    </button>
  )
}
