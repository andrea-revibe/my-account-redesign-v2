// Warranty-claim mocks — hand-seeded to exercise WarrantyClaimCard heroes
// (under_repair, ship_back) that in-session submit (always `initiated`) can’t reach.
export const WARRANTY_ORDERS = [
  // ----- Layered mock: delivered → warranty claim → under repair.
  // Exercises the WarrantyClaimCard's `under_repair` hero: brand-tone
  // headline, Wrench-iconed repair-window strip. No takeover cards
  // involved — warranty's happy path doesn't block on the customer
  // between pickup and device_returned.
  {
    id: '89610',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '14/04/2026 09:24 AM',
    placedAtFull: '14 Apr 2026 · 9:24 AM',
    deliveredOn: '2026-04-24',
    deliveredOnLong: 'Friday, 24 April',
    quantity: 1,
    unitPrice: 1149,
    subtotal: 1149,
    warranty: 95,
    total: 1244,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25193601',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'ios',
    timeline: {
      created: '14 Apr · 9:24 AM',
      quality_check: '15 Apr · 11:18 AM',
      shipped: '18 Apr · 4:42 PM',
      delivered: '24 Apr · 10:50 AM',
    },
    product: {
      name: 'iPhone 14',
      variant: 'Midnight · 256 GB · Excellent',
      image: '/iphone-cutout.png',
    },
    claim: {
      claimRef: 'Wr8nQp',
      claimStatusId: 'under_repair',
      type: 'warranty',
      submittedAt: '09 May 2026 · 8:42 AM',
      units: 1,
      issueDetails: {
        category: 'charging_port',
        description:
          'Charging port stopped recognising the cable after three weeks of use — needs to be wiggled to connect and drops mid-charge.',
        attachmentName: 'IMG_0710.jpg',
      },
      reason: { value: 'other', otherText: '' },
      devicePrep: { option: 'reset', os: 'ios' },
      pickupDetails: {
        address: 'Ontario Tower, Office 103, Business Bay Dubai',
        email: 'andrea.grossi@example.com',
        phone: '+971 50 559 5034',
      },
      scheduledPickup: {
        courier: 'DHL Express',
        date: 'Monday, 11 May',
        slot: '10 AM – 12 PM',
      },
      timeline: {
        initiated: '9 May · 8:42 AM',
        pickup: '11 May · 11:05 AM',
        qc: '14 May · 9:30 AM',
        under_repair: '14 May · 2:12 PM',
      },
      repairWindow: {
        expectedComplete: 'Sun, 24 May',
        expectedCompleteLong: 'Sunday, 24 May',
        note: 'Charging-port assembly swap — typically wraps up within 7–10 days.',
      },
    },
  },
  // ----- Layered mock: delivered → warranty claim → repair complete →
  // device on its way back, currently in transit. Exercises the
  // WarrantyClaimCard's `ship_back` hero (brand-gradient ETA, courier
  // strip) and the pre-expanded inverse-journey dropdown driven by
  // claim.shipBack.subStatusId + subTimeline.
  {
    id: '89580',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '08/04/2026 02:50 PM',
    placedAtFull: '8 Apr 2026 · 2:50 PM',
    deliveredOn: '2026-04-16',
    deliveredOnLong: 'Thursday, 16 April',
    quantity: 1,
    unitPrice: 879,
    subtotal: 879,
    warranty: 80,
    total: 959,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25193558',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Mastercard', last4: '8210' },
    deviceOs: 'android',
    timeline: {
      created: '8 Apr · 2:50 PM',
      quality_check: '10 Apr · 9:14 AM',
      shipped: '13 Apr · 5:38 PM',
      delivered: '16 Apr · 11:42 AM',
    },
    product: {
      name: 'Samsung Galaxy S22',
      variant: 'Phantom Black · 128 GB · Good',
      image: '/iphone-cutout.png',
    },
    claim: {
      claimRef: 'Sx2kLp',
      claimStatusId: 'ship_back',
      type: 'warranty',
      submittedAt: '28 Apr 2026 · 4:10 PM',
      units: 1,
      issueDetails: {
        category: 'speaker',
        description:
          'Earpiece speaker started crackling on calls — sounds fine on speakerphone but unusable for voice calls.',
        attachmentName: 'VID_0118.mov',
      },
      reason: { value: 'other', otherText: '' },
      devicePrep: {
        option: 'credentials',
        os: 'android',
        accountUnlinked: true,
        passcode: '••••48',
      },
      pickupDetails: {
        address: 'Ontario Tower, Office 103, Business Bay Dubai',
        email: 'andrea.grossi@example.com',
        phone: '+971 50 559 5034',
      },
      scheduledPickup: {
        courier: 'DHL Express',
        date: 'Thursday, 30 April',
        slot: '9 AM – 11 AM',
      },
      timeline: {
        initiated: '28 Apr · 4:10 PM',
        pickup: '30 Apr · 10:12 AM',
        qc: '4 May · 9:48 AM',
        under_repair: '5 May · 1:30 PM',
        ship_back: '17 May · 11:05 AM',
      },
      shipBack: {
        courier: 'DHL Express',
        awb: '25193620',
        estimatedDelivery: 'May 22',
        estimatedDeliveryLong: 'Friday, 22 May',
        // Outbound-style milestones — same labels as a normal outgoing
        // order (SHIPPING_SUB_STATUSES in lib/statuses.js).
        subStatusId: 'forwarded_to_agent',
        subTimeline: {
          arrived_destination: '18 May · 8:30 AM',
          cleared_customs: '19 May · 11:15 AM',
          forwarded_to_agent: '19 May · 4:45 PM',
        },
      },
    },
  },
  // ----- Layered mock: delivered → warranty claim → repaired → device back
  // with the customer. Exercises the WarrantyClaimCard's terminal
  // `device_returned` hero (ReturnedStrip) and — the point of this mock —
  // the "Verified by NSYS" chip re-appearing under the product row for the
  // returned/repaired unit (fresh claim.shipBack.conditionReport). Mirrors
  // the journey's claim_device_returned terminal shape (last transit
  // sub-status + deliveredOn). Lands in Past via isWarrantyDelivered.
  {
    id: '89568',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '02/04/2026 11:20 AM',
    placedAtFull: '2 Apr 2026 · 11:20 AM',
    deliveredOn: '2026-04-10',
    deliveredOnLong: 'Friday, 10 April',
    quantity: 1,
    unitPrice: 999,
    subtotal: 999,
    warranty: 90,
    total: 1089,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25193568',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'ios',
    timeline: {
      created: '2 Apr · 11:20 AM',
      quality_check: '4 Apr · 10:02 AM',
      shipped: '7 Apr · 3:30 PM',
      delivered: '10 Apr · 12:15 PM',
    },
    product: {
      name: 'iPhone 13',
      variant: 'Blue · 128 GB · Excellent',
      image: '/iphone-cutout.png',
    },
    claim: {
      claimRef: 'Wr5tGh',
      claimStatusId: 'device_returned',
      type: 'warranty',
      submittedAt: '25 May 2026 · 4:02 PM',
      units: 1,
      issueDetails: {
        category: 'battery',
        description:
          'Battery drained unusually fast and the phone ran hot during calls — replaced under warranty.',
        attachmentName: 'IMG_0733.jpg',
      },
      reason: { value: 'other', otherText: '' },
      devicePrep: { option: 'reset', os: 'ios' },
      pickupDetails: {
        address: 'Ontario Tower, Office 103, Business Bay Dubai',
        email: 'andrea.grossi@example.com',
        phone: '+971 50 559 5034',
      },
      scheduledPickup: {
        courier: 'DHL Express',
        date: 'Wednesday, 27 May',
        slot: '10 AM – 12 PM',
        awb: '25193560',
        awbUrl: '/awb-document.pdf',
      },
      timeline: {
        initiated: '25 May · 4:02 PM',
        pickup: '28 May · 10:14 AM',
        qc: '1 Jun · 9:30 AM',
        under_repair: '1 Jun · 2:12 PM',
        ship_back: '10 Jun · 11:05 AM',
        device_returned: '12 Jun · 3:14 PM',
      },
      shipBack: {
        courier: 'DHL Express',
        awb: '25193620',
        estimatedDelivery: 'Jun 12',
        estimatedDeliveryLong: 'Friday, 12 June',
        deliveredOn: '2026-06-12',
        deliveredOnLong: 'Friday, 12 June',
        subStatusId: 'out_for_delivery',
        subTimeline: {
          arrived_destination: '10 Jun · 8:30 AM',
          cleared_customs: '11 Jun · 11:15 AM',
          forwarded_to_agent: '11 Jun · 4:45 PM',
          out_for_delivery: '12 Jun · 7:30 AM',
        },
        // Fresh NSYS condition report for the repaired unit we sent back.
        conditionReport: {
          url: 'https://www.nsys.com/',
          reportId: 'NSYS-WAR-89568-R1',
        },
      },
    },
  },
]
