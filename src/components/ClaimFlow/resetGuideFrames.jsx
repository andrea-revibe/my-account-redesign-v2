import {
  ChevronRight,
  Laptop,
  Watch,
  Headphones,
  Gamepad2,
  Package,
  Smartphone,
  Tablet,
  Globe,
} from 'lucide-react'
import { IntroDevice } from './resetGuideMocks'

// Plain device frames for guide steps that have no CSS-art mock: the frame
// says which device, and the menu path is written inside it as tap-by-tap
// rows (last row = the thing to tap). Deliberately simple — the content is
// what QA checks against the vendor menus.

const FRAME_ICON = {
  phone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  watch: Watch,
  earbuds: Headphones,
  console: Gamepad2,
  box: Package,
  browser: Globe,
}

function PathRows({ path }) {
  if (!path?.length) return null
  return (
    <ol className="flex flex-col gap-1 text-left">
      {path.map((seg, i) => {
        const last = i === path.length - 1
        return (
          <li
            key={i}
            className={`flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[11.5px] leading-tight ${
              last ? 'bg-brand text-white font-semibold' : 'bg-white text-ink shadow-sm2'
            }`}
          >
            <span className={`w-4 text-[10px] font-bold ${last ? 'text-white/80' : 'text-muted'}`}>
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 break-words">{seg}</span>
            {!last && <ChevronRight size={12} strokeWidth={2.2} className="text-muted shrink-0" />}
          </li>
        )
      })}
    </ol>
  )
}

function Placeholder({ frame, label }) {
  const Icon = FRAME_ICON[frame] ?? Package
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted">
      <Icon size={34} strokeWidth={1.4} />
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  )
}

export function PathFrame({ frame = 'phone', path, label }) {
  const inner = path?.length ? <PathRows path={path} /> : <Placeholder frame={frame} label={label} />

  if (frame === 'phone') {
    return (
      <div className="mx-auto w-[200px] rounded-[30px] bg-ink p-[6px] shadow-md2">
        <div className="rounded-[24px] bg-canvas min-h-[260px] px-2.5 pt-7 pb-4 relative">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-ink" />
          {inner}
        </div>
      </div>
    )
  }
  if (frame === 'tablet') {
    return (
      <div className="mx-auto w-[280px] rounded-[22px] bg-ink p-[7px] shadow-md2">
        <div className="rounded-[16px] bg-canvas min-h-[190px] px-3 py-4">{inner}</div>
      </div>
    )
  }
  if (frame === 'laptop' || frame === 'browser') {
    return (
      <div className="mx-auto w-[290px]">
        <div className="rounded-t-[12px] bg-ink p-[6px] pb-[8px] shadow-md2">
          <div className="rounded-[6px] bg-canvas min-h-[160px] overflow-hidden">
            {frame === 'browser' && (
              <div className="flex items-center gap-1 px-2 h-6 bg-line-2 border-b border-line">
                <span className="w-1.5 h-1.5 rounded-full bg-danger/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-warn/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-success/60" />
                <span className="ml-1.5 flex-1 h-3.5 rounded bg-white text-[8.5px] text-muted px-1.5 leading-[14px] truncate">
                  {path?.[0] ?? 'browser'}
                </span>
              </div>
            )}
            <div className="px-3 py-3">{inner}</div>
          </div>
        </div>
        <div className="h-2.5 rounded-b-[10px] bg-ink/80 mx-[-10px]" />
      </div>
    )
  }
  if (frame === 'watch') {
    return (
      <div className="mx-auto w-[150px] flex flex-col items-center">
        <span className="w-16 h-6 rounded-t-[10px] bg-ink/70" />
        <div className="w-[150px] rounded-[34px] bg-ink p-[6px] shadow-md2">
          <div className="rounded-[28px] bg-canvas min-h-[150px] px-2.5 py-3">{inner}</div>
        </div>
        <span className="w-16 h-6 rounded-b-[10px] bg-ink/70" />
      </div>
    )
  }
  return (
    <div className="mx-auto w-[270px] rounded-[18px] border-[1.5px] border-line bg-canvas px-3.5 py-4 min-h-[150px]">
      {inner}
    </div>
  )
}

// Intro art: the existing CSS-art devices where we have them, else an icon
// coin for the guides that were added with plain frames.
const INTRO_DEVICE = {
  iphone: 'iphone',
  ipad: 'ipad',
  samsung_phone: 'android',
  other_android: 'android',
  samsung_tablet: 'android_tablet',
  macbook: 'mac',
}

export function GuideIntroArt({ variant }) {
  const legacy = INTRO_DEVICE[variant.id]
  if (legacy) return <IntroDevice device={legacy} />
  const Icon = FRAME_ICON[variant.frame] ?? Package
  return (
    <div className="relative">
      <div className="absolute inset-0 -m-3 rounded-full blur-2xl bg-brand-bg" aria-hidden />
      <span className="relative w-[112px] h-[112px] rounded-full bg-brand-bg grid place-items-center text-brand">
        <Icon size={52} strokeWidth={1.4} />
      </span>
    </div>
  )
}
