# 2.1 — Service layer & types

## Goal

Create `src/modules/negotiations/negotiations.service.ts` with all API calls for negotiations, business clients, visits, and lookup tables.

## File

`src/modules/negotiations/negotiations.service.ts`

## Types from @bopacorp/shared/crm

**Request types:**
- `CreateBusinessClientRequest`, `UpdateBusinessClientRequest`, `ListBusinessClientsQuery`
- `CreateNegotiationRequest`, `UpdateNegotiationRequest`, `ChangeNegotiationStateRequest`, `ListNegotiationsQuery`
- `CreateVisitRequest`, `UpdateVisitRequest`, `VerifyVisitRequest`, `ListVisitsQuery`
- `ListNegotiationStatesQuery`, `ListVisitTypesQuery`

**Response types:**
- `BusinessClientResponse`, `BusinessClientListItemResponse`
- `NegotiationResponse`, `NegotiationListItemResponse`
- `NegotiationStateResponse`, `NegotiationStateHistoryResponse`
- `VisitResponse`, `VisitListItemResponse`
- `VisitTypeResponse`

**From @bopacorp/shared/common:**
- `PaginationMeta`

## Functions to implement

### Business Clients
```ts
listBusinessClients(params: ListBusinessClientsQuery)
  → GET /crm/business-clients → requestPaginated<BusinessClientListItemResponse>

getBusinessClient(id: string)
  → GET /crm/business-clients/:id → request<BusinessClientResponse>

createBusinessClient(data: CreateBusinessClientRequest)
  → POST /crm/business-clients → request<BusinessClientResponse>

updateBusinessClient(id: string, data: UpdateBusinessClientRequest)
  → PATCH /crm/business-clients/:id → request<BusinessClientResponse>

deleteBusinessClient(id: string)
  → DELETE /crm/business-clients/:id → request<void>
```

### Negotiations
```ts
listNegotiations(params: ListNegotiationsQuery)
  → GET /crm/negotiations → requestPaginated<NegotiationListItemResponse>

getNegotiation(id: string)
  → GET /crm/negotiations/:id → request<NegotiationResponse>

createNegotiation(data: CreateNegotiationRequest)
  → POST /crm/negotiations → request<NegotiationResponse>

updateNegotiation(id: string, data: UpdateNegotiationRequest)
  → PATCH /crm/negotiations/:id → request<NegotiationResponse>

changeNegotiationState(id: string, data: ChangeNegotiationStateRequest)
  → PATCH /crm/negotiations/:id/state → request<NegotiationResponse>

getNegotiationHistory(id: string)
  → GET /crm/negotiations/:id/history → request<NegotiationStateHistoryResponse[]>
```

### Negotiation States (lookup)
```ts
listNegotiationStates(params?: ListNegotiationStatesQuery)
  → GET /crm/negotiation-states → requestPaginated<NegotiationStateResponse>
```

### Visits
```ts
listVisits(params: ListVisitsQuery)
  → GET /crm/visits → requestPaginated<VisitListItemResponse>

getVisit(id: string)
  → GET /crm/visits/:id → request<VisitResponse>

createVisit(data: CreateVisitRequest)
  → POST /crm/visits → request<VisitResponse>

updateVisit(id: string, data: UpdateVisitRequest)
  → PATCH /crm/visits/:id → request<VisitResponse>

verifyVisit(id: string, data: VerifyVisitRequest)
  → PATCH /crm/visits/:id/verify → request<VisitResponse>
```

### Visit Types (lookup)
```ts
listVisitTypes(params?: ListVisitTypesQuery)
  → GET /crm/visit-types → requestPaginated<VisitTypeResponse>
```

## Pattern

Follow existing `request<T>()` and `requestPaginated<T>()` from `services/api.ts`. Each function is a one-liner. Export all as named exports.

## Verification

- `npm run check` passes (types resolve, no unused imports)
- Each function signature matches API contract from shared types
