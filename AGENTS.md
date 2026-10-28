<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Brick By Brick: frontend

Construction management for construction and real-estate firms, Nigeria first (₦, Lagos time).
Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript (strict, `noUncheckedIndexedAccess`).
The backend (`../bbb-backend`: Node, Express, TypeScript) is being built from scratch; until a
module's endpoints exist, its screens run on mock data shaped like the future API.

## Commands

`npm run dev` · `build` · `start`. Keep `type-check`, `lint` and `format:check` green.

## Structure (no `src/`)

```
app/                    routes and layouts; globals.css holds the design tokens
app/(app)/              everything inside the app shell (route group: adds nothing to URLs)
app/api/[...path]/      the mock backend's entry point (becomes a proxy to Express later)
app/kitchen-sink/       every token and primitive in both themes: check design-system changes here
components/ui/          primitives, shadcn-style: one family per file, data-slot attrs, cn(), cva, Radix
components/charts/      ColumnChart, StackedBar, GanttChart (built to the dataviz skill's spec)
components/data/        QueryBoundary
components/layout/      app shell: sidebar nav, top bar, mobile nav, menus, command palette
components/approvals/   approve / reject buttons and the confirm dialog, shared by every module
components/<module>/    a module's screens and vocabulary (dashboard/, projects/, inventory/, …)
hooks/                  client hooks (theme, media query, hotkey, debounce, isMac, stored state)
lib/api/                the API contract (types.ts), the HTTP client, one file of calls per area
lib/queries/            TanStack Query: query keys, options and hooks per area
lib/                    cn.ts, csv.ts, format.ts, nav.ts, theme.ts, utils.ts
mocks/                  the stand-in backend: Express-shaped router, routes, seed data
store/                  zustand, for UI state only (the command palette, the purchase order drawer)
```

## Data

- The flow is: screen → hook in `lib/queries/` → call in `lib/api/` → `apiFetch` → `/api/*`.
  Today `/api/*` is answered by `mocks/`; later it reaches Express. Screens never import mocks.
- `lib/api/types.ts` is the contract the backend will implement. Dates are ISO strings, ids are
  opaque strings, money is naira numbers until the money-format decision is made.
- Fetched data renders inside a `QueryBoundary` (skeleton fallback, error state with retry,
  browser-only), and components read it with the `useSuspenseQuery` hooks, so they never branch
  on loading or errors themselves. Keep static chrome (titles, labels) outside the boundary so
  it's in the prerendered HTML.
- Anything that reads the clock or browser state goes in `BrowserOnly` (or a QueryBoundary).
  Cache Components fails the build on a clock read during prerender.
- Several queries in one component: `useSuspenseQueries`. Consecutive `useSuspenseQuery` calls
  run one after another, because each suspends before the next starts.
- Small collections (projects: tens, not thousands) load whole and filter in the browser. Long
  ones (stock, invoices) will filter and page on the server.
- Exports are CSV built in the browser (`lib/csv.ts`) from raw values: naira, ISO dates.
- Low-stakes writes are optimistic (notifications read). Decisions (approve / reject) wait for the
  server, with `components/approvals/decision.tsx`; ones that commit money confirm first.
  Anything that changes what's waiting for approval calls `refreshApprovalCounts`.
- The server decides what a client could get wrong or fake: numbers (PO-2026-0234), totals,
  who did it, whether it needs approval. Creates answer `201` with a `Location` header.
- `MOCK_LATENCY_MS` and `MOCK_FAILURE_RATE` (see `.env.example`) exercise loading and error states.

## Forms

- The draft holds strings, as typed. A module's rule functions (pure, e.g.
  `components/inventory/purchase-order-rules.ts`) check it on every submit and build the request
  body. Blank optional fields are left out of the body, never sent as `""`.
- Controls stop bad input first: a `Select` for anything with a fixed set of values (options
  from the API), `NumberInput` / `MoneyInput` for numbers (they refuse letters), date inputs
  bounded with `min`/`max`, `maxLength` on text.
- A field's error shows under it (`Field`'s `error`) and clears as it's edited; on a failed
  submit focus moves to the first one (`focusFirstInvalid`). When the server refuses, its message
  shows in an `Alert` above the buttons. Field-by-field server errors wait on the backend's
  error format.
- A drawer that opens from anywhere (the new purchase order) is mounted in the app shell and
  opened through `store/ui.store.ts`.

## Design system

- Source of truth is the Foundations board of the Claude Design export in `notes/` (gitignored).
  Translate a board's layout and intent; build it from our primitives and tokens, not its markup.
- Tokens only. Tailwind's palette, type scale and shadows are reset: use the semantic classes
  (`bg-surface`, `text-ink-2`, `border-line-strong`, `text-success`, `bg-data`…). Primitives don't
  use `dark:`; tokens already switch, and `[data-theme]` can scope a subtree to either theme.
- Outline first. One `variant="primary"` button per screen (Button defaults to outline). Badges
  always carry a label. `tabular-nums` where numbers line up in a column (tables, axes, legends);
  proportional digits on a lone headline figure. `font-mono` for codes.
- Charts: load the dataviz skill first. One data colour (`bg-data`, tints validated with the
  skill's palette script), solid hairline grids, a legend for 2+ series, and a table view or
  legend that carries every value, so nothing is hover-only.
- A wide table becomes a list below `md:` (see the dashboard's Active projects), switched in CSS.
- Tabs that are pages (a project's Overview, Schedule, Budget) are routes under a shared layout,
  with `TabNav`. Radix `Tabs` is for panels within one page.
- Controls use `h-control` / `h-control-sm`: 44px under 860px, 38px / 32px above. `md:` is 860px.
- Type scale (custom): 2xs 11 · xs 12 · sm 12.5 · md 13.5 (controls) · base 14 (body) · lg 16 ·
  xl 18 · 2xl 20 · 3xl 24 (page title) · 4xl 28 · 5xl 44.
- A new custom theme key (spacing, shadow, container…) must also be registered in `lib/cn.ts`, or
  tailwind-merge can't resolve conflicts and call-site overrides silently lose.
- Format money, numbers and dates only through `lib/format.ts`. It pins en-NG and Africa/Lagos so
  the server and the browser render the same text (anything else is a hydration error).

## Conventions that bite

- Cache Components is on. A Server Component can't read the clock while prerendering: pass `now`
  to the date helpers. Reading `cookies()` in a layout makes every route beneath it dynamic.
- Dynamic segments (`/projects/[id]`) have no `generateStaticParams`: the ids live behind the
  API, so the build prerenders one shell for every id. While it does, `usePathname` and
  `useParams` suspend, so call them only inside Suspense (BrowserOnly or a QueryBoundary) or the
  build fails, even from a layout (see `SidebarNav`, `ProjectTabs`, `useProjectId`).
- Navigation keeps recent pages mounted (`<Activity>`), so state survives a round trip. Close
  transient UI (menus, popovers) when a page is hidden; see Next's "Preserving UI state" guide.
- Exact-pinned dependencies (`.npmrc` has `save-exact`), and no version published in the last
  two weeks.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
