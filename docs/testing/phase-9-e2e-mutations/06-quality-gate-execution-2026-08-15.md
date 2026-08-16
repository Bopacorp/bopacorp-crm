# Quality-Gate Execution Record — 2026-08-15

## Scope

This record validates the CRM quality gate after aligning Vitest with the
`bopacorp-web` configuration. The default Vitest runner is limited to
`src/**/*.{test,spec}.{ts,tsx}`, integration tests remain on their dedicated
configuration, and the critical-code coverage threshold requires at least 80%
of lines.

## Revision and environment

- CRM revision: `49e0733ac3cb983962ffc029c099974b134b2854`
- Branch: `main`
- Date: `2026-08-15`
- Node: `22.22.2`
- Vitest: `4.1.10`
- Coverage provider: V8
- Local coverage output: `coverage/` (ignored; not committed)

## Results

| Check | Command | Result |
| --- | --- | --- |
| Critical-code coverage | `npm run test:coverage` | **Passed** — 47 files, 174 tests; 85.32% lines, 83.80% statements, 81.28% functions, 69.51% branches |
| Unit/component tests | `npm run test:run` | **Passed** — 47 files, 174 tests |
| Lint | `npm run lint` | **Passed** — Biome checked 292 files |
| Typecheck | `npx tsc -b --noEmit` | **Passed** |
| Build | `npm run build` | **Passed** — existing large-chunk warning remains |
| E2E typecheck | `npm run test:e2e:typecheck` | **Passed** |
| API integration | `npm run test:integration` | **Blocked** — API unavailable and required test-account variables were not loaded |
| Browser E2E | `npm run test:e2e` | **Not run** — CRM and API were not listening on ports 5173 and 3000 |

The coverage threshold passed because the configured critical-code line result
was 85.32%, above the required 80%. The branch result is reported for
visibility but is not a gate in this phase.

## Integration and E2E boundary

The integration command discovered only the two files under
`src/integration/`, confirming that the test runners remain separated. Its 12
tests could not exercise the API because the local environment did not provide
the runtime account variables or an API process. No credentials were written
to the repository or this record.

The E2E typecheck passed. The browser suite was not started because readiness
checks returned no connection on `http://localhost:3000` and
`http://localhost:5173`. The earlier 16/16 browser result remains historical
evidence from the Phase 9 execution record and must be rerun against this
revision after both services and runtime variables are available.

## CI effect

The standard CI workflow already runs lint, typecheck, `npm run test:coverage`,
build, and coverage artifact upload. The new `thresholds.lines: 80` setting
makes the coverage step fail when critical-code line coverage falls below the
target. Playwright remains outside the required CI gate until an isolated API,
database, storage, browser, and secret-injection environment is available.

## Remaining follow-up

- Start the test API and CRM with approved runtime variables.
- Rerun `npm run test:integration` and `npm run test:e2e` on this revision.
- Capture the resulting reports and cleanup status without committing raw
  screenshots, traces, tokens, or seeded personal data.
- Confirm the GitHub Actions run and downloaded `coverage-report` artifact.
