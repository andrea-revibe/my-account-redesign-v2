// Device-category helpers. `category_name` is the production category
// (`product_categories.name`, e.g. 'iPhone', 'Macbook', 'Tablet'); `deviceOs`
// is only a fallback for orders that predate it. `os` (`ios` | `android`)
// drives the iCloud-vs-Google backup copy.

const IOS_RE = /iphone|ipad|ipod|apple|mac/i
const ANDROID_RE = /samsung|android|galaxy|pixel|oneplus|xiaomi|oppo|vivo/i

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

// Reset guide allocation from the production category (`order_products.
// category_id` → `product_categories`). A category that spans more than one
// guide asks the customer; the product title only pre-selects an answer —
// except in a `byTitle` category, where a title match routes outright and the
// question is only the fallback for an unmatched title.
// Each device option names the guide + variant it opens; `sample` is a
// catalogue-style title the sandbox uses.
export const DEVICE_OPTIONS = {
  iphone: { sample: 'iPhone 13', label: 'iPhone', guideId: 'apple_mobile', variant: 'iphone', match: /^iphone/i },
  ipad: { sample: 'iPad Air (5th generation)', label: 'iPad', guideId: 'apple_mobile', variant: 'ipad', match: /^ipad/i },
  samsung_phone: { sample: 'Samsung Galaxy S21', label: 'Samsung Galaxy phone', guideId: 'android', variant: 'samsung_phone', match: /^(samsung|galaxy)/i },
  other_android_phone: { sample: 'Oppo Reno 12 5G', label: 'Other Android phone', sub: 'Oppo, Huawei, Xiaomi…', guideId: 'android', variant: 'other_android', match: /pixel|xiaomi|redmi|oneplus|oppo|vivo|huawei|honor|motorola|nokia/i },
  macbook: { sample: 'MacBook Air 13″', label: 'MacBook', guideId: 'mac', variant: 'macbook', match: /macbook/i },
  windows_laptop: { sample: 'Windows laptop', label: 'Windows laptop', guideId: 'windows', variant: 'laptop' },
  apple_watch: { sample: 'Apple Watch Series 8', label: 'Apple Watch', guideId: 'watch', variant: 'apple_watch', match: /^apple watch/i },
  other_watch: { sample: 'Awei H25 Smartwatch', label: 'Another watch', sub: 'Awei, Galaxy Watch… · no reset needed', guideId: 'no_reset', variant: 'accessory', match: /awei|smartwatch|galaxy watch|garmin|fitbit|huawei watch/i },
  airpods_max: { sample: 'AirPods Max', label: 'AirPods Max', guideId: 'airpods', variant: 'airpods_max', match: /airpods max/i },
  airpods: { sample: 'AirPods Pro (2nd generation)', label: 'AirPods or AirPods Pro', guideId: 'airpods', variant: 'airpods', match: /airpods(?! max)/i },
  other_audio: { sample: 'JBL Flip 6', label: 'Other headphones or speaker', sub: 'No reset needed', guideId: 'no_reset', variant: 'audio', match: /jbl|bose|beats|marshall|sennheiser|sony wh|speaker/i },
  ps5: { sample: 'PlayStation 5', label: 'PlayStation 5', guideId: 'playstation', variant: 'ps5', match: /^(?!.*controller).*(ps|playstation)\s?5\b/i },
  ps4: { sample: 'PlayStation 4 Pro', label: 'PlayStation 4', guideId: 'playstation', variant: 'ps4', match: /^(?!.*controller).*(ps|playstation)\s?4\b/i },
  ps3: { sample: 'PlayStation 3', label: 'PlayStation 3', guideId: 'playstation', variant: 'ps3', match: /^(?!.*controller).*(ps|playstation)\s?3\b/i },
  other_gaming: { sample: 'DualSense Controller', label: 'Controller or other console', sub: 'PlayStation 2, controllers… · no reset needed', guideId: 'no_reset', variant: 'controller', match: /controller|(ps|playstation)\s?2\b|xbox|nintendo|switch/i },
  accessory: { sample: 'USB-C 20W Charger', label: 'Something else', sub: 'Charger, case, accessory · no reset needed', guideId: 'no_reset', variant: 'accessory' },
}

// Mirrors production `product_categories` (id · name), with options trimmed to
// what prod actually sells there (Tablet = iPads only, Smartphone = non-Samsung
// Android, Not found = TVs). `device: false` = not a device (Care+ line). One
// option = no question.
export const PRODUCT_CATEGORIES = [
  { id: 2, name: 'iPhone', options: ['iphone'] },
  { id: 1, name: 'Samsung phone', options: ['samsung_phone'] },
  { id: 11, name: 'Smartphone', options: ['other_android_phone'] },
  { id: 6, name: 'Tablet', options: ['ipad'] },
  { id: 5, name: 'Macbook', options: ['macbook'] },
  { id: 4, name: 'Laptop', options: ['windows_laptop'] },
  { id: 8, name: 'Watch', question: 'Which watch is it?', byTitle: true, options: ['apple_watch', 'other_watch'] },
  { id: 10, name: 'Audio', question: 'Which headphones or speaker is it?', options: ['airpods', 'airpods_max', 'other_audio'] },
  { id: 9, name: 'Gaming', question: 'Which console is it?', options: ['ps5', 'ps4', 'ps3', 'other_gaming'] },
  { id: 7, name: 'Accessories', options: ['accessory'] },
  { id: 13, name: 'TV', options: ['accessory'] },
  { id: 12, name: 'Not found', options: ['accessory'] },
  { id: 3, name: 'Warranty', device: false, options: ['accessory'] },
]

const NOT_FOUND = PRODUCT_CATEGORIES.find((c) => c.id === 12)

export function productCategoryFor(name) {
  const n = (name ?? '').trim().toLowerCase()
  return PRODUCT_CATEGORIES.find((c) => c.name.toLowerCase() === n) ?? NOT_FOUND
}

// Title → the option it most likely is, or null (nothing pre-selected).
export function guessDevice(category, title) {
  const t = (title ?? '').trim()
  if (!t) return null
  return category.options.find((id) => DEVICE_OPTIONS[id].match?.test(t)) ?? null
}

export function asksCustomer(category, guess) {
  return category.options.length > 1 && !(category.byTitle && guess)
}

// Order line → { category, device, guideId, variant, needsChooser }. When
// `needsChooser`, `device` is the title's guess (null = customer must pick,
// and guideId/variant are null until they do).
export function resetGuideForOrder(order) {
  const name = order?.product?.category_name ?? order?.category_name
  const category = name
    ? productCategoryFor(name)
    : productCategoryFor(order?.deviceOs === 'android' ? 'Samsung phone' : 'iPhone')
  const multi = category.options.length > 1
  const device = multi ? guessDevice(category, order?.product?.name) : category.options[0]
  const needsChooser = asksCustomer(category, device)
  const opt = device ? DEVICE_OPTIONS[device] : null
  return { category, device, guideId: opt?.guideId ?? null, variant: opt?.variant ?? null, needsChooser }
}
