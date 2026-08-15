# Phase 7 — API and RBAC Integration Test Report

Date: 2026-08-15

## Scope

This phase verifies the CRM frontend against the running Bopacorp API. The
integration suite uses the same service functions consumed by the application
and a small direct HTTP client for authentication, authorization, and error
envelope assertions.

The test accounts are provided through process environment variables. No
password or token is stored in the repository.

## Reproducible execution

Start the API at `http://localhost:3000`, then provide the variables described
in [`.env.integration.example`](../../.env.integration.example). The example
file contains placeholders only.

```bash
npm run test:integration
```

The integration runner is intentionally separate from the default Vitest
configuration so that a normal unit/component run never requires a live API or
test credentials.

## Observed results

| Check | Command | Result |
|---|---|---|
| API integration | `npm run test:integration` | 2 files, 12 passed |
| Unit/component suite | `npm run test:run` | 47 files, 174 passed |
| Lint | `npm run lint` | 276 files checked, no errors |
| Typecheck | `npx tsc -b --noEmit` | Passed |
| Production build | `npm run build` | Passed |
| Diff hygiene | `git diff --check` | Passed |

## HTTP and RBAC evidence

| Scenario | Expected result | Observed contract |
|---|---:|---|
| Protected profile request without a token | 401 | `UNAUTHORIZED` |
| Supervisor reads `/users` | 200 | Allowed by `users.read` |
| Advisor reads `/users` | 403 | `FORBIDDEN` |
| Invalid CRM query or body | 422 | `VALIDATION_ERROR` with details |
| Missing business-client UUID | 404 | `RESOURCE_NOT_FOUND` |
| Category cannot be its own parent | 409 | `CONFLICT` |

The suite also authenticates admin, manager, supervisor, advisor, and
coordinator accounts; verifies profile roles; exercises refresh and logout;
checks manager CRM/documentation/employability/report collections; and checks
advisor ownership plus supervisor scope.

## Known API contract difference

`GET /catalog/categories` accepts pagination-shaped query parameters but the
current API response contains only `{ success, data }` and does not include
`meta`. Catalog items and contact requests return pagination metadata. The
integration test records this behavior explicitly instead of treating the
endpoint as paginated. A future contract cleanup should either add metadata to
the API or adapt the CRM category service and hook to the non-paginated
response.

## Reproducibility boundary

The observed run used the following repository heads:

| Repository | Observed head | Working tree |
|---|---|---|
| CRM | `d7ed513` | Fase 7 changes were in the working tree during the run |
| API | `4018bd5` | Clean |
| Shared | `4cbf3d4` | Local modifications present |

These values are an execution snapshot, not a coordinated release SHA. The
CRM phase commit created from this report is the revision to use for future
retests. A coordinated SHA should still include the intended API/shared
revisions after their worktrees are clean or explicitly selected.

## Deferred coverage

This phase does not perform destructive live mutations. Account blocking,
successful state transitions, document upload/storage, and browser journeys
remain candidates for the coordinated API follow-up and Phase 8 E2E testing.
