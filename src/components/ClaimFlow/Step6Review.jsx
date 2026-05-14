import {
  Pencil,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Check,
  FileImage,
} from 'lucide-react'
import StepHeading from './StepHeading'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from '../WalletInfoTooltip'
import { refundBreakdown, formatMoney } from '../../lib/returns'

const REASON_LABELS = {
  no_fit: "Didn't suit my needs",
  better_option: 'Found a better option elsewhere',
  changed_mind: 'Changed my mind',
  mistake: 'Ordered by mistake',
  other: 'Other',
}

const ISSUE_CATEGORY_LABELS = {
  battery: 'Battery draining',
  software: 'Software issue',
  physical: 'Physical condition',
  screen: 'Screen issue',
  charger: 'Defective charger',
  overheating: 'Overheating',
  camera: 'Camera issue',
}

export default function Step6Review({ state, dispatch, order }) {
  if (!order) return null
  const currency = order.currency
  const isIssue = state.claimType === 'issue'
  const refund = refundBreakdown(
    order,
    state.units,
    state.refundMethod,
    state.claimType,
  )
  const reasonText = !state.reason.value
    ? 'Not provided'
    : state.reason.value === 'other' && state.reason.otherText.trim()
      ? state.reason.otherText.trim()
      : REASON_LABELS[state.reason.value]

  const devicePrep =
    state.devicePrep.option === 'reset'
      ? 'Factory reset confirmed'
      : 'Credentials provided'

  const refundMethodLabel =
    state.refundMethod === 'wallet'
      ? 'Revibe Wallet'
      : `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`

  const goTo = (step) => dispatch({ type: 'GO_TO_STEP', value: step })

  return (
    <>
      <StepHeading
        title="Review your return"
        subtitle="Double-check before you submit. You can edit any section."
      />

      <div className="px-4 flex flex-col gap-3">
        <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
          <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Item
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-13 rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
              <img
                src={order.product.image}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                Order · #{order.id}
              </div>
              <div className="text-[14px] font-semibold text-ink truncate mt-0.5">
                {order.product.name}
              </div>
              <div className="text-[12px] text-muted truncate">
                {order.product.variant}
              </div>
            </div>
          </div>
        </div>

        {isIssue ? (
          <Section title="Issue" onEdit={() => goTo(2)}>
            <IssueSummary issueDetails={state.issueDetails} />
          </Section>
        ) : (
          <Section title="Reason" onEdit={() => goTo(2)}>
            <div
              className={`text-[13.5px] ${
                state.reason.value ? 'text-ink' : 'text-muted italic'
              }`}
            >
              {reasonText}
            </div>
          </Section>
        )}

        <Section title="Device preparation" onEdit={() => goTo(3)}>
          <div className="text-[13.5px] text-ink">{devicePrep}</div>
        </Section>

        <Section title="Pickup details" onEdit={() => goTo(4)}>
          <div className="flex flex-col gap-2">
            <PickupRow
              Icon={MapPin}
              label="Address"
              value={state.pickupDetails.address}
              multiline
            />
            <PickupRow
              Icon={Mail}
              label="Email"
              value={state.pickupDetails.email}
            />
            <PickupRow
              Icon={Phone}
              label="Phone"
              value={state.pickupDetails.phone}
            />
          </div>
        </Section>

        <Section title="Refund" onEdit={() => goTo(5)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13.5px] text-ink flex items-center gap-1.5">
                {state.refundMethod === 'wallet' ? (
                  <>
                    <img
                      src={REVIBE_WALLET_ICON}
                      alt=""
                      aria-hidden
                      className="w-3.5 h-3.5 object-contain"
                    />
                    <span>Revibe Wallet</span>
                    <WalletInfoTooltip stopPropagation />
                  </>
                ) : (
                  <>
                    <CreditCard
                      size={13}
                      strokeWidth={1.75}
                      className="text-ink-2"
                    />
                    {refundMethodLabel}
                  </>
                )}
              </div>
              {!isIssue && state.refundMethod === 'original' && (
                <div className="text-[11.5px] text-muted mt-0.5">
                  Includes 10% restocking fee
                </div>
              )}
              {isIssue && state.refundMethod === 'wallet' && refund.bonus > 0 && (
                <div className="text-[11.5px] text-accent font-semibold mt-0.5">
                  Includes {currency} {formatMoney(refund.bonus)} bonus
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                You'll receive
              </div>
              <div className="text-[18px] font-bold text-ink tabular-nums leading-none mt-1">
                {currency} {formatMoney(refund.net)}
              </div>
            </div>
          </div>
        </Section>

        <PackingConfirmation
          checked={state.packingConfirmed}
          isIssue={isIssue}
          onChange={(value) =>
            dispatch({ type: 'SET_PACKING_CONFIRMED', value })
          }
        />
      </div>
    </>
  )
}

function PackingConfirmation({ checked, isIssue, onChange }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-[14px] border-2 px-3.5 py-3 cursor-pointer transition-colors ${
        checked
          ? 'border-brand bg-brand-bg/30'
          : 'border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
            checked ? 'bg-brand border-brand' : 'border-line bg-surface'
          }`}
        >
          {checked && (
            <Check size={13} strokeWidth={3} className="text-white" />
          )}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink leading-[1.35]">
          {isIssue
            ? 'I have packed the device properly and performed the necessary testing.'
            : 'I have packed the device properly in its original box.'}
        </span>
        <span className="block mt-1 text-[11.5px] text-muted leading-[1.4]">
          {isIssue
            ? 'Devices returned without proper testing or packaging may be delayed or rejected.'
            : 'Include all original accessories. Devices returned damaged may be sent back at your cost.'}
        </span>
      </span>
    </label>
  )
}

function IssueSummary({ issueDetails }) {
  const { category, description, attachmentName } = issueDetails
  const categoryLabel = category ? ISSUE_CATEGORY_LABELS[category] : 'Not selected'
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          Category
        </div>
        <div
          className={`mt-0.5 text-[13.5px] leading-[1.4] ${
            category ? 'text-ink' : 'text-muted italic'
          }`}
        >
          {categoryLabel}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          Description
        </div>
        <div
          className={`mt-0.5 text-[13.5px] leading-[1.4] whitespace-pre-line break-words ${
            description ? 'text-ink' : 'text-muted italic'
          }`}
        >
          {description || 'Not provided'}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          Attachment
        </div>
        {attachmentName ? (
          <div className="mt-1 inline-flex items-center gap-2 rounded-[10px] border border-line bg-line-2/40 px-2.5 py-1.5 max-w-full">
            <FileImage
              size={12}
              strokeWidth={1.75}
              className="text-brand shrink-0"
            />
            <span className="text-[12.5px] text-ink truncate">
              {attachmentName}
            </span>
          </div>
        ) : (
          <div className="mt-0.5 text-[13.5px] text-muted italic">
            Not provided
          </div>
        )}
      </div>
    </div>
  )
}

function PickupRow({ Icon, label, value, multiline }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} strokeWidth={1.75} className="text-ink-2 mt-1 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          {label}
        </div>
        <div
          className={`text-[13.5px] text-ink leading-[1.4] ${
            multiline ? 'whitespace-pre-line break-words' : 'truncate'
          }`}
        >
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function Section({ title, onEdit, children }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
        >
          <Pencil size={11} strokeWidth={2} />
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}
