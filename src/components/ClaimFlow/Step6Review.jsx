import { useEffect, useRef } from 'react'
import {
  Pencil,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  Check,
  FileImage,
  Wrench,
  Package,
  AlertCircle,
} from 'lucide-react'
import StepHeading from './StepHeading'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from '../WalletInfoTooltip'
import BnplDisclaimerTooltip, { isBnpl } from '../BnplDisclaimerTooltip'
import { refundBreakdown, formatMoney } from '../../lib/returns'
import { expectedCompletionFor } from '../../lib/claims'
import { findSubtype, ISSUE_SCOPES } from './issueSubtypes'
import { PACKING_LABELS } from './Step4Packing'
import { findCompensationSubtype } from './compensationSubtypes'
import { REASON_LABELS } from './Step2Reason'

const SCOPE_LABELS = Object.fromEntries(
  ISSUE_SCOPES.map((s) => [s.id, s.label]),
)

export default function Step6Review({
  state,
  dispatch,
  order,
  submitAttempted = false,
}) {
  if (!order) return null
  const currency = order.currency
  const isIssue = state.claimType === 'issue'
  const isWarranty = state.claimType === 'warranty'
  const isCompensation = state.claimType === 'compensation'
  const refund = isWarranty || isCompensation
    ? null
    : refundBreakdown(
        order,
        state.units,
        state.refundMethod,
        state.claimType,
      )
  const warrantyEta = isWarranty ? expectedCompletionFor('warranty') : null
  const reasonText = !state.reason.value
    ? 'Not provided'
    : state.reason.value === 'other' && state.reason.otherText.trim()
      ? state.reason.otherText.trim()
      : REASON_LABELS[state.reason.value]

  const isUnlinkPath = state.devicePrep.option === 'credentials'
  const isNeverSetUp = state.devicePrep.neverSetUp
  const devicePrep = isNeverSetUp
    ? 'Not set up — no reset needed'
    : isUnlinkPath
      ? 'Unlinked + passcode shared'
      : 'Factory reset confirmed'
  const devicePrepAck = isNeverSetUp
    ? {
        title: 'This device was never set up.',
        subtitle: 'No account is linked, so no reset is needed before pickup.',
      }
    : isUnlinkPath
      ? {
          title: "I've unlinked the device and shared my passcode.",
          subtitle: 'Required so our technician can complete the wipe.',
        }
      : {
          title: 'I have factory reset my device.',
          subtitle: 'Required before pickup. Unreset devices may delay your refund.',
        }

  const refundMethodLabel = isWarranty
    ? null
    : state.refundMethod === 'wallet'
      ? 'Revibe Wallet'
      : isBnpl(order)
        ? order.paymentMethod.brand
        : `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`

  const goTo = (step) => dispatch({ type: 'GO_TO_STEP', value: step })

  const resetError = submitAttempted && !state.factoryResetConfirmed
  const packingError =
    submitAttempted &&
    !state.packingConfirmed &&
    state.factoryResetConfirmed

  return (
    <>
      <StepHeading
        title={
          isWarranty
            ? 'Review your warranty claim'
            : isCompensation
              ? 'Review your compensation request'
              : 'Review your return'
        }
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

        {isCompensation ? (
          <Section title="What happened" onEdit={() => goTo('compsubtype')}>
            <CompensationSummary
              issueDetails={state.issueDetails}
              subtypeId={state.compensationSubtype}
            />
          </Section>
        ) : isIssue || isWarranty ? (
          <Section
            title={isWarranty ? 'Fault' : 'Issue'}
            onEdit={() => goTo('issuedetails')}
          >
            <IssueSummary
              issueDetails={state.issueDetails}
              issueScope={state.issueScope}
              issueSubtypeId={state.issueSubtypeId}
            />
          </Section>
        ) : (
          <Section title="Reason" onEdit={() => goTo('reason')}>
            <div
              className={`text-[13.5px] ${
                state.reason.value ? 'text-ink' : 'text-muted italic'
              }`}
            >
              {reasonText}
            </div>
          </Section>
        )}

        {!isCompensation && (
        <>
        <Section
          title="Device preparation"
          onEdit={() => goTo('deviceprep')}
          error={resetError}
          scrollOnError={resetError}
        >
          <div className="text-[13.5px] text-ink">{devicePrep}</div>
          <AckCheckboxRow
            checked={state.factoryResetConfirmed}
            error={resetError}
            onChange={(value) =>
              dispatch({ type: 'SET_FACTORY_RESET_CONFIRMED', value })
            }
            title={devicePrepAck.title}
            subtitle={devicePrepAck.subtitle}
          />
        </Section>

        <Section
          title="Packing"
          onEdit={() => goTo('packing')}
          error={packingError}
          scrollOnError={packingError}
        >
          <div className="flex items-start gap-2.5">
            <Package
              size={13}
              strokeWidth={1.75}
              className="text-ink-2 mt-1 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] text-ink leading-[1.4]">
                {PACKING_LABELS[state.packingMethod] || 'Not selected'}
              </div>
              <div className="text-[11.5px] text-muted mt-0.5 leading-[1.4]">
                {state.packingMethod === 'post_box'
                  ? 'Bubble-wrapped and cushioned in a sturdy outer box.'
                  : 'Repacked using the original Revibe box.'}
              </div>
            </div>
          </div>
          <AckCheckboxRow
            checked={state.packingConfirmed}
            error={packingError}
            onChange={(value) =>
              dispatch({ type: 'SET_PACKING_CONFIRMED', value })
            }
            title="I have packed the device properly."
            subtitle="Sealed, cushioned, and ready for the courier to collect."
          />
        </Section>

        <Section title="Pickup details" onEdit={() => goTo('pickup')}>
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
        </>
        )}

        {isWarranty ? (
          <Section title="What you'll get back">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13.5px] text-ink flex items-center gap-1.5">
                  <Wrench
                    size={13}
                    strokeWidth={1.75}
                    className="text-ink-2"
                  />
                  Your repaired device
                </div>
                <div className="text-[11.5px] text-muted mt-0.5 leading-[1.4]">
                  No refund — the same unit is returned to you after repair.
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                  Expected back
                </div>
                <div className="text-[14px] font-semibold text-ink leading-[1.2] mt-1">
                  {warrantyEta?.long || '—'}
                </div>
              </div>
            </div>
          </Section>
        ) : isCompensation ? (
          <Section title="Refund" onEdit={() => goTo('refund')}>
            <CompensationRefundBody
              refundMethod={state.refundMethod}
              order={order}
            />
          </Section>
        ) : (
          <Section title="Refund" onEdit={() => goTo('refund')}>
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
                      <span>{refundMethodLabel}</span>
                      {isBnpl(order) && (
                        <BnplDisclaimerTooltip
                          provider={order.paymentMethod.provider}
                          align="left"
                        />
                      )}
                    </>
                  )}
                </div>
                {!isIssue && state.refundMethod === 'original' && (
                  <div className="text-[11.5px] text-muted mt-0.5">
                    Includes 10% restocking fee
                  </div>
                )}
                {isIssue &&
                  state.refundMethod === 'wallet' &&
                  refund.bonus > 0 && (
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
        )}

      </div>
    </>
  )
}

function AckCheckboxRow({ checked, error, onChange, title, subtitle }) {
  const dividerCls = error ? 'border-danger/30' : 'border-line/60'
  const boxFill = error
    ? 'border-danger bg-surface'
    : checked
      ? 'bg-brand border-brand'
      : 'border-line bg-surface'

  return (
    <label
      className={`mt-3 pt-3 border-t flex items-start gap-3 cursor-pointer ${dividerCls}`}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${boxFill}`}
        >
          {checked && (
            <Check size={13} strokeWidth={3} className="text-white" />
          )}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink leading-[1.35]">
          {title}
        </span>
        <span className="block mt-1 text-[11.5px] text-muted leading-[1.4]">
          {subtitle}
        </span>
        {error && (
          <span className="mt-2 flex items-start gap-1.5 text-[11.5px] font-semibold text-danger leading-[1.4]">
            <AlertCircle size={12} strokeWidth={2} className="mt-px shrink-0" />
            <span>Please confirm before submitting.</span>
          </span>
        )}
      </span>
    </label>
  )
}

function CompensationSummary({ issueDetails, subtypeId }) {
  const { description, attachmentName } = issueDetails
  const subtype = subtypeId ? findCompensationSubtype(subtypeId) : null
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          Claim
        </div>
        <div
          className={`mt-0.5 text-[13.5px] leading-[1.4] ${
            subtype ? 'text-ink' : 'text-muted italic'
          }`}
        >
          {subtype ? subtype.label : 'Not selected'}
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
          Proof
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

function CompensationRefundBody({ refundMethod, order }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13.5px] text-ink flex items-center gap-1.5">
          {refundMethod === 'wallet' ? (
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
              <span>
                {isBnpl(order)
                  ? order.paymentMethod.brand
                  : `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`}
              </span>
              {isBnpl(order) && (
                <BnplDisclaimerTooltip
                  provider={order.paymentMethod.provider}
                  align="left"
                />
              )}
            </>
          )}
        </div>
        <div className="text-[11.5px] text-muted mt-0.5 leading-[1.4]">
          Confirmed by support after review
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
          You'll receive
        </div>
        <div className="text-[13px] font-semibold text-ink leading-[1.2] mt-1">
          To be confirmed
        </div>
      </div>
    </div>
  )
}

function IssueSummary({ issueDetails, issueScope, issueSubtypeId }) {
  const { description, attachmentName } = issueDetails
  const subtype = issueSubtypeId ? findSubtype(issueSubtypeId) : null
  const scopeLabel = issueScope ? SCOPE_LABELS[issueScope] : null
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
          Issue
        </div>
        <div
          className={`mt-0.5 text-[13.5px] leading-[1.4] ${
            subtype ? 'text-ink' : 'text-muted italic'
          }`}
        >
          {subtype ? subtype.label : 'Not selected'}
        </div>
        {scopeLabel && (
          <div className="mt-0.5 text-[11.5px] text-muted">{scopeLabel}</div>
        )}
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

function Section({ title, onEdit, children, error, scrollOnError }) {
  const cardRef = useRef(null)
  useEffect(() => {
    if (scrollOnError && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [scrollOnError])

  const borderCls = error ? 'border-danger' : 'border-line'
  const bgCls = error ? 'bg-danger-bg/40' : 'bg-surface'

  return (
    <div
      ref={cardRef}
      className={`rounded-[14px] border ${borderCls} ${bgCls} px-3.5 py-3 transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {title}
        </h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
          >
            <Pencil size={11} strokeWidth={2} />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
