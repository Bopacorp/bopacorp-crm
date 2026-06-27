# Requirements Audit — Technical Debt

Audit date: 2026-06-27. Covers all RF and RNF from BOPADIGITAL Requirements Specification Document.

## Legend

- **Done**: Fully implemented in CRM
- **Partial**: Implemented with noted limitations
- **Missing**: Not implemented
- **Skipped**: Client descoped
- **Backend**: Backend responsibility, not observable from frontend
- **Other repo**: Implemented in bopacorp-web, not this CRM

---

## RF-CRM (Client Management)

| Req | Status | Notes |
|-----|--------|-------|
| RF-CRM-001 | Done | Advisor creates clients (RUC, name, services, billing) |
| RF-CRM-002 | Done | Advisor updates assigned clients |
| RF-CRM-003 | Partial | Search + active/inactive + advisor filter. **No negotiation stage or visit date filter on clients page** |
| RF-CRM-004 | Done | CreateVisitSheet with date/time/type/observations |
| RF-CRM-005 | Done | Visit registration with auto GPS capture |
| RF-CRM-006 | Done | VisitDetailSheet shows GPS coords, supervisor can verify |
| RF-CRM-007 | Done | VisitsTab on negotiation detail, paginated |
| RF-CRM-008 | Done | ChangeStateDialog on negotiation detail |
| RF-CRM-009 | Done | Supervisor creates clients via same form |
| RF-CRM-010 | Done | Supervisor edits via BusinessClientSheet |
| RF-CRM-011 | Done | isActive toggle in edit form |
| RF-CRM-012 | Done | advisorId field with SearchSelect |
| RF-CRM-013 | Done | ClientsPage advisor filter dropdown |
| RF-CRM-014 | Done | Reassign/clear advisor via edit form |
| RF-CRM-015 | Done | ActivityFeed in OverviewPage |
| RF-CRM-016 | Done | Per-advisor state counts + clientsVisited + billing |
| RF-CRM-017 | Done | totalBilledAmount + averageBillingPerService columns |
| RF-CRM-018 | Missing | **No terminals/equipment sold metric per advisor** |
| RF-CRM-019 | Done | FunnelChart + per-advisor state columns |
| RF-CRM-020 | Partial | Same as RF-CRM-003 — **no stage/visit date filter** |
| RF-CRM-021 | Done | Advisor scoped to own ID via effectiveAdvisorId |
| RF-CRM-022 | Partial | State change history only. **No field-level audit log** |

## RF-MAT (Offer Matrix)

| Req | Status | Notes |
|-----|--------|-------|
| RF-MAT-001 | Done | Create matrix tied to negotiation |
| RF-MAT-002 | Skipped | Client descoped — no line items/qty/prices |
| RF-MAT-003 | Skipped | Client descoped — no subsidy calculation |
| RF-MAT-004 | Done | Two attachment slots (OFFER_MATRIX + EMAIL_TEMPLATE) |
| RF-MAT-005 | Skipped | Client descoped — no draft workflow |
| RF-MAT-006 | Skipped | Client descoped — no approval workflow |
| RF-MAT-007 | Partial | Single matrix per negotiation. Observations only, no multi-matrix history |

## RF-SUP (Supervision & Approvals)

| Req | Status | Notes |
|-----|--------|-------|
| RF-SUP-001–006 | Skipped | Client descoped entirely — no approval queue/workflow |

## RF-DOC (Documentation)

| Req | Status | Notes |
|-----|--------|-------|
| RF-DOC-001 | Done | DocumentUploadDialog picks negotiation + type + file |
| RF-DOC-002 | Done | 50MB limit + PDF/JPG/PNG validation |
| RF-DOC-003 | Done | documentTypeId required on upload |
| RF-DOC-004 | Done | DocumentTypesPage with isMandatory flag |
| RF-DOC-005 | Done | StateBadge shows PENDING/ACCEPTED/REJECTED |
| RF-DOC-006 | Done | DocumentActions approve/reject, permission-gated |
| RF-DOC-007 | Done | Individual + bulk (ZIP) download |
| RF-DOC-008 | Backend | Notification display works; email is backend |
| RF-DOC-009 | Partial | **PendingSummary UI built, backend endpoint not deployed** |

## RF-REP (Reports)

| Req | Status | Notes |
|-----|--------|-------|
| RF-REP-001 | Done | Performance reports by advisor/period |
| RF-REP-002 | Partial | Date + supervisor scope. **No service-type or zone filter** |
| RF-REP-003 | Done | KPIs: state counts, visits, avgDaysToClose, billing |
| RF-REP-004 | Done | Supervisor sees team metrics via supervisorId filter |
| RF-REP-005 | Done | Tier targets with progress bars + met/not-met badges |
| RF-REP-006 | Partial | **CSV only — spec requires PDF and/or Excel** |
| RF-REP-007 | Partial | Same CSV limitation |
| RF-REP-008 | Done | PerformanceChart, FunnelChart, KpiCards |
| RF-REP-009 | Done | Routes gated by SALES_MANAGEMENT_ROLES |
| RF-REP-010 | Done | Advisor overview filters to own user ID |

## RF-CAT (Public Website Catalog)

| Req | Status | Notes |
|-----|--------|-------|
| RF-CAT-001–005 | Other repo | Public website — implemented in bopacorp-web |

## RF-CMS (Content Management)

| Req | Status | Notes |
|-----|--------|-------|
| RF-CMS-001 | Other repo | CMS login in bopacorp-web |
| RF-CMS-002 | Other repo | CMS text/image editing in bopacorp-web |
| RF-CMS-003 | Done | CatalogItemCreatePage in this CRM |
| RF-CMS-004 | Done | CatalogItemEditSheet in this CRM |
| RF-CMS-005 | Done | deleteCatalogItem service |

## RF-EMP (Employability)

| Req | Status | Notes |
|-----|--------|-------|
| RF-EMP-001 | Done | CRM admin: vacancies CRUD + applications management |
| RF-EMP-002–005 | Other repo | Candidate-facing (bopacorp-web) |
| RF-EMP-006 | Partial | State change dialog exists, email notification depends on backend |

## RF-SEG (Security)

| Req | Status | Notes |
|-----|--------|-------|
| RF-SEG-001 | Done | Email/password login |
| RF-SEG-002 | Done | Role-based permissions throughout |
| RF-SEG-003 | Done | Manager included in all role arrays where supervisor has access |

## RF-NOT (Notifications)

| Req | Status | Notes |
|-----|--------|-------|
| RF-NOT-001 | Partial | Internal popover (30s polling). Email is backend |
| RF-NOT-002 | Partial | **Popover shows last 10 only — no full-page notification history** |

## RNF (Non-Functional) — Frontend Observable

| RNF | Status | Notes |
|-----|--------|-------|
| RNF-007 | Done | Responsive layout with Tailwind breakpoints |
| RNF-009 | Partial | **Matrix attachments missing 50MB size check** |
| RNF-015 | Done | All strings through i18n |
| RNF-018 | Done | Zod + react-hook-form + server-side validation |
| RNF-024 | Partial | **No idle timeout — only expires on failed request** |
| RNF-004/005/026 | Backend | Not observable from frontend |

---

## Prioritized Gap Summary

| # | Gap | Req | Priority |
|---|-----|-----|----------|
| 1 | No terminals/equipment sold metric | RF-CRM-018 | High |
| 2 | No negotiation stage/visit date filter on clients | RF-CRM-003/020 | High |
| 3 | Export is CSV only (spec: PDF/Excel) | RF-REP-006/007 | Medium |
| 4 | No full notification history page | RF-NOT-002 | Medium |
| 5 | PendingSummary backend endpoint not deployed | RF-DOC-009 | Medium |
| 6 | No field-level client audit log | RF-CRM-022 | Medium |
| 7 | No service-type/zone filter on reports | RF-REP-002 | Low |
| 8 | Matrix attachments no 50MB validation | RNF-009 | Low |
| 9 | No explicit idle timeout (15 min) | RNF-024 | Low |
