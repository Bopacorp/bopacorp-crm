# Findings

## Sources
- `01ProjectSpec_FirstEval_en.md`
- `BOPADIGITAL_REQUIREMENTS_SPECIFICATION_DOCUMENT.md`
- `docs/form-standards.md`

## Initial context
- The project spec covers a B2B platform split into public website modules and internal web/mobile modules.
- The requirements document defines functional modules: CAT, CMS, EMP, CRM, MAT, SUP, DOC, REP, SEG, and NOT.
- The form standard is strict about shared Zod schemas, `react-hook-form`, `zodResolver`, explicit defaults, `mode: 'onTouched'`, field-level errors, submit disabling, and unsaved-change guards in dialogs.

## Module verification snapshot

### Auth
- `LoginPage` is compliant with the standard: shared schema, `useForm`, `zodResolver`, `defaultValues`, `mode: 'onTouched'`, `noValidate`, field errors, submit spinner, and submit disable logic.

### Catalog
- `CreateCategoryDialog` and `CatalogItemForm` follow the standard closely and use unsaved-change guards.
- `LookupTableSheet` is not standard-compliant: it uses manual local state instead of `react-hook-form`/Zod, has no field-level error handling, and no submit-state validation gating.

### Clients
- `BusinessClientForm` uses `react-hook-form` and `zodResolver`, but the schema is local instead of coming from `@bopacorp/shared/crm`.
- Submit gating is incomplete because the button only checks `isPending`, not post-submit validity.

### Documentation
- `DocumentUploadDialog` and `AddAttachmentDialog` use local schemas, not shared ones.
- `DocumentUploadDialog` does not use an unsaved-change guard.
- `RejectDocumentDialog` is closer to the standard but still relies on a local schema.

### Employability
- `VacancyForm` reuses the shared create schema with an extension, which is acceptable, but submit gating is still only `isPending`.
- `ChangeApplicationStateDialog` and `RejectApplicationDialog` are generally aligned with the standard, though they still miss the stricter submit-disable pattern.

### Matrices
- `CreateMatrixSheet` uses the expected guard + RHF pattern.
- `AddAttachmentDialog` lacks the unsaved-change guard and uses a local schema.

### Negotiations
- `NegotiationForm` is the main gap: it uses a local schema, not a shared schema, and omits field-level errors for several inputs.
- `CreateVisitSheet` is mostly aligned but uses a local schema.
- `ChangeStateDialog` uses the shared CRM schema and is close to compliant, but still lacks the stricter submit-disable pattern.

### Organization
- `CreateEmployeeSheet` is the largest standard violation: it is built with manual local state, manual validation, and no `react-hook-form`.
- `EmployeeSheet` edit mode repeats the same pattern and is not aligned with the form standard.

### Shared lookup tables
- `src/shared/ui/LookupTableSheet.tsx` is another non-compliant form surface because it is entirely manual-state driven.

### Reports / Overview
- These modules are currently more about functional coverage than form compliance.
- `docs/gaps/*.md` already flags missing report wiring, missing overview activity feed/charts, and advisor-scoped dashboard behavior.
