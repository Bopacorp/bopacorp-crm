# 2.6 — Visits

## Goal

Full visit management within negotiation detail: list visits, create with GPS, verify (supervisor only).

## Files

- `src/modules/negotiations/components/VisitsTab.tsx` — expand from 2.4 basic version
- `src/modules/negotiations/components/CreateVisitDialog.tsx` — create visit with GPS
- `src/modules/negotiations/components/VisitDetailSheet.tsx` — full visit detail in side panel

## Visits tab (expanded)

Table columns:
| Column | Source | Render |
|--------|--------|--------|
| Fecha | `visitDate` | Formatted datetime |
| Tipo | `type.name` | Badge or text |
| Asesor | `advisor.username` | Text |
| Verificada | `isVerified` | Check icon or "—" |
| Observaciones | `observations` | Truncated preview |

**Actions:**
- "Registrar visita" button → `CreateVisitDialog`
- Row click → `VisitDetailSheet`
- Supervisor: "Verificar" action on unverified visits

## Create visit dialog

**Fields:**
- Visit type: dropdown from `useVisitTypes()`
- Visit date: datetime picker (default now)
- Observations: textarea (required)
- Latitude: number input (auto-filled via geolocation)
- Longitude: number input (auto-filled via geolocation)

**GPS auto-fill:**
```ts
navigator.geolocation.getCurrentPosition(
  (pos) => {
    setLatitude(pos.coords.latitude);
    setLongitude(pos.coords.longitude);
  },
  () => { /* GPS denied — leave fields empty, user can fill manually */ }
);
```

Request permission on dialog open. If denied, fields remain editable for manual input.

**Submit flow:**
1. `createVisit({ negotiationId, visitTypeId, visitDate, observations, latitude, longitude })`
2. Toast success "Visita registrada"
3. Close dialog
4. Refetch visits tab

## Visit detail sheet

Side panel with full visit info:
- Visit type, date, advisor
- Observations (full text)
- GPS coordinates (if present, show as text — no map needed)
- Verification status: verified/pending, verified by, verified at
- **Verify button** (supervisor only): `verifyVisit(id, { notes })` → toast → refetch

## Verify flow

- Only visible to users with `visits.verify` permission
- Opens confirmation with optional notes textarea
- `verifyVisit(id, { notes })` → toast "Visita verificada" → refetch

## Dependencies

- `useVisits` hook (2.2)
- `useVisitTypes` hook (2.2)
- Service: `createVisit`, `getVisit`, `verifyVisit`
- `Can` component for permission gating verify button
- shadcn: `Dialog`, `Sheet`, `Select`
- Shared UI: `EntityTable`, `FormAlert`, `EmptyState`

## Verification

- Visits list renders in detail page tab
- Create dialog auto-fills GPS if browser allows
- GPS fields editable if geolocation denied
- Visit creates successfully
- Detail sheet shows full info
- Verify works for supervisor, hidden for advisor
- `npm run check` passes
