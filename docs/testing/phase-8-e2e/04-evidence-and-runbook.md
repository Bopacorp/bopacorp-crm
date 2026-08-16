# Phase 8 — E2E Evidence and Execution Runbook

## Local execution sequence

The first implementation should use an explicitly prepared environment:

1. Confirm the CRM test URL and API URL.
2. Confirm the API, database, and test storage are running.
3. Apply the documented seed/reset revision.
4. Export the role credentials in the shell or load them from an approved local
   secret manager.
5. Start the CRM against the test API.
6. Run the selected Playwright project headlessly.
7. Inspect the HTML report and failed-test artifacts.
8. Run cleanup/reset and record the result.

Commands for the initial implementation:

```bash
npm run test:e2e:typecheck
npm run test:e2e
npm run test:e2e:report
```

The initial Phase 8 run does not require a seed reset because its journeys are
read-only. The separately scoped mutation run requires the marker-based cleanup
and test-only storage rules documented in
[Phase 9](../phase-9-e2e-mutations/04-evidence-and-runbook.md).

Interactive debugging may use the Playwright UI mode, but CI must use a
headless command with deterministic timeouts.

## Artifact contract

The E2E job should publish these directories when available:

```text
playwright-report/
test-results/
```

The report should include:

- test case ID and role;
- pass/fail/skip status;
- browser and operating-system version;
- CRM/API base URLs without secrets;
- CRM, API, and shared repository SHAs;
- seed revision;
- screenshots for selected acceptance steps;
- trace and video for failures or explicitly selected journeys;
- failure message and retest reference.

CI artifact upload should use `if: always()` so failed runs remain useful for
diagnosis. Retention should follow the academic/project evidence policy.

## Illustrative evidence policy

The final report should not contain a screenshot for every click. For each
selected journey, keep three to five images:

1. authenticated starting screen and role-visible navigation;
2. critical form or action before submission;
3. successful result, state change, or permission outcome;
4. optional error validation or export result;
5. optional final detail/history screen.

Each image requires a caption containing the case ID, role, action, expected
result, and observed result. Redact or replace sensitive values before adding
it to Bopadigital or the final report.

## Execution record template

```markdown
## E2E execution — YYYY-MM-DD

- CRM SHA:
- API SHA:
- Shared SHA:
- Seed revision:
- Environment:
- Browser:
- Command:
- Result:
- Passed cases:
- Failed cases:
- Skipped cases:
- HTML report:
- Screenshots/traces:
- Cleanup result:
- Known defects:
```

The first local execution is recorded in
[05-execution-2026-08-15.md](./05-execution-2026-08-15.md). The mutable
execution is recorded in
[Phase 9's execution record](../phase-9-e2e-mutations/05-execution-2026-08-15.md).

## CI handoff requirements

Before adding E2E as a required check:

- provide an isolated API/database/storage service or environment;
- install browser dependencies in the runner;
- load credentials from repository/environment secrets;
- seed data deterministically;
- start the CRM and API with health checks;
- run `npm run test:e2e`;
- upload reports with `if: always()`;
- keep E2E separate from the unit coverage threshold;
- fail the job when a required P0 journey fails.

## Acceptance checklist

- [ ] P0 cases pass in the declared test environment.
- [ ] Negative permission case proves the UI outcome, not only the HTTP code.
- [ ] Created data is cleaned up or the environment is reset.
- [ ] Failed runs contain enough artifact detail to reproduce the problem.
- [ ] Screenshots are illustrative, anonymized, and linked to the matrix.
- [ ] Run record includes date, URLs, SHAs, seed, browser, and command.
- [ ] No credentials or tokens are present in source or artifacts.
