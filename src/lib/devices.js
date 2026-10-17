// Device-category → guided-reset mapping. `category_name` (the production
// category, e.g. 'iPhone', 'Macbook', 'Tablet', 'Samsung phone') is the
// canonical field that drives both which reset guide a customer sees and
// which device illustration it shows; `deviceOs` is only a fallback for
// orders that predate the field.
//
// Two dimensions come out of the category:
//   • os (`ios` | `android`) — the Apple-vs-Google split. Drives the
//     iCloud-vs-Google backup / remote-account copy.
//   • deviceType (`iphone` | `ipad` | `mac` | `android` | `tablet`) — the
//     finer split that selects the walkthrough's copy, steps, mock screens,
//     and frame. `tablet` is OS-AMBIGUOUS: the production `Tablet` category
//     covers both iPads and Android tablets, so it can't be resolved from the
//     category alone — Step 3 asks the customer (defaulting to iPad) and
//     resolves it to `ipad` or `android` before the guide opens.
// The Android guide is Samsung-branded (the only one built), so any Android
// device maps to it knowingly; unknown categories fall back to iPhone / iOS.

const IOS_RE = /iphone|ipad|ipod|apple|mac/i
const ANDROID_RE = /samsung|android|galaxy|pixel|oneplus|xiaomi|oppo|vivo/i

const IPAD_RE = /ipad/i
const MAC_RE = /macbook|imac|\bmac\b|mac\s?(mini|studio|pro)/i
const TABLET_RE = /tablet/i

export function osForCategory(categoryName, fallback = 'ios') {
  if (!categoryName) return fallback
  if (ANDROID_RE.test(categoryName)) return 'android'
  if (IOS_RE.test(categoryName)) return 'ios'
  return fallback
}

export function deviceOsForOrder(order) {
  const category = order?.product?.category_name ?? order?.category_name
  if (category) return osForCategory(category)
  return order?.deviceOs || 'ios'
}

export function deviceTypeForCategory(categoryName, fallback = 'iphone') {
  if (!categoryName) return fallback
  if (ANDROID_RE.test(categoryName)) return 'android'
  if (MAC_RE.test(categoryName)) return 'mac'
  if (IPAD_RE.test(categoryName)) return 'ipad'
  // Generic 'Tablet' is OS-ambiguous (iPad vs Android tablet) — resolved by
  // the Step 3 chooser, not here.
  if (TABLET_RE.test(categoryName)) return 'tablet'
  if (IOS_RE.test(categoryName)) return 'iphone'
  return fallback
}

export function deviceTypeForOrder(order) {
  const category = order?.product?.category_name ?? order?.category_name
  if (category) return deviceTypeForCategory(category)
  // Fallback for orders predating category_name: deviceOs only distinguishes
  // ios vs android, so iOS collapses to the iPhone guide.
  return order?.deviceOs === 'android' ? 'android' : 'iphone'
}

// True when the order's category can't pin down the guide's OS on its own
// (today: the generic `Tablet` category). Step 3 shows the iPad/Android
// chooser in this case.
export function isOsAmbiguous(order) {
  return deviceTypeForOrder(order) === 'tablet'
}

// Order line → reset guide (data/resetGuides/*). Catalogue category first,
// then the product title, per the guided-reset doc's mapping table. Returns
// { guideId, variant, needsChooser } — needsChooser marks a Tablet whose title
// can't tell iPad from Android (Step 3 then asks). Care+ lines never reach
// here: a Care+ claim carries its covered device's product.
const SAMSUNG_RE = /^(samsung|galaxy)/i
const WINDOWS_BRANDS = [
  [/thinkpad/i, 'thinkpad'],
  [/lenovo|ideapad/i, 'ideapad'],
  [/^dell/i, 'dell'],
  [/^hp\b/i, 'hp'],
  [/^acer/i, 'acer'],
  [/surface|^microsoft/i, 'surface'],
]

export function resetGuideForOrder(order) {
  const category = order?.product?.category_name ?? order?.category_name
  const title = (order?.product?.name ?? '').trim()
  const g = (guideId, variant, needsChooser = false) => ({ guideId, variant, needsChooser })

  if (!category) {
    return order?.deviceOs === 'android' ? g('android', 'samsung_phone') : g('apple_mobile', 'iphone')
  }
  if (/iphone/i.test(category)) return g('apple_mobile', 'iphone')
  if (MAC_RE.test(category)) return g('mac', 'macbook')
  if (/ipad/i.test(category) || (TABLET_RE.test(category) && /^ipad/i.test(title))) {
    return g('apple_mobile', 'ipad')
  }
  if (TABLET_RE.test(category)) {
    if (SAMSUNG_RE.test(title)) return g('android', 'samsung_tablet')
    if (title) return g('android', 'other_android')
    return g('apple_mobile', 'ipad', true)
  }
  if (/samsung/i.test(category)) return g('android', 'samsung_phone')
  if (/smartphone|android/i.test(category)) {
    return g('android', SAMSUNG_RE.test(title) ? 'samsung_phone' : 'other_android')
  }
  if (/laptop/i.test(category)) {
    const hit = WINDOWS_BRANDS.find(([re]) => re.test(title))
    return g('windows', hit ? hit[1] : 'dell')
  }
  if (/watch/i.test(category)) {
    return /^apple/i.test(title) ? g('watch', 'apple_watch') : g('no_reset', 'accessory')
  }
  if (/audio/i.test(category)) {
    if (/airpods max/i.test(title)) return g('airpods', 'airpods_max')
    return /airpods/i.test(title) ? g('airpods', 'airpods') : g('no_reset', 'audio')
  }
  if (/gaming/i.test(category)) {
    const ps = title.match(/(?:ps|playstation)\s?([345])\b/i)
    if (ps && !/controller/i.test(title)) return g('playstation', `ps${ps[1]}`)
    return g('no_reset', 'controller')
  }
  return g('no_reset', 'accessory')
}
