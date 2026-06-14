# Phase 6 — Employability

Job vacancy management, candidate/application tracking, and contact request inbox. Covers RF-EMP-001 through RF-EMP-006 (admin side) and contact request management.

## 6.1 Service layer

Create `src/modules/employability/employability.service.ts`:

**Job Vacancies:**
- `listJobVacancies(params)` → `GET /employability/vacancies` → paginated
  - Params: isActive, isPublished, search
- `getJobVacancy(id)` → `GET /employability/vacancies/:id`
- `createJobVacancy(data)` → `POST /employability/vacancies`
- `updateJobVacancy(id, data)` → `PATCH /employability/vacancies/:id`
- `deleteJobVacancy(id)` → `DELETE /employability/vacancies/:id`

**Candidates:**
- `listCandidates(params)` → `GET /employability/candidates` → paginated
- `getCandidate(id)` → `GET /employability/candidates/:id`
- `updateCandidate(id, data)` → `PATCH /employability/candidates/:id`

**Job Applications:**
- `listJobApplications(params)` → `GET /employability/job-applications` → paginated
  - Params: vacancyId, candidateId, state
- `getJobApplication(id)` → `GET /employability/job-applications/:id`
- `updateJobApplication(id, data)` → `PATCH /employability/job-applications/:id`
  - data: `{ state: ApplicationState, reviewNotes?: string }`

**Candidate Resumes:**
- `listCandidateResumes(params)` → `GET /employability/candidate-resumes` → paginated
  - Params: candidateId, applicationId
- `downloadResume(id)` → `GET /employability/candidate-resumes/:id/download` → file blob

**Contact Requests:**
- `listContactRequests(params)` → `GET /contact-requests` → paginated
  - Params: isAttended, search
- `getContactRequest(id)` → `GET /contact-requests/:id`
- `attendContactRequest(id)` → `PATCH /contact-requests/:id`

## 6.2 Data hooks

**`useJobVacancies(page, filters)`** — paginated vacancy list.

**`useJobApplications(page, filters)`** — paginated applications with state/vacancy filters.

**`useContactRequests(page, filters)`** — paginated contact messages with read/attended filter.

**`useCandidateResumes(candidateId)`** — resumes for a specific candidate.

## 6.3 ApplicantsPage

Replace current stub. Two-level view: vacancies + applications.

**Layout:**
- SectionHeader: "Empleabilidad — Aplicantes" + "Nueva vacante" button
- Tabs: Vacantes | Aplicaciones

### Tab: Vacantes

- FilterBar: search, active/published filter
- EntityTable columns:
  - Título (title) — bold
  - Estado: badge (Activa/Inactiva + Publicada/No publicada)
  - Fecha publicación (publicationDate)
  - Fecha cierre (closingDate)
  - Creador (creator.username)
  - Acciones: edit, delete
- Row click → opens vacancy detail sheet

**Create/Edit vacancy dialog:**
- Title, description (textarea), requirements (textarea)
- isActive toggle, isPublished toggle
- Publication date, closing date (date pickers)
- Submit → create or update → toast → refetch

**Vacancy detail sheet:**
- Full details: title, description, requirements
- Dates and status
- List of applications for this vacancy (filtered by vacancyId)
- Application count badge

### Tab: Aplicaciones

- FilterBar: search (candidate name), state filter (DRAFT/PENDING/ACCEPTED/REJECTED), vacancy filter
- EntityTable columns:
  - Candidato (candidate.firstName + lastName) — bold
  - Vacante (vacancy.title)
  - Estado (StateBadge with ApplicationState)
  - Fecha aplicación (appliedAt)
  - CV (download icon if resume exists)
  - Acciones: review button
- Row click → opens application review sheet

**Application review sheet:**
- Candidate info: name, email, phone, nationalId
- Vacancy info: title
- Cover letter display
- Resume download button (if exists)
- Current state as StateBadge
- Review form:
  - State selector: PENDING → ACCEPTED or REJECTED
  - Review notes textarea
  - Submit → updateJobApplication → toast → refetch

## 6.4 MessagesPage

Replace current stub.

**Layout:**
- SectionHeader: "Empleabilidad — Mensajes" + description "Mensajes de contacto recibidos desde bopacorp-web"
- FilterBar:
  - Search by name/email/subject
  - Attended filter: Todos / Pendientes / Atendidos
- EntityTable columns:
  - Nombre (clientName) — bold if not attended
  - Email (clientEmail)
  - Mensaje (message preview, truncated)
  - Producto (itemId link if exists)
  - Fecha (createdAt)
  - Estado: badge (Pendiente / Atendido)
  - Acciones: "Atender" button (if not attended), "Ver" button

**Message detail dialog:**
- Full message content
- Client info: name, email, phone
- Related catalog item (if itemId present)
- Attended status + attendedAt + attendedBy
- "Marcar como atendido" button → attendContactRequest → toast → refetch

## 6.5 State machine — Applications

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

## 6.6 Resume download

For resume download:
- Call `downloadResume(id)` → returns blob
- Create temporary download link via `URL.createObjectURL(blob)`
- Trigger download with `<a download>` pattern

## 6.7 Permission gating

| Action | Permission |
|--------|-----------|
| View vacancies | `job_vacancies.read` |
| Create/edit vacancy | `job_vacancies.create`, `job_vacancies.update` |
| Delete vacancy | `job_vacancies.delete` |
| View candidates | `candidates.read` |
| View applications | `job_applications.read` |
| Review applications | `job_applications.update` |
| View resumes | `candidate_resumes.read` |
| View contact requests | `contact_requests.read` |
| Attend contact requests | `contact_requests.update` |

## 6.8 Types consumed

From `@bopacorp/shared/employability`:
- `JobVacancyResponse`, `JobVacancyListItemResponse`
- `JobApplicationResponse`, `JobApplicationListItemResponse`
- `CandidateResponse`, `CandidateListItemResponse`
- `CandidateResumeResponse`
- `ApplicationState` enum
- All request types

From `@bopacorp/shared/catalog`:
- `ContactRequestResponse` (for messages)

## Deliverable

After this phase: vacancy management with publish control, application review with accept/reject, resume download, contact message inbox with attend workflow.
