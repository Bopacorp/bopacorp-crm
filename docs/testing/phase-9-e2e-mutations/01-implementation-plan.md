# Phase 9 — Implementation Plan

## Objective

Add a small, repeatable Playwright mutation suite for the CRM. The suite must
exercise real UI actions where the current role has the permission, use the API
for deterministic setup or cross-role verification where the UI does not expose
the required control, and clean every resource created by the run.

## Implemented workstreams

### 1. Mutable test infrastructure

- Add an authenticated API client that unwraps the API envelope and supports
  JSON, multipart upload, deletion, and 404 verification.
- Add a `mutationRun` fixture with a unique run marker, synthetic RUC values,
  reverse-ordered cleanup actions, and cleanup failure attachments.
- Add role-aware `authSession`, `authenticatedApi`, and `managerApi` fixtures.
- Generate PDF and PNG fixtures at runtime under ignored Playwright output; do
  not commit binary test assets.
- Poll for eventual persistence instead of assuming that a mutation is visible
  in the first immediate list response.

### 2. Representative mutable journeys

- `E2E-CRM-09`: client, negotiation, state transition, and visit journey.
- `E2E-CRM-10`: document upload, approval, rejection, history, and cleanup.
- `E2E-CRM-11`: catalog product create/update/publish, image lifecycle, and
  deletion.
- `E2E-CRM-12`: vacancy create/update/publish, applicant-screen navigation,
  and deletion.
- `E2E-CRM-13`: sales-target edit and restoration of the seeded values.

### 3. Safety and evidence

- Use only test-account environment variables.
- Use run-specific markers in names, filenames, descriptions, observations,
  and RUC values.
- Register cleanup immediately after the resource can exist.
- Delete child resources before parent resources and verify 404 after deletion.
- Capture one illustrative screenshot per completed journey. Keep the generated
  artifacts local until they have been reviewed and anonymized.
- Keep E2E outside the unit-test coverage gate for this phase.

## Acceptance criteria

- [x] All five mutable journeys are present in `e2e/`.
- [x] The suite uses API setup/verification/cleanup without logging tokens or
  request bodies.
- [x] Cleanup is reverse ordered and reports individual action failures.
- [x] Synthetic upload files are generated at runtime.
- [x] Role limitations are respected instead of bypassed silently.
- [x] The consolidated local run passes 5/5 journeys.
- [x] A runbook and execution record are committed with the implementation.
- [ ] CI starts isolated CRM/API/database/storage services.
- [ ] CI publishes Playwright artifacts with `if: always()`.
- [ ] Selected screenshots are anonymized before academic publication.

## Deliberate scope decisions

- The sample uses Chromium only and one worker for predictable shared test-data
  cleanup.
- The mutable tests use a 90-second per-test timeout because file uploads,
  browser/API synchronization, and cleanup can exceed the read-only 30-second
  baseline.
- No global coverage threshold is added here. Unit and API integration coverage
  remain the appropriate quality gates for this phase.
