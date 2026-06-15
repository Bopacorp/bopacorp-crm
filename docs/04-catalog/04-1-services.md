# 4.1 — Service layer & types

## Goal

Create `src/modules/catalog/catalog.service.ts` with all API calls for catalog entities: lookup tables, categories, catalog items, content blocks, and contact requests.

## File

`src/modules/catalog/catalog.service.ts`

## Types from @bopacorp/shared/catalog

**Lookup entities** (ItemType, ContractType, Segment, Tier, GeoZone, BenefitType, ContentType — all identical shape):
- `Create{Entity}Request` — `{code, name, description?, isActive?}`
- `Update{Entity}Request` — all optional
- `List{Entity}Query` — extends PaginationQuery + `{search?, isActive?}`
- `{Entity}Response` — `{id, code, name, description|null, isActive, createdAt, updatedAt}`
- `{Entity}ListItemResponse` — `{id, code, name, isActive, createdAt, updatedAt}`

**Categories:**
- `CreateCategoryRequest`, `UpdateCategoryRequest`, `ListCategoriesQuery`
- `CategoryResponse`, `CategoryListItemResponse`, `CategoryTreeResponse`

**Catalog items:**
- `CreateCatalogItemRequest`, `UpdateCatalogItemRequest`, `ListCatalogItemsQuery`
- `CatalogItemResponse`, `CatalogItemListItemResponse`
- Detail sub-schemas: `CreateVoiceDetailSchema`, `CreateConnectivityDetailSchema`, `CreateDigitalDetailSchema`, `CreateRoamingDetailSchema`, `CreateDeviceDetailSchema`
- Benefit: `CreateItemBenefitSchema`
- Conditions: `CreateAgeConditionSchema`, `CreateLegalConditionSchema`, `CreateTemporalConditionSchema`

**Content blocks:**
- `CreateContentBlockRequest`, `UpdateContentBlockRequest`, `ListContentBlocksQuery`
- `ContentBlockResponse`

**Contact requests:**
- `CreateContactRequest`, `UpdateContactRequest`, `ListContactRequestsQuery`
- `ContactRequestResponse`

## Functions to implement

### Lookup tables (7 × 5 functions each)

Pattern for each entity (itemTypes, contractTypes, segments, tiers, geoZones, benefitTypes, contentTypes):

```ts
list{Entity}(params: List{Entity}Query)
  → GET /catalog/{kebab-entity} → requestPaginated<{Entity}ListItemResponse>

get{Entity}(id: string)
  → GET /catalog/{kebab-entity}/:id → request<{Entity}Response>

create{Entity}(data: Create{Entity}Request)
  → POST /catalog/{kebab-entity} → request<{Entity}Response>

update{Entity}(id: string, data: Update{Entity}Request)
  → PATCH /catalog/{kebab-entity}/:id → request<{Entity}Response>

disable{Entity}(id: string)
  → PATCH /catalog/{kebab-entity}/:id/disable → request<{Entity}Response>
```

API path mapping:
| Entity | API path segment |
|--------|-----------------|
| ItemType | `item-types` |
| ContractType | `contract-types` |
| Segment | `segments` |
| Tier | `tiers` |
| GeoZone | `geo-zones` |
| BenefitType | `benefit-types` |
| ContentType | `content-types` |

### Categories

```ts
listCategories(params: ListCategoriesQuery)
  → GET /catalog/categories → requestPaginated<CategoryListItemResponse>

getCategoryTree()
  → GET /catalog/categories/tree → request<CategoryTreeResponse[]>

getCategory(id: string)
  → GET /catalog/categories/:id → request<CategoryResponse>

createCategory(data: CreateCategoryRequest)
  → POST /catalog/categories → request<CategoryResponse>

updateCategory(id: string, data: UpdateCategoryRequest)
  → PATCH /catalog/categories/:id → request<CategoryResponse>

disableCategory(id: string)
  → PATCH /catalog/categories/:id/disable → request<CategoryResponse>
```

### Catalog Items

```ts
listCatalogItems(params: ListCatalogItemsQuery)
  → GET /catalog-items → requestPaginated<CatalogItemListItemResponse>

getCatalogItem(id: string)
  → GET /catalog-items/:id → request<CatalogItemResponse>

createCatalogItem(data: CreateCatalogItemRequest)
  → POST /catalog-items → request<CatalogItemResponse>

updateCatalogItem(id: string, data: UpdateCatalogItemRequest)
  → PATCH /catalog-items/:id → request<CatalogItemResponse>

deleteCatalogItem(id: string)
  → DELETE /catalog-items/:id → request<void>

uploadCatalogItemImage(id: string, file: File)
  → POST /catalog-items/:id/image → request<CatalogItemResponse>
  (multipart/form-data with field name "image")

deleteCatalogItemImage(id: string)
  → DELETE /catalog-items/:id/image → request<CatalogItemResponse>
```

### Content Blocks

```ts
listContentBlocks(params: ListContentBlocksQuery)
  → GET /catalog/content-blocks → requestPaginated<ContentBlockResponse>

getContentBlock(id: string)
  → GET /catalog/content-blocks/:id → request<ContentBlockResponse>

createContentBlock(data: CreateContentBlockRequest)
  → POST /catalog/content-blocks → request<ContentBlockResponse>

updateContentBlock(id: string, data: UpdateContentBlockRequest)
  → PATCH /catalog/content-blocks/:id → request<ContentBlockResponse>

deleteContentBlock(id: string)
  → DELETE /catalog/content-blocks/:id → request<void>
```

### Contact Requests

```ts
listContactRequests(params: ListContactRequestsQuery)
  → GET /contact-requests → requestPaginated<ContactRequestResponse>

getContactRequest(id: string)
  → GET /contact-requests/:id → request<ContactRequestResponse>

updateContactRequest(id: string, data: UpdateContactRequest)
  → PATCH /contact-requests/:id → request<ContactRequestResponse>
```

Note: `POST /contact-requests` is public (no auth) — only needed if CRM has a contact form. Skip for now.

## Pattern

Follow existing `request<T>()` and `requestPaginated<T>()` from `services/api.ts`. For image upload, use `api.post` with `FormData` and `Content-Type: multipart/form-data` header.

## Verification

- `npm run check` passes (types resolve, no unused imports)
- Each function signature matches API contract from shared types
