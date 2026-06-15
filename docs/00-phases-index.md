# CRM Frontend — Implementation Phases

## Phase order

| # | Phase | File | Depends on |
|---|-------|------|------------|
| 1 | **Foundation & Auth** | [01-foundation-auth.md](./01-foundation-auth.md) | — |
| 2 | **Negotiations & Clients** | [02-negotiations.md](./02-negotiations.md) | Phase 1 |
| 3 | **Documentation** | [03-documentation.md](./03-documentation.md) | Phase 2 |
| 4a | **Catalog (Products)** | [04-catalog/00-index.md](./04-catalog/00-index.md) | Phase 2 |
| 4b | **Matrices (Offers)** | [04-catalog-matrices.md](./04-catalog-matrices.md) | Phase 4a |
| 5 | **Reports** | [05-reports.md](./05-reports.md) | Phase 2 |
| 6 | **Employability** | [06-employability.md](./06-employability.md) | Phase 1 |
| 7 | **Overview Dashboard** | [07-overview.md](./07-overview.md) | Phases 2–6 |
| 8 | **Notifications & Polish** | [08-notifications-polish.md](./08-notifications-polish.md) | All above |

## Conventions across all phases

- Import types from `@bopacorp/shared/<module>` — never define inline interfaces
- Follow CMS patterns: service file → custom hook → page component
- API calls via `request<T>()` and `requestPaginated<T>()` from `services/api.ts`
- Permission gating via `<Can>` component and `usePermission()` hook
- Spanish UI labels, English code
- All forms use shadcn `FieldGroup` + `Field` pattern
- Toast via `sonner` for success/error feedback
- `useDebounce` (300ms) for search inputs
