import {
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

// Steps that happen on the device itself rather than on a screen (hold a
// button, press a key at startup, pack the box) get a product illustration
// card instead of a fake screen. Screens live in resetGuideMocks (hand-drawn,
// or PathScreen built from the step's menu path).

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

export function StepIllustration({ frame, label }) {
  const Icon = FRAME_ICON[frame] ?? Package
  return (
    <div className="relative mx-auto w-[240px] h-[190px] grid place-items-center">
      <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-brand-bg to-surface" aria-hidden />
      <div className="relative flex flex-col items-center gap-2.5">
        <span className="w-[92px] h-[92px] rounded-full bg-surface shadow-md2 grid place-items-center text-brand">
          <Icon size={42} strokeWidth={1.4} />
        </span>
        <span className="text-[11.5px] font-semibold text-ink-2">{label}</span>
      </div>
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
