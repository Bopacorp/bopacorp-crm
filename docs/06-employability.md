# Phase 6 — Employability

Job vacancy management, candidate/application tracking, and contact request inbox. Covers RF-EMP-001 through RF-EMP-006 (admin side).

## 6.1 Shared package changes

The CRM needs to know whether an application has a resume and to download it. `@bopacorp/shared@0.2.17` extends the employability response schemas.

### `@bopacorp/shared/src/employability/response.ts`

```typescript
export const JobApplicationResumeSchema = z.object({
  id: UuidSchema,
  filename: z.string(),
  mimeType: z.string(),
  fileSizeMb: z.number(),
});
export type JobApplicationResume = z.infer<typeof JobApplicationResumeSchema>;

export const JobApplicationResponseSchema = z
  .object({
    id: UuidSchema,
    state: ApplicationStateSchema,
    coverLetter: z.string().nullable(),
    reviewNotes: z.string().nullable(),
    reviewDate: z.string().datetime().nullable(),
    appliedAt: z.string().datetime().nullable(),
    vacancy: ApplicationVacancySchema,
    candidate: ApplicationCandidateSchema,
    reviewer: ApplicationReviewerSchema.nullable(),
    resume: JobApplicationResumeSchema.nullable(),
  })
  .merge(TimestampsSchema);

export const JobApplicationListItemResponseSchema = z
  .object({
    id: UuidSchema,
    state: ApplicationStateSchema,
    appliedAt: z.string().datetime().nullable(),
    hasResume: z.boolean(),
    vacancy: ApplicationVacancySchema,
    candidate: z.object({
      id: UuidSchema,
      firstName: z.string(),
      lastName: z.string(),
    }),
  })
  .merge(TimestampsSchema);
```

The backend (`bopacorp-api/src/modules/employability/employability.service.ts`) populates:

- `hasResume` in `listJobApplications` by looking for a `candidate_resumes` row linked to the application or candidate.
- `resume` in `getJobApplicationById` with the same matching rule.

## 6.2 Service layer

`src/modules/employability/employability.service.ts`

```typescript
export function listVacancies(query: ListJobVacanciesQuery) { ... }
export function getVacancy(id: string) { ... }
export function createVacancy(data: CreateJobVacancyRequest) { ... }
export function updateVacancy(id: string, data: UpdateJobVacancyRequest) { ... }
export function removeVacancy(id: string) { ... }

export function listJobApplications(query: ListJobApplicationsQuery) { ... }
export function getJobApplication(id: string) { ... }
export function updateJobApplication(id: string, data: UpdateJobApplicationRequest) { ... }

export async function downloadCandidateResume(resumeId: string, filename: string) {
  const response = await api.get(`/employability/candidate-resumes/${resumeId}/download`, {
    responseType: 'blob',
  });
  // triggers browser download via createObjectURL
}
```

## 6.3 Data hooks

- `useVacancies(page, filters)` — paginated vacancy list.
- `useVacancy(id)` — vacancy detail for the edit sheet.
- `useJobApplications(page, filters)` — paginated applications with `vacancyId` and `state` filters.
- `useJobApplication(id)` — application detail for the review sheet.

## 6.4 State helpers

`src/modules/employability/lib/state.ts`

```typescript
export function applicationStateLabel(state: ApplicationState): string { ... }
export function applicationStateVariant(state: ApplicationState): BadgeVariant { ... }
```

## 6.5 Components

### VacancyForm

Shared form for create/edit. Fields:

- Título
- Descripción (textarea)
- Requisitos (textarea)
- Fecha de publicación (datetime-local)
- Fecha de cierre (datetime-local)
- Activa (Switch)
- Publicada (Switch, edit mode only)

Validates `closingDate >= publicationDate` on submit.

### CreateVacancyDialog

Sheet wrapping `VacancyForm` with `useUnsavedGuard`. Creates via `POST /employability/vacancies`.

### EditVacancySheet

Sheet that loads a vacancy, edits via `PATCH`, and includes a delete button. Uses `useUnsavedGuard`.

### DeleteVacancyDialog

Confirmation dialog. Calls `DELETE /employability/vacancies/:id`.

### ApplicationDetailSheet

Shows candidate info, vacancy title, application dates, reviewer, review notes, cover letter, and a CV download button. Exposes **Cambiar estado** when the user has `job_applications.update`.

### ChangeApplicationStateDialog

Dialog to pick a new state (`DRAFT | PENDING | ACCEPTED | REJECTED`) and optional review notes. Calls `PATCH /employability/job-applications/:id`.

## 6.6 VacanciesPage

`src/modules/employability/pages/VacanciesPage.tsx`

- SectionHeader with **Nueva vacante** button (`job_vacancies.create`)
- FilterBar: search, active/inactive, published/draft
- EntityTable columns: título, creador, activa, publicada, publicación, cierre, ver aplicantes
- Row click opens `EditVacancySheet`
- PaginationFooter

## 6.7 ApplicantsPage

`src/modules/employability/pages/ApplicantsPage.tsx`

- Reads `?vacancyId=` from URL to filter applications
- FilterBar: search, state
- EntityTable columns: candidato, vacante, fecha, estado, CV icon, ver detalle
- Row click opens `ApplicationDetailSheet`
- Back button when filtered by vacancy

## 6.8 Routing and navigation

`App.tsx` adds `/empleabilidad/vacantes` before `/empleabilidad/aplicantes`.

`app/Sidebar.tsx` updates `employabilityChildren`:

```typescript
const employabilityChildren = [
  { name: 'Vacantes', href: '/empleabilidad/vacantes', icon: Briefcase },
  { name: 'Aplicantes', href: '/empleabilidad/aplicantes', icon: Users },
  { name: 'Mensajes', href: '/empleabilidad/mensajes', icon: Inbox },
];
```

## 6.9 Permission gating

| Action | Permission |
|--------|-----------|
| View vacancies | `job_vacancies.read` |
| Create vacancy | `job_vacancies.create` |
| Edit vacancy | `job_vacancies.update` |
| Delete vacancy | `job_vacancies.delete` |
| View applications | `job_applications.read` |
| Review applications | `job_applications.update` |
| Download resumes | `candidate_resumes.read` |

## 6.10 State machine — Applications

```
DRAFT → PENDING (on submission from public site)
PENDING → ACCEPTED
PENDING → REJECTED
```

StateBadge mapping:
- `DRAFT` → secondary, "Borrador"
- `PENDING` → secondary, "Pendiente"
- `ACCEPTED` → default, "Aceptado"
- `REJECTED` → destructive, "Rechazado"

## 6.11 Resume download

- Detail sheet checks `application.resume`
- Calls `downloadCandidateResume(resumeId, filename)`
- Uses `api.get(..., { responseType: 'blob' })` and triggers download via `URL.createObjectURL`

## Deliverable

After this phase:
- CRUD of job vacancies with publish control.
- Application review with accept/reject.
- Resume download from application detail.
- `ApplicantsPage` and `VacanciesPage` wired to the backend.
