import { useCallback, useMemo, useState } from 'react'
import { JOURNEYS } from '../data/journey'
import { RESET_GUIDES } from '../data/resetGuides'
import { guideById, variantFor, isSingleMode } from './resetGuides'

// Third sandbox (kind 'reset_sandbox'): previews every guided-reset guide ×
// variant × mode without walking a claim. The panel opens ResetGuideSheet
// directly; the synthesised delivered order carries the chosen variant's
// catalogue category + title, so "Raise a claim" on the card behind reaches
// the same guide through the real Step 3 mapping.

const DEFAULT_INPUTS = {
  guideId: 'apple_mobile',
  variant: 'iphone',
  mode: 'return',
  openAt: 'start',
}

function buildOrder(initialOrder, guide, variant) {
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
    deviceOs: guide.id === 'android' ? 'android' : 'ios',
    product: {
      ...initialOrder.product,
      name: variant.title,
      variant: 'Sandbox device · Good',
      category_name: variant.category,
    },
  }
}

export function useResetGuideSandbox(journey) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const setInput = useCallback((key, value) => {
    setInputs((prev) => {
      if (key !== 'guideId') return { ...prev, [key]: value }
      // A new guide starts on its first variant; the mode carries over unless
      // the guide only has one.
      const g = guideById(value)
      return { ...prev, guideId: value, variant: g.variants[0].id }
    })
  }, [])

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), [])

  const guide = guideById(inputs.guideId)
  const variant = variantFor(guide, inputs.variant)
  const order = useMemo(
    () => buildOrder(journey?.initialOrder ?? {}, guide, variant),
    [journey, guide, variant],
  )

  return {
    kind: 'reset_sandbox',
    journey,
    journeys: JOURNEYS,
    guides: RESET_GUIDES,
    inputs,
    setInput,
    reset,
    guide,
    variant,
    single: isSingleMode(guide),
    order,
  }
}
