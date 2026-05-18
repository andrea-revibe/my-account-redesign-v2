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

- `src/App.jsx` — page composition; routes each order to one of three cards (`InProgressCard` for created/QC, `OrderCard` for shipped + in-flight cancelled, `PastOrderCard` for delivered + cancelled-past). Also owns the `claimFlowOrderId` entry state for the returns flow overlay.
- `src/components/` — UI components, one per file.
- `src/components/ClaimFlow/` — the seven-step returns flow (launched from `Raise a claim` on delivered past orders). Two wired branches: change of mind and issue/wrong device. See `docs/output/returns/change_of_mind.md` and `docs/output/returns/issue.md`.
- `src/data/orders.js` — mock orders. Swap for an API call to ship for real.
- `src/lib/statuses.js` — single source of truth for top-level statuses, shipping sub-statuses, header chips, status-banner copy + tone, and the auto-expand rule (`pickActiveOrderId`).
- `src/lib/returns.js` — single source of truth for return eligibility, refund math, and formatting helpers used by the returns flow.
- `public/` — Revibe logo and product image (local copies, not hotlinked).
- `brief/` — source material (screenshots and the design-system reference).
- `docs/` — living documentation. Split into `docs/input/` (operational state-machine specs transcribed from drawio source) and `docs/output/` (prototype / UI feature specs). Start at `docs/README.md`.
- `CHANGELOG.md` — change history, phase by phase.

## Scope reminder

Functional: the orders list, expand/collapse interactions, status communication, status filter chips, the status banner (with `delayed` and `statusMessage` overrides), the auto-expand-the-active-one rule, the cancellation bottom sheet, and two returns-flow branches (change of mind, issue/wrong device — all seven steps wired end-to-end, submission is a stub).

Decorative (visual placeholder, no logic): site-wide search, the date-range dropdown's effect on the list (plumbed but all mock orders fall inside any range), the Revibe Wallet pill (the info tooltip is interactive but the balance is hardcoded), profile menu, language toggle, receipt download, the warranty and compensation claim branches (route to a stub note), the in-list "Find items" search field.

Per-feature mocked-vs-production lists in each `docs/output/*.md`.
