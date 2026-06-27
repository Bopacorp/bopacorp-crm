# Rubric Compliance Checklist

Tracks pending items to satisfy the Software Engineering II midterm project marking scheme
(ref: `01ProjectSpec_FirstEval_en.md`).

Last updated: 2026-06-27

---

## Graded Criteria

| # | Criteria | Weight | Status | Action needed |
|---|----------|--------|--------|---------------|
| 1 | Report quality + structure + hi-fi prototype | 10 | **Pending** | Write self-contained PDF report (ETS template, ESPOL logo). Include prototype screenshots from Appendix I, architecture diagrams, test results, deployment evidence |
| 2 | Well-structured Git repository | 5 | **Done** | GitHub repo with branch strategy, PRs, conventional commits |
| 3 | Build automation tool | 5 | **Done** | Vite build pipeline, npm scripts (`dev`, `build`, `check`), CI on push/PR |
| 4 | SCRUM evidence (backlogs, planning, roles) | 10 | **Verify** | Confirm sprint backlogs, planning artifacts, role definitions exist. Add to `Communications/` folder if missing |
| 5 | Coding standards + enforcement | 10 | **Done** | Biome linter (single quotes, semicolons, noUnusedImports, noExplicitAny), husky pre-commit hooks, commitlint (Conventional Commits) |
| 6 | Preemptive error detection | 15 | **Done** | Biome lint rules act as PMD equivalent. TypeScript strict mode catches type errors at compile time |
| 7 | Teamwork management tool | 10 | **Verify** | Confirm which tool (ClickUp, Asana, etc.) and ensure access is granted to evaluators |
| 8 | Test cases | 10 | **Missing** | No test framework configured. Must add Vitest + React Testing Library. Write tests for critical flows (auth, negotiations CRUD, document upload, matrix approval) |
| 9 | Deployment guide (user manual, install guide) | 10 | **Pending** | Write formal installation guide (Docker setup, env vars, NGINX config) + user manual with screenshots per role |
| 10 | Presentation: project info (client, scope, scenarios) | 3 | **Pending** | Prepare ESPOL template slides. Cover: client (BOPACORP), system scope, stakeholders |
| 11 | Presentation: architectural decisions justification | 3 | **Pending** | Slides on: React + Vite + Tailwind choice, JWT auth strategy, Biome over ESLint, shadcn/ui, TanStack Query |
| 12 | Presentation: feature demonstration | 9 | **Pending** | Record 10-min demo video. Show one user per role (Advisor, Supervisor, Manager, Coordinator). Cover acceptance criteria from user stories |

## Extra Points

| Criteria | Points | Status |
|----------|--------|--------|
| Auth/Access-Control framework | +1 | **Done** — JWT + RBAC + RequirePermission + Can component |
| Application profiling | +1 | **Not done** — Could add React DevTools Profiler or Lighthouse CI |

## Penalties to Avoid

| Penalty | Points | Status | Action needed |
|---------|--------|--------|---------------|
| No production deployment | -100 | **Verify** | Confirm system is deployed and accessible. Document URL in report |
| No communications evidence | -30 | **Pending** | Create `Communications/` folder in repo with: WhatsApp screenshots, meeting recordings, emails. Add index document with columns: file name, description, type, participants, date/time |
| No client acceptance form | -100 | **Done** | Signed by Mgtr. Christian Pauta (Appendix II in spec doc, 2025-11-04) |
| Non-compliance with delivery standard | -50 | **Check** | Ensure PDF named `T<number>BOPADIGITAL.pdf`, English throughout, ETS template |
| Grammar/orthographic errors (max 20 × -2) | -40 max | **Review** | Proofread report before submission |
| Missing co-evaluation | -50 | **Remind** | Each member must submit individual co-evaluation in Aula Virtual |
| Repo without access permission | -50 | **Verify** | Ensure evaluators have repo access (both CRM and Web repos) |

---

## Pending Functional Requirements (CRM)

These remain incomplete and may affect the demo/report:

| ID | Description | Gap |
|----|-------------|-----|
| RF-NOT-001 | Internal + email notifications for events | Phase 8 not started — no notification center UI |
| RF-NOT-002 | View notification history | No notification history page |
| RF-REP-005 | Compare advisor performance vs defined objectives | No objectives/targets feature implemented |
| RF-CRM-005 | Visit registration with GPS auto-capture | GPS capture on mobile needs testing |
| RF-CRM-006 | Supervisor view GPS location on map | Map visualization not confirmed |
| RF-SUP-005 | Notify advisor of matrix approval/rejection (in-app) | Backend email may work; no in-app notification |

---

## Action Plan (Priority Order)

### Critical (blocks passing)

1. **Add test framework + write tests** — Install Vitest + RTL. Write at least unit tests for services and integration tests for key pages. Target 80% critical path coverage per RNF-021
2. **Verify production deployment** — Confirm Docker deployment is live and accessible. Document URL
3. **Communications folder** — Gather all client communication evidence, create indexed document

### High (significant point impact)

4. **Write project report** — Self-contained PDF per ETS template. Include: architecture diagrams (deployment + component), prototype screenshots, test results, SCRUM evidence, individual contributions
5. **Record presentation video** — 10-min demo, equal participation, ESPOL slides, one user per role
6. **Deployment + user guide** — Docker install steps, env configuration, user manual with role-based screenshots

### Medium (feature completeness)

7. **Build notification center** — Bell icon in header, notification dropdown/page, mark as read. Connects to RF-NOT-001/002 and unblocks RF-SUP-005, RF-DOC-008
8. **GPS visit verification** — Test on mobile device, confirm coordinates captured and displayed

### Low (nice to have)

9. **Performance objectives** — RF-REP-005, targets per advisor for comparison charts
10. **Application profiling** — Lighthouse CI or React Profiler for +1 extra point
