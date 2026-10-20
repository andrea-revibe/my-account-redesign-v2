import { useCallback, useMemo, useState } from 'react'
import { JOURNEYS } from '../data/journey'
import { RESET_GUIDES } from '../data/resetGuides'
import { guideById, variantFor, isSingleMode } from './resetGuides'
import { DEVICE_OPTIONS, PRODUCT_CATEGORIES, guessDevice } from './devices'

// Third sandbox (kind 'reset_sandbox'): previews guided reset the way
// production allocates it — pick the order line's product category
// (`product_categories`), then the device the customer answers when that
// category spans several guides. The synthesised delivered order carries the
// category + a sample title (or none, with `titleGuess` off), so "Raise a
// claim" on the card behind reaches the same picker + guide through Step 3.

const DEFAULT_INPUTS = {
  categoryId: 2,
  device: 'iphone',
  titleGuess: true,
  mode: 'return',
  openAt: 'start',
}

const categoryById = (id) => PRODUCT_CATEGORIES.find((c) => c.id === id) ?? PRODUCT_CATEGORIES[0]

function buildOrder(initialOrder, category, device, titleGuess) {
  const needsChooser = category.options.length > 1
  return {
    ...initialOrder,
    statusId: 'delivered',
    state: 'close',
    subStatusId: null,
    courier: 'DHL Express',
    trackingNumber: '3392654392',
    timeline: {
      created: '19 May · 10:30 AM',
      quality_check: '20 May · 9:00 AM',
      shipped: '21 May · 6:00 PM',
      delivered: '25 May · 3:14 PM',
    },
    deliveredOn: '2026-05-25',
    deliveredOnLong: 'Monday, 25 May',
    deviceOs: DEVICE_OPTIONS[device].guideId === 'android' ? 'android' : 'ios',
    product: {
      ...initialOrder.product,
      name: needsChooser && !titleGuess ? 'Unknown model' : DEVICE_OPTIONS[device].sample,
      variant: 'Sandbox device · Good',
      category_name: category.name,
    },
  }
}

export function useResetGuideSandbox(journey) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const setInput = useCallback((key, value) => {
    setInputs((prev) => {
      if (key !== 'categoryId') return { ...prev, [key]: value }
      // A new category starts on its first device.
      return { ...prev, categoryId: value, device: categoryById(value).options[0] }
    })
  }, [])

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), [])

  const category = categoryById(inputs.categoryId)
  const option = DEVICE_OPTIONS[inputs.device]
  const guide = guideById(option.guideId)
  const variant = variantFor(guide, option.variant)
  const order = useMemo(
    () => buildOrder(journey?.initialOrder ?? {}, category, inputs.device, inputs.titleGuess),
    [journey, category, inputs.device, inputs.titleGuess],
  )
  const guess = category.options.length > 1 ? guessDevice(category, order.product.name) : inputs.device

  return {
    kind: 'reset_sandbox',
    journey,
    journeys: JOURNEYS,
    guides: RESET_GUIDES,
    categories: PRODUCT_CATEGORIES.filter((c) => c.device !== false),
    category,
    guess,
    inputs,
    setInput,
    reset,
    guide,
    variant,
    single: isSingleMode(guide),
    order,
  }
}
