# Phase 8 — CRM End-to-End Testing

Status: read-only baseline complete locally. The Chromium suite passed 11 of 11
tests in the initial execution; mutable journeys are implemented and tracked in
[Phase 9](../phase-9-e2e-mutations/00-index.md). Artifact anonymization and CI
integration remain open.

## Purpose

Phase 8 will validate complete CRM journeys in a real browser. It complements
the unit/component suite and the API/RBAC integration suite; it does not replace
either one.

The phase is also an evidence phase for the final report. A passing journey
must produce a reproducible test result and a small, anonymized set of
illustrative screenshots or traces for the relevant user action.

## Current baseline

- Phase 7 API/RBAC integration was published in commit `98db999`.
- The live API integration suite passed 12 of 12 tests.
- The unit/component suite passed 174 of 174 tests in 47 files.
- Playwright is now configured as a CRM development dependency with local
  scripts; it is not yet a required CI check.
- The current CI runs unit/component coverage, lint, typecheck, and build, but
  it does not start the CRM/API environment or run browser tests.
- The API and CRM environment must be test-only; production is out of scope.

## Initial delivery decision

- Scope: smoke coverage plus the P0 cases in the journey matrix.
- Browser: Chromium only.
- Execution: local/manual while the API and CRM are already running.
- Authentication: UI login for the role smoke test; API login plus in-memory
  browser storage for the remaining read-only journeys.
- Data: this phase remains read-only and inspects deterministic seeded records.
  Mutable create/upload/approve/reject/publish/delete journeys are owned by
  [Phase 9](../phase-9-e2e-mutations/00-index.md), which adds marker-based
  cleanup and role-aware API support.

## Documents in this folder

- [Implementation plan](./01-implementation-plan.md)
- [Role-based journey matrix](./02-journey-matrix.md)
- [Fixtures and data-safety rules](./03-fixtures-and-safety.md)
- [Evidence and execution runbook](./04-evidence-and-runbook.md)
- [Initial execution record](./05-execution-2026-08-15.md)
- [Phase 9 mutable E2E extension](../phase-9-e2e-mutations/00-index.md)

## Scope boundaries

### Included in this phase

- Login, role-aware navigation, protected routes, and logout.
- Critical read-only CRM journeys for sales, documentation, reports, and
  protected routes.
- Browser-visible validation messages and permission outcomes.
- Screenshots, traces, and HTML reports suitable for academic evidence.

### Not included in this phase

- Replacing unit tests with browser tests.
- Re-measuring the 80% critical-code coverage gate.
- Load, performance, accessibility certification, or mobile-device testing.
- Public web/CMS journeys owned by `bopacorp-web`.
- Production data or production credentials.
- Mutable journeys; see [Phase 9](../phase-9-e2e-mutations/00-index.md) for the
  separate cleanup-controlled implementation.

## Contract decisions that must be resolved during implementation

1. The CRM frontend currently gates `/documentacion` with `DOC_ROLES`
   (`admin`, `manager`, `coordinator`), while the API permission matrix also
   describes supervisor document actions. The coordinator journey is the
   primary CRM case; supervisor parity must be explicitly accepted or tracked
   as a defect before being marked passed.
2. `web-admin` is not a CRM route persona. Its catalog and employability
   journeys belong to the web/CMS E2E suite and must not be silently claimed by
   CRM evidence.
3. The API and CRM may be started manually for local runs. CI must provide an
   isolated API/database/storage environment before enabling the E2E gate.

## Phase exit

Phase 8 is complete when the P0 journeys in the matrix pass in a reproducible
test environment, failures generate diagnosable artifacts, evidence is
reviewed for sensitive data, and the final result is recorded with repository
SHAs and environment details.
