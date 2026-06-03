// Device-category → guided-reset mapping. `category_name` (e.g. 'iPhone',
// 'iPad', 'MacBook', 'Samsung phone') is the canonical field that drives both
// which reset guide a customer sees and which device illustration it shows;
// `deviceOs` is only a fallback for orders that predate the field.
//
// Two dimensions come out of the category:
//   • os (`ios` | `android`) — the Apple-vs-Google split. Drives the
//     iCloud-vs-Google backup / remote-account copy. iPad and Mac are `ios`.
//   • deviceType (`iphone` | `ipad` | `mac` | `android`) — the finer split
//     that selects the walkthrough's copy, steps, mock screens, and frame.
// The Android guide is Samsung-branded (the only one built), so any Android
// category maps to it knowingly; unknown categories fall back to iPhone / iOS.

const IOS_RE = /iphone|ipad|ipod|apple|mac/i
const ANDROID_RE = /samsung|android|galaxy|pixel|oneplus|xiaomi|oppo|vivo/i

const IPAD_RE = /ipad/i
const MAC_RE = /macbook|imac|\bmac\b|mac\s?(mini|studio|pro)/i

export function osForCategory(categoryName, fallback = 'ios') {
  if (!categoryName) return fallback
  if (IOS_RE.test(categoryName)) return 'ios'
  if (ANDROID_RE.test(categoryName)) return 'android'
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
  if (IPAD_RE.test(categoryName)) return 'ipad'
  if (MAC_RE.test(categoryName)) return 'mac'
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
