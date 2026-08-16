# Phase 8 — Playwright Implementation Plan

## Objective

Add a small, stable Playwright suite that proves the highest-value CRM
journeys through the browser while keeping credentials, data, and artifacts
outside the repository.

## First delivery decisions

The first implementation is intentionally a small, illustrative sample:

- Run locally and manually against the already-running CRM and API.
- Execute Chromium only.
- Exercise login/logout and role navigation through the UI.
- Authenticate the remaining journeys through the API and inject the session
  into an in-memory browser context.
- Read deterministic seeded records only. Do not create, edit, upload,
  approve, reject, export, or delete data in this delivery.
- Keep CI integration and mutation cleanup as follow-up work.

## Entry criteria

- The CRM can run at a stable test URL.
- The API is reachable from that CRM environment.
- Test accounts for the required roles are available through environment
  variables or a secret store.
- Seed data identifies the records required by the journey matrix.
- The test database and storage are isolated from production.
- The team agrees how created records will be cleaned up or reset.
- The documentation route/role discrepancy described in `00-index.md` has an
  owner and an expected result.

## Implementation files

The initial implementation contains these files:

```text
playwright.config.ts
tsconfig.e2e.json
e2e/
  fixtures/auth.fixture.ts
  support/auth.ts
  auth.spec.ts
  navigation.spec.ts
  documentation.spec.ts
```

Planned package scripts:

```text
test:e2e
test:e2e:ui
test:e2e:report
```

The suite keeps fixtures, support utilities, and journeys separated. Mutation
fixtures and additional journey files remain follow-up work.

## Implementation stages

### Stage 1 — Runner and browser lifecycle

- Add `@playwright/test` as a development dependency.
- Configure Chromium first; add other browsers only when required by the
  acceptance scope.
- Define `baseURL` through `E2E_BASE_URL`.
- Keep local API/CRM lifecycle explicit unless CI owns those processes.
- Configure retries, timeout, trace-on-first-retry, screenshot-on-failure, and
  video-on-failure.
- Ignore generated `playwright-report/` and `test-results/` directories.

### Stage 2 — Authentication fixture

- Create a role fixture that logs in through the UI or a controlled API setup.
- Store authenticated state only in temporary test output or memory.
- Never hardcode email addresses, passwords, access tokens, or refresh tokens.
- Make the role visible in the test title and artifact path.
- Ensure logout clears the session and returns to `/login`.

### Stage 3 — P0 journeys

Implement the journeys in [the matrix](./02-journey-matrix.md) in this order:

1. Login and role-aware landing/navigation.
2. Advisor client → negotiation detail read-only flow.
3. Documentation review-action inspection without submission.
4. Reports date-filter flow without export.
5. Restricted-route negative flow.

### Stage 4 — P1 journeys

- Catalog item creation/update with cleanup.
- Vacancy and applicant/CV review.
- Additional role navigation checks.
- Invalid form and server-error recovery where the journey can assert a stable
  user-visible result.

### Stage 5 — Evidence and CI handoff

- Verify every P0 test produces useful failure diagnostics.
- Capture selected screenshots for the final report, not every DOM state.
- Add a manual/local E2E command first.
- Add a CI job only after API, database, storage, and seed ownership are
  defined.
- Upload Playwright reports as artifacts with `if: always()` so failed runs
  remain diagnosable.

## Selector policy

Use selectors in this order:

1. Accessible role and accessible name.
2. Associated label, placeholder, or visible heading.
3. Stable `data-testid` added only where the UI has no reliable accessible
   target.
4. URL assertions for route boundaries.

Do not select by generated CSS classes, React component names, array indexes,
or translated implementation details when a semantic target exists.

## Acceptance criteria

- `npm run test:e2e` runs headlessly against a declared test environment.
- P0 journeys pass with deterministic seed data.
- A failing test produces an HTML report, screenshot, and trace when useful.
- No test requires production data or repository-stored credentials.
- Role and permission failures are asserted as user-visible outcomes, not only
  as hidden API calls.
- The report identifies the browser, CRM/API URLs, commit SHAs, test count,
  pass/fail state, and artifact locations.
- The suite is not added to the required CI gate until its environment is
  reproducible.

## Open decisions

| Decision | Owner | Required before |
|---|---|---|
| Stable CRM `E2E_BASE_URL` | Environment owner | Runner setup |
| API/database/storage lifecycle | API/infra owner | First P0 run |
| Seed/reset strategy | API/QA owner | Mutation journeys |
| Documentation supervisor behavior | CRM/API owners | Documentation journey |
| Artifact retention and redaction | Report owner | CI handoff |
| Required browsers | QA/team | Playwright config |
