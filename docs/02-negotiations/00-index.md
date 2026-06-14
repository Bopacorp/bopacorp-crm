# Phase 2 — Negotiations & Clients — Sub-phases

| # | Sub-phase | File | Depends on |
|---|-----------|------|------------|
| 2.1 | **Service layer & types** | [02-1-services.md](./02-1-services.md) | — |
| 2.2 | **Data hooks** | [02-2-hooks.md](./02-2-hooks.md) | 2.1 |
| 2.3 | **Negotiations list page** | [02-3-negotiations-list.md](./02-3-negotiations-list.md) | 2.2 |
| 2.4 | **Negotiation detail page** | [02-4-negotiation-detail.md](./02-4-negotiation-detail.md) | 2.2, 2.3 |
| 2.5 | **Business client management** | [02-5-business-clients.md](./02-5-business-clients.md) | 2.2 |
| 2.6 | **Visits** | [02-6-visits.md](./02-6-visits.md) | 2.2, 2.4 |
| 2.7 | **Permission gating & sidebar** | [02-7-permissions.md](./02-7-permissions.md) | 2.3–2.6 |

## Build order

```
2.1 Services ──► 2.2 Hooks ──┬──► 2.3 List page ──► 2.4 Detail page
                              ├──► 2.5 Clients
                              └──► 2.6 Visits ──────────────┐
                                                             ▼
                                                    2.7 Permissions
```

Services and hooks are foundational — everything depends on them. List page and detail page are sequential (detail links from list). Clients and visits can be built in parallel after hooks. Permissions wired last once all UI exists.
