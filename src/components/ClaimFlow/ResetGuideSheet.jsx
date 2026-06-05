import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Clock,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Package,
  Watch,
  Camera,
  Hash,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { STEP_ANIM_CSS, stepAnim } from './resetGuideAnim'
import {
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
  SimCard,
} from './resetGuideMocks'

// Guided reset — a focused, one-step-per-screen walkthrough launched from the
// "I've factory reset the device" option on Step 3. The `os` prop ('ios' |
// 'android') selects the platform's steps, copy, and mock screens; everything
// else (the phase machine, the shell, the progress + trouble chrome) is
// shared. The customer picks a route on the intro screen (reset from the
// device, or remove it remotely), walks each step grounded in a mock OS
// screen, then lands on a "ready to ship" finish with an optional
// final-touches checklist. Pressing Done fires onDone so the step can unlock
// its confirm checkbox. Instructional only — never gates the flow directly;
// the step's confirm checkbox does. Final-touches ticks persist in
// devicePrep.resetGuideChecks via checks / onToggle.
//
// iOS = Activation Lock (one Apple account). Android = Samsung One UI, where
// two separate locks must clear: Google's Factory Reset Protection (FRP) and
// Samsung's Reactivation Lock — which is why the Android routes carry an extra
// account step.

const DEVICE_STEPS = {
  iphone: [
    {
      Mock: SettingsSignOut,
      title: 'Sign out of iCloud',
      lead: 'Open Settings, tap your name, scroll to the very bottom and tap Sign Out. Enter your Apple ID password to confirm.',
      why: 'This is the one step that removes Activation Lock.',
      trouble: {
        label: "It won't let me sign out",
        body: 'On iOS 17.3+, Stolen Device Protection can add a 1-hour delay away from home or work — do it at home, or turn it off under Settings › Face ID & Passcode. Forgot the password or biometrics broken? Switch to the remote path.',
        escalate: true,
      },
    },
    {
      Mock: SettingsErase,
      title: 'Erase all content',
      lead: 'Go to Settings › General › Transfer or Reset, then tap Erase All Content and Settings. It takes 2–10 minutes — don’t interrupt it.',
      why: 'Not the “Reset” sub-menu — that only clears network & keyboard settings.',
    },
    {
      Mock: HelloScreen,
      title: 'Restart and check',
      lead: 'When it reboots you’ll see the rotating “hello” screen and a language picker — not an Apple ID prompt. Then power it off and pack it.',
      why: 'No Apple ID prompt means Activation Lock is off — you’re done.',
      trouble: {
        label: 'I see a passcode or “Locked to Owner” screen',
        body: 'A passcode keypad means the erase didn’t run — redo the erase step. An Apple ID / “iPhone Locked to Owner” prompt means it’s wiped but still linked — finish it on the remote path.',
        escalate: true,
      },
    },
  ],
  ipad: [
    {
      Mock: IpadSettingsSignOut,
      title: 'Sign out of iCloud',
      lead: 'Open Settings, tap your name at the top, scroll to the bottom and tap Sign Out. Enter your Apple ID password to confirm.',
      why: 'This is the one step that removes Activation Lock.',
      trouble: {
        label: "It won’t let me sign out",
        body: 'On iPadOS 17.3+, Stolen Device Protection can add a 1-hour delay away from home or work — do it at home, or turn it off under Settings › Face ID & Passcode. Forgot the password or the screen’s broken? Switch to the remote path.',
        escalate: true,
      },
    },
    {
      Mock: IpadSettingsErase,
      title: 'Erase all content',
      lead: 'Go to Settings › General › Transfer or Reset iPad, then tap Erase All Content and Settings. It takes 2–10 minutes — don’t interrupt it.',
      why: 'Not the “Reset” sub-menu — that only clears network & keyboard settings.',
    },
    {
      Mock: IpadHelloScreen,
      title: 'Restart and check',
      lead: 'When it reboots you’ll see the rotating “hello” screen and a language picker — not an Apple ID prompt. Then power it off and pack it.',
      why: 'No Apple ID prompt means Activation Lock is off — you’re done.',
      trouble: {
        label: 'I see a passcode or “Locked to Owner” screen',
        body: 'A passcode keypad means the erase didn’t run — redo the erase step. An Apple ID / “iPad Locked to Owner” prompt means it’s wiped but still linked — finish it on the remote path.',
        escalate: true,
      },
    },
  ],
  mac: [
    {
      Mock: MacSignOut,
      title: 'Sign out of your Apple Account',
      lead: 'Open System Settings, click your name at the top of the sidebar, scroll down and click Sign Out. Enter your Apple ID password to confirm.',
      why: 'Signing out turns off Find My and lifts Activation Lock on Apple silicon and T2 Macs.',
      trouble: {
        label: "It won’t let me sign out",
        body: 'Find My asks for your Apple ID password before it releases the Mac. Forgot it, or the Mac won’t start up? Switch to the remote path and unlink it from your account instead.',
        escalate: true,
      },
    },
    {
      Mock: MacErase,
      title: 'Erase all content and settings',
      lead: 'Go to System Settings › General › Transfer or Reset, then click Erase All Content and Settings. The Erase Assistant wipes the Mac and signs you out automatically.',
      why: 'On Apple silicon and 2018-or-newer (T2) Macs this is the clean one-click wipe — the same idea as on iPhone.',
      trouble: {
        label: "I don’t see Erase All Content and Settings",
        body: 'Older Intel Macs without the T2 chip don’t have it. Restart holding ⌘-R to enter Recovery, open Disk Utility and erase Macintosh HD, then reinstall macOS from the Recovery menu.',
      },
    },
    {
      Mock: MacWelcome,
      title: 'Restart and check',
      lead: 'When it reboots you’ll see the Setup Assistant — the globe and “Select Your Country or Region” — not a login or Apple ID prompt. Then shut it down and pack it.',
      why: 'Landing on Setup Assistant with no account prompt means Activation Lock is off — you’re done.',
      trouble: {
        label: 'I see a login window or Activation Lock',
        body: 'A login window means the erase didn’t run — redo the erase step. An “Activation Lock” / Apple ID prompt means it’s wiped but still linked — finish it on the remote path.',
        escalate: true,
      },
    },
  ],
  android: [
    {
      Mock: SamsungRemoveGoogle,
      title: 'Remove your Google account',
      lead: 'Open Settings › Accounts and backup › Manage accounts, tap your Google account, then Remove account. Repeat for every Google account signed in.',
      why: 'This is what stops Factory Reset Protection (FRP) locking the device after the wipe.',
      trouble: {
        label: 'I forgot my Google password',
        body: 'Stop here and reset it at accounts.google.com/signin/recovery before you reset the phone — without it you can’t clear FRP afterwards, and there’s no workaround we or Google can offer. If the phone is broken and you can’t reach this screen, switch to the remote path.',
        escalate: true,
      },
    },
    {
      Mock: SamsungSignOutCarousel,
      title: 'Sign out of Samsung & turn off Find My Mobile',
      lead: 'Settings › Security and privacy › Find My Mobile — toggle it off (and Reactivation lock if shown). Then Accounts and backup › Manage accounts › your Samsung account › Sign out.',
      why: 'Leaving the Samsung account signed in keeps Reactivation Lock active — it’ll block the device after reset even with Google removed.',
      trouble: {
        label: 'It needs my fingerprint or face',
        body: 'On One UI 6.1+ (most 2024-or-newer Galaxy devices) Identity Check can require biometric verification before you can sign out. Turn it off under Settings › Security and privacy › Lost device protection. If your fingerprint sensor or front camera is broken, switch to the remote path instead.',
        escalate: true,
      },
    },
    {
      Mock: SamsungFactoryReset,
      title: 'Remove the screen lock, then factory reset',
      lead: 'First set Settings › Lock screen › Screen lock type to None. Then Settings › General management › Reset › Factory data reset › Reset › Delete all.',
      why: 'Pick “Factory data reset” — not “Reset settings” or “Reset network settings”, which only clear preferences and are the #1 reason people think they’ve reset but haven’t.',
    },
    {
      Mock: SamsungWelcome,
      title: 'Restart and check',
      lead: 'When it reboots you’ll see the Samsung welcome screen with a language picker — not a Google or Samsung sign-in. Then power it off and pack it. Don’t connect to Wi-Fi or finish setup.',
      why: 'No account prompt means FRP and Reactivation Lock are both off — you’re done.',
      trouble: {
        label: 'I see a PIN or an account sign-in',
        body: 'A PIN/pattern keypad means the erase didn’t run — redo the factory reset step. A “Verify your account” (Google) or “Sign in to your Samsung account” prompt means it’s wiped but still linked — finish it on the remote path.',
        escalate: true,
      },
    },
  ],
  // Android tablet — identical One UI steps to the Samsung phone guide, just
  // rendered in the wider tablet frame (MiniTablet) and worded "tablet".
  android_tablet: [
    {
      Mock: AndroidTabletRemoveGoogle,
      title: 'Remove your Google account',
      lead: 'Open Settings › Accounts and backup › Manage accounts, tap your Google account, then Remove account. Repeat for every Google account signed in.',
      why: 'This is what stops Factory Reset Protection (FRP) locking the device after the wipe.',
      trouble: {
        label: 'I forgot my Google password',
        body: 'Stop here and reset it at accounts.google.com/signin/recovery before you reset the tablet — without it you can’t clear FRP afterwards, and there’s no workaround we or Google can offer. If the tablet is broken and you can’t reach this screen, switch to the remote path.',
        escalate: true,
      },
    },
    {
      Mock: AndroidTabletSignOutCarousel,
      title: 'Sign out of Samsung & turn off Find My Mobile',
      lead: 'Settings › Security and privacy › Find My Mobile — toggle it off (and Reactivation lock if shown). Then Accounts and backup › Manage accounts › your Samsung account › Sign out.',
      why: 'Leaving the Samsung account signed in keeps Reactivation Lock active — it’ll block the device after reset even with Google removed.',
      trouble: {
        label: 'It needs my fingerprint or face',
        body: 'On One UI 6.1+ (most 2024-or-newer Galaxy devices) Identity Check can require biometric verification before you can sign out. Turn it off under Settings › Security and privacy › Lost device protection. If your fingerprint sensor or front camera is broken, switch to the remote path instead.',
        escalate: true,
      },
    },
    {
      Mock: AndroidTabletFactoryReset,
      title: 'Remove the screen lock, then factory reset',
      lead: 'First set Settings › Lock screen › Screen lock type to None. Then Settings › General management › Reset › Factory data reset › Reset › Delete all.',
      why: 'Pick “Factory data reset” — not “Reset settings” or “Reset network settings”, which only clear preferences and are the #1 reason people think they’ve reset but haven’t.',
    },
    {
      Mock: AndroidTabletWelcome,
      title: 'Restart and check',
      lead: 'When it reboots you’ll see the Samsung welcome screen with a language picker — not a Google or Samsung sign-in. Then power it off and pack it. Don’t connect to Wi-Fi or finish setup.',
      why: 'No account prompt means FRP and Reactivation Lock are both off — you’re done.',
      trouble: {
        label: 'I see a PIN or an account sign-in',
        body: 'A PIN/pattern keypad means the erase didn’t run — redo the factory reset step. A “Verify your account” (Google) or “Sign in to your Samsung account” prompt means it’s wiped but still linked — finish it on the remote path.',
        escalate: true,
      },
    },
  ],
}

// iPhone & iPad unlink the same way (icloud.com/find + account.apple.com ›
// Devices) on a portrait touch device, so they share one factory — only the
// device noun and the frame change. Mac uses a desktop-Safari layout (see
// MAC_REMOTE_STEPS). Android keeps its own two-account remote path below.
function appleRemoteSteps(noun, Frame = MiniPhone) {
  const a = /^[aeiou]/i.test(noun) ? 'an' : 'a'
  return [
    {
      Mock: () => <ICloudRemove noun={noun} Frame={Frame} />,
      title: 'Remove it from iCloud',
      lead: `On any device, open icloud.com/find and sign in with the Apple ID that was on this ${noun}. Pick the device, then tap Remove This Device — not Erase.`,
      why: 'Remove This Device is what unlinks it and lifts Activation Lock. Erase only wipes the data — the lock stays on.',
      trouble: {
        label: 'What if it’s still online?',
        body: `If the ${noun} is offline, Activation Lock lifts straight away (and it drops off Find My after 30 days). If it’s still online it can’t be removed yet — tap Continue to mark it “Ready for Repair / Trade In” for 30 days. One catch: if it later comes back online while still signed in, it can reappear and re-lock — so if you can still reach the device, also sign out of iCloud on it. You can do the same from appleid.apple.com › Devices.`,
      },
    },
    {
      Mock: makeAccountCarousel(noun, Frame),
      title: 'Or unlink it from your account',
      lead: `No iCloud access? On any device open account.apple.com and sign in. Open the menu, tap Devices, pick this ${noun}, scroll to About, then tap Remove from account. Swipe the screens with the arrows.`,
      why: 'Removing it from your Apple Account lifts Activation Lock too — same result as the iCloud step, just a different route.',
      trouble: {
        label: 'Which one should I use?',
        body: `Either lifts the lock. Use icloud.com/find if the ${noun} is lost or you also want to erase it remotely. Use account.apple.com › Devices when you just need to unlink ${a} ${noun} you still have in hand.`,
      },
    },
  ]
}

// Mac remote path — a Mac is unlocked from a desktop browser, so the screens
// render in the laptop shell with Safari-window chrome rather than a phone.
const MAC_REMOTE_STEPS = [
  {
    Mock: MacICloudRemove,
    title: 'Remove it from iCloud',
    lead: 'On any computer, open icloud.com/find and sign in with the Apple ID that was on this Mac. Select the Mac, then click Remove This Device — not Erase.',
    why: 'Remove This Device unlinks it and lifts Activation Lock. Erase only wipes the data — the lock stays on.',
    trouble: {
      label: 'What if it’s still online?',
      body: 'If the Mac is offline, Activation Lock lifts straight away (and it drops off Find My after 30 days). If it’s still online it can’t be removed yet — sign out of iCloud on the Mac itself, or remove it from account.apple.com › Devices once it’s offline.',
    },
  },
  {
    Mock: MacAccountRemove,
    title: 'Or unlink it from your account',
    lead: 'No iCloud access? Open account.apple.com, sign in, go to Devices, select this Mac, then click Remove from account.',
    why: 'Removing it from your Apple Account lifts Activation Lock too — same result as the iCloud step, just a different route.',
    trouble: {
      label: 'Which one should I use?',
      body: 'Either lifts the lock. Use icloud.com/find if the Mac is lost or you also want to erase it remotely. Use account.apple.com › Devices when you just need to unlink a Mac you still have in hand.',
    },
  },
]

const REMOTE_STEPS = {
  iphone: appleRemoteSteps('iPhone'),
  ipad: appleRemoteSteps('iPad', MiniTablet),
  mac: MAC_REMOTE_STEPS,
  android: [
    {
      Mock: GoogleRemoveRemote,
      title: 'Remove it from your Google account',
      lead: 'On any device, open myaccount.google.com/device-activity and sign in with the Google account that was on this phone. Find the device, open the ⋮ menu, and tap Sign out.',
      why: 'This clears Factory Reset Protection so our technician can wipe and resell the device.',
      trouble: {
        label: 'How long does this take?',
        body: 'Google’s FRP cache can take up to 72 hours to fully clear after a remote sign-out. If you’re shipping urgently and still remember the password, signing in on the device once is faster.',
      },
    },
    {
      Mock: SamsungRemoveRemote,
      title: 'And remove it from your Samsung account',
      lead: 'Open account.samsung.com, sign in, go to Devices, find this phone and tap Remove.',
      why: 'This lifts Samsung’s Reactivation Lock — the same result as on-device, just remote.',
      trouble: {
        label: 'Do I need to do both?',
        body: 'Yes. Google and Samsung locks are separate systems — removing only one still leaves the other able to block the device. Do both before you ship.',
      },
    },
  ],
  android_tablet: [
    {
      Mock: AndroidTabletGoogleRemoveRemote,
      title: 'Remove it from your Google account',
      lead: 'On any device, open myaccount.google.com/device-activity and sign in with the Google account that was on this tablet. Find the device, open the ⋮ menu, and tap Sign out.',
      why: 'This clears Factory Reset Protection so our technician can wipe and resell the device.',
      trouble: {
        label: 'How long does this take?',
        body: 'Google’s FRP cache can take up to 72 hours to fully clear after a remote sign-out. If you’re shipping urgently and still remember the password, signing in on the device once is faster.',
      },
    },
    {
      Mock: AndroidTabletSamsungRemoveRemote,
      title: 'And remove it from your Samsung account',
      lead: 'Open account.samsung.com, sign in, go to Devices, find this tablet and tap Remove.',
      why: 'This lifts Samsung’s Reactivation Lock — the same result as on-device, just remote.',
      trouble: {
        label: 'Do I need to do both?',
        body: 'Yes. Google and Samsung locks are separate systems — removing only one still leaves the other able to block the device. Do both before you ship.',
      },
    },
  ],
}

const FINAL_CHECKS = {
  iphone: [
    { id: 'gf_sim', Icon: SimCard, label: 'Remove SIM / delete eSIM' },
    { id: 'gf_watch', Icon: Watch, label: 'Unpair Apple Watch' },
    { id: 'gf_imei', Icon: Camera, label: 'Photo the IMEI for warranty' },
    { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
  ],
  ipad: [
    { id: 'gf_sim', Icon: SimCard, label: 'Remove SIM / delete eSIM (cellular)' },
    { id: 'gf_pencil', Icon: Watch, label: 'Unpair Apple Pencil & accessories' },
    { id: 'gf_serial', Icon: Camera, label: 'Photo the serial for warranty' },
    { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
  ],
  mac: [
    { id: 'gf_bt', Icon: Watch, label: 'Unpair Bluetooth mouse & keyboard' },
    { id: 'gf_charger', Icon: Package, label: 'Include the charger & cable' },
    { id: 'gf_serial', Icon: Camera, label: 'Photo the serial for warranty' },
    { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
  ],
  android: [
    { id: 'gf_sim', Icon: SimCard, label: 'Remove SIM / delete eSIM' },
    { id: 'gf_sd', Icon: Package, label: 'Remove the microSD card' },
    { id: 'gf_galaxy', Icon: Watch, label: 'Unpair Galaxy Watch / Buds' },
    { id: 'gf_imei', Icon: Camera, label: 'Photo the IMEI for warranty' },
    { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
  ],
  android_tablet: [
    { id: 'gf_sim', Icon: SimCard, label: 'Remove SIM / delete eSIM (cellular)' },
    { id: 'gf_sd', Icon: Package, label: 'Remove the microSD card' },
    { id: 'gf_spen', Icon: Watch, label: 'Pack the S Pen & accessories' },
    { id: 'gf_serial', Icon: Camera, label: 'Photo the serial for warranty' },
    { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
  ],
}

const COPY = {
  iphone: {
    fallbackTitle: 'Reset your iPhone',
    introTitle: 'Let’s unlock your iPhone',
    introSub:
      'We’ll go one step at a time. First — can you still unlock and use this phone?',
    yes: 'Yes, I can unlock it',
    yesSub: 'Reset right from the device · most people',
    no: 'No — it’s broken or won’t turn on',
    noSub: 'We’ll erase it remotely instead',
    doneTitle: 'Your iPhone is ready to ship',
    doneSub:
      'It’s erased and unlinked. Before you box it up, a few quick optional checks:',
  },
  ipad: {
    fallbackTitle: 'Reset your iPad',
    introTitle: 'Let’s unlock your iPad',
    introSub:
      'We’ll go one step at a time. First — can you still unlock and use this iPad?',
    yes: 'Yes, I can unlock it',
    yesSub: 'Reset right from the device · most people',
    no: 'No — it’s broken or won’t turn on',
    noSub: 'We’ll erase it remotely instead',
    doneTitle: 'Your iPad is ready to ship',
    doneSub:
      'It’s erased and unlinked. Before you box it up, a few quick optional checks:',
  },
  mac: {
    fallbackTitle: 'Reset your MacBook',
    introTitle: 'Let’s wipe your MacBook',
    introSub:
      'We’ll go one step at a time. First — can you still log in and use this Mac?',
    yes: 'Yes, I can log in',
    yesSub: 'Erase right from the Mac · most people',
    no: 'No — it’s broken or won’t start up',
    noSub: 'We’ll unlink it remotely instead',
    doneTitle: 'Your MacBook is ready to ship',
    doneSub:
      'It’s erased and unlinked. Before you box it up, a few quick optional checks:',
  },
  android: {
    fallbackTitle: 'Reset your Samsung phone',
    introTitle: 'Let’s unlock your Samsung phone',
    introSub:
      'We’ll go one step at a time. First — can you still unlock and use this phone?',
    yes: 'Yes, I can unlock it',
    yesSub: 'Reset right from the device · most people',
    no: 'No — it’s broken or won’t turn on',
    noSub: 'We’ll erase it remotely instead',
    doneTitle: 'Your phone is ready to ship',
    doneSub:
      'It’s erased and unlinked from your Google and Samsung accounts. Before you box it up, a few quick optional checks:',
  },
  android_tablet: {
    fallbackTitle: 'Reset your Samsung tablet',
    introTitle: 'Let’s unlock your Samsung tablet',
    introSub:
      'We’ll go one step at a time. First — can you still unlock and use this tablet?',
    yes: 'Yes, I can unlock it',
    yesSub: 'Reset right from the device · most people',
    no: 'No — it’s broken or won’t turn on',
    noSub: 'We’ll erase it remotely instead',
    doneTitle: 'Your tablet is ready to ship',
    doneSub:
      'It’s erased and unlinked from your Google and Samsung accounts. Before you box it up, a few quick optional checks:',
  },
}

const DEVICE_LABEL = {
  iphone: 'iPhone',
  ipad: 'iPad',
  mac: 'MacBook',
  android: 'Samsung',
  android_tablet: 'Samsung tablet',
}

export default function ResetGuideSheet({
  device = 'iphone',
  checks,
  onToggle,
  onDone,
  onClose,
}) {
  const c = COPY[device] || COPY.iphone
  const [phase, setPhase] = useState('intro')
  const [route, setRoute] = useState(null)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  // Index within a carousel step (steps whose Mock carries a `.screens`
  // array). Reset whenever the step or route changes. The footer button walks
  // this forward one screen at a time and only advances the step once the last
  // screen has been viewed.
  const [carouselIdx, setCarouselIdx] = useState(0)
  useEffect(() => {
    setCarouselIdx(0)
  }, [i, route])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const deviceSteps = DEVICE_STEPS[device] || DEVICE_STEPS.iphone
  const remoteSteps = REMOTE_STEPS[device] || REMOTE_STEPS.iphone
  const finalChecks = FINAL_CHECKS[device] || FINAL_CHECKS.iphone
  const steps = route === 'remote' ? remoteSteps : deviceSteps

  // A step is a carousel when its Mock exposes a `.screens` array (see
  // AccountRemoveCarousel / SamsungSignOutCarousel). `atCarouselEnd` is true
  // for non-carousel steps and for carousel steps sitting on their last screen.
  const activeScreens = steps[i]?.Mock?.screens
  const isCarousel = Array.isArray(activeScreens)
  const atCarouselEnd = !isCarousel || carouselIdx >= activeScreens.length - 1
  const showFinish = atCarouselEnd && i === steps.length - 1

  const start = (r) => {
    setRoute(r)
    setI(0)
    setDir(1)
    setPhase('steps')
  }
  const next = () => {
    if (isCarousel && carouselIdx < activeScreens.length - 1) {
      setCarouselIdx((n) => n + 1)
      return
    }
    setDir(1)
    if (i < steps.length - 1) setI(i + 1)
    else setPhase('done')
  }
  const back = () => {
    if (isCarousel && carouselIdx > 0) {
      setCarouselIdx((n) => n - 1)
      return
    }
    setDir(-1)
    if (i > 0) setI(i - 1)
    else setPhase('intro')
  }
  const escalate = () => {
    setRoute('remote')
    setI(0)
    setDir(1)
  }

  const headerTitle =
    phase === 'done'
      ? 'Almost there'
      : route === 'remote'
        ? 'Remote reset'
        : route === 'device'
          ? 'Reset from the device'
          : c.fallbackTitle

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Guided ${DEVICE_LABEL[device] || 'device'} reset`}
    >
      <style>{STEP_ANIM_CSS}</style>
      <button
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile h-full bg-surface flex flex-col animate-slideUp overflow-hidden">
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {phase === 'steps' && (
                <button
                  onClick={back}
                  className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2/60 shrink-0"
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
              )}
              <span className="text-[13px] font-bold text-ink truncate">
                {headerTitle}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60 shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          {phase === 'steps' && (
            <Progress current={i + 1} total={steps.length} />
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {phase === 'intro' && (
            <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
              <IntroDevice device={device} />
              <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">
                {c.introTitle}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
                {c.introSub}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
                  <Clock size={12} strokeWidth={2} />
                  About 10 minutes
                </span>
              </div>
              <div className="mt-5 w-full flex flex-col gap-2.5">
                <button
                  onClick={() => start('device')}
                  className="w-full text-left rounded-[16px] border-2 border-brand bg-brand-bg/50 px-4 py-3.5 flex items-center gap-3 hover:bg-brand-bg/70 transition-colors"
                >
                  <span className="w-10 h-10 rounded-full bg-brand text-white grid place-items-center shrink-0">
                    <CheckCircle2 size={20} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      {c.yes}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {c.yesSub}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2.2}
                    className="text-brand shrink-0"
                  />
                </button>
                <button
                  onClick={() => start('remote')}
                  className="w-full text-left rounded-[16px] border-2 border-line bg-surface px-4 py-3.5 flex items-center gap-3 hover:bg-line-2/30 transition-colors"
                >
                  <span className="w-10 h-10 rounded-full bg-warn-bg text-warn grid place-items-center shrink-0">
                    <AlertTriangle size={20} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink leading-snug">
                      {c.no}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {c.noSub}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2.2}
                    className="text-muted shrink-0"
                  />
                </button>
              </div>
            </div>
          )}

          {phase === 'steps' &&
            (() => {
              const s = steps[i]
              const Mock = s.Mock
              return (
                <div
                  key={`${route}-${i}`}
                  className="px-5 pt-5 pb-5 flex flex-col items-center text-center"
                  style={{ animation: stepAnim(dir) }}
                >
                  {isCarousel ? (
                    <Mock idx={carouselIdx} onIdxChange={setCarouselIdx} />
                  ) : (
                    <Mock />
                  )}
                  <h2 className="mt-4 text-[20px] font-bold text-ink leading-tight">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.55] max-w-[320px]">
                    {s.lead}
                  </p>
                  {s.why && (
                    <div
                      className={`mt-3 inline-flex items-start gap-1.5 rounded-[10px] px-3 py-2 text-[12px] leading-snug max-w-[320px] ${
                        route === 'remote'
                          ? 'bg-warn-bg/70 text-warn'
                          : 'bg-brand-bg/70 text-brand'
                      }`}
                    >
                      <ShieldCheck
                        size={14}
                        strokeWidth={2}
                        className="shrink-0 mt-px"
                      />
                      <span className="text-left font-medium">{s.why}</span>
                    </div>
                  )}
                  {s.trouble && (
                    <Trouble trouble={s.trouble} onEscalate={escalate} />
                  )}
                </div>
              )
            })()}

          {phase === 'done' && (
            <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-success-bg" />
                <div className="absolute inset-0 grid place-items-center text-success">
                  <CheckCircle2 size={40} strokeWidth={1.9} />
                </div>
              </div>
              <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">
                {c.doneTitle}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
                {c.doneSub}
              </p>
              <div className="mt-4 w-full rounded-[16px] border border-line overflow-hidden">
                {finalChecks.map((f, idx) => {
                  const ItemIcon = f.Icon
                  const checked = !!checks[f.id]
                  return (
                    <button
                      key={f.id}
                      onClick={() => onToggle(f.id, !checked)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${
                        idx > 0 ? 'border-t border-line-2' : ''
                      }`}
                    >
                      <span
                        className={`w-[22px] h-[22px] rounded-[7px] border-2 grid place-items-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-success border-success'
                            : 'border-line bg-surface'
                        }`}
                      >
                        {checked && (
                          <Check size={13} strokeWidth={3} className="text-white" />
                        )}
                      </span>
                      <ItemIcon
                        size={16}
                        strokeWidth={1.9}
                        className="text-muted shrink-0"
                      />
                      <span
                        className={`flex-1 text-[13px] ${
                          checked
                            ? 'text-muted line-through decoration-line'
                            : 'text-ink-2'
                        }`}
                      >
                        {f.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[11.5px] text-muted leading-snug">
                These are optional — tap Done whenever you’re ready.
              </p>
            </div>
          )}
        </div>

        <footer className="shrink-0 px-4 py-3 border-t border-line">
          {phase === 'steps' && (
            <button
              onClick={next}
              className="w-full h-[48px] rounded-[12px] bg-brand text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
            >
              {showFinish ? (
                <>
                  I’ve done this — finish
                  <Check size={16} strokeWidth={2.6} />
                </>
              ) : (
                <>
                  I’ve done this
                  <ArrowRight size={16} strokeWidth={2.4} />
                </>
              )}
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={onDone}
              className="w-full h-[48px] rounded-[12px] bg-success text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.6} />
              Done
            </button>
          )}
          {phase === 'intro' && (
            <p className="text-center text-[11.5px] text-muted leading-snug py-1">
              Not sure? Pick “Yes” — you can switch paths anytime.
            </p>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function Progress({ current, total }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, idx) => (
          <span
            key={idx}
            className="flex-1 h-1.5 rounded-full overflow-hidden bg-line"
          >
            <span
              className={`block h-full rounded-full bg-brand transition-all duration-500 ${
                idx < current ? 'w-full' : 'w-0'
              }`}
            />
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        Step {Math.min(current, total)} of {total}
      </div>
    </div>
  )
}

function Trouble({ trouble, onEscalate }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand"
        aria-expanded={open}
      >
        <HelpCircle size={15} strokeWidth={2} />
        {trouble.label}
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-2 rounded-[12px] border border-line bg-line-2/40 px-3.5 py-3 animate-slideDown text-left">
          <p className="text-[12.5px] text-ink-2 leading-[1.5]">{trouble.body}</p>
          {trouble.escalate && (
            <button
              onClick={onEscalate}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-[10px] bg-warn-bg text-warn font-semibold text-[12px] px-3 h-9 hover:brightness-95"
            >
              <RotateCcw size={14} strokeWidth={2.2} />
              Switch to the remote path
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------- iOS mock screens */

// Builds the four-screen account.apple.com carousel for a given device. The
// returned component carries `.screens` so ResetGuideSheet detects it as a
// carousel step and gates its footer button on reaching the last screen.
function makeAccountCarousel(noun, Frame = MiniPhone) {
  const screens = [
    { Screen: AcctMenu, caption: 'Open the menu, tap Devices' },
    { Screen: () => <AcctDeviceList noun={noun} />, caption: `Pick this ${noun}` },
    {
      Screen: () => <AcctDeviceDetail noun={noun} />,
      caption: 'Open it, scroll to About',
    },
    { Screen: () => <AcctRemove noun={noun} />, caption: 'Tap Remove from account' },
  ]
  function AccountRemoveCarousel(props) {
    return <MockCarousel screens={screens} Frame={Frame} {...props} />
  }
  AccountRemoveCarousel.screens = screens
  return AccountRemoveCarousel
}
