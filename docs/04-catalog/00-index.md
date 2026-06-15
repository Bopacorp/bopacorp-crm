# Phase 4 — Catalog — Sub-phases

| # | Sub-phase | File | Depends on |
|---|-----------|------|------------|
| 4.1 | **Service layer & types** | [04-1-services.md](./04-1-services.md) | — |
| 4.2 | **Data hooks** | [04-2-hooks.md](./04-2-hooks.md) | 4.1 |
| 4.3 | **Lookup tables CRUD** | [04-3-lookup-tables.md](./04-3-lookup-tables.md) | 4.2 |
| 4.4 | **Categories tree** | [04-4-categories.md](./04-4-categories.md) | 4.2 |
| 4.5 | **Catalog items list** | [04-5-catalog-items-list.md](./04-5-catalog-items-list.md) | 4.2, 4.3, 4.4 |
| 4.6 | **Catalog item detail** | [04-6-catalog-item-detail.md](./04-6-catalog-item-detail.md) | 4.5 |
| 4.7 | **Catalog item form** | [04-7-catalog-item-form.md](./04-7-catalog-item-form.md) | 4.5, 4.6 |
| 4.8 | **Content blocks (CMS)** | [04-8-content-blocks.md](./04-8-content-blocks.md) | 4.2 |
| 4.9 | **Contact requests** | [04-9-contact-requests.md](./04-9-contact-requests.md) | 4.2 |

## Build order

```
4.1 Services ──► 4.2 Hooks ──┬──► 4.3 Lookup tables ──┐
                              │                         ├──► 4.5 Items list ──► 4.6 Detail ──► 4.7 Form
                              ├──► 4.4 Categories ──────┘
                              ├──► 4.8 Content blocks
                              └──► 4.9 Contact requests
```

Services and hooks are foundational. Lookup tables and categories can be built in parallel — both needed before catalog items (items reference them via FK). Content blocks and contact requests are independent and can be built anytime after hooks.

## Routing plan

| Path | Page | Notes |
|------|------|-------|
| `/catalogo` | CatalogItemsPage | Main product list (replaces current stub) |
| `/catalogo/:id` | CatalogItemDetailPage | Product detail view |
| `/catalogo/configuracion` | CatalogSettingsPage | Tabbed page for all 7 lookup tables + categories |
| `/catalogo/contenido` | ContentBlocksPage | CMS content management |
| `/catalogo/solicitudes` | ContactRequestsPage | Contact request inbox |

## Note on matrices

Offer matrices (`/catalogo/matrices`) are documented in the original `04-catalog-matrices.md`. They depend on catalog items being available (for the line item picker). Build catalog items first, then matrices.
