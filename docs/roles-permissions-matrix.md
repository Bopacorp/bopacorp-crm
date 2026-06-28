# Roles and Permissions Matrix

Complete reference of the BOPADIGITAL RBAC system. Covers all 7 roles, their module access, entity-level operations, and frontend route guards.

Last updated: 2026-06-27

---

## 1. Role Definitions

| Role | Slug | Scope | Description |
|------|------|-------|-------------|
| Admin | `admin` | System-wide | Full access to all permissions in the system |
| Manager | `manager` | CRM + Org + Catalog | General manager, oversees all sales and operations |
| Supervisor | `supervisor` | CRM (scoped) | Sales supervisor, sees only supervised advisors' data |
| Advisor | `advisor` | CRM (own data) | Field sales advisor, sees only own records |
| Coordinator | `coordinator` | Documentation | Document review and approval workflow |
| Web Admin | `web-admin` | CMS + Catalog + Employability | Public website content management |

> **Note**: `admin` receives ALL permissions automatically via seeder. The matrix below focuses on the 5 non-admin roles.

---

## 2. Frontend Module Access

Each CRM page requires BOTH a permission AND (optionally) a role from a role group.

**Role groups:**
- `ORG_ROLES` = admin, manager
- `DOC_ROLES` = admin, manager, coordinator
- `SALES_MANAGEMENT_ROLES` = admin, manager, supervisor

| Module / Page | Route | Permission | Role Gate | manager | supervisor | advisor | coordinator | web-admin |
|---------------|-------|------------|-----------|---------|------------|---------|-------------|-----------|
| Overview | `/overview` | — | auth only | Y | Y | Y | Y | Y |
| Clients | `/clientes` | `business_clients.read` | — | Y | Y | Y | Y (read) | — |
| Negotiations | `/negociaciones` | `negotiations.read` | — | Y | Y | Y | Y (read) | — |
| Documentation | `/documentacion` | `negotiation_documents.read` | DOC | Y | — | — | Y | — |
| Document Types | `/documentacion/tipos` | `document_types.read` | DOC | Y | — | — | Y | — |
| Catalog | `/catalogo` | `catalog_items.read` | ORG | Y | — | — | — | Y* |
| Categories Config | `/catalogo/configuracion` | `categories.read` | ORG | Y | — | — | — | Y* |
| Contact Requests | `/catalogo/solicitudes` | `contact_requests.read` | ORG | Y | — | — | — | — |
| Team | `/organizacion/equipo` | `employees.read` | ORG | Y | — | — | — | — |
| Departments | `/organizacion/configuracion` | `departments.read` | ORG | Y | — | — | — | — |
| Reports | `/reportes` | `report_exports.read` | SALES | Y | Y | — | — | — |
| Vacancies | `/empleabilidad/vacantes` | `job_vacancies.read` | — | Y | — | — | — | Y |
| Applications | `/empleabilidad/aplicantes` | `job_applications.read` | — | Y | — | — | — | Y |

> \* web-admin has the permission but not the ORG role — accesses catalog via a separate CMS interface, not the CRM routes.

---

## 3. Entity Permissions Matrix

C = Create, R = Read, U = Update, D = Delete, X = Special action

### CRM Module

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| business_clients | C | Y | Y | Y | — |
| | R | Y | Y | Y | Y |
| | U | Y | Y | Y | — |
| | D | Y | Y | — | — |
| negotiations | C | Y | Y | Y | — |
| | R | Y | Y | Y | Y |
| | U | Y | Y | Y | — |
| | D | Y | Y | — | — |
| | change_state | Y | Y | Y | — |
| negotiation_states | R | Y | Y | Y | Y |
| visits | C | Y | Y | Y | — |
| | R | Y | Y | Y | — |
| | U | Y | Y | Y | — |
| | D | Y | Y | — | — |
| | verify | Y | Y | — | — |
| visit_types | R | Y | Y | Y | — |

### Documentation Module

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| negotiation_documents | C | Y | Y | Y | — |
| | R | Y | Y | Y | Y |
| | D | — | — | Y | — |
| | change_state | Y | Y | — | Y |
| document_types | C | — | — | — | Y |
| | R | Y | Y | Y | Y |
| | U | — | — | — | Y |
| | D | — | — | — | Y |

### Offer Matrices Module

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| offer_matrices | C | Y | — | Y | — |
| | R | Y | Y | Y | Y |
| | U | Y | — | Y | — |
| | D | Y | — | Y | — |
| matrix_attachments | C | Y | — | Y | — |
| | R | Y | Y | Y | — |
| | D | Y | — | Y | — |

### Reports Module

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| report_exports | R | Y | Y | Y | — |
| | C | Y | Y | — | — |
| sales_targets | R | Y | Y | Y | — |
| | U | Y | — | — | — |

### Notifications

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| notifications | C | Y | Y | — | — |
| | R | Y | Y | Y | Y |
| | U | Y | Y | Y | Y |

### Organization Module

| Entity | Operation | manager | supervisor | advisor | coordinator |
|--------|-----------|---------|------------|---------|-------------|
| employees | R | Y | Y | Y | Y |
| users | R | Y | Y | — | — |
| departments | R | Y | — | — | — |
| org_roles | R | Y | — | — | — |
| contact_requests | R | Y | Y | — | Y |
| | U | Y | Y | — | — |

### Catalog Module (CMS)

| Entity | Operation | manager | web-admin |
|--------|-----------|---------|-----------|
| catalog_items | C | Y | Y |
| | R | Y | Y |
| | U | Y | Y |
| | D | Y | Y |
| categories | C | Y | Y |
| | R | Y | Y |
| | U | Y | Y |
| | D | Y | Y |
| content_blocks | C | — | Y |
| | R | — | Y |
| | U | — | Y |
| | D | — | Y |
| content_types | R | — | Y |
| item_types | R | Y | Y |
| contract_types | R | Y | Y |
| segments | R | Y | Y |
| tiers | R | Y | Y |
| geo_zones | R | Y | Y |
| benefit_types | R | Y | Y |

### Employability Module

| Entity | Operation | manager | web-admin |
|--------|-----------|---------|-----------|
| job_vacancies | C | Y | Y |
| | R | Y | Y |
| | U | Y | Y |
| | D | Y | Y |
| job_applications | R | Y | Y |
| | U | Y | Y |
| candidates | R | Y | Y |
| | U | Y | Y |
| candidate_resumes | R | Y | Y |

---

## 4. Data Scoping Rules

Beyond permissions, some roles have data visibility restrictions enforced at the service layer:

| Role | Scoping Rule |
|------|-------------|
| advisor | Sees only own records (negotiations, clients, visits, documents) |
| supervisor | Sees only supervised advisors' records (via `advisor_supervisors` table) |
| manager | Sees all records (no scope restriction) |
| coordinator | Sees all documents for review, but read-only on negotiations |
| admin | No restrictions |

---

## 5. Permission Count Summary

| Role | Total Permissions |
|------|-------------------|
| admin | 139 (all) |
| manager | 63 |
| supervisor | 32 |
| advisor | 28 |
| coordinator | 14 |
| web-admin | 32 |

---

## 6. JWT and Re-login

Permissions are cached in the JWT at login time. Any changes to role-permission assignments in the database require the user to **log out and log back in** to take effect. There is no real-time permission refresh mechanism.
