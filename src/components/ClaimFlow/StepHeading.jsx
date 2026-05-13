export default function StepHeading({ title, subtitle, children }) {
  return (
    <div className="px-4 pt-1 pb-5">
      <h1 className="m-0 text-[24px] leading-[1.15] font-bold text-ink tracking-[-0.01em]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[13.5px] leading-[1.45] text-muted">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}
