# Reports Module — Gap Analysis

Audited: 2026-06-27
Updated: 2026-06-27 (post sales_targets migration)

Route: `/reportes`
File: `src/modules/reports/pages/ReportsPage.tsx`

## Backend changes (already deployed)

The `sales_objectives` system was replaced with a tier-based `sales_targets` config:

| Old (removed) | New (live) |
|----------------|------------|
| `GET/POST/PUT/DELETE /reports/objectives` | `GET /reports/targets` — list active tier configs |
| Per-advisor CRUD objectives | `PUT /reports/targets/:id` — edit tier thresholds |
| `SalesObjectiveResponseSchema` | `GET /reports/advisor-performance` — per-advisor tier breakdown |
| `sales_objectives.*` permissions | `sales_targets.read` / `sales_targets.update` permissions |
| `ListNegotiationsQuery` had no tier filter | `ListNegotiationsQuery.tierCode` filter added |

Shared package `@bopacorp/shared@0.2.48` has all new types. Old objective types removed.

---

## Current CRM state (broken)

ReportsPage still imports deleted shared types:

```
SalesObjectiveListItemResponse    ← REMOVED from shared
CreateSalesObjectiveRequestSchema ← REMOVED from shared
UpdateSalesObjectiveRequest       ← REMOVED from shared
ListSalesObjectivesQuery          ← REMOVED from shared
```

Files that will fail to compile after `npm update @bopacorp/shared`:

| File | Issue |
|------|-------|
| `pages/ReportsPage.tsx` | Imports `SalesObjectiveListItemResponse`, calls `deleteObjective()`, references `sales_objectives.*` permissions |
| `reports.service.ts` | `listObjectives()`, `createObjective()`, `updateObjective()`, `deleteObjective()` — all call dead endpoints |
| `hooks/useSalesObjectives.ts` | Imports `ListSalesObjectivesQuery`, calls `listObjectives()` |
| `components/ObjectiveDialog.tsx` | Imports `SalesObjectiveListItemResponse`, `CreateSalesObjectiveRequestSchema`, calls `createObjective()`/`updateObjective()` |
| `lib/query-keys.ts` | `reports.objectives` key — rename to `reports.targets` |

---

## What needs to change

### 1. Update shared package

```bash
npm update @bopacorp/shared
```

This will break compilation. All changes below fix it.

### 2. Replace `reports.service.ts`

Remove 4 objective functions, add 3 new ones:

```ts
// REMOVE
listObjectives(query: ListSalesObjectivesQuery)
createObjective(data: CreateSalesObjectiveRequest)
updateObjective(id: string, data: UpdateSalesObjectiveRequest)
deleteObjective(id: string)

// ADD
import type {
  SalesTargetResponse,
  UpdateSalesTargetRequest,
  AdvisorPerformanceResponse,
  ListAdvisorPerformanceQuery,
} from '@bopacorp/shared/reports';

export function listTargets() {
  return request<SalesTargetResponse[]>({ method: 'GET', url: '/reports/targets' });
}

export function updateTarget(id: string, data: UpdateSalesTargetRequest) {
  return request<SalesTargetResponse>({ method: 'PUT', url: `/reports/targets/${id}`, data });
}

export function getAdvisorPerformance(query: ListAdvisorPerformanceQuery = {}) {
  return request<AdvisorPerformanceResponse[]>({
    method: 'GET',
    url: '/reports/advisor-performance',
    params: query,
  });
}
```

Keep `listAdvisorMetrics`, `listRecentActivity`, `listExports`, `createExport` unchanged.

### 3. Replace `hooks/useSalesObjectives.ts` → `hooks/useSalesTargets.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listTargets } from '../reports.service.js';

export function useSalesTargets() {
  return useQuery({
    queryKey: queryKeys.reports.targets(),
    queryFn: () => listTargets(),
  });
}
```

### 4. Add `hooks/useAdvisorPerformance.ts`

```ts
import type { ListAdvisorPerformanceQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getAdvisorPerformance } from '../reports.service.js';

export function useAdvisorPerformance(query: ListAdvisorPerformanceQuery = {}) {
  return useQuery({
    queryKey: queryKeys.reports.advisorPerformance(query),
    queryFn: () => getAdvisorPerformance(query),
  });
}
```

### 5. Update `lib/query-keys.ts`

```ts
reports: {
  // REMOVE
  objectives: (filters) => ['reports', 'objectives', filters] as const,

  // ADD
  targets: () => ['reports', 'targets'] as const,
  advisorPerformance: (filters: Record<string, unknown>) =>
    ['reports', 'advisor-performance', filters] as const,

  // KEEP
  advisorMetrics: ...,
  recentActivity: ...,
  exports: ...,
},
```

### 6. Delete `components/ObjectiveDialog.tsx`

Entire file. No replacement needed — targets are not created via dialog. Only inline editing of `minCloses` / thresholds via the targets table.

### 7. Rewrite `ReportsPage.tsx` — "Objetivos" tab → "Rendimiento" tab

The old Objetivos tab showed a CRUD table of per-advisor objectives. Replace with:

#### Tab 1: "Rendimiento por Asesor" (Advisor Performance)

**Data source**: `GET /reports/advisor-performance` → `AdvisorPerformanceResponse[]`

**Layout**:
1. **Tier config cards** (read from `GET /reports/targets`): 3 `KpiCard` components showing current tier configuration:
   - ONE_SHOT: >= $850, min 2 cierres
   - MEDIANO: $500-849, min 3 cierres
   - SMALL: < $500, min 4 cierres
   - Manager sees edit icon on each card → inline edit `minCloses`/thresholds via `PUT /reports/targets/:id`

2. **Performance table** — one row per advisor:

| Column | Source field | Notes |
|--------|-------------|-------|
| Asesor | `advisor.firstName + lastName` | Link or name |
| ONE_SHOT | `tiers[tierCode='ONE_SHOT'].closedCount` / `minCloses` | Color: green if `met`, red if not |
| MEDIANO | `tiers[tierCode='MEDIANO'].closedCount` / `minCloses` | Same |
| SMALL | `tiers[tierCode='SMALL'].closedCount` / `minCloses` | Same |
| Total | `totalClosed` / `totalRequired` | Bold |
| Estado | `overallMet` | Badge: "Cumple" green / "No cumple" red |

3. **Filters**:
   - `supervisorId` — auto-set for supervisors (same pattern as overview)
   - `dateFrom` / `dateTo` — date range picker

4. **Permissions**:
   - View: `sales_targets.read` (replaces `sales_objectives.read`)
   - Edit targets: `sales_targets.update` (manager only)
   - No create/delete — tiers are fixed, only thresholds editable

#### Tab 2: "Exportaciones" — keep as-is

Already wired to `GET /reports/exports`. No changes needed.

### 8. Target edit UI (manager only)

Two options, pick one:

**Option A — Inline edit on KPI cards** (simpler):
- Each tier card shows current `minBilling`/`maxBilling`/`minCloses`
- Click edit icon → fields become editable inputs
- Save calls `PUT /reports/targets/:id`
- Use `useMutation` + invalidate `queryKeys.reports.targets`

**Option B — Edit dialog**:
- Click "Configurar" button → dialog with 3 sections (one per tier)
- Each section: tierLabel (readonly), minBilling, maxBilling, minCloses
- Single save updates all changed tiers

Recommendation: **Option A** — less code, more intuitive for 3 fixed items.

### 9. Permission updates in components

Search and replace across CRM:

| Old permission | New permission | Files |
|----------------|----------------|-------|
| `sales_objectives.create` | (remove — no creation) | `ReportsPage.tsx`, `ObjectiveDialog.tsx` |
| `sales_objectives.update` | `sales_targets.update` | `ReportsPage.tsx` |
| `sales_objectives.delete` | (remove — no deletion) | `ReportsPage.tsx` |
| `sales_objectives.read` | `sales_targets.read` | `ReportsPage.tsx` |

### 10. Add `tierCode` filter to Negotiations (kanban + table)

Backend already supports `tierCode` in `ListNegotiationsQuery`. Frontend needs:

#### `NegotiationsPage.tsx`

Add state + filter:

```ts
const [tierCode, setTierCode] = useState<string | undefined>();
```

Add to `useNegotiations` call:

```ts
const { negotiations, meta, ... } = useNegotiations(page, {
  search,
  stateId,
  advisorId: effectiveAdvisorId,
  tierCode,   // ← NEW
  sortBy,
  sortOrder,
  limit: pageSize,
});
```

Add filter option to `FilterBar`:

```ts
{
  id: 'tierCode',
  label: t('negotiations.clientTier'),
  placeholder: t('negotiations.selectTier'),
  options: [
    { value: 'all', label: t('common.all') },
    { value: 'ONE_SHOT', label: 'One Shot (>= $850)' },
    { value: 'MEDIANO', label: 'Mediano ($500-849)' },
    { value: 'SMALL', label: 'Small (< $500)' },
  ],
  value: tierCode ?? 'all',
  onChange: (value: string) => setTierCode(value === 'all' ? undefined : value),
},
```

#### `hooks/useNegotiations.ts`

Add `tierCode` to `NegotiationFilters` interface and `buildParams`:

```ts
interface NegotiationFilters {
  search?: string;
  stateId?: string;
  advisorId?: string;
  tierCode?: string;     // ← NEW
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

buildParams: (f, debouncedSearch) => ({
  search: debouncedSearch || undefined,
  stateId: f.stateId,
  advisorId: f.advisorId,
  tierCode: f.tierCode,  // ← NEW
  sortBy: f.sortBy,
  sortOrder: f.sortOrder ?? 'asc',
  limit: f.limit ?? 10,
}),
```

#### `components/NegotiationKanbanBoard.tsx`

Add `tierCode` to `KanbanFilters`:

```ts
interface KanbanFilters {
  search?: string;
  advisorId?: string;
  tierCode?: string;     // ← NEW
}
```

Pass through to `useNegotiations` in `KanbanColumn`:

```ts
const { negotiations, meta, loading, fetching } = useNegotiations(page, {
  stateId: state.id,
  search: filters.search,
  advisorId: filters.advisorId,
  tierCode: filters.tierCode,  // ← NEW
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  limit: COLUMN_PAGE_SIZE,
});
```

Pass from parent in `NegotiationsPage.tsx`:

```ts
<NegotiationKanbanBoard
  states={states}
  filters={{ search, advisorId: effectiveAdvisorId, tierCode }}  // ← ADD tierCode
  onCardClick={...}
  onClientClick={...}
/>
```

Add `tierCode` to filter reset effect in `KanbanColumn`:

```ts
const filtersChanged =
  prevFiltersRef.current.search !== filters.search ||
  prevFiltersRef.current.advisorId !== filters.advisorId ||
  prevFiltersRef.current.tierCode !== filters.tierCode;  // ← NEW
```

### 11. i18n keys to add

Add to both `es.json` and `en.json`:

```json
{
  "reports": {
    "performance": "Rendimiento",
    "tierConfig": "Configuracion de tiers",
    "tierOneShot": "One Shot",
    "tierMediano": "Mediano",
    "tierSmall": "Small",
    "minCloses": "Cierres minimos",
    "minBilling": "Facturacion minima",
    "maxBilling": "Facturacion maxima",
    "closedCount": "Cierres",
    "met": "Cumple",
    "notMet": "No cumple",
    "overallMet": "Cumplimiento general",
    "editTargets": "Configurar metas",
    "targetUpdated": "Meta actualizada",
    "totalClosed": "Total cierres",
    "totalRequired": "Total requerido"
  },
  "negotiations": {
    "clientTier": "Tipo de cliente",
    "selectTier": "Seleccionar tipo"
  }
}
```

---

## Available shared types (`@bopacorp/shared@0.2.48`)

### New types (use these)

| Schema | Type | Purpose |
|--------|------|---------|
| `SalesTargetResponseSchema` | `SalesTargetResponse` | Tier config row (id, tierCode, tierLabel, minBilling, maxBilling, minCloses, isActive) |
| `UpdateSalesTargetRequestSchema` | `UpdateSalesTargetRequest` | Partial update (tierLabel, minBilling, maxBilling, minCloses, isActive) |
| `AdvisorTierPerformanceSchema` | `AdvisorTierPerformance` | Per-tier result (tierCode, tierLabel, closedCount, minCloses, met) |
| `AdvisorPerformanceResponseSchema` | `AdvisorPerformanceResponse` | Per-advisor result (advisor, tiers[], totalClosed, totalRequired, overallMet) |
| `ListAdvisorPerformanceQuerySchema` | `ListAdvisorPerformanceQuery` | Query params (supervisorId?, dateFrom?, dateTo?) |
| `TierCodeSchema` | `TierCode` | Enum: `'ONE_SHOT' | 'MEDIANO' | 'SMALL'` |

### Removed types (delete all references)

- `SalesObjectiveResponseSchema` / `SalesObjectiveResponse`
- `SalesObjectiveListItemResponseSchema` / `SalesObjectiveListItemResponse`
- `CreateSalesObjectiveRequestSchema` / `CreateSalesObjectiveRequest`
- `UpdateSalesObjectiveRequestSchema` / `UpdateSalesObjectiveRequest`
- `ListSalesObjectivesQuerySchema` / `ListSalesObjectivesQuery`
- `EmployeeRefSchema`

### Unchanged types (keep using)

- `ReportExportResponseSchema`, `ReportExportListItemResponseSchema`
- `CreateReportExportRequestSchema`, `ListReportExportsQuerySchema`
- `AdvisorMetricResponseSchema`
- `RecentActivityResponseSchema`, `ListRecentActivityQuerySchema`
- `UserRefSchema`, `SlimUserRefSchema`

---

## New API endpoints

| Endpoint | Method | Permission | Response | Notes |
|----------|--------|------------|----------|-------|
| `/reports/targets` | GET | `sales_targets.read` | `SalesTargetResponse[]` | Active tiers, ordered by minBilling DESC |
| `/reports/targets/:id` | PUT | `sales_targets.update` | `SalesTargetResponse` | Partial update. Manager only |
| `/reports/advisor-performance` | GET | `report_exports.read` | `AdvisorPerformanceResponse[]` | Supports `supervisorId`, `dateFrom`, `dateTo` |

## Removed API endpoints

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/reports/objectives` | GET | Replaced by `/reports/targets` |
| `/reports/objectives` | POST | No creation — tiers are seeded |
| `/reports/objectives/:id` | PUT | Replaced by `/reports/targets/:id` |
| `/reports/objectives/:id` | DELETE | No deletion |

---

## File change summary

| Action | File | Description |
|--------|------|-------------|
| REWRITE | `reports.service.ts` | Remove objective functions, add target + performance functions |
| DELETE | `hooks/useSalesObjectives.ts` | Dead code |
| CREATE | `hooks/useSalesTargets.ts` | Simple useQuery for targets list |
| CREATE | `hooks/useAdvisorPerformance.ts` | useQuery with filter params |
| DELETE | `components/ObjectiveDialog.tsx` | Dead code — no objective CRUD |
| CREATE | `components/TargetEditCard.tsx` | Inline-editable tier card (manager only) |
| REWRITE | `pages/ReportsPage.tsx` | Replace Objetivos tab with Performance tab |
| EDIT | `lib/query-keys.ts` | Replace `objectives` key with `targets` + `advisorPerformance` |
| EDIT | `negotiations/pages/NegotiationsPage.tsx` | Add `tierCode` filter state + FilterBar option |
| EDIT | `negotiations/hooks/useNegotiations.ts` | Add `tierCode` to filters + buildParams |
| EDIT | `negotiations/components/NegotiationKanbanBoard.tsx` | Add `tierCode` to KanbanFilters + pass through |
| EDIT | i18n `es.json` / `en.json` | Add performance + tier translation keys |

## Priority

High. ReportsPage currently broken after shared package update. Negotiations tierCode filter is additive (won't break without it but needed for RF-REP-005 tier filtering requirement).

Execution order:
1. `npm update @bopacorp/shared` — triggers compilation errors
2. Fix `query-keys.ts` + `reports.service.ts` — foundational
3. Create new hooks (`useSalesTargets`, `useAdvisorPerformance`)
4. Delete dead files (`useSalesObjectives.ts`, `ObjectiveDialog.tsx`)
5. Rewrite `ReportsPage.tsx` — biggest change
6. Add negotiations `tierCode` filter
7. Add i18n keys
8. Test all views
