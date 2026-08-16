# Phase 9 — Fixtures and Data Safety

## Authentication

Role credentials are resolved only at runtime by `e2e/support/auth.ts` from
these variable names:

```text
E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
E2E_MANAGER_EMAIL / E2E_MANAGER_PASSWORD
E2E_SUPERVISOR_EMAIL / E2E_SUPERVISOR_PASSWORD
E2E_ADVISOR_EMAIL / E2E_ADVISOR_PASSWORD
E2E_COORDINATOR_EMAIL / E2E_COORDINATOR_PASSWORD
```

The repository contains no values for these variables. Do not put credentials
in `.env`, Markdown, screenshots, traces, fixtures, or test source. Use an
approved local secret manager or ephemeral shell variables.

## Run markers

Each test receives a marker in the form:

```text
e2e-{timestamp}-{workerIndex}-{repeatIndex}-{randomSuffix}
```

The marker is embedded in mutable names and notes. The RUC generator adds a
unique numeric suffix to the Ecuadorian RUC-shaped value used by the CRM client
form. The marker makes list-based cleanup narrow and auditable.

## Resource registry

`MutationTestRun` exposes three registration patterns:

- `register(label, action)` for custom cleanup such as image deletion and
  restoration of seeded values;
- `registerDelete(api, path)` for a known resource ID;
- `registerSearchDelete(api, listPath, query, resourcePath, label)` for a
  marker-scoped list followed by reverse deletion.

Actions execute in reverse registration order. Cleanup continues after an
individual error so the final error reports all failed labels. The fixture
attaches `mutable-e2e-cleanup-error.txt` to the test result when cleanup fails.

## Deletion policy

- Never use a broad unfiltered delete.
- Prefer a unique marker, RUC, filename, or exact resource ID.
- Delete children before parents: image/document/visit, then negotiation/client
  or catalog/vacancy.
- Use `ignoreMissing` only for idempotent cleanup retries.
- After deletion, call the API and require HTTP 404.
- Document deletion is currently a logical soft-delete. The test verifies that
  the document record is no longer returned and responds 404; it does not claim
  that the underlying storage object has been physically removed.
- Seeded sales targets are restored to their captured original values; they are
  not deleted.

## Synthetic files

`e2e/support/synthetic-files.ts` creates a small PDF and a one-pixel PNG during
the test. The files are placed below `testInfo.outputPath('fixtures')`, which
resolves under ignored `test-results/`. No binary file is committed.

The generated PDF is padded so it satisfies the API's minimum-size validation
while remaining deterministic and safe for a test-only storage bucket.

## API boundary

`e2e/support/api.ts` sends only the bearer token required by the test request,
does not log headers or bodies, and exposes the API envelope data to the test.
It supports multipart upload without writing credentials or response content to
the repository. Failure messages contain method, path, status, and API error
code only.

## Failure handling

When a test fails before cleanup registration, inspect the test output and use
the unique run marker to remove only the resources created by that run. When
the fixture reports a cleanup error, do not rerun a broad delete; fix the
specific labeled action or perform a marker-scoped manual cleanup.

## Known storage limitation

The current document-delete API marks `negotiation_documents.deletedAt` but does
not expose a verified physical object-deletion operation. A future API/storage
phase should add and test object garbage collection for uploaded document paths.
