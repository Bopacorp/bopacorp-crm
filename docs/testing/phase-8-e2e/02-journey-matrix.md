# Phase 8 — Role-Based Journey Matrix

The matrix is the source of truth for the first CRM browser suite. Each case
must record the seed revision, user role, expected route outcome, and evidence
artifact.

| ID | Priority | Role | Routes | Journey and assertions | Data/cleanup |
|---|---|---|---|---|---|
| E2E-CRM-01 | P0 | Advisor | `/login`, `/clientes`, `/negociaciones`, `/negociaciones/:id` | Sign in, inspect seeded owned clients and negotiations, and open an existing negotiation detail. | Read-only seeded data; no cleanup required. |
| E2E-CRM-02 | P0 | Advisor | `/negociaciones/:id` | Open an owned negotiation and verify that its document and history sections are visible. | Read-only seeded data; upload is deferred. |
| E2E-CRM-03 | P0 | Coordinator | `/documentacion` | Open documentation, inspect the review action menu, and open then cancel the rejection form without changing state. | Read-only seeded data; approve/reject is deferred. |
| E2E-CRM-03S | P1 | Supervisor | `/documentacion` or API parity check | Confirm whether supervisor document review is intentionally available in the CRM UI. Mark pass only against the accepted frontend/API contract. | Do not mutate a real document until the role contract is approved. |
| E2E-CRM-04 | P0 | Manager and Supervisor | `/reportes` | Load reports and apply the date filter without exporting or mutating data. | Use deterministic report fixtures; export is deferred. |
| E2E-CRM-05 | P1 | Manager | `/catalogo`, `/catalogo/nuevo`, `/catalogo/:id` | Create a catalog item with valid lookup selections, verify detail rendering, and update a safe field. | Deferred until reset/cleanup ownership exists. |
| E2E-CRM-06 | P1 | Manager | `/empleabilidad/vacantes`, `/empleabilidad/aplicantes` | Create or open a vacancy, review an applicant, and open/download a valid CV PDF. | Deferred until non-sensitive fixtures and reset/cleanup ownership exist. |
| E2E-CRM-07 | P0 | Advisor | `/organizacion/equipo` | Navigate directly to a manager-only route and verify the app redirects or renders the documented access-denied behavior; verify the hidden navigation item as applicable. | Read-only; no cleanup. |
| E2E-CRM-08 | P0 | All required roles | `/`, `/login` | Verify each role can sign in, lands on the expected home route, sees the expected navigation group, and can log out. | Read-only; use environment-provided accounts. |

## Expected role boundaries

- Advisor: own clients, negotiations, visits, and documents only.
- Supervisor: supervised advisor scope and sales-management pages.
- Manager: organization, catalog, reports, employability, and broad CRM access.
- Coordinator: documentation review and read-only CRM areas allowed by the
  frontend route guards.
- Admin: full CRM access; use only where a dedicated admin journey is needed.
- Web admin: excluded from this repo's CRM E2E scope; cover it in
  `bopacorp-web`.

## Per-case evidence

Each case should retain:

- role and case ID in the test title;
- starting route and final route;
- created record marker, if any;
- expected versus observed result;
- screenshot of the critical action and final state;
- trace/video only when the test fails or the journey is selected for the final
  report;
- cleanup/reset result, or an explicit read-only justification.

## Traceability template

```text
Risk:
Requirement:
Test case:
Preconditions and seed:
Observed result:
Evidence artifact:
Retest/fix SHA:
```
