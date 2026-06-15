# 4.6 — Catalog item detail page

## Goal

Build the product detail view showing all item data organized by sections, with type-specific detail panels.

## Page

`src/modules/catalog/pages/CatalogItemDetailPage.tsx`

Route: `/catalogo/:id`

## Layout

### Header

- Back button → `/catalogo`
- Product name (`h1`)
- StateBadge (active/inactive)
- Published badge
- Image thumbnail (if exists), click to enlarge
- Actions:
  - "Editar" button → opens edit form (permission: `catalog_items.update`)
  - "Eliminar" button → delete confirmation (permission: `catalog_items.delete`)
  - "Subir imagen" / "Eliminar imagen" (permission: `catalog_items.update`)

### Sections

Organized as card-based sections (not tabs — all visible at once, scrollable):

#### 1. Información general

| Field | Value |
|-------|-------|
| Nombre | `name` |
| Descripción | `description` or "—" |
| Precio | `$price` formatted |
| Código de activación | `activationCode` or "—" |
| Permanencia | `permanenceMonths` meses (or "Sin permanencia" if 0) |
| Categoría | `category.name` |
| Tipo de item | `itemType.name` |
| Tipo de contrato | `contractType.name` |
| Segmento | `segment.name` |
| Nivel | `tier.name` |

#### 2. Detalle técnico (conditional on itemType)

Show only the detail section matching the item's type. Title changes per type.

**Voz** (when `voiceDetails` exists):

| Field | Value |
|-------|-------|
| Gigas estructurales | `gigasStructural` GB |
| Gigas fidelización | `gigasLoyalty` GB |
| Minutos nacionales | `minutesNational` or "Ilimitados" if `hasUnlimitedMinutes` |
| Minutos LDI | `minutesLdi` |
| SMS | `sms` |
| WhatsApp ilimitado | Sí/No (`hasUnlimitedWhatsapp`) |
| Redes sociales | Sí/No (`hasSocialNetworks`) |
| Roaming incluido | `includedRoamingGb` GB |

**Conectividad** (when `connectivityDetails` exists):

| Field | Value |
|-------|-------|
| Ancho de banda | `bandwidthMbps` Mbps |

**Digital** (when `digitalDetails` exists):

| Field | Value |
|-------|-------|
| Proveedor | `provider` |

**Roaming** (when `roamingDetails` exists):

| Field | Value |
|-------|-------|
| Zona geográfica | `geoZone.name` (nested from response) |
| Datos | `dataMb` MB |
| Duración | `durationDays` días |
| Throttle | Sí/No (`hasThrottle`) |

**Dispositivo** (when `deviceDetails` exists):

| Field | Value |
|-------|-------|
| Marca | `brand` |
| Modelo | `model` |
| Almacenamiento | `storageGb` GB or "—" |
| Financiamiento | `financingMonths` meses or "—" |
| Cuota mensual | `$financingMonthly` or "—" |

#### 3. Beneficios

Table or list of `benefits[]`:

| Column | Value |
|--------|-------|
| Tipo | benefit type name (from `benefitTypeId` — need to resolve or backend includes it) |
| Nombre | `name` |
| Descripción | `description` or "—" |
| Duración | `durationDays` días or "Permanente" |

Empty state if no benefits: "Sin beneficios configurados"

#### 4. Condiciones (if any exist)

Show applicable condition cards:

**Edad** (when `ageConditions` exists):
- Edad mínima: `minAge` años
- Edad máxima: `maxAge` años or "Sin límite"

**Legales** (when `legalConditions` exists):
- Requisito: `legalRequirement`
- Descripción: `description` or "—"

**Temporales** (when `temporalConditions` exists):
- Vigencia desde: `effectiveDate` formatted
- Vencimiento: `expirationDate` formatted or "Sin vencimiento"

## Image management

**Upload:**
- Button "Subir imagen" opens file picker (JPG, PNG, WebP)
- On select → `uploadCatalogItemImage(id, file)` → refetch → toast
- Show upload progress if possible

**Display:**
- If `imagePath` exists, show as rounded image in header area
- Click to view full size in a dialog

**Delete:**
- Button appears only when image exists
- Confirmation → `deleteCatalogItemImage(id)` → refetch → toast

## Delete item

Soft delete via `DELETE /catalog-items/:id`. Confirmation dialog with item name. On success → navigate back to `/catalogo` → toast.

## Loading state

Use skeleton layout matching the section structure. `SheetDetailSkeleton` pattern adapted for full page (not sheet).

## Verification

- `npm run check` passes
- Detail loads correct data
- Type-specific section shows only for matching itemType
- Benefits list renders correctly
- Conditions show when present
- Image upload/delete works
- Delete navigates back to list
- Loading shows skeletons
