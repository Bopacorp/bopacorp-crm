# 2.2 — Data hooks

## Goal

Create React hooks that wrap service layer calls with loading/error state, pagination, and refetch capability. These hooks are consumed by all pages and components.

## Files

`src/modules/negotiations/hooks/` directory:
- `useNegotiations.ts`
- `useNegotiation.ts`
- `useNegotiationHistory.ts`
- `useBusinessClients.ts`
- `useVisits.ts`
- `useNegotiationStates.ts`
- `useVisitTypes.ts`

## Hook signatures

### useNegotiations(page, filters)
```ts
interface NegotiationFilters {
  search?: string;
  stateId?: string;
  advisorId?: string;
}

function useNegotiations(page: number, filters: NegotiationFilters)
  → { negotiations, meta, loading, error, refetch }
```
- Fetches paginated list via `listNegotiations()`
- Debounced search (300ms)
- Refetches on page/filter change

### useNegotiation(id)
```ts
function useNegotiation(id: string)
  → { negotiation, loading, error, refetch }
```
- Single negotiation detail

### useNegotiationHistory(id)
```ts
function useNegotiationHistory(id: string)
  → { history, loading, error, refetch }
```
- State change history array

### useBusinessClients(page, filters)
```ts
interface BusinessClientFilters {
  search?: string;
}

function useBusinessClients(page: number, filters: BusinessClientFilters)
  → { clients, meta, loading, error, refetch }
```

### useVisits(params)
```ts
interface VisitFilters {
  negotiationId?: string;
  businessClientId?: string;
  advisorId?: string;
  startDate?: string;
  endDate?: string;
}

function useVisits(page: number, filters: VisitFilters)
  → { visits, meta, loading, error, refetch }
```

### useNegotiationStates()
```ts
function useNegotiationStates()
  → { states, loading, error }
```
- Fetches once on mount, no pagination needed (small lookup table)

### useVisitTypes()
```ts
function useVisitTypes()
  → { visitTypes, loading, error }
```
- Same pattern as states — fetch once

## Pattern

Each hook uses `useState` + `useEffect` + service call. Error stored as `unknown`, displayed via `getErrorMessage()`. Loading starts true on mount/refetch. Cleanup with abort signal or stale flag to prevent state updates after unmount.

## Verification

- `npm run check` passes
- Each hook returns correct types
- Stale closure / race condition handled (effect cleanup)
