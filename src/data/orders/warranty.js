// Warranty mocks, two kinds:
//
//  1. Claim-free delivered orders that exercise the three warranty-coverage
//     tiers on the returns flow's remedy screen (lib/coverage.js). Coverage runs
//     off `placedAt` + the Revibe Care add-on (`warranty`), so these need real
//     order ages — the rest of the mock set is only a few months old and would
//     all resolve to the same tier.
//  2. Layered claim mocks that exercise WarrantyClaimCard heroes (under_repair,
//     ship_back) which in-session submit (always `initiated`) can’t reach.
export const WARRANTY_ORDERS = [
  // ----- Coverage tier: standard + Care, inside the 10-day return window.
  // The full remedy menu — refund, repair under warranty, and the accidental
  // damage arm. The only mock still refund-eligible, so it's also the one that
  // proves the return-window gate on `Return for a refund`.
  {
    id: '89660',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '01/08/2026 10:15 AM',
    placedAtFull: '1 Aug 2026 · 10:15 AM',
    deliveredOn: '2026-08-06',
    deliveredOnLong: 'Thursday, 6 August',
    quantity: 1,
    unitPrice: 1049,
    subtotal: 1049,
    warranty: 85,
    total: 1134,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25194118',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'ios',
    timeline: {
      created: '1 Aug · 10:15 AM',
      quality_check: '2 Aug · 12:40 PM',
      shipped: '4 Aug · 9:05 AM',
      delivered: '6 Aug · 2:20 PM',
    },
    product: {
      name: 'iPhone 15',
      variant: 'Blue · 256 GB · Excellent',
      image: '/iphone-cutout.png',
    },
  },
  // ----- Coverage tier: extended (Revibe Care). 14 months old, so the standard
  // warranty has lapsed and only Care is left. The headline case: no refund
  // (window long closed), repair reads as Revibe Care, accidental damage
  // available.
  {
    id: '89380',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '05/06/2025 11:20 AM',
    placedAtFull: '5 Jun 2025 · 11:20 AM',
    deliveredOn: '2025-06-12',
    deliveredOnLong: 'Thursday, 12 June',
    quantity: 1,
    unitPrice: 1299,
    subtotal: 1299,
    warranty: 110,
    total: 1409,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25188402',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Mastercard', last4: '8821' },
    deviceOs: 'ios',
    timeline: {
      created: '5 Jun · 11:20 AM',
      quality_check: '6 Jun · 3:15 PM',
      shipped: '9 Jun · 10:30 AM',
      delivered: '12 Jun · 4:05 PM',
    },
    product: {
      name: 'iPhone 14 Pro',
      variant: 'Deep Purple · 256 GB · Excellent',
      image: '/iphone-cutout.png',
    },
  },
  // ----- Coverage tier: expired. Past the first year too, but no Revibe Care, so the
  // standard warranty has run out and nothing replaces it. Uncovered devices
  // are out of scope this phase: the remedy screen must look exactly as it does
  // today (no coverage strip, no accidental arm, repair still offered).
  {
    id: '89381',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '18/06/2025 04:40 PM',
    placedAtFull: '18 Jun 2025 · 4:40 PM',
    deliveredOn: '2025-06-25',
    deliveredOnLong: 'Wednesday, 25 June',
    quantity: 1,
    unitPrice: 699,
    subtotal: 699,
    total: 699,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25188655',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'android',
    timeline: {
      created: '18 Jun · 4:40 PM',
      quality_check: '19 Jun · 1:05 PM',
      shipped: '21 Jun · 11:45 AM',
      delivered: '25 Jun · 5:30 PM',
    },
    product: {
      name: 'Samsung Galaxy S22',
      variant: 'Phantom Black · 128 GB · Good',
      image: '/iphone-cutout.png',
    },
  },
  // ----- Layered mock: delivered → warranty claim → at quality check,
  // pre-verdict. The only warranty mock inside the ERD model's span (the
  // rest are past the verdict or parked on the over-cap gate), so it is
  // what exercises WarrantyClaimCard's resolution strip: a device with
  // Revibe, no decision yet, window still open on both bounds.
  {
    id: '89622',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '21/04/2026 10:12 AM',
    placedAtFull: '21 Apr 2026 · 10:12 AM',
    deliveredOn: '2026-04-29',
    deliveredOnLong: 'Wednesday, 29 April',
    quantity: 1,
    unitPrice: 989,
    subtotal: 989,
    total: 989,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25193622',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'ios',
    timeline: {
      created: '21 Apr · 10:12 AM',
      quality_check: '22 Apr · 9:40 AM',
      shipped: '24 Apr · 3:18 PM',
      delivered: '29 Apr · 1:26 PM',
    },
    product: {
      name: 'iPhone 13',
      variant: 'Starlight · 128 GB · Good',
      image: '/iphone-cutout.png',
    },
    claim: {
      claimRef: 'Wq2vTm',
      claimStatusId: 'qc',
      type: 'warranty',
      submittedAt: '18 May 2026 · 10:05 AM',
      milestones: {
        createdAt: '2026-05-18',
        docsClearedAt: '2026-05-18',
        pickedUpAt: '2026-05-20',
        qcAt: '2026-05-25',
        asOf: '2026-05-27',
      },
      units: 1,
      coverage: 'standard',
      cause: 'defect',
      issueDetails: {
        category: 'speaker',
        description:
          'Earpiece speaker crackles on calls at any volume — happens on speakerphone too, so it is not the case.',
        attachmentName: 'VID_0221.mov',
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
        date: 'Wednesday, 20 May',
        slot: '10 AM – 12 PM',
        awb: '25193622',
      },
      timeline: {
        initiated: '18 May · 10:05 AM',
        pickup: '20 May · 11:22 AM',
        qc: '25 May · 10:40 AM',
      },
    },
  },
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
      milestones: {
        createdAt: '2026-05-09',
        docsClearedAt: '2026-05-09',
        pickedUpAt: '2026-05-11',
        qcAt: '2026-05-14',
        decidedAt: '2026-05-14',
        asOf: '2026-05-20',
      },
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
  // ----- Layered mock: delivered → accidental-damage claim → QC priced the
  // repair ABOVE the Revibe Care cap. Parks on `claim.repairQuote` (undecided),
  // which is the only state RepairQuoteCard renders — the sixth takeover. The
  // claim deliberately stays on `qc`: the over-cap gate is a pause, not a
  // pipeline step. In-session submit always lands on `initiated`, so this is the
  // only way to reach the surface outside journey mode.
  //
  // A higher-value device on purpose: with a AED 1,500 cap, a cheap handset
  // makes every over-cap quote read as absurd rather than as a real decision.
  {
    id: '89615',
    phone: '+971 50 559 5034',
    email: 'andrea.grossi@example.com',
    address: 'Ontario Tower, Office 103, Business Bay Dubai',
    country: 'AE',
    placedAt: '12/06/2026 02:10 PM',
    placedAtFull: '12 Jun 2026 · 2:10 PM',
    deliveredOn: '2026-06-18',
    deliveredOnLong: 'Thursday, 18 June',
    quantity: 1,
    unitPrice: 3290,
    subtotal: 3290,
    warranty: 180,
    total: 3470,
    currency: 'AED',
    statusId: 'delivered',
    state: 'close',
    courier: 'DHL Express',
    trackingNumber: '25193615',
    trackingUrl: 'https://www.dhl.com/track',
    customerName: 'Andrea Grossi',
    paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
    deviceOs: 'ios',
    timeline: {
      created: '12 Jun · 2:10 PM',
      quality_check: '13 Jun · 10:05 AM',
      shipped: '15 Jun · 3:20 PM',
      delivered: '18 Jun · 11:40 AM',
    },
    product: {
      name: 'MacBook Air 13″',
      variant: 'Midnight · M2 · 512 GB · Excellent',
      category_name: 'Macbook',
      image: '/iphone-cutout.png',
    },
    claim: {
      claimRef: 'WrQt15',
      claimStatusId: 'qc',
      type: 'warranty',
      submittedAt: '20 Aug 2026 · 9:15 AM',
      milestones: {
        createdAt: '2026-08-20',
        docsClearedAt: '2026-08-20',
        pickedUpAt: '2026-08-22',
        qcAt: '2026-08-26',
        decidedAt: '2026-08-28',
        asOf: '2026-08-28',
      },
      units: 1,
      remedy: 'accidental',
      // Raised inside the first year, so the standard warranty is still live —
      // but damage the customer caused is only ever Revibe Care's to answer.
      coverage: 'standard',
      cause: 'accidental',
      accidentalAck: true,
      issueScope: 'not_working',
      issueSubtypeId: 'screen',
      issueDetails: {
        description:
          'Knocked it off the desk with the lid open — the screen is cracked corner to corner and the lid no longer sits flush.',
        attachmentName: 'IMG_0908.jpg',
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
        date: 'Friday, 22 August',
        slot: '10 AM – 12 PM',
        awb: '25193615',
      },
      timeline: {
        initiated: '20 Aug · 9:15 AM',
        pickup: '22 Aug · 10:48 AM',
        qc: '26 Aug · 2:05 PM',
      },
      // Priced above the AED 1,500 accidental cap, so Revibe Care can't absorb
      // the whole job. Numbers mirror `repairQuoteSplit(order, 2450)` — kept
      // literal here because mocks are data, but they must agree with the
      // helper or the card and the journey would tell different stories.
      repairQuote: {
        total: 2450,
        cap: 1500,
        covered: 1500,
        excess: 950,
        overCap: true,
        summary: 'Display assembly and top case replacement',
        quotedAt: '28 Aug · 11:20 AM',
        deadline: '2026-09-02',
        deadlineLabel: 'Respond by Wed, 2 Sep',
        paidAt: null,
        declinedAt: null,
      },
      actionRequired: {
        kind: 'repair_over_cap',
        deadline: '2026-09-02',
        deadlineLabel: 'Respond by Wed, 2 Sep',
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
      milestones: {
        createdAt: '2026-04-28',
        docsClearedAt: '2026-04-28',
        pickedUpAt: '2026-04-30',
        qcAt: '2026-05-04',
        decidedAt: '2026-05-05',
        asOf: '2026-05-18',
      },
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
      milestones: {
        createdAt: '2026-05-25',
        docsClearedAt: '2026-05-25',
        pickedUpAt: '2026-05-28',
        qcAt: '2026-06-01',
        decidedAt: '2026-06-01',
        asOf: '2026-06-13',
      },
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
