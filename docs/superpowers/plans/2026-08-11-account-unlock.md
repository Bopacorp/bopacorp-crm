# Account Unlock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authorized organization managers to inspect and unlock a locked employee account.

**Architecture:** Extend the existing typed user service and React Query keys, gate lock data behind `users.unlock`, and surface the action from the employee sheet. The dialog owns form validation and mutation feedback while the sheet refreshes its account data.

**Tech Stack:** React, TypeScript, React Query, react-hook-form, Zod, shadcn/ui, i18next.

---

### Task 1: Upgrade the shared API contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Run `npm install @bopacorp/shared@^0.3.1 --save` so the UI receives `LockStatusResponse`, `UnlockUserRequest`, and `UnlockUserRequestSchema`.

### Task 2: Add typed lock service and query key

**Files:**
- Modify: `src/modules/org/users.service.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] Add GET lock-status and POST unlock request helpers plus the local unlock response type and a per-user lock-status query key.

### Task 3: Add the permission-gated UI

**Files:**
- Create: `src/modules/org/components/UnlockAccountDialog.tsx`
- Modify: `src/modules/org/components/EmployeeSheet.tsx`
- Modify: `src/modules/org/pages/TeamPage.tsx`

- [ ] Use the shared unlock schema with trim/min/max validation, localized outcomes, feature-specific conflict feedback, and React Query invalidation.
- [ ] Request and display lock data only for `users.unlock`; add a conditional lock column and sheet section/action.

### Task 4: Localize and document the permission

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `docs/roles-permissions-matrix.md`

- [ ] Add Spanish and English labels/messages and document `users.unlock` for manager with inherited admin access.

### Task 5: Verify

**Files:**
- Test: project lint and production build

- [ ] Run `npm run lint` and `npm run build`; resolve feature-related errors before handoff.
