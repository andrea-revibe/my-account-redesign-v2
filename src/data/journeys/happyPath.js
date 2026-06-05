
// ----- Happy-path journey -----------------------------------------------
// Default journey: order placed → QC → shipped (4 sub-statuses) → delivered.
// No branches, no cancellation, no claim.
export const HAPPY_PATH_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    apply: (o) => o,
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    apply: (o) => ({
      ...o,
      statusId: 'quality_check',
      timeline: { ...o.timeline, quality_check: '21 May · 9:18 AM' },
    }),
  },
  {
    id: 'shipped_arrived_destination',
    label: 'Arrived in destination country',
    trigger: 'system',
    event: 'shipment.arrived_destination',
    apply: (o) => ({
      ...o,
      statusId: 'shipped',
      subStatusId: 'arrived_destination',
      courier: 'DHL Express',
      trackingNumber: '25193399',
      trackingUrl: 'https://www.dhl.com/track',
      timeline: { ...o.timeline, shipped: '23 May · 11:02 AM' },
      subTimeline: {
        ...(o.subTimeline ?? {}),
        arrived_destination: '24 May · 8:30 AM',
      },
    }),
  },
  {
    id: 'shipped_cleared_customs',
    label: 'Cleared customs',
    trigger: 'system',
    event: 'shipment.cleared_customs',
    apply: (o) => ({
      ...o,
      subStatusId: 'cleared_customs',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        cleared_customs: '24 May · 11:15 AM',
      },
    }),
  },
  {
    id: 'shipped_forwarded_to_agent',
    label: 'Forwarded to third-party agent',
    trigger: 'system',
    event: 'shipment.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      subStatusId: 'forwarded_to_agent',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        forwarded_to_agent: '24 May · 4:45 PM',
      },
    }),
  },
  {
    id: 'shipped_out_for_delivery',
    label: 'Out for delivery',
    trigger: 'system',
    event: 'shipment.out_for_delivery',
    apply: (o) => ({
      ...o,
      subStatusId: 'out_for_delivery',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        out_for_delivery: '25 May · 7:30 AM',
      },
    }),
  },
  {
    id: 'delivered',
    label: 'Delivered',
    trigger: 'system',
    event: 'shipment.delivered',
    apply: (o) => ({
      ...o,
      statusId: 'delivered',
      state: 'close',
      subStatusId: null,
      timeline: { ...o.timeline, delivered: '25 May · 3:14 PM' },
      deliveredOn: '2026-05-25',
      deliveredOnLong: 'Monday, 25 May',
    }),
  },
]
