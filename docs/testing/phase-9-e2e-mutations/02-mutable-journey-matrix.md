# Phase 9 — Mutable Journey Matrix

| ID | Role(s) | UI mutation | API setup / verification | Cleanup | Result |
| --- | --- | --- | --- | --- | --- |
| E2E-CRM-09 | Advisor, manager cleanup | Advisor creates a client, edits its name, creates a negotiation, changes its state, and registers a visit. | Lookup data and persistence are checked through authenticated API calls. The state response is checked from the browser PATCH response. | Manager deletes the visit because advisors do not have `visits.delete`; manager then removes the negotiation and client. Every deletion is checked with GET 404. | Passed |
| E2E-CRM-10 | Advisor, coordinator review, manager cleanup | Coordinator approves one pending document and rejects the other through the action menu and rejection form. | Advisor API creates the marked client/negotiation, uploads two generated PDFs, creates pending document records, checks state/history, and verifies document persistence. | Advisor soft-deletes both document records; manager removes the negotiation and client. Reverse cleanup verifies missing records. Physical object deletion is not claimed because the current document-delete API only soft-deletes the record. | Passed |
| E2E-CRM-11 | Manager | Manager creates a catalog product, edits its name and price, publishes it, and deletes it from the detail page. | Catalog lookup data is read through the API. The synthetic PNG is uploaded and removed through the catalog image API because the current CRM UI has no image-upload control. Product state and image path are verified. | Delete image first, then soft-delete the catalog item; search both original and updated markers and verify 404. | Passed |
| E2E-CRM-12 | Manager | Manager creates a vacancy, edits the title, publishes it, opens the applicants page, and deletes the vacancy. | Vacancy persistence and publication state are checked through the API. | Search both original and updated titles, delete matching records, and verify 404. | Passed |
| E2E-CRM-13 | Manager | Manager edits the first seeded sales target in the report UI. | Target list is read before and after the UI update; API restores the original seeded values and verifies the restoration. | Restoration is registered as cleanup and also executed explicitly before the evidence screenshot. | Passed |

## Role and UI boundaries

- The advisor role can create visits but cannot delete them. The CRM test uses
  the advisor browser for creation and the manager API fixture for authorized
  deletion.
- The advisor documentation tab does not expose the upload control in the
  current CRM role experience, and the coordinator cannot create documents. The
  document journey therefore uses the advisor API for upload/setup and the
  coordinator browser for approval/rejection.
- The catalog detail page exposes product editing/deletion but not image upload;
  the image API is tested directly after the UI product mutation.
- The document search input currently sends its value as the API `search`
  parameter, which filters filenames. The test uses the unique run ID because
  it is present in both generated filenames. This records current behavior and
  does not silently claim that the visual “company” placeholder is a company
  search.

## Evidence produced

- `mutable-crm-journey.png`
- `mutable-document-review.png`
- `mutable-catalog-journey.png`
- `mutable-employability-applicants.png`
- `mutable-reports-target.png`

The exact files are written below the per-test Playwright output directory and
are ignored by Git. Review and anonymize them before copying them to an
academic report.
