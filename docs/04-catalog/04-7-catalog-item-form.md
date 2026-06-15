# 4.7 — Catalog item form (create & edit)

## Goal

Build the polymorphic product form. This is the most complex component — fields change based on selected `itemType`, plus dynamic benefits list and optional condition sections.

## Components

### Main form

`src/modules/catalog/components/CatalogItemForm.tsx`

Used by both create dialog and edit page. Follows shared form pattern from `docs/09-crud-standards.md`.

### Form structure

Multi-section form with conditional rendering. NOT tabs — all sections visible in a scrollable form, with type-specific section appearing/disappearing based on `itemTypeId` selection.

```
┌─ Información general ──────────────────────┐
│ name, description, price, activationCode,   │
│ permanenceMonths, categoryId, itemTypeId,   │
│ contractTypeId, segmentId, tierId,          │
│ isActive, isPublished                       │
└─────────────────────────────────────────────┘
┌─ Detalle técnico (conditional) ─────────────┐
│ Voice fields OR Connectivity fields OR ...   │
│ Changes when itemTypeId changes              │
└─────────────────────────────────────────────┘
┌─ Beneficios (dynamic list) ─────────────────┐
│ Repeatable rows: benefitTypeId, name,        │
│ description, durationDays                    │
│ [+ Agregar beneficio] button                 │
└─────────────────────────────────────────────┘
┌─ Condiciones (collapsible, optional) ───────┐
│ Age conditions toggle + fields               │
│ Legal conditions toggle + fields             │
│ Temporal conditions toggle + fields          │
└─────────────────────────────────────────────┘
```

## Section 1: Información general

All products share these fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | text | Yes | Max 200 chars |
| `description` | textarea | No | |
| `price` | number | Yes | Min 0, step 0.01 |
| `activationCode` | text | No | Max 50 chars |
| `permanenceMonths` | number | No | Default 0, min 0 |
| `categoryId` | select | Yes | From `useCategoryOptions()` |
| `itemTypeId` | select | Yes | From `useItemTypeOptions()` — triggers section 2 change |
| `contractTypeId` | select | Yes | From `useContractTypeOptions()` |
| `segmentId` | select | Yes | From `useSegmentOptions()` |
| `tierId` | select | Yes | From `useTierOptions()` |
| `isActive` | switch | No | Default true. Only show on edit |
| `isPublished` | switch | No | Default false |

All selects use the `*Options()` hooks for dropdown data.

## Section 2: Detalle técnico (polymorphic)

Rendered conditionally based on selected `itemTypeId`. When item type changes, clear previous detail fields and show new ones.

Map `itemType.code` to determine which sub-form to show:

| Item type code | Sub-form component | Fields |
|---------------|-------------------|--------|
| `voice` | `VoiceDetailFields` | gigasStructural*, gigasLoyalty, minutesNational, minutesLdi, sms, hasUnlimitedMinutes, hasUnlimitedWhatsapp, hasSocialNetworks, includedRoamingGb |
| `connectivity` | `ConnectivityDetailFields` | bandwidthMbps* |
| `digital` | `DigitalDetailFields` | provider* |
| `roaming` | `RoamingDetailFields` | geoZoneId*, dataMb*, durationDays*, hasThrottle |
| `device` | `DeviceDetailFields` | brand*, model*, storageGb, financingMonths, financingMonthly |

`*` = required field for that type.

### Implementation pattern

```tsx
function TypeSpecificFields({ itemTypeCode }: { itemTypeCode: string | null }) {
  switch (itemTypeCode) {
    case 'voice': return <VoiceDetailFields />;
    case 'connectivity': return <ConnectivityDetailFields />;
    case 'digital': return <DigitalDetailFields />;
    case 'roaming': return <RoamingDetailFields />;
    case 'device': return <DeviceDetailFields />;
    default: return null;
  }
}
```

Each sub-form is a simple component rendering FieldGroup + Field + FieldLabel for its fields. State managed by parent form.

### Resolving itemType code from id

The form works with `itemTypeId` (uuid), but switching logic needs `code`. Options:
1. `useItemTypeOptions()` returns `{ value, label, code }` — pass code alongside
2. Look up code from the options array when `itemTypeId` changes

Option 1 is cleaner. Extend options hook to include code.

## Section 3: Beneficios (dynamic list)

Repeatable field group for benefits. Each row:

| Field | Type | Required |
|-------|------|----------|
| `benefitTypeId` | select | Yes |
| `name` | text | Yes |
| `description` | text | No |
| `durationDays` | number | No |

Controls:
- "Agregar beneficio" button at bottom
- Remove button (X) per row
- Min 0 rows, no max

State: `benefits: CreateItemBenefitSchema[]` array. Add/remove manipulate array.

## Section 4: Condiciones (optional toggles)

Three independent toggleable sections. Each has a switch to enable/disable, fields appear when enabled.

### Condición de edad

Toggle: "Aplicar condición de edad"

| Field | Type | Required |
|-------|------|----------|
| `minAge` | number | Yes (when enabled) |
| `maxAge` | number | No |

Validation: maxAge >= minAge when both set.

### Condición legal

Toggle: "Aplicar condición legal"

| Field | Type | Required |
|-------|------|----------|
| `legalRequirement` | textarea | Yes (when enabled) |
| `description` | text | No |

### Condición temporal

Toggle: "Aplicar condición temporal"

| Field | Type | Required |
|-------|------|----------|
| `effectiveDate` | date picker | Yes (when enabled) |
| `expirationDate` | date picker | No |

Validation: expirationDate >= effectiveDate when both set.

## Form state shape

```tsx
interface CatalogItemFormValues {
  // General
  name: string;
  description: string;
  price: number;
  activationCode: string;
  permanenceMonths: number;
  categoryId: string;
  itemTypeId: string;
  contractTypeId: string;
  segmentId: string;
  tierId: string;
  isActive: boolean;
  isPublished: boolean;

  // Type-specific (only one populated based on itemType)
  voiceDetails: CreateVoiceDetailSchema | null;
  connectivityDetails: CreateConnectivityDetailSchema | null;
  digitalDetails: CreateDigitalDetailSchema | null;
  roamingDetails: CreateRoamingDetailSchema | null;
  deviceDetails: CreateDeviceDetailSchema | null;

  // Benefits (dynamic array)
  benefits: CreateItemBenefitSchema[];

  // Conditions (null = not applied)
  ageConditions: CreateAgeConditionSchema | null;
  legalConditions: CreateLegalConditionSchema | null;
  temporalConditions: CreateTemporalConditionSchema | null;
}
```

## Submit mapping

Transform form values to `CreateCatalogItemRequest` / `UpdateCatalogItemRequest`:
- Include only the detail object matching current itemType, set others to undefined
- Include benefits array (empty array if none)
- Include condition objects only when their toggle is enabled, undefined otherwise
- On edit: `isActive` and `isPublished` included. On create: omit `isActive` (defaults true)

## Create flow

Dialog or Sheet from list page. On success: invalidate items query, toast, navigate to detail page.

## Edit flow

Rendered on detail page (inline or Sheet). Pre-populate all fields from `CatalogItemResponse`. On success: invalidate item detail + list queries, toast, return to view mode.

### Edit pre-population

Map response to form values:
- Detail objects: response includes the matching detail or null
- Benefits: response includes `benefits[]` array
- Conditions: response includes condition objects or null
- Toggles: enabled when condition object is not null

## Dirty state

Track dirty state across all sections. Compare each field group against defaults. Use `useUnsavedGuard`.

## Verification

- `npm run check` passes
- Create product with each item type — correct detail fields appear
- Switch item type in form — previous detail fields clear, new ones appear
- Add/remove benefits dynamically
- Toggle conditions on/off
- Edit pre-populates all fields correctly including nested details
- Submit sends correct shape to API
- Validation prevents invalid states (missing required fields, age range, date range)
- Unsaved changes guard works
