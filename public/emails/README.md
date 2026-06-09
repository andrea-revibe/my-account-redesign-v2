# Email screenshots

Drop real Revibe email renders here. The journey-mode notification panel
(`JourneyNotificationPanel`) makes the Email preview tappable and opens the
matching file full-size in a lightbox. Until a file exists, the lightbox shows
a "coming soon" placeholder naming the exact path — paths are already wired, so
just add the images.

Files are organised by domain, mirroring the notification content files in
`src/data/notifications/`. Each path is set as `email.screenshot` on the event
there and served at the site root (e.g. `/emails/shipment/shipped.png`):

```
public/emails/
  orders/      ← order.* lifecycle (placed, quality check, cancellation, refund)
  shipment/    ← shipment.* outbound delivery leg
  claims/      ← claim.* returns / issue / warranty / compensation
```

Currently wired (happy path):

| Step (event) | File |
|---|---|
| Order placed (`order.created`) | `orders/order-confirmed.png` |
| Quality check started (`order.quality_check.started`) | `orders/quality-check.png` |
| Shipped (`shipment.arrived_destination`) | `shipment/shipped.png` |
| Out for delivery (`shipment.out_for_delivery`) | `shipment/out-for-delivery.png` |
| Delivered (`shipment.delivered`) | `shipment/delivered.png` |

Use a tall full-email screenshot (PNG or JPG) — the lightbox scales to width and
scrolls vertically. To add a step: set its `email.screenshot` path in the
matching `src/data/notifications/<domain>.js` entry and drop the file in the
mirrored folder here.
