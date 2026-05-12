# Order Redesign

Internal-demo prototype of the My Account → Orders area for the Revibe
mobile site. Built to evaluate functional and visual changes (additional
shipment statuses, collapsing delivered orders, elevated courier tracking)
before specifying them for production.

## Stack

- React 19 + Vite
- Tailwind CSS 3
- lucide-react for icons
- Inter (Google Fonts) substituted for Graphik

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Where things live

- `src/App.jsx` — page composition.
- `src/components/` — UI components, one per file.
- `src/data/orders.js` — mock orders. Swap for an API call to ship for real.
- `src/lib/statuses.js` — single source of truth for top-level statuses, shipping sub-statuses, header chips, status-banner copy + tone, and the auto-expand rule (`pickActiveOrderId`).
- `public/` — Revibe logo and product image (local copies, not hotlinked).
- `brief/` — source material (screenshots and the design-system reference).
- `docs/my-account-flow.md` — living documentation of how the orders area works (product + engineering audience).
- `CHANGELOG.md` — change history, phase by phase.

## Scope reminder

Functional: the orders list, expand/collapse interactions, status communication, status filter chips, the status banner (with `delayed` and `statusMessage` overrides), the auto-expand-the-active-one rule.

Decorative (visual placeholder, no logic): site-wide search, the date-range dropdown's effect on the list (plumbed but all mock orders fall inside any range), the Revibe Wallet pill (the info tooltip is interactive but the balance is hardcoded), profile menu, language toggle, receipt / claim flows, the in-list "Find items" search field.

See `docs/my-account-flow.md` § "Mocked vs production gap" for the full list of fakes.
