# Phase 5 — Reports

Performance tracking and report exports. Covers RF-REP-001 through RF-REP-010. Dashboard-style metrics, sales objectives, and export management.

## 5.1 Service layer

Create `src/modules/reports/reports.service.ts`:

**Sales Objectives:**
- `listSalesObjectives(params)` → `GET /reports/objectives` → paginated
  - Params: advisorId, createdBy, periodStart, periodEnd
- `getSalesObjective(id)` → `GET /reports/objectives/:id`
- `createSalesObjective(data)` → `POST /reports/objectives`
- `updateSalesObjective(id, data)` → `PUT /reports/objectives/:id`
- `deleteSalesObjective(id)` → `DELETE /reports/objectives/:id`

**Report Exports:**
- `listReportExports(params)` → `GET /reports/exports` → paginated
  - Params: reportType, generatedBy
- `getReportExport(id)` → `GET /reports/exports/:id`
- `createReportExport(data)` → `POST /reports/exports`

**Supporting data (from other modules, for dashboard metrics):**
- `listNegotiations(params)` — reuse from negotiations service
- `listVisits(params)` — reuse from negotiations service
- `listBusinessClients(params)` — reuse from negotiations service

## 5.2 Data hooks

**`useSalesObjectives(page, filters)`** — paginated objectives list with period/advisor filters.

**`useReportExports(page, filters)`** — paginated exports list with type filter.

## 5.3 ReportsPage — Two-tab view

Replace current stub.

**Layout:**
- SectionHeader: "Reportes" + "Generar reporte" action button
- Tabs: Objetivos | Exportaciones

### Tab: Objetivos

**KPI cards row (3 cards):**
- Objetivo mensual (% compliance average across active objectives)
- Asesores activos (count of advisors with objectives this period)
- Cumplimiento promedio (average targetClosedDeals vs actual)

Note: actual compliance % requires comparing objectives against real negotiation closures. If backend doesn't have an aggregation endpoint, compute client-side from available data.

**Objectives table:**
- FilterBar: advisor dropdown, period selector (date range)
- EntityTable columns:
  - Asesor (advisor name or "Global" if no advisor)
  - Meta ventas ($targetSalesAmount formatted)
  - Meta cierres (targetClosedDeals)
  - Periodo (periodStart – periodEnd formatted)
  - Creado por (createdBy.username)
  - Acciones: edit, delete
- "Nuevo objetivo" button → create dialog

**Create/Edit objective dialog:**
- Select advisor (optional — global objective if none)
- Target sales amount ($)
- Target closed deals (number)
- Period: start date + end date
- Submit → create or update → toast → refetch

### Tab: Exportaciones

**Table of generated reports:**
- FilterBar: report type filter (COMMERCIAL_PERFORMANCE / OPERATIONAL / ADVISOR_DASHBOARD)
- EntityTable columns:
  - Título (title)
  - Tipo (reportType — translated label)
  - Archivo (filename + extension)
  - Tamaño (fileSizeMb formatted)
  - Generado por (createdBy.username)
  - Fecha (generatedAt formatted)
  - Acciones: download button

**"Generar reporte" dialog:**
- Report type selector
- Title field
- Period selector (for context, not filtering — actual generation may be server-side)
- Submit → createReportExport with metadata → toast
- Note: actual PDF/Excel generation depends on backend capability. Frontend creates the export record; download links to storagePath.

## 5.4 Report type labels

```
COMMERCIAL_PERFORMANCE → "Desempeño comercial"
OPERATIONAL → "Operativo"
ADVISOR_DASHBOARD → "Dashboard de asesor"
```

## 5.5 Permission gating

| Action | Permission |
|--------|-----------|
| View objectives | `sales_objectives.read` |
| Create/edit objectives | `sales_objectives.create`, `sales_objectives.update` |
| Delete objectives | `sales_objectives.delete` |
| View exports | `report_exports.read` |
| Generate export | `report_exports.create` |

Visibility scoping:
- Manager: sees all objectives and exports
- Supervisor: sees objectives for their advisors
- Advisor: sees own objectives only (RF-REP-010)

## 5.6 Types consumed

From `@bopacorp/shared/reports`:
- `SalesObjectiveResponse`, `SalesObjectiveListItemResponse`
- `ReportExportResponse`, `ReportExportListItemResponse`
- `ReportType` enum
- All request types

## Deliverable

After this phase: sales objectives CRUD with advisor assignment and period management, report export listing with download, KPI cards showing compliance metrics, permission-scoped visibility.
