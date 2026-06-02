// Device-category → guided-reset platform mapping. `category_name` (e.g.
// 'iPhone', 'Samsung phone') is the canonical field that drives which reset
// guide a customer sees; `deviceOs` is only a fallback for orders that
// predate the field. The Android guide is Samsung-branded (the only one
// built), so any Android category maps to it knowingly; unknown categories
// fall back to iOS.

const IOS_RE = /iphone|ipad|ipod|apple|mac/i
const ANDROID_RE = /samsung|android|galaxy|pixel|oneplus|xiaomi|oppo|vivo/i

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
