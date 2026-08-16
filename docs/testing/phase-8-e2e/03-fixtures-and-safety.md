# Phase 8 — Fixtures and Data Safety

## Environment variables

The final Playwright runner should read values from the environment or CI
secret storage. Suggested names are:

```text
E2E_BASE_URL
E2E_API_URL
E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
E2E_MANAGER_EMAIL
E2E_MANAGER_PASSWORD
E2E_SUPERVISOR_EMAIL
E2E_SUPERVISOR_PASSWORD
E2E_ADVISOR_EMAIL
E2E_ADVISOR_PASSWORD
E2E_COORDINATOR_EMAIL
E2E_COORDINATOR_PASSWORD
```

No populated `.env` file, password, token, or storage credential may be
committed. Local examples must contain empty placeholders only.

## Required seed graph for the first delivery

The test environment should expose deterministic, anonymized records for:

- one advisor with owned client, negotiation, and document records;
- one supervisor and one manager with report records;
- pending documentation and document review actions;
- report records that can render with a date filter.

The broader catalog, employability, upload, and state-transition graph remains
required for the deferred mutation iteration, not for the initial read-only
sample.

Use stable IDs or unique data markers returned by the seed process. Do not
couple tests to production names or historical row order.

## File fixtures

Store only synthetic files under an E2E fixture directory:

```text
e2e/fixtures/files/valid-document.pdf
e2e/fixtures/files/valid-image.jpg
e2e/fixtures/files/valid-cv.pdf
e2e/fixtures/files/invalid-extension.exe
e2e/fixtures/files/empty-file.pdf
```

Size-boundary files should be generated during setup or provided by the test
environment. Do not commit customer documents or files copied from storage.

## Mutation and cleanup policy for follow-up iterations

1. Prefer a resettable test database over cleanup that depends on UI actions.
2. Give every created record a unique run marker.
3. If a journey mutates state, run it against a dedicated fixture and restore
   it before the next role starts.
4. Never run mutation journeys against production.
5. If cleanup fails, fail the run and preserve the diagnostic artifact.
6. Do not let tests depend on execution order unless the dependency is an
   explicit fixture.

## Screenshot safety

Before publishing an artifact:

- check that no password field, token, authorization header, or browser storage
  value is visible;
- replace personal names, emails, phone numbers, and client identifiers with
  synthetic values when they appear in screenshots;
- keep the URL limited to the approved test host;
- remove screenshots that are not needed for the acceptance claim.

## Data readiness checklist

- [ ] Test database is isolated from production.
- [ ] Seed version and SHA are recorded.
- [ ] Role accounts are available through secrets, not files.
- [ ] Ownership/supervision relationships are deterministic.
- [ ] Document, report, catalog, vacancy, and CV fixtures exist.
- [ ] Reset or cleanup command is documented and tested.
- [ ] Storage bucket/path is test-only.
