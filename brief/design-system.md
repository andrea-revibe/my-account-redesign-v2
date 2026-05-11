# Design System Reference

> Updated during phase-1 prototype build. Values that were missing or
> looked incorrect in the source dump are flagged with `// noted:`.

## Fonts

- Body font: Graphik (prototype substitute: **Inter**)
- Heading font: Graphik (prototype substitute: **Inter**)
- Button font: Graphik (prototype substitute: **Inter**)

## Font sizes (in pixels)

- Body text: 14px
- Small/secondary text: 12px
- Page heading: 20px
- Section heading: 14px
- Button label: 14px

## Colors (hex / rgb)

- Page background: `#FFFFFF` // noted: source said rgb(33,43,54) but the
  screenshots clearly show a near-white page; the dark slate is the
  primary text colour.
- Card / container background: `#FFFFFF`
- Primary text: `rgb(33, 43, 54)`
- Secondary text: `rgb(167, 169, 171)`
- Brand primary (CTA background): `transparent` for most actions in the
  source app (outlined buttons). Phase 2 introduces one filled brand
  button on the `CourierBanner` "Track order" CTA — deliberate
  deviation, see Notes.
- Brand primary text / fill: `rgb(80, 25, 160)`
- Success / delivered green: `rgb(0, 182, 122)`
- In-progress / shipped: `rgb(255, 153, 31)` // noted: not present in the
  source dump; chosen to match the orange chip on the "Close" pill so the
  shipped step reads as in-progress.
- Border / divider: `rgb(192, 192, 192)`
- Link colour: `rgb(26, 13, 171)`
- Promo bar / chat FAB accent: `rgb(217, 26, 122)` (magenta)
- Search field background: `rgb(244, 240, 250)` (light lilac)
- "Close" chip background / text: `rgb(255, 213, 153)` / `rgb(180, 95, 6)`
- "Cancelled" text: `rgb(220, 38, 38)`

## Spacing & shape

- Card border-radius: 16px
- Button border-radius: 8px
- Common padding inside cards: 16px
- Common gap between sections: 8px
- Card box-shadow: none in app; using a 1px `rgb(192,192,192)` border at
  ~60% opacity to define edges. // noted

## Buttons

- Height: 36px (primary CTA), 40px (full-width brand actions)
- Horizontal padding: 12px
- Font weight: 700
- Hover/pressed: not specified in source — prototype uses Tailwind defaults.
- Secondary button: outlined, `rgb(192,192,192)` border, muted text. // noted

## Icons

- Source: lucide-react in the prototype (visually close to the source app's
  outlined icon set). Logo and product image kept as local copies in `public/`.
- Common icon size: 18–22px
- Stroke width: 1.75–2

## Existing order states (faithful recreation reference)

Top-level progression statuses (horizontal timeline, always 4 steps):

- Order created
- At quality check
- Shipped
- Delivered

Shipping sub-statuses (vertical sub-timeline, only while top status is
`shipped`):

- Arrived in destination country
- Cleared customs
- Forwarded to third-party agent
- Out for delivery

Note: there is intentionally no "delivered" sub-status — when the package
is delivered, the order transitions to the top-level Delivered stage.

Header / summary states (chips and labels):

- Open (no chip)
- Close — orange chip on the order header
- Cancelled — red text in the order summary; auto-collapses the card

Phase-2+ candidates noted but not yet wired: Returned, Refunded, Out for
delivery time-window pickers.

## Notes / oddities

- The order card uses inline expand/collapse rather than a navigation
  push. The whole collapsed-card header is the tap target; the chevron is
  decorative.
- The collapsed card carries a Noon-style summary header — status icon
  + headline + state chip + product image with price + order ID — so
  customers can scan the list without expanding anything.
- The horizontal status timeline fills reached steps with brand purple
  (circles + 2px connectors). The current step's label is bold; future
  steps are outlined and gray. This is a deliberate departure from the
  source app, where all four circles look uniform.
- A vertical shipping sub-timeline appears under the horizontal timeline
  only while `statusId === 'shipped'`. It carries four DHL sub-statuses:
  arrived in destination country, cleared customs, forwarded to
  third-party agent, out for delivery.
- `CourierBanner` is the only filled brand-purple CTA in the app — used
  on the "Track order" button to make the action stand out, since
  elevating tracking visibility was a phase-2 goal.
- The chat FAB is anchored to the mobile frame (not the viewport), so on
  desktop preview it sits inside the 430px-wide column.
