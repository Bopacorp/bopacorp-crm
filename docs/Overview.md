# Bopacorp CRM Frontend System Plan

## 1. Purpose

This document defines the frontend system structure for **bopacorp-crm** based on the finalized backend in **bopacorp-api**.  
Its goal is to establish a clear implementation baseline for:

1. Information architecture (sections and navigation).
2. Data mapping (what data goes where and why).
3. UI scaffolding and design consistency with **bopacorp-web**.
4. Incremental implementation order before full data population/simulation.

---

## 2. Business context

Bopacorp operates as a commercial intermediary between carriers and companies.  
The CRM must support:

- Account portfolio control.
- Negotiation lifecycle management.
- Visit execution and supervision.
- Document compliance and approvals.
- Offer/matrix construction for telecom products/services.
- Supervisor performance and period reporting.
- Employability workflows connected to public web channels.

---

## 3. Information architecture (final sections)

## 3.1 Overview
Essential operational visibility:
- Open/active accounts.
- Visits scheduled or completed today.
- Employee leaderboard (advisor/supervisor performance signals).

## 3.2 Negociaciones
Operational hub for account lifecycle and contract status:
- Company history with Bopacorp (active, closed, expired).
- Active negotiations and account assignment.
- Visit registration.
- Negotiation/contract state tracking and changes.

## 3.3 Documentación
Compliance and approval workflow:
- Accounts that require documents or approval.
- Supervisor uploads/attaches required documents.
- Admin reviews and approves/rejects.
- Full status/history visibility by account/negotiation.

## 3.4 Catálogo
Offer and matrix operations:
- Supervisors/admins build and manage offer matrices.
- Existing matrices can be listed, reviewed, edited, and state-managed.
- Product/service definitions and related offer components are consumed here.

## 3.5 Reportes
Performance and exported reporting:
- Supervisor-level performance monitoring.
- Sales reports by period/range.
- Historical exports and generated report artifacts.

## 3.6 Empleabilidad
Hiring and inbound communication from bopacorp-web:
- Vacancy template creation/publication workflows.
- Applicants subsection: candidate data, applications, CVs.
- Messages subsection: contact form messages submitted on bopacorp-web.

---

## 4. Data mapping: what goes where and why

| CRM section | Primary backend domains | Why it belongs here |
|---|---|---|
| **Overview** | `crm.business_clients`, `crm.visits`, `crm.negotiations`, `reports.sales_objectives` | Cross-domain executive snapshot for daily action. |
| **Negociaciones** | `crm.negotiations`, `crm.negotiation_states`, `crm.negotiation_state_history`, `crm.visits`, `crm.business_clients` | Core lifecycle and account relationship management. |
| **Documentación** | `documents.document_types`, `documents.negotiation_documents`, `documents.document_state_history` | Compliance-critical document flow with approval states. |
| **Catálogo** | `matrices.offer_matrices`, `matrices.matrix_line_items`, `matrices.matrix_attachments`, `matrices.matrix_state_history`, `catalog.catalog_items` (+ lookups) | Offer design and commercial packaging operations. |
| **Reportes** | `reports.sales_objectives`, `reports.report_exports` | Performance tracking and formal report generation history. |
| **Empleabilidad / Aplicantes** | `employability.job_vacancies`, `employability.candidates`, `employability.job_applications`, `employability.candidate_resumes` | Talent acquisition workflow and candidate tracking. |
| **Empleabilidad / Mensajes** | `catalog.contact_requests` | Public contact demand intake from bopacorp-web. |

---

## 5. Route structure (scaffolding baseline)

```txt
/overview
/negociaciones
/negociaciones/:id
/documentacion
/catalogo
/catalogo/matrices/:id
/reportes
/empleabilidad/aplicantes
/empleabilidad/mensajes
```

### Route-to-purpose mapping

- `/overview`: KPI cards, today activity, ranking widgets.
- `/negociaciones`: pipeline/history list with filters.
- `/negociaciones/:id`: 360 detail (timeline, visits, assignment, state transitions).
- `/documentacion`: pending docs queue + approval actions.
- `/catalogo`: matrix list/management and offer construction.
- `/catalogo/matrices/:id`: matrix detail, line items, attachments, state history.
- `/reportes`: objectives, performance slices, export history.
- `/empleabilidad/aplicantes`: vacancies, applications, resumes.
- `/empleabilidad/mensajes`: web contact messages for follow-up.

---

## 6. Frontend system structure

Recommended module organization in `src/`:

```txt
src/
  app/
    AppShell.tsx
    routes.tsx
  modules/
    overview/
    negotiations/
    documentation/
    catalog/
    reports/
    employability/
  services/
    api.ts
    <module>.service.ts
  shared/
    ui/
    table/
    filters/
    states/
  lib/
    mappers/
    formatters/
```

### Layer responsibilities

1. **App layer**: routing, layout shell, section metadata.
2. **Module layer**: pages + feature components by domain.
3. **Service layer**: API calls and query parameter composition.
4. **Shared UI layer**: reusable design-system driven blocks.
5. **Mapper/formatter layer**: normalize backend payloads into view models.

---

## 7. UI design alignment with bopacorp-web

Use the same visual language as bopacorp-web:

1. `b0` preset and semantic token usage (`bg-background`, `text-foreground`, `border-border`, etc.).
2. shadcn/ui-first composition before custom components.
3. Layout hierarchy via spacing, borders, typography, and cards (not heavy shadow styling).
4. Reusable primitives for consistency:
   - `Card`, `Badge`, `Tabs`, `Dialog`, `Table/DataTable`, `FieldGroup`, `Select`, `Chart`.

### Styling constraints

- Prefer variants over ad-hoc visual overrides.
- Keep responsive behavior consistent with existing bopacorp-web patterns.
- Keep interaction patterns uniform: filters/header actions/content tables/timelines.

---

## 8. Base components to implement first

1. `AppShell` (sidebar + top bar + breadcrumb + content container).
2. `SectionHeader` (title, description, main actions).
3. `KpiCard` (metric, trend, context).
4. `FilterBar` (search, dates, status selectors).
5. `EntityTable` (wrapper over shared data table behavior).
6. `StateBadge` (status color/label unification).
7. `TimelinePanel` (state/history visualization).
8. `EmptyState` and `ErrorState` per module.

---

## 9. MVP scope per section

### Overview (MVP)
- Open accounts KPI.
- Visits today KPI.
- Employee leaderboard card/table.

### Negociaciones (MVP)
- Negotiation list with filters.
- Negotiation detail with key metadata and history.
- Visit registration and state-change actions.

### Documentación (MVP)
- Pending documents list.
- Document state transitions (approve/reject/pending).
- Document history visibility.

### Catálogo (MVP)
- Matrix list.
- Matrix detail with line items and totals/subsidy visibility.
- Attachments and state history.

### Reportes (MVP)
- Objectives by supervisor.
- Report exports listing by period/type.

### Empleabilidad (MVP)
- Applicants board/table (vacancy, candidate, CV status).
- Messages list from contact requests.

---

## 10. Implementation sequence

1. **Phase 1 — Foundation**
   - Shell, routes, section metadata, shared base components.

2. **Phase 2 — Core Operations**
   - Overview + Negociaciones.

3. **Phase 3 — Compliance and Offer Operations**
   - Documentación + Catálogo.

4. **Phase 4 — Insight and Hiring Channels**
   - Reportes + Empleabilidad.

5. **Phase 5 — Data simulation and hardening**
   - Seed-like frontend fixtures + realistic scenario datasets.
   - Validate empty/loading/error and edge-state UI behavior.

---

## 11. Data simulation strategy (post-scaffolding)

After module skeleton completion:

1. Define stable view models per section.
2. Add mapper functions from API responses to UI-friendly shapes.
3. Create representative datasets for:
   - Active vs closed vs expired negotiations.
   - Pending vs approved vs rejected documents.
   - Multiple matrix states (draft, pending, approved, rejected).
   - Supervisor objective variance (above/under target).
   - Vacancy/application lifecycle states.
4. Enable end-to-end UI walkthroughs without production data dependency.

---

## 12. Expected outcome

By following this plan, bopacorp-crm will have:

- A business-consistent IA aligned with real API domains.
- A modular and scalable frontend structure.
- Design consistency with bopacorp-web from day one.
- A safe path to iteratively build each section, then populate realistic data scenarios.

