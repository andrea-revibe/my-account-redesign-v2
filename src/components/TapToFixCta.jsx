import { ArrowRight } from 'lucide-react'

export default function TapToFixCta() {
  return (
    <span
      aria-hidden
      className="w-full h-[46px] rounded-[12px] bg-danger text-white font-semibold text-[14px] inline-flex items-center justify-center gap-1.5 shadow-sm2 group-active:scale-[0.99] transition"
    >
      Tap to fix
      <ArrowRight size={16} strokeWidth={2.4} />
    </span>
  )
}
