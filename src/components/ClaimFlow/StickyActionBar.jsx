export default function StickyActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryVariant = 'brand',
  secondaryLabel,
  onSecondary,
}) {
  const primaryStyles =
    primaryVariant === 'success'
      ? 'bg-success text-white border-success disabled:opacity-40'
      : 'bg-brand text-white border-brand disabled:opacity-40'

  return (
    <div className="sticky bottom-0 z-10 bg-surface border-t border-line">
      <div className="px-4 py-3 flex gap-2">
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondary}
            className="flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center bg-surface text-ink border border-line font-semibold text-[14px]"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={`flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center border font-semibold text-[14px] ${primaryStyles}`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
