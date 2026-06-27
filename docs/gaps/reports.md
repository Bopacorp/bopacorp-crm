# Reports Module — Gap Analysis

Audited: 2026-06-27

Route: `/reportes` (NOT in sidebar — hidden from users)
File: `src/modules/reports/pages/ReportsPage.tsx`

## What Reports does now

- SectionHeader with "Generar reporte" button (does nothing)
- Two tabs: Objetivos, Exportaciones
- Objetivos tab: 3 KPI cards hardcoded to "0%", empty card saying "No hay objetivos configurados"
- Exportaciones tab: FilterBar + EmptyState. Uses local `ReportExport` interface, NOT shared schema
- **Zero API calls** — no hooks, no service calls. Completely static shell

## Requirements assigned to Reports

These requirements describe **historical analysis, comparison, and export** — the deep-dive complement to Overview.

| Req | Description | Status | Notes |
|-----|-------------|--------|-------|
| RF-REP-001 | Generate performance reports by advisor/month/period | **Shell** | UI exists but no data fetching |
| RF-REP-002 | Supervisor generate sales/closure reports filtered by date/type/zone | **Missing** | No supervisor-scoped view |
| RF-REP-004 | Supervisor view operational metrics of their advisors | **Missing** | No supervisor filtering |
| RF-REP-005 | Compare advisor performance vs objectives | **Shell** | Objetivos tab exists but hardcoded zeros. API fully implemented |
| RF-REP-006 | Manager export reports PDF/Excel | **Shell** | Download button exists but no functionality |
| RF-REP-007 | Supervisor export reports PDF/Excel | **Missing** | Same as above |
| RF-REP-009 | Restrict reports access by role | **Done** | `RequirePermission permission="report_exports.read"` on route |

## Gaps to close

### 1. Wire up Objetivos tab (RF-REP-005)

- API fully built: `GET /reports/objectives` with pagination + filters (advisorId, periodStart, periodEnd)
- Shared schemas: `SalesObjectiveResponseSchema`, `ListSalesObjectivesQuerySchema`
- **CRM work**:
  - Add service functions: `listObjectives`, `createObjective`, `updateObjective`, `deleteObjective`
  - Add hook: `useSalesObjectives`
  - Wire Objetivos tab: table of objectives with advisor, target amount, target deals, period
  - Add create/edit dialog for objectives
  - Show actual vs target comparison (needs advisor-metrics data merged with objectives)

### 2. Wire up Exportaciones tab (RF-REP-006/007)

- API stores export metadata: `GET /reports/exports`, `POST /reports/exports`
- BUT API does NOT generate files — only stores records (filename, path, size, mimeType)
- **Options**:
  - A) Client-side export: use jspdf + xlsx libraries to generate PDF/Excel from advisor-metrics data
  - B) Server-side: add file generation endpoint that creates the file and returns download URL
  - Recommendation: **Option A** for MVP — client-side is simpler, no infra changes
- **CRM work**:
  - Replace local `ReportExport` interface with shared schema
  - Add service + hook for exports list
  - Implement client-side PDF/Excel generation from metrics data
  - After generating, POST metadata to `/reports/exports` for history

### 3. Add to sidebar navigation

- `/reportes` route exists but no sidebar link
- Add nav item under management section with BarChart3 icon
- Permission gate: `report_exports.read`

### 4. Supervisor scoping (RF-REP-002/004)

- Current advisor-metrics endpoint returns ALL advisors
- Supervisor should see only advisors under their supervision
- **API work**: Add `supervisorId` filter to `listAdvisorMetrics` query
- Use `advisor_supervisors` relationship table to filter
- **CRM work**: Auto-filter by current user when role is supervisor

## API endpoints available (all functional)

| Endpoint | Method | Description | CRM usage |
|----------|--------|-------------|-----------|
| `GET /reports/objectives` | GET | List sales objectives (paginated) | **Not used** |
| `GET /reports/objectives/:id` | GET | Get objective by ID | **Not used** |
| `POST /reports/objectives` | POST | Create sales objective | **Not used** |
| `PUT /reports/objectives/:id` | PUT | Update sales objective | **Not used** |
| `DELETE /reports/objectives/:id` | DELETE | Delete sales objective | **Not used** |
| `GET /reports/exports` | GET | List report exports (paginated) | **Not used** |
| `GET /reports/exports/:id` | GET | Get export by ID | **Not used** |
| `POST /reports/exports` | POST | Create export record | **Not used** |
| `GET /reports/advisor-metrics` | GET | Advisor performance metrics | Used by Overview only |

## Shared schemas available (all unused in CRM)

- `SalesObjectiveResponseSchema` / `SalesObjectiveListItemResponseSchema`
- `ReportExportResponseSchema` / `ReportExportListItemResponseSchema`
- `CreateSalesObjectiveRequestSchema` / `UpdateSalesObjectiveRequestSchema`
- `ListSalesObjectivesQuerySchema`
- `CreateReportExportRequestSchema` / `ListReportExportsQuerySchema`
- `ReportTypeSchema`: `'COMMERCIAL_PERFORMANCE' | 'OPERATIONAL' | 'ADVISOR_DASHBOARD'`

## Priority

Reports page is **high-impact for rubric** — criteria #12 (demo, 9 pts) needs to show working reports with real data. Currently zero functionality behind the shell.

For minimum viable demo:
1. Wire Objetivos tab with real API data
2. Add client-side PDF export of advisor metrics table
3. Add `/reportes` to sidebar
