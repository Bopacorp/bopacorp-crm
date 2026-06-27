# Overview Module — Gap Analysis

Audited: 2026-06-27
Updated: 2026-06-27

Route: `/overview` (all authenticated users)
File: `src/modules/overview/pages/OverviewPage.tsx`

## What Overview does now

- 4 KPI cards: first 2 dynamic states + clients visited + avg days to close
- FunnelChart (recharts BarChart): all negotiation states dynamically from `stateCounts`, colors cycle `--chart-1` to `--chart-5`
- ActivityFeed: recent state changes + visits via `GET /reports/recent-activity`, scrollable, icons per type
- Advisor metrics table: dynamic state columns + visited + billed + avg per service + days to close
- Date range filter (from/to) with clear button
- Row click → AdvisorDetailSheet with per-state KPI cards + visited + avg days to close + billing summary (scrollable)
- Role-based scoping:
  - **Management (admin/manager/coordinator)**: sees all advisors
  - **Supervisor**: sees only supervised advisors (via `supervisorId` API filter)
  - **Advisor**: sees own metrics only, no table, activity feed scoped to self
- All strings via `useTranslation()` — no hardcoded Spanish
- Data sources: `GET /reports/advisor-metrics` (dynamic `stateCounts`), `GET /reports/recent-activity`

## Requirements assigned to Overview

| Req | Description | Status | Notes |
|-----|-------------|--------|-------|
| RF-CRM-015 | Supervisor view recent activity of ALL advisors | **Done** | `ActivityFeed` component using `GET /reports/recent-activity` |
| RF-CRM-016 | Per advisor: contacted, visited, closed | **Done** | Dynamic state columns in table |
| RF-CRM-017 | Total billed + avg revenue per service per advisor | **Done** | `totalBilledAmount`, `averageBillingPerService` |
| RF-CRM-018 | Clients per funnel stage per advisor | **Done** | HU-CRM-018 defines this as funnel view. `FunnelChart` + dynamic table columns from `stateCounts`. Note: RF text mentions "terminals/equipment" but HU contradicts — HU prioritized |
| RF-CRM-019 | Clients per funnel stage per advisor | **Done** | Dynamic `stateCounts` covers all states including custom ones |
| RF-REP-003 | Key metrics: sales, closures, visits, avg negotiation time | **Done** | `avgDaysToClose` KPI card + table column. Computed from `negotiation_state_history` in backend |
| RF-REP-008 | Bar charts, line graphs, KPI indicators | **Done** | `FunnelChart` (recharts BarChart) + 4 KPI cards |
| RF-REP-010 | Advisor sees OWN performance | **Done** | Advisors access `/overview` with role-based filtering. Sidebar link visible to all roles |

## Remaining gaps

### 1. Equipment/terminals (RF-CRM-018 — RF text only)

- RF table text mentions "terminals and equipment sold per advisor (count + value)"
- HU-CRM-018 user story says "view clients at each stage of sales funnel" — contradicts RF
- HU interpretation implemented. If equipment tracking needed: requires new DB table, API endpoint, CRM display
- **Deferred** — no data model exists

## Completed work

- ~~Dead code~~ — `src/modules/dashboard/` deleted
- ~~Activity feed~~ — `ActivityFeed` component + `useRecentActivity` hook + `listRecentActivity` service
- ~~Average negotiation time~~ — `avgDaysToClose` from backend, KPI card + column
- ~~Charts~~ — `FunnelChart` with dynamic states, custom tooltip formatter
- ~~Advisor self-dashboard~~ — Role-based scoping in `OverviewPage`, removed `ManagementOnly` guard
- ~~Supervisor scoping~~ — `supervisorId` filter on API call
- ~~i18n~~ — All strings via `t()`, keys in `es.json` + `en.json`

## API summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/reports/advisor-metrics` | GET | authenticated | Dynamic `stateCounts` array per advisor + visited + billing + avgDaysToClose. Supports `dateFrom`/`dateTo`/`supervisorId` |
| `/reports/recent-activity` | GET | authenticated | Paginated union of state changes + visits. Supports `advisorId`/`dateFrom`/`dateTo`/`sortOrder` |
| `/reports/targets` | GET | `sales_targets.read` | List active tier configs |
| `/reports/targets/:id` | PUT | `sales_targets.update` | Edit tier thresholds (manager) |
| `/reports/advisor-performance` | GET | `report_exports.read` | Per-advisor tier performance breakdown |
| `/reports/exports` | GET/POST | `report_exports.*` | CRUD for report export records (metadata only) |
