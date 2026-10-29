# Brick By Brick: frontend

Construction management for construction and real-estate firms: projects and sites, stock,
equipment, staff, invoices and property sales in one place. Built for Nigeria first (naira, Lagos
time), and for phones on site as well as desktops in the office.

This repository is the web app. The API is
[brick-by-brick-backend](https://github.com/amgoni/brick-by-brick-backend) (Node, Express,
TypeScript), which is being built step by step. Until an area's endpoints exist there, its screens
run on a stand-in API inside this app that serves data in the same shape.

## Status

- **Built:** the dashboard; Projects & sites (the project list, and a page per project with
  overview, schedule, daily reports, budget and team); Inventory (stock on hand, material
  requests, purchase orders with a new-order form, and stock movements); Invoices (the list,
  payments and reminders, the invoice builder, and a print page that saves as a PDF).
- **Placeholder pages:** suppliers, equipment, staff, reports, properties, clients, documents,
  users and roles, settings.
- **Not started:** sign-in, and the mobile field app.

The designs are a Claude Design export kept locally in `notes/`, which isn't in the repository.

## Running it

You need Node.js 22.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Worth a look: `/` (the dashboard), `/projects`, `/invoices`, and
`/kitchen-sink`, which shows every design token and component in both themes.

The stand-in API needs no setup. To see slow or failing requests, copy `.env.example` to
`.env.local` and set `MOCK_LATENCY_MS` (the average delay per request) or `MOCK_FAILURE_RATE` (the
share of requests that fail, from 0 to 1).

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Development server                          |
| `npm run build`        | Production build                            |
| `npm start`            | Serves the production build                 |
| `npm run lint`         | ESLint                                      |
| `npm run type-check`   | Generates route types, then runs TypeScript |
| `npm run format`       | Formats everything with Prettier            |
| `npm run format:check` | Checks formatting without changing files    |

Keep `lint`, `type-check` and `format:check` passing.

## How it fits together

Every screen gets its data the same way: it calls a hook in `lib/queries/` (TanStack Query), which
calls a function in `lib/api/`, which requests `/api/…`. Today `/api` is answered by `mocks/`, an
Express-shaped router with seed data; later it will pass requests on to the real API.
`lib/api/types.ts` is the contract both sides follow.

Pages are prerendered as static HTML, and their data loads in the browser.

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript, TanStack
Query, Radix UI and zustand.

The folder layout, the design-system rules and the conventions that catch people out are in
[AGENTS.md](AGENTS.md).
