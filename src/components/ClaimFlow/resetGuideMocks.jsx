// Guided-reset mock screens — CSS-art illustrations of the OS screens each reset
// step happens on (iOS / iPadOS / macOS / Android One UI) + the device frames.
// Pure presentation. Acyclic: imports only the shared anim primitives, nothing
// from the sheet. Consumed by ResetGuideSheet.jsx + its tables. See docs/code_map.md.
import { useEffect, useRef } from 'react'
import {
  X,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Cloud,
  KeyRound,
  Package,
  Lock,
  ShieldCheck,
  Apple,
  Volume2,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  Menu,
  ChevronUp,
} from 'lucide-react'
import { stepAnim } from './resetGuideAnim'

// Polished CSS illustrations of the iOS screen each reset step happens on.
// The highlight glow uses the brand channels. No screenshots.

const BRAND = '80 25 160'
const BRAND2 = '122 61 211'
const HILITE = {
  background: `rgb(${BRAND} / 0.12)`,
  boxShadow: `inset 3px 0 0 rgb(${BRAND})`,
}

// Base screen is 190×384 (tall enough that the densest step — Sign out of
// iCloud — fits without clipping), then scaled up so the illustration reads
// clearly inside the sheet.
function MiniPhone({ children, dark = false, camera = 'island' }) {
  const W = 190
  const H = 384
  const S = 1.32
  const outerW = W + 14
  const outerH = H + 14
  return (
    <div
      className="mx-auto"
      style={{ width: outerW * S, height: outerH * S }}
    >
      <div
        className="relative rounded-[34px] p-[7px]"
        style={{
          width: outerW,
          height: outerH,
          transform: `scale(${S})`,
          transformOrigin: 'top left',
          background: dark
            ? 'linear-gradient(160deg,#2a2a30,#0a0a0c)'
            : 'linear-gradient(160deg,#efecf5,#c9c2da)',
          boxShadow:
            '0 18px 40px -16px rgba(40,20,80,0.45), 0 2px 6px rgba(40,20,80,0.18), inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      >
        <div
          className={`relative rounded-[28px] overflow-hidden ${
            dark ? '' : 'bg-[#f1f1f6]'
          }`}
          style={{
            width: W,
            height: H,
            ...(dark
              ? {
                  background:
                    'radial-gradient(130% 100% at 50% 0%, #232838 0%, #050507 72%)',
                }
              : {}),
          }}
        >
          {camera === 'hole' ? (
            <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] bg-black rounded-full z-20" />
          ) : (
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[54px] h-[15px] bg-black rounded-full z-20" />
          )}
          {children}
          <div
            className={`absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[66px] h-[3.5px] rounded-full z-20 ${
              dark ? 'bg-white/55' : 'bg-ink/25'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBar({ light }) {
  const c = light ? 'bg-white/90' : 'bg-ink/80'
  return (
    <div className="flex items-center justify-between px-4 pt-[8px] pb-1">
      <span className={`text-[9px] font-bold ${light ? 'text-white' : 'text-ink'}`}>
        9:41
      </span>
      <div className="flex items-center gap-[3px]">
        <div
          className={`w-[12px] h-[7px] rounded-[1px] ${c}`}
          style={{
            clipPath:
              'polygon(0 40%,18% 40%,18% 100%,0 100%, 0 40%, 27% 25%,45% 25%,45% 100%,27% 100%,27% 25%, 55% 10%,73% 10%,73% 100%,55% 100%,55% 10%, 82% 0,100% 0,100% 100%,82% 100%)',
          }}
        />
        <Cloud
          size={9}
          strokeWidth={2}
          className={light ? 'text-white/90' : 'text-ink/80'}
        />
        <div
          className={`relative w-[15px] h-[7px] rounded-[2px] border ${
            light ? 'border-white/70' : 'border-ink/60'
          }`}
        >
          <div className={`absolute inset-[1px] right-[5px] rounded-[1px] ${c}`} />
        </div>
      </div>
    </div>
  )
}

function Row({ Icon, iconBg, label, value, highlight, danger, chevron = true }) {
  return (
    <div
      className={`relative flex items-center gap-2 px-2.5 py-[8px] ${
        highlight ? 'z-10' : ''
      }`}
      style={highlight ? HILITE : undefined}
    >
      {Icon && (
        <span
          className="w-[19px] h-[19px] rounded-[5px] grid place-items-center shrink-0 text-white"
          style={{ background: iconBg }}
        >
          <Icon size={11} strokeWidth={2.2} />
        </span>
      )}
      <span
        className={`flex-1 text-[10.5px] font-medium ${
          danger ? 'text-danger' : 'text-ink'
        } truncate`}
      >
        {label}
      </span>
      {value && (
        <span className="text-[9.5px] text-muted truncate max-w-[52px]">
          {value}
        </span>
      )}
      {chevron && (
        <ChevronRight
          size={11}
          strokeWidth={2.2}
          className="text-muted/50 shrink-0"
        />
      )}
    </div>
  )
}

// 1 · Sign out of iCloud — Apple-ID card + the Sign Out row glowing. `Frame`
// lets the iPad guide reuse this exact content inside a tablet shell.
function SettingsSignOut({ Frame = MiniPhone }) {
  return (
    <Frame>
      <StatusBar />
      <div className="px-2.5 pt-1.5">
        <div className="text-[15px] font-bold text-ink px-1">Settings</div>
        <div className="mt-1.5 flex items-center gap-1.5 bg-black/5 rounded-[9px] px-2 h-[22px]">
          <Search size={10} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-muted">Search</span>
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="flex items-center gap-2 bg-white rounded-[11px] px-2 py-2 shadow-sm2">
          <span
            className="w-[28px] h-[28px] rounded-full grid place-items-center text-white text-[11px] font-bold"
            style={{
              background: `linear-gradient(145deg, rgb(${BRAND2}), rgb(${BRAND}))`,
            }}
          >
            A
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10.5px] font-semibold text-ink leading-tight">
              Your Name
            </span>
            <span className="block text-[8.5px] text-muted">
              Apple Account, iCloud &amp; more
            </span>
          </span>
          <ChevronRight size={11} strokeWidth={2.2} className="text-muted/50" />
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Cloud} iconBg="#3478f6" label="iCloud" value="50 GB" />
          <Row Icon={KeyRound} iconBg="#34c759" label="Sign-In &amp; Security" />
          <Row Icon={Package} iconBg="#ff9500" label="Payment &amp; Shipping" />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[11px] overflow-hidden shadow-sm2">
          <Row label="Sign Out" danger highlight chevron={false} />
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
          <ArrowRight size={9} strokeWidth={2.6} /> at the very bottom
        </div>
      </div>
    </Frame>
  )
}

// 2 · Erase — Transfer or Reset list with the destructive action glowing.
function SettingsErase({ Frame = MiniPhone, noun = 'iPhone' }) {
  return (
    <Frame>
      <StatusBar />
      <div className="px-2.5 pt-1.5 flex items-center gap-0.5 text-brand">
        <ChevronLeft size={13} strokeWidth={2.4} />
        <span className="text-[9px] font-medium">General</span>
      </div>
      <div className="px-2.5 mt-1">
        <div className="text-[13px] font-bold text-ink px-1 leading-tight">
          Transfer or Reset {noun}
        </div>
      </div>
      <div className="px-2.5 mt-3">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Package} iconBg="#34c759" label={`Prepare for New ${noun}`} />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row label="Reset" chevron />
          <div className="relative" style={HILITE}>
            <div className="px-2.5 py-[9px] text-[10.5px] font-semibold text-danger leading-tight">
              Erase All Content and Settings
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[8px] text-muted leading-snug">
          Not the “Reset” row above — that only clears network &amp;
          keyboard settings.
        </div>
      </div>
    </Frame>
  )
}

// 3 · Confirm it worked — the rotating Hello screen means you're unlocked.
function HelloScreen({ Frame = MiniPhone }) {
  return (
    <Frame>
      <StatusBar />
      <div className="h-full flex flex-col items-center justify-center -mt-8">
        <div
          className="text-ink text-[34px] leading-none"
          style={{
            fontFamily: '"Snell Roundhand", "Brush Script MT", Georgia, cursive',
            fontStyle: 'italic',
          }}
        >
          hello
        </div>
        <div
          className="mt-3 text-muted text-[13px]"
          style={{
            fontFamily: '"Snell Roundhand", Georgia, cursive',
            fontStyle: 'italic',
          }}
        >
          Bonjour
        </div>
        <div className="mt-9 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ink/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink/25" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink/25" />
        </div>
        <div className="mt-8 flex items-center gap-1 rounded-full bg-success-bg border border-success/30 px-2.5 h-6 text-[9px] font-semibold text-success">
          <CheckCircle2 size={11} strokeWidth={2.4} />
          No Apple ID prompt
        </div>
      </div>
    </Frame>
  )
}

// Remote · the iCloud Find Devices sheet in a browser. Mirrors the real
// UI: the device card, Play Sound / Mark As Lost actions, and the Erase /
// Remove list — with Remove glowing as the correct choice. `noun` keeps the
// copy correct for iPhone / iPad / Mac.
function ICloudRemove({ noun = 'iPhone', Frame = MiniPhone }) {
  return (
    <Frame>
      <StatusBar />
      <div className="px-2.5 mt-1.5">
        <div className="flex items-center justify-center gap-1.5 bg-black/5 rounded-full px-2.5 h-[22px]">
          <Lock size={9} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-ink-2 font-medium truncate">
            icloud.com
          </span>
        </div>
      </div>
      <div className="px-2.5 mt-2.5 flex items-center gap-1">
        <Apple size={12} strokeWidth={1.5} className="text-ink fill-ink" />
        <span className="text-[11px] font-bold text-ink">iCloud</span>
        <span className="text-[11px] font-bold text-success">Find Devices</span>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="text-[11.5px] font-bold text-ink leading-tight">
          This {noun}
        </div>
        <div className="text-[8.5px] text-muted mt-0.5">
          {noun} · Offline · 6 min ago
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <div className="rounded-[9px] bg-white border border-line shadow-sm2 px-2 py-1.5 flex flex-col gap-1">
            <span
              className="w-[18px] h-[18px] rounded-full grid place-items-center text-white"
              style={{ background: `rgb(${BRAND2})` }}
            >
              <Volume2 size={10} strokeWidth={2.4} />
            </span>
            <span className="text-[9px] font-semibold text-ink leading-none">
              Play Sound
            </span>
          </div>
          <div className="rounded-[9px] bg-white border border-line shadow-sm2 px-2 py-1.5 flex flex-col gap-1">
            <span className="w-[18px] h-[18px] rounded-full grid place-items-center text-white bg-[#ff9500]">
              <Lock size={10} strokeWidth={2.4} />
            </span>
            <span className="text-[9px] font-semibold text-ink leading-none">
              Lost {noun}
            </span>
          </div>
        </div>

        <div className="mt-1.5 rounded-[10px] overflow-hidden border border-line bg-white shadow-sm2">
          <div className="px-2.5 py-[10px] text-[11px] font-medium text-muted">
            Erase
          </div>
          <div className="relative border-t border-line-2" style={HILITE}>
            <div className="px-2.5 py-[10px] text-[11px] font-bold text-brand">
              Remove
            </div>
          </div>
        </div>

        <div className="mt-2 px-1 text-[8.5px] text-muted leading-snug">
          Tap <span className="font-semibold text-ink-2">Remove</span> — not
          Erase.
        </div>
      </div>
    </Frame>
  )
}

// Remote · account.apple.com route — a four-screen swipeable walkthrough of
// removing the device from the Apple Account (menu › Devices › pick › About ›
// Remove from account). Same polished CSS-mock language as ICloudRemove; the
// account holder's details are masked since this is a removal-from-account
// surface, not a sign-in one.
// Per-device model metadata for the account-removal screens. The highlighted
// device + the "About" rows read correctly whether you're unlinking an
// iPhone, iPad, or Mac.
const DEVICE_META = {
  iPhone: {
    name: 'Your iPhone',
    model: 'iPhone 17',
    version: 'iOS 26.5',
    Icon: Smartphone,
    extraRows: [
      ['Phone Number', '+•• ••• ••• ••••'],
      ['IMEI', '•• •••••• •••••• •'],
    ],
    other: { name: 'Your MacBook Air', model: 'MacBook Air 13″', Icon: Laptop },
  },
  iPad: {
    name: 'Your iPad',
    model: 'iPad Pro 11″',
    version: 'iPadOS 26.5',
    Icon: Tablet,
    extraRows: [],
    other: { name: 'Your iPhone', model: 'iPhone 17', Icon: Smartphone },
  },
  Mac: {
    name: 'Your MacBook',
    model: 'MacBook Air 13″',
    version: 'macOS 26.5',
    Icon: Laptop,
    extraRows: [],
    other: { name: 'Your iPhone', model: 'iPhone 17', Icon: Smartphone },
  },
}

// Arrow-swipeable strip of mock screens with dot pagination + a numbered
// caption — shared by the iOS account-removal walkthrough and the Android
// Samsung sign-out step. `camera` is forwarded to each MiniPhone frame.
// Controlled: the parent owns `idx` so the guide's footer button can walk the
// screens; the arrows and dots call `onIdxChange` too.
function MockCarousel({ screens, camera, Frame = MiniPhone, idx = 0, onIdxChange }) {
  const prevIdx = useRef(idx)
  const dir = idx >= prevIdx.current ? 1 : -1
  useEffect(() => {
    prevIdx.current = idx
  }, [idx])
  const last = screens.length - 1
  const go = (n) => onIdxChange && onIdxChange(n)
  const { Screen, caption } = screens[idx]
  return (
    <div className="w-full">
      <div className="relative flex justify-center">
        <button
          onClick={() => idx > 0 && go(idx - 1)}
          disabled={idx === 0}
          aria-label="Previous screen"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line shadow-sm2 grid place-items-center text-ink disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div key={idx} style={{ animation: stepAnim(dir) }}>
          <Frame camera={camera}>
            <Screen />
          </Frame>
        </div>
        <button
          onClick={() => idx < last && go(idx + 1)}
          disabled={idx === last}
          aria-label="Next screen"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line shadow-sm2 grid place-items-center text-ink disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {screens.map((_, d) => (
          <button
            key={d}
            onClick={() => go(d)}
            aria-label={`Screen ${d + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              d === idx ? 'w-5 bg-brand' : 'w-1.5 bg-line'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[12px] font-semibold text-ink-2">
        {idx + 1}. {caption}
      </p>
    </div>
  )
}

// Shared chrome for the account.apple.com screens — status bar + URL pill.
function AcctScreen({ children }) {
  return (
    <>
      <StatusBar />
      <div className="px-2.5 mt-1.5">
        <div className="flex items-center justify-center gap-1.5 bg-black/5 rounded-full px-2.5 h-[22px]">
          <Lock size={9} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-ink-2 font-medium truncate">
            account.apple.com
          </span>
        </div>
      </div>
      {children}
    </>
  )
}

function AcctSignOut({ collapsed }) {
  const Chevron = collapsed ? ChevronDown : ChevronUp
  return (
    <div className="px-2.5 mt-2.5 flex items-center justify-between">
      <span className="text-[13px] font-bold text-ink">Apple Account</span>
      <div className="flex items-center gap-1.5">
        <Chevron size={12} strokeWidth={2.4} className="text-ink" />
        <span className="rounded-full bg-[#0071e3] text-white text-[8.5px] font-semibold px-2 py-[3px]">
          Sign Out
        </span>
      </div>
    </div>
  )
}

// 1 · Account menu expanded — the Devices row glowing as the route to take.
function AcctMenu() {
  const items = [
    'Personal Information',
    'Sign-In and Security',
    'Payment & Shipping',
    'Subscriptions',
    'Family Sharing',
    'Devices',
    'Privacy',
  ]
  return (
    <AcctScreen>
      <div className="px-2.5 mt-2.5 flex items-center justify-between">
        <Apple size={13} strokeWidth={1} className="text-ink fill-ink" />
        <div className="flex items-center gap-2 text-ink/70">
          <Search size={11} strokeWidth={2} />
          <Package size={11} strokeWidth={2} />
          <Menu size={12} strokeWidth={2.4} />
        </div>
      </div>
      <AcctSignOut />
      <div className="px-2.5 mt-2">
        <div className="border-t border-line-2 divide-y divide-line-2">
          {items.map((label) => {
            const highlight = label === 'Devices'
            return (
              <div
                key={label}
                className="relative px-1.5 py-[8px]"
                style={highlight ? HILITE : undefined}
              >
                <span
                  className={`text-[10.5px] ${
                    highlight ? 'font-semibold text-brand' : 'font-medium text-ink'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
        <ArrowRight size={9} strokeWidth={2.6} /> tap Devices
      </div>
    </AcctScreen>
  )
}

// 2 · Devices list — this device picked out of the account's devices.
function AcctDeviceList({ noun = 'iPhone' }) {
  const meta = DEVICE_META[noun] || DEVICE_META.iPhone
  const HiIcon = meta.Icon
  const OtherIcon = meta.other.Icon
  return (
    <AcctScreen>
      <AcctSignOut collapsed />
      <div className="px-2.5 mt-2 border-t border-line-2 pt-2 text-[9px] text-muted leading-snug">
        See details for the devices associated with your account.
      </div>
      <div className="px-2.5 mt-2.5 space-y-2">
        <div
          className="relative rounded-[11px] border border-line bg-white shadow-sm2 p-2.5"
          style={HILITE}
        >
          <div className="flex items-start gap-2">
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold text-ink leading-tight">
                {meta.name}
              </span>
              <span className="block text-[9px] text-muted mt-0.5">
                {meta.model}
              </span>
            </span>
            <HiIcon size={20} strokeWidth={1.6} className="text-ink/70" />
          </div>
        </div>
        <div className="rounded-[11px] border border-line bg-white shadow-sm2 p-2.5 flex items-start gap-2">
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] font-bold text-ink leading-tight">
              {meta.other.name}
            </span>
            <span className="block text-[9px] text-muted mt-0.5">
              {meta.other.model}
            </span>
          </span>
          <OtherIcon size={20} strokeWidth={1.6} className="text-ink/70" />
        </div>
      </div>
    </AcctScreen>
  )
}

// 3 · Device detail — Backup & Security; a hint to scroll down to About.
function AcctDeviceDetail({ noun = 'iPhone' }) {
  const meta = DEVICE_META[noun] || DEVICE_META.iPhone
  const DetailIcon = meta.Icon
  return (
    <AcctScreen>
      <div className="px-2.5 mt-1.5">
        <X size={13} strokeWidth={2.2} className="text-ink" />
      </div>
      <div className="flex flex-col items-center mt-0.5">
        <DetailIcon size={26} strokeWidth={1.4} className="text-ink/70" />
        <span className="mt-1 text-[12px] font-bold text-ink">{meta.name}</span>
        <span className="text-[9.5px] text-ink-2">{meta.model}</span>
        <span className="text-[8.5px] text-muted mt-0.5">
          Serial Number: ••••••••
        </span>
      </div>
      <div className="px-2.5 mt-3">
        <div className="text-[11px] font-bold text-ink">Backup &amp; Security</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted">—</span>
            <span className="text-[9.5px] text-muted">iCloud Backup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            <span className="text-[9.5px] text-ink">Find My {noun}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            <span className="text-[9.5px] text-ink">Trusted Device</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
        scroll down to About
        <ChevronDown size={10} strokeWidth={2.6} />
      </div>
    </AcctScreen>
  )
}

// 4 · About — masked details + the Remove from account button glowing.
function AcctRemove({ noun = 'iPhone' }) {
  const meta = DEVICE_META[noun] || DEVICE_META.iPhone
  const rows = [
    ['Model', meta.model],
    ['Version', meta.version],
    ['Serial Number', '••••••••••'],
    ...meta.extraRows,
  ]
  return (
    <AcctScreen>
      <div className="px-2.5 mt-1.5">
        <X size={13} strokeWidth={2.2} className="text-ink" />
      </div>
      <div className="px-2.5 mt-1">
        <div className="text-[12px] font-bold text-ink">About</div>
        <div className="mt-2 space-y-[7px]">
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="text-[8.5px] text-muted leading-none">{k}</div>
              <div className="text-[10px] font-medium text-ink mt-[2px]">{v}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-3 rounded-[8px]" style={HILITE}>
          <div className="rounded-[8px] border border-brand/60 px-2.5 py-[8px] text-center">
            <span className="text-[10.5px] font-semibold text-brand">
              Remove from account
            </span>
          </div>
        </div>
      </div>
    </AcctScreen>
  )
}

/* ------------------------------------------------- Android (One UI) mocks */
// Samsung One UI screens for the Android route. Same MiniPhone shell as the
// iOS mocks (centered punch-hole instead of the Dynamic Island), the same
// brand-purple highlight, and the same Row helper — just One UI's white
// rounded cards on a light-gray canvas. Two account systems clear here:
// Google's FRP and Samsung's Reactivation Lock.

const ANDROID_BLUE = '#2b6ef2'

function OneUiHeader({ title, back = true }) {
  return (
    <div className="px-2.5 pt-1.5">
      {back && (
        <div className="flex items-center text-ink/80 h-[16px]">
          <ChevronLeft size={14} strokeWidth={2.4} />
        </div>
      )}
      <div className="text-[15px] font-bold text-ink px-1 mt-0.5 leading-tight text-left">
        {title}
      </div>
    </div>
  )
}

function Toggle({ on }) {
  return (
    <span
      className="relative w-[30px] h-[17px] rounded-full shrink-0 transition-colors"
      style={{ background: on ? ANDROID_BLUE : 'rgb(0 0 0 / 0.18)' }}
    >
      <span
        className={`absolute top-[2px] w-[13px] h-[13px] rounded-full bg-white shadow ${
          on ? 'right-[2px]' : 'left-[2px]'
        }`}
      />
    </span>
  )
}

function ToggleRow({ label, sub, on, highlight }) {
  return (
    <div
      className="relative flex items-center gap-2 px-2.5 py-[9px]"
      style={highlight ? HILITE : undefined}
    >
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[10.5px] font-medium text-ink leading-tight truncate">
          {label}
        </span>
        {sub && (
          <span className="block text-[8.5px] text-muted leading-tight mt-0.5 truncate">
            {sub}
          </span>
        )}
      </span>
      <Toggle on={on} />
    </div>
  )
}

function GoogleG({ size = 22 }) {
  return (
    <span
      className="rounded-full bg-white border border-line shadow-sm2 grid place-items-center shrink-0 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.55, color: '#4285F4' }}
    >
      G
    </span>
  )
}

function SamsungWordmark() {
  return (
    <span
      className="text-[11px] font-bold tracking-tight"
      style={{ color: '#1428A0' }}
    >
      SAMSUNG
    </span>
  )
}

function UrlPill({ url }) {
  return (
    <div className="px-2.5 mt-1.5">
      <div className="flex items-center justify-center gap-1.5 bg-black/5 rounded-full px-2.5 h-[22px]">
        <Lock size={9} strokeWidth={2.2} className="text-muted" />
        <span className="text-[9px] text-ink-2 font-medium truncate">{url}</span>
      </div>
    </div>
  )
}

// 1 · Remove Google account — the account detail screen with Remove account
// glowing (mirrors the iOS Sign Out row).
function SamsungRemoveGoogle({ Frame = MiniPhone }) {
  return (
    <Frame camera="hole">
      <StatusBar />
      <OneUiHeader title="Manage accounts" />
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[14px] px-2.5 py-2.5 shadow-sm2 flex items-center gap-2">
          <GoogleG />
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[10.5px] font-semibold text-ink leading-tight">
              Your Name
            </span>
            <span className="block text-[8.5px] text-muted truncate">
              yourname@gmail.com
            </span>
          </span>
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[14px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Cloud} iconBg="#4285F4" label="Sync account" />
          <Row Icon={KeyRound} iconBg="#34a853" label="Google services" />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[14px] overflow-hidden shadow-sm2">
          <Row label="Remove account" danger highlight chevron={false} />
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
          <ArrowRight size={9} strokeWidth={2.6} /> repeat for every Google account
        </div>
      </div>
    </Frame>
  )
}

// 2 · Two screens, arrow-swipeable: turn off Find My Mobile, then sign out of
// the Samsung account. Both locks (Reactivation Lock lives behind Find My
// Mobile + the account) have to clear before the reset, so the step walks them
// in order the same way the iOS account-removal step does.
const SAMSUNG_SIGNOUT_SCREENS = [
  { Screen: FmmScreen, caption: 'Turn off Find My Mobile' },
  { Screen: SamsungAcctSignOutScreen, caption: 'Sign out of your Samsung account' },
]

function SamsungSignOutCarousel(props) {
  return <MockCarousel screens={SAMSUNG_SIGNOUT_SCREENS} camera="hole" {...props} />
}
SamsungSignOutCarousel.screens = SAMSUNG_SIGNOUT_SCREENS

// 2a · Find My Mobile — the toggle screen with the main switch glowing (turn
// it off), Reactivation lock below it.
function FmmScreen() {
  return (
    <>
      <StatusBar />
      <OneUiHeader title="Find My Mobile" />
      <div className="px-3.5 mt-1.5 text-[8.5px] text-muted leading-snug text-left">
        Locate this device remotely and protect your data.
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[14px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <ToggleRow label="Find My Mobile" sub="Tap to turn off" on highlight />
          <ToggleRow label="Remote unlock" on />
          <ToggleRow label="Reactivation lock" sub="Needs Samsung account" on />
        </div>
      </div>
    </>
  )
}

// 2b · Samsung account detail — Sign out glowing at the bottom of the profile.
function SamsungAcctSignOutScreen() {
  return (
    <>
      <StatusBar />
      <OneUiHeader title="Samsung account" />
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[14px] px-2.5 py-2.5 shadow-sm2 flex items-center gap-2">
          <span
            className="w-[28px] h-[28px] rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
            style={{ background: '#1428A0' }}
          >
            S
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[10.5px] font-semibold text-ink leading-tight">
              Your Name
            </span>
            <span className="block text-[8.5px] text-muted truncate">
              yourname@email.com
            </span>
          </span>
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[14px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Cloud} iconBg="#1428A0" label="Samsung Cloud" />
          <Row Icon={ShieldCheck} iconBg="#34a853" label="Security &amp; privacy" />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[14px] overflow-hidden shadow-sm2">
          <Row label="Sign out" danger highlight chevron={false} />
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
          <ArrowRight size={9} strokeWidth={2.6} /> at the bottom of your profile
        </div>
      </div>
    </>
  )
}

// 3 · Factory data reset — the Reset list with the destructive action glowing,
// the preference-only resets above it.
function SamsungFactoryReset({ Frame = MiniPhone }) {
  return (
    <Frame camera="hole">
      <StatusBar />
      <OneUiHeader title="Reset" />
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[14px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row label="Reset all settings" />
          <Row label="Reset network settings" />
          <Row label="Reset accessibility settings" />
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[14px] overflow-hidden shadow-sm2">
          <div className="relative" style={HILITE}>
            <div className="px-2.5 py-[10px] text-[10.5px] font-semibold text-danger leading-tight">
              Factory data reset
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[8px] text-muted leading-snug text-left">
          Not the “Reset” rows above — those only clear preferences.
        </div>
      </div>
    </Frame>
  )
}

// 4 · Confirm it worked — the Samsung welcome screen, no account prompt.
function SamsungWelcome({ Frame = MiniPhone }) {
  return (
    <Frame camera="hole">
      <StatusBar />
      <div className="h-full flex flex-col items-center justify-center -mt-8">
        <div className="text-ink text-[26px] font-bold leading-none">Welcome</div>
        <div className="mt-3 flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 h-[22px] text-[9px] font-medium text-ink-2 shadow-sm2">
          English (US)
          <ChevronDown size={10} strokeWidth={2.4} className="text-muted" />
        </div>
        <div
          className="mt-7 rounded-full px-6 h-[27px] grid place-items-center text-white text-[10px] font-semibold"
          style={{ background: ANDROID_BLUE }}
        >
          Start
        </div>
        <div className="mt-8 flex items-center gap-1 rounded-full bg-success-bg border border-success/30 px-2.5 h-6 text-[9px] font-semibold text-success">
          <CheckCircle2 size={11} strokeWidth={2.4} />
          No account prompt
        </div>
      </div>
    </Frame>
  )
}

// Remote 1 · Google — the device-detail page you land on after tapping this
// device in "Your devices", with the Sign out button glowing (mirrors the real
// myaccount.google.com/device-activity detail screen, where signing out is what
// clears Factory Reset Protection).
function GoogleRemoveRemote({ Frame = MiniPhone, tablet = false }) {
  const DeviceIcon = tablet ? Tablet : Smartphone
  const rows = [
    ['Account', 'yourname@gmail.com'],
    ['First signed in', '12 Mar 2024'],
    ['Recent activity', 'Active 6 min ago'],
    ['Browser', 'Chrome'],
  ]
  return (
    <Frame camera="hole">
      <StatusBar />
      <UrlPill url="myaccount.google.com" />
      <div className="px-2.5 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-ink">
          <ChevronLeft size={13} strokeWidth={2.4} />
          <span className="text-[10.5px] font-bold">Your devices</span>
        </div>
        <GoogleG size={16} />
      </div>
      <div className="mt-2.5 flex flex-col items-center">
        <span className="w-[34px] h-[34px] rounded-full bg-black/[0.04] grid place-items-center">
          <DeviceIcon size={18} strokeWidth={1.6} className="text-ink/70" />
        </span>
        <span className="mt-1 text-[11.5px] font-bold text-ink leading-tight">
          {tablet ? 'This tablet' : 'This phone'}
        </span>
        <span className="text-[8.5px] text-muted mt-0.5 whitespace-nowrap">
          {tablet ? 'Galaxy Tab · Android 14' : 'Galaxy · Android 14'}
        </span>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[14px] px-2.5 py-1 shadow-sm2 divide-y divide-line-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2 py-[6px]">
              <span className="text-[8.5px] text-muted whitespace-nowrap">{k}</span>
              <span className="text-[9.5px] font-medium text-ink truncate text-right">
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="relative rounded-[10px]" style={HILITE}>
          <div className="rounded-[10px] border border-brand/60 px-2.5 py-[9px] text-center">
            <span className="text-[10.5px] font-bold text-brand">Sign out</span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

// Remote 2 · Samsung — the Devices page with the Remove button glowing.
function SamsungRemoveRemote({ Frame = MiniPhone, tablet = false }) {
  const DeviceIcon = tablet ? Tablet : Smartphone
  return (
    <Frame camera="hole">
      <StatusBar />
      <UrlPill url="account.samsung.com" />
      <div className="px-2.5 mt-2.5 flex items-center gap-1.5">
        <SamsungWordmark />
        <span className="text-[11px] font-bold text-ink">Devices</span>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="rounded-[12px] border border-line bg-white shadow-sm2 p-2.5">
          <div className="flex items-start gap-2">
            <DeviceIcon size={18} strokeWidth={1.6} className="text-ink/70 shrink-0" />
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-[10.5px] font-bold text-ink leading-tight">
                {tablet ? 'This tablet' : 'This phone'}
              </span>
              <span className="block text-[8.5px] text-muted mt-0.5">
                {tablet ? 'Galaxy Tab · Registered' : 'Galaxy · Registered'}
              </span>
            </span>
          </div>
          <div className="relative mt-2.5 rounded-[8px]" style={HILITE}>
            <div className="rounded-[8px] border border-brand/60 px-2.5 py-[7px] text-center">
              <span className="text-[10px] font-semibold text-brand">Remove</span>
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[8.5px] text-muted leading-snug text-left">
          Tap <span className="font-semibold text-ink-2">Remove</span> to lift
          Reactivation Lock.
        </div>
      </div>
    </Frame>
  )
}

// Android-tablet mocks — the same Samsung One UI screens as the phone guide,
// rendered in the wider MiniTablet shell. The two remote screens also flip to
// the Tablet icon + "This tablet" wording via the `tablet` flag.
function AndroidTabletRemoveGoogle() {
  return <SamsungRemoveGoogle Frame={MiniTablet} />
}
function AndroidTabletSignOutCarousel(props) {
  return (
    <MockCarousel
      screens={SAMSUNG_SIGNOUT_SCREENS}
      camera="hole"
      Frame={MiniTablet}
      {...props}
    />
  )
}
AndroidTabletSignOutCarousel.screens = SAMSUNG_SIGNOUT_SCREENS
function AndroidTabletFactoryReset() {
  return <SamsungFactoryReset Frame={MiniTablet} />
}
function AndroidTabletWelcome() {
  return <SamsungWelcome Frame={MiniTablet} />
}
function AndroidTabletGoogleRemoveRemote() {
  return <GoogleRemoveRemote Frame={MiniTablet} tablet />
}
function AndroidTabletSamsungRemoveRemote() {
  return <SamsungRemoveRemote Frame={MiniTablet} tablet />
}

// Intro illustration — the iPhone PNG, or an asset-free CSS slab for each
// other device (iPad, MacBook, Galaxy), all behind the same brand-bg glow.
function IntroDevice({ device }) {
  if (device === 'iphone') {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 -m-3 rounded-full blur-2xl bg-brand-bg"
          aria-hidden
        />
        <img
          src="/iphone-cutout.png"
          alt=""
          className="relative w-[148px] h-[148px] object-contain drop-shadow-xl"
        />
      </div>
    )
  }
  if (device === 'ipad' || device === 'android_tablet') return <IntroTablet />
  if (device === 'mac') return <IntroLaptop />
  // Android — CSS Galaxy slab.
  return (
    <div className="relative grid place-items-center" style={{ width: 148, height: 148 }}>
      <div className="absolute inset-0 -m-1 rounded-full blur-2xl bg-brand-bg" aria-hidden />
      <div
        className="relative rounded-[26px]"
        style={{
          width: 92,
          height: 138,
          padding: 4,
          background: 'linear-gradient(155deg,#3a3a42,#0c0c10)',
          boxShadow:
            '0 16px 34px -14px rgba(40,20,80,0.5), inset 0 1px 1px rgba(255,255,255,0.25)',
        }}
      >
        <div
          className="relative w-full h-full rounded-[22px] overflow-hidden grid place-items-center"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, #2a3350 0%, #07070b 70%)',
          }}
        >
          <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-black" />
          <Lock size={28} strokeWidth={1.5} className="text-white/80" />
        </div>
      </div>
    </div>
  )
}

// CSS iPad slab — uniform slim bezel, top-edge camera, a Lock on the locked
// screen. Same brand-bg glow as the other intro illustrations.
function IntroTablet() {
  return (
    <div className="relative grid place-items-center" style={{ width: 148, height: 148 }}>
      <div className="absolute inset-0 -m-1 rounded-full blur-2xl bg-brand-bg" aria-hidden />
      <div
        className="relative rounded-[20px]"
        style={{
          width: 104,
          height: 138,
          padding: 6,
          background: 'linear-gradient(155deg,#3a3a42,#0c0c10)',
          boxShadow:
            '0 16px 34px -14px rgba(40,20,80,0.5), inset 0 1px 1px rgba(255,255,255,0.25)',
        }}
      >
        <div
          className="relative w-full h-full rounded-[14px] overflow-hidden grid place-items-center"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 0%, #2a3350 0%, #07070b 70%)',
          }}
        >
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-black" />
          <Lock size={28} strokeWidth={1.5} className="text-white/80" />
        </div>
      </div>
    </div>
  )
}

// CSS MacBook — an open laptop (lid + deck) with a Lock on the screen.
function IntroLaptop() {
  return (
    <div className="relative grid place-items-center" style={{ width: 168, height: 148 }}>
      <div className="absolute inset-0 -m-1 rounded-full blur-2xl bg-brand-bg" aria-hidden />
      <div className="relative">
        <div
          className="relative rounded-[12px] mx-auto"
          style={{
            width: 142,
            height: 92,
            padding: 6,
            background: 'linear-gradient(155deg,#3a3a42,#0c0c10)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.22)',
          }}
        >
          <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-white/25" />
          <div
            className="relative w-full h-full rounded-[6px] overflow-hidden grid place-items-center"
            style={{
              background:
                'radial-gradient(120% 110% at 50% 0%, #2a3350 0%, #07070b 72%)',
            }}
          >
            <Lock size={24} strokeWidth={1.5} className="text-white/80" />
          </div>
        </div>
        <div
          className="relative mx-auto"
          style={{
            width: 164,
            height: 10,
            marginTop: -1,
            background: 'linear-gradient(180deg,#cfcbd9,#9d97ad)',
            borderBottomLeftRadius: 9,
            borderBottomRightRadius: 9,
            boxShadow: '0 10px 20px -8px rgba(40,20,80,0.5)',
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40px] h-[4px] rounded-b-[6px] bg-black/15" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------- iPad mock screens */
// iPadOS resets exactly like iOS — same Settings path, same Activation Lock —
// so the iPad guide reuses the iOS screen content inside a tablet shell. Only
// the device noun ("iPad") and the frame differ.

// Tablet shell — uniform slim bezel + a single top-edge camera, no notch.
// Same 384-tall inner viewport as MiniPhone so the shared iOS content drops
// in without clipping, but a proper ~3:4 portrait-tablet width (the phone's
// 1.32× upscale otherwise leaves the two frames near-identical in width, so a
// narrower slab reads as a chunky phone rather than a tablet).
function MiniTablet({ children }) {
  const W = 300
  const H = 384
  const S = 1.0
  const outerW = W + 18
  const outerH = H + 18
  return (
    <div className="mx-auto" style={{ width: outerW * S, height: outerH * S }}>
      <div
        className="relative rounded-[30px] p-[9px]"
        style={{
          width: outerW,
          height: outerH,
          transform: `scale(${S})`,
          transformOrigin: 'top left',
          background: 'linear-gradient(160deg,#e9e6f0,#c6bfd6)',
          boxShadow:
            '0 18px 40px -16px rgba(40,20,80,0.45), 0 2px 6px rgba(40,20,80,0.18), inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      >
        <div
          className="relative rounded-[22px] overflow-hidden bg-[#f1f1f6]"
          style={{ width: W, height: H }}
        >
          <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] bg-black/70 rounded-full z-20" />
          {children}
        </div>
      </div>
    </div>
  )
}

function IpadSettingsSignOut() {
  return <SettingsSignOut Frame={MiniTablet} />
}
function IpadSettingsErase() {
  return <SettingsErase Frame={MiniTablet} noun="iPad" />
}
function IpadHelloScreen() {
  return <HelloScreen Frame={MiniTablet} />
}

/* -------------------------------------------------------- Mac mock screens */
// macOS reset differs from iOS — System Settings (sidebar + content) and a
// landscape screen — so the Mac guide gets its own laptop shell + screens.

// Laptop shell — a landscape lid over a thin keyboard deck wedge.
function MiniLaptop({ children }) {
  const W = 320
  const H = 196
  const S = 1.02
  return (
    <div className="mx-auto" style={{ width: (W + 60) * S }}>
      <div style={{ transform: `scale(${S})`, transformOrigin: 'top center' }}>
        <div
          className="relative mx-auto rounded-[12px] p-[8px]"
          style={{
            width: W + 16,
            background: 'linear-gradient(160deg,#2a2a30,#0a0a0c)',
            boxShadow:
              '0 16px 34px -16px rgba(40,20,80,0.5), inset 0 1px 1px rgba(255,255,255,0.18)',
          }}
        >
          <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-white/30" />
          <div
            className="relative rounded-[5px] overflow-hidden bg-[#edeaf2]"
            style={{ width: W, height: H }}
          >
            {children}
          </div>
        </div>
        <div
          className="relative mx-auto"
          style={{
            width: W + 56,
            height: 11,
            background: 'linear-gradient(180deg,#d3d0db,#a9a3b8)',
            borderBottomLeftRadius: 11,
            borderBottomRightRadius: 11,
            boxShadow: '0 9px 16px -7px rgba(40,20,80,0.42)',
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[64px] h-[4px] rounded-b-[6px] bg-black/15" />
        </div>
      </div>
    </div>
  )
}

// macOS menu bar — Apple logo + the active app's menus, clock at the right.
function MacMenuBar({ app = 'System Settings' }) {
  return (
    <div className="flex items-center gap-2 px-2 h-[15px] bg-white/65 border-b border-black/10 text-[7px] text-ink/80 backdrop-blur">
      <Apple size={8} strokeWidth={1.5} className="text-ink fill-ink" />
      <span className="font-bold text-ink">{app}</span>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span className="ml-auto flex items-center gap-1.5">
        <Search size={7} strokeWidth={2.2} />
        9:41
      </span>
    </div>
  )
}

// Shared System Settings chrome — sidebar (search + items) on the left,
// content pane on the right. `selected` highlights the active sidebar row.
function MacSettings({ sidebar, account, children }) {
  return (
    <MiniLaptop>
      <MacMenuBar />
      <div className="flex" style={{ height: 181 }}>
        <div className="w-[118px] shrink-0 bg-black/[0.04] border-r border-black/10 p-1.5">
          <div className="flex items-center gap-1 bg-black/5 rounded-[5px] px-1.5 h-[15px] mb-1.5">
            <Search size={7} strokeWidth={2.2} className="text-muted" />
            <span className="text-[6.5px] text-muted">Search</span>
          </div>
          {account && (
            <div
              className={`flex items-center gap-1.5 rounded-[6px] px-1.5 py-1 mb-1.5 ${
                account.selected ? 'bg-[#0071e3]' : ''
              }`}
            >
              <span
                className="w-[16px] h-[16px] rounded-full grid place-items-center text-white text-[7px] font-bold shrink-0"
                style={{
                  background: `linear-gradient(145deg, rgb(${BRAND2}), rgb(${BRAND}))`,
                }}
              >
                A
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-[7px] font-semibold leading-tight ${
                    account.selected ? 'text-white' : 'text-ink'
                  }`}
                >
                  Your Name
                </span>
                <span
                  className={`block text-[6px] ${
                    account.selected ? 'text-white/80' : 'text-muted'
                  }`}
                >
                  Apple Account
                </span>
              </span>
            </div>
          )}
          <div className="space-y-[3px]">
            {sidebar.map((row) => (
              <div
                key={row.label}
                className={`rounded-[5px] px-1.5 py-[5px] text-[7px] ${
                  row.selected
                    ? 'bg-[#0071e3] text-white font-semibold'
                    : 'text-ink/80'
                }`}
              >
                {row.label}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-2 min-w-0">{children}</div>
      </div>
    </MiniLaptop>
  )
}

// 1 · Sign out — System Settings › Apple Account, Sign Out glowing.
function MacSignOut() {
  return (
    <MacSettings
      account={{ selected: true }}
      sidebar={[
        { label: 'Wi-Fi' },
        { label: 'Bluetooth' },
        { label: 'Network' },
        { label: 'General' },
      ]}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-[24px] h-[24px] rounded-full grid place-items-center text-white text-[10px] font-bold shrink-0"
          style={{
            background: `linear-gradient(145deg, rgb(${BRAND2}), rgb(${BRAND}))`,
          }}
        >
          A
        </span>
        <div className="min-w-0">
          <div className="text-[8.5px] font-bold text-ink leading-tight">
            Your Name
          </div>
          <div className="text-[6.5px] text-muted truncate">your@email.com</div>
        </div>
      </div>
      <div className="mt-2 rounded-[6px] bg-white border border-black/10 overflow-hidden divide-y divide-black/5 shadow-sm2">
        {['iCloud', 'Media & Purchases', 'Sign-In & Security'].map((x) => (
          <div
            key={x}
            className="flex items-center justify-between px-1.5 py-[5px] text-[7.5px] text-ink"
          >
            {x}
            <ChevronRight size={8} strokeWidth={2.2} className="text-muted/50" />
          </div>
        ))}
      </div>
      <div className="relative mt-2 rounded-[6px] bg-white shadow-sm2" style={HILITE}>
        <div className="px-2 py-[6px] text-[8px] font-semibold text-danger">
          Sign Out…
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[6.5px] font-semibold text-brand">
        <ArrowRight size={7} strokeWidth={2.6} /> scroll to the bottom
      </div>
    </MacSettings>
  )
}

// 2 · Erase — System Settings › General › Transfer or Reset, EACAS glowing.
function MacErase() {
  return (
    <MacSettings
      sidebar={[
        { label: 'General', selected: true },
        { label: 'Appearance' },
        { label: 'Accessibility' },
        { label: 'Control Center' },
      ]}
    >
      <div className="flex items-center gap-0.5 text-brand">
        <ChevronLeft size={9} strokeWidth={2.4} />
        <span className="text-[7px] font-medium">General</span>
      </div>
      <div className="text-[9px] font-bold text-ink mt-1">Transfer or Reset</div>
      <div className="mt-2 rounded-[6px] bg-white border border-black/10 p-1.5 shadow-sm2">
        <div className="text-[7px] text-ink-2 leading-snug">
          Erase all content, settings, and apps from this Mac, restoring it to
          factory settings.
        </div>
        <div className="relative mt-1.5 rounded-[6px]" style={HILITE}>
          <div className="rounded-[6px] border border-brand/50 px-1.5 py-[6px] text-center text-[7.5px] font-semibold text-brand">
            Erase All Content and Settings…
          </div>
        </div>
      </div>
      <div className="mt-1.5 px-0.5 text-[6.5px] text-muted leading-snug">
        The Erase Assistant signs you out and turns off Activation Lock for you.
      </div>
    </MacSettings>
  )
}

// 3 · Confirm it worked — the macOS Setup Assistant, no login / Apple ID.
function MacWelcome() {
  return (
    <MiniLaptop>
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{
          height: 196,
          background: 'radial-gradient(120% 100% at 50% 0%, #eceaf3 0%, #d6d2e0 75%)',
        }}
      >
        <Globe size={30} strokeWidth={1.3} className="text-ink/70" />
        <div className="mt-2.5 text-[11px] font-semibold text-ink">
          Select Your Country or Region
        </div>
        <div className="mt-1 text-[8px] text-muted">United Arab Emirates</div>
        <div className="mt-3 flex items-center gap-1 rounded-full bg-success-bg border border-success/30 px-2.5 h-6 text-[8.5px] font-semibold text-success">
          <CheckCircle2 size={11} strokeWidth={2.4} />
          No login or Apple ID prompt
        </div>
      </div>
    </MiniLaptop>
  )
}

// Safari window chrome — traffic lights + a centered address pill. Sits at
// the top of the laptop screen for the desktop remote-path mocks.
function MacBrowserBar({ url }) {
  return (
    <div className="flex items-center gap-1.5 px-2 h-[16px] bg-white/85 border-b border-black/10">
      <span className="w-[5px] h-[5px] rounded-full bg-[#ff5f57]" />
      <span className="w-[5px] h-[5px] rounded-full bg-[#febc2e]" />
      <span className="w-[5px] h-[5px] rounded-full bg-[#28c840]" />
      <div className="mx-auto flex items-center gap-1 bg-black/5 rounded-[5px] h-[11px] px-2.5">
        <Lock size={6} strokeWidth={2.4} className="text-muted" />
        <span className="text-[6.5px] text-ink-2">{url}</span>
      </div>
    </div>
  )
}

// Remote 1 · Mac — iCloud Find Devices in Safari, This Mac picked out and
// Remove This Device glowing as the correct choice.
function MacICloudRemove() {
  return (
    <MiniLaptop>
      <MacBrowserBar url="icloud.com/find" />
      <div className="flex bg-white" style={{ height: 180 }}>
        <div className="w-[124px] shrink-0 border-r border-black/10 bg-black/[0.03] p-1.5 space-y-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Apple size={9} strokeWidth={1.5} className="text-ink fill-ink" />
            <span className="text-[8px] font-bold text-ink">Find Devices</span>
          </div>
          <div
            className="relative rounded-[6px] bg-white border border-line shadow-sm2 px-1.5 py-1 flex items-center gap-1.5"
            style={HILITE}
          >
            <Laptop size={13} strokeWidth={1.6} className="text-ink/70 shrink-0" />
            <span className="min-w-0">
              <span className="block text-[7.5px] font-bold text-ink leading-tight">
                This Mac
              </span>
              <span className="block text-[6px] text-muted">Offline</span>
            </span>
          </div>
          <div className="rounded-[6px] px-1.5 py-1 flex items-center gap-1.5">
            <Smartphone size={13} strokeWidth={1.6} className="text-ink/45 shrink-0" />
            <span className="text-[7.5px] text-ink/70">Your iPhone</span>
          </div>
        </div>
        <div className="flex-1 p-2 min-w-0">
          <div className="text-[9px] font-bold text-ink leading-tight">This Mac</div>
          <div className="text-[6.5px] text-muted mt-0.5">
            MacBook Air 13″ · Offline
          </div>
          <div className="mt-2 flex gap-1.5">
            <div className="rounded-[6px] bg-white border border-line shadow-sm2 px-1.5 py-1 flex items-center gap-1 text-[7px] font-semibold text-ink">
              <Volume2 size={9} strokeWidth={2.2} />
              Play Sound
            </div>
            <div className="rounded-[6px] bg-white border border-line shadow-sm2 px-1.5 py-1 flex items-center gap-1 text-[7px] font-semibold text-ink">
              <Lock size={9} strokeWidth={2.2} />
              Mark As Lost
            </div>
          </div>
          <div className="mt-2 w-[140px] rounded-[6px] overflow-hidden border border-line bg-white shadow-sm2">
            <div className="px-2 py-[6px] text-[7.5px] text-muted">Erase Mac</div>
            <div className="relative border-t border-line-2" style={HILITE}>
              <div className="px-2 py-[6px] text-[7.5px] font-bold text-brand">
                Remove This Device
              </div>
            </div>
          </div>
          <div className="mt-1.5 text-[6.5px] text-muted leading-snug">
            Click <span className="font-semibold text-ink-2">Remove This Device</span>{' '}
            — not Erase.
          </div>
        </div>
      </div>
    </MiniLaptop>
  )
}

// Remote 2 · Mac — account.apple.com › Devices, the Mac's About panel with
// Remove from account glowing.
function MacAccountRemove() {
  return (
    <MiniLaptop>
      <MacBrowserBar url="account.apple.com" />
      <div className="flex bg-white" style={{ height: 180 }}>
        <div className="w-[120px] shrink-0 border-r border-black/10 bg-black/[0.03] p-1.5 space-y-[3px]">
          <div className="flex items-center gap-1 mb-1">
            <Apple size={9} strokeWidth={1.5} className="text-ink fill-ink" />
            <span className="text-[7.5px] font-bold text-ink">Apple Account</span>
          </div>
          {['Personal Information', 'Sign-In & Security', 'Payment & Shipping', 'Devices'].map(
            (x) => {
              const hl = x === 'Devices'
              return (
                <div
                  key={x}
                  className={`rounded-[5px] px-1.5 py-[4px] text-[7px] ${
                    hl ? 'bg-[#0071e3] text-white font-semibold' : 'text-ink/80'
                  }`}
                >
                  {x}
                </div>
              )
            },
          )}
        </div>
        <div className="flex-1 p-2 min-w-0">
          <div className="flex items-center gap-1.5">
            <Laptop size={18} strokeWidth={1.6} className="text-ink/70" />
            <div className="min-w-0">
              <div className="text-[8.5px] font-bold text-ink leading-tight">
                Your MacBook
              </div>
              <div className="text-[6.5px] text-muted">MacBook Air 13″</div>
            </div>
          </div>
          <div className="mt-2 rounded-[6px] bg-white border border-black/10 p-1.5 shadow-sm2 space-y-[5px]">
            {[
              ['Model', 'MacBook Air 13″'],
              ['Version', 'macOS 26.5'],
              ['Serial Number', '••••••••••'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[6px] text-muted leading-none">{k}</div>
                <div className="text-[7px] font-medium text-ink mt-[1px]">{v}</div>
              </div>
            ))}
          </div>
          <div className="relative mt-2 rounded-[6px]" style={HILITE}>
            <div className="rounded-[6px] border border-brand/60 px-2 py-[6px] text-center text-[7.5px] font-semibold text-brand">
              Remove from account
            </div>
          </div>
        </div>
      </div>
    </MiniLaptop>
  )
}

export {
  MiniPhone,
  SettingsSignOut,
  SettingsErase,
  HelloScreen,
  ICloudRemove,
  MockCarousel,
  AcctMenu,
  AcctDeviceList,
  AcctDeviceDetail,
  AcctRemove,
  SamsungRemoveGoogle,
  SamsungSignOutCarousel,
  SamsungFactoryReset,
  SamsungWelcome,
  GoogleRemoveRemote,
  SamsungRemoveRemote,
  AndroidTabletRemoveGoogle,
  AndroidTabletSignOutCarousel,
  AndroidTabletFactoryReset,
  AndroidTabletWelcome,
  AndroidTabletGoogleRemoveRemote,
  AndroidTabletSamsungRemoveRemote,
  IntroDevice,
  MiniTablet,
  IpadSettingsSignOut,
  IpadSettingsErase,
  IpadHelloScreen,
  MacSignOut,
  MacErase,
  MacWelcome,
  MacICloudRemove,
  MacAccountRemove,
}
