# Phase 9 — Mutable CRM End-to-End Testing

Status: implemented and locally validated. The consolidated Chromium run passed
5 of 5 mutable journeys on 2026-08-15. CI orchestration, isolated environment
provisioning, screenshot anonymization, and physical document-object garbage
collection remain follow-up work.

## Purpose

Phase 9 extends the Phase 8 browser baseline with representative mutations in
the CRM. It demonstrates that the most important create, update, transition,
upload, publish, review, restore, and delete paths work in a real browser while
protecting the seeded test environment with unique markers and reverse cleanup.

This phase is an illustrative integration/E2E sample. It is intentionally
separate from the unit-test coverage threshold and does not claim broad browser
coverage of every CRM screen or permission combination.

## Entry criteria

- The CRM is running at `http://localhost:5173`.
- The API is running at `http://localhost:3000/api/v1`.
- The database and test storage are available.
- Role credentials are supplied through environment variables; they are never
  stored in the repository.
- The local environment is test-only and may contain the seeded records used by
  the journeys.

## Documents in this folder

- [Implementation plan](./01-implementation-plan.md)
- [Mutable journey matrix](./02-mutable-journey-matrix.md)
- [Fixtures and data-safety rules](./03-fixtures-and-data-safety.md)
- [Evidence and execution runbook](./04-evidence-and-runbook.md)
- [Execution record for 2026-08-15](./05-execution-2026-08-15.md)

## Relationship with Phase 8

[Phase 8](../phase-8-e2e/00-index.md) remains the read-only browser baseline:
authentication, navigation, protected routes, and non-submitting inspections.
This folder owns the mutation journeys so the two phases can be run and
reported independently.

## Phase exit

Phase 9 is complete for the local/manual scope when all five P0/P1 sample
journeys pass, every created resource is cleaned or verified missing, failed
runs attach cleanup diagnostics, and the execution record names the environment
and repository revisions. A future CI phase may promote these cases to a
required check after isolated database/storage provisioning is available.
