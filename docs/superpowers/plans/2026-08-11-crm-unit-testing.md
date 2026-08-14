# CRM Unit Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish reproducible unit and component tests with local mocks and coverage evidence for stable CRM authentication and API behavior.

**Architecture:** Vitest extends the existing Vite configuration and runs React components in jsdom. Tests use only mocked authentication and Axios boundaries; CI generates and uploads coverage without starting an application server.

**Tech Stack:** Vitest, V8 coverage, jsdom, React Testing Library, user-event, jest-dom, React Query, React Router.

---

### Task 1: Configure the test runner

**Files:**
- Modify: `package.json`, `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] Add non-watch `test:run` and `test:coverage` scripts.
- [ ] Configure Vitest with the current `@/` alias, jsdom, jest-dom setup, V8 coverage, and text/LCOV/HTML reports in `coverage/`.
- [ ] Run `npm run test:run` and confirm the runner discovers the focused tests.

### Task 2: Cover authentication guards and session state

**Files:**
- Create: `src/test/test-utils.tsx`, `src/modules/auth/components/RequireAuth.test.tsx`, `src/modules/auth/components/RequirePermission.test.tsx`, `src/modules/auth/context/AuthContext.test.tsx`

- [ ] Render guards with Router, Tooltip, Query and Auth providers.
- [ ] Verify unauthenticated redirection, permission allow/deny fallback, token and user persistence on login, and local cleanup on logout using auth-service mocks.
- [ ] Run each auth-focused test file independently.

### Task 3: Cover API envelope and refresh boundary

**Files:**
- Create: `src/services/api.test.ts`

- [ ] Mock Axios and verify success-envelope unwrap, error-envelope normalization, and no refresh attempt for each public auth route after a 401.
- [ ] Run the API-focused test file independently.

### Task 4: Make evidence available in CI

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] Run non-mutating lint, `tsc -b --noEmit`, coverage tests, and build in CI.
- [ ] Upload `coverage/` using `actions/upload-artifact@v4`.
- [ ] Rerun the baseline commands and report before/after availability, pass state, coverage, lint, typecheck, and build.
