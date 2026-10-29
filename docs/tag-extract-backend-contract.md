# Tag & Extract — Backend adapters (frontend handoff)

The Tag & Extract prototype (Upload → Extract → Review → Approve → Tag → Constellation) runs entirely in the browser.
This document lists the adapters a production build needs to connect it to the existing Luxia backend (`/document-classification`, NestJS).
**No API is connected in this repo. Every status change, approval and suggestion below is simulated.**

Verified against the backend source (`DocumentClassificationService`, `ReviewedMarkdownService`, `document-classification.dto.ts`).
All `/document-classification` routes require `Data source / Manage`, an organization match, and the `Document-Classification` organization feature (403 when off).

## Adapters

| Prototype | Production | Adapter notes |
|---|---|---|
| `localDocumentId` (`local-doc-…`, `local-derived-doc:…`) | `fileMetadataId` (`S3FileMetadata.uuid`) | `DataSourceDocumentRecord.fileMetadataId` and `DocumentReviewRecord.fileMetadataId` are reserved and always `null` today. Map at the API boundary; keep `localDocumentId` only for drafts that have no file record yet. Open decision: the prototype extracts, reviews and tags drafts **before** Create; the backend needs an existing Data Source and file record. |
| Organization tag definitions (`luxia.organization-tags.v1`: id, display name, colour) | Free-form strings per file (`document_classifications.tags TEXT[]`) | The backend trims, lowercases, collapses whitespace, dedupes and sorts; max 20 tags per file, 50 characters each, rejected rather than truncated. Colour is not stored (frontend-v2 derives it from the name). `PUT /:fileMetadataId` replaces the whole array; `POST bulk` supports `add`. Accepting a new suggestion creates an Organization definition in the prototype; in production it only adds a string to that file. Vocabulary: `GET datasource/:uuid/file-tags`. |
| Per-page Markdown drafts (`ReviewPage[]`) | Whole-document `PUT /:fileMetadataId/markdown` | The backend re-splits pages on its page-break marker (`splitPages`), so join edited pages with that marker before saving. Docling output has no pages. Saving the same text keeps the status; a change resets REVIEWED → EXTRACTED. |
| Approved snapshot (`approvedPages`) | None | The backend keeps one Markdown text per file: an edit overwrites the approved text. `approvedPages` is a local-only field the UI never shows; drop it with the store. |
| Static engine list (`listAvailableExtractionEngines`) | `GET /document-classification/engines` | Same ids: `AZURE_LAYOUT`, `AZURE_READ`, `DOCLING`. Return only what the deployment can run. |
| Simulated extraction (`startPrototypeExtraction`) | `POST /extract` → job (`GET job/:jobId`, socket progress) | PDF and DOCX only; max 100 files per job; 5 active jobs per tenant. Re-extracting a REVIEWED file returns **409** unless `force: true` (show a confirmation). Statuses: `POST statuses`. A job interrupted by a backend restart is reported failed, but its files can stay PROCESSING (backend gap). |
| Simulated approval (`approveDocumentReview`) | `POST /:fileMetadataId/approve` → `republishApproved` | Approval is only valid from EXTRACTED and is idempotent. Republishing to Constellations that already hold the file runs in the background; a restart loses it and no status is reported. The prototype never claims a Constellation has ingested approved text. |
| Rule-based suggestions (`generateTagSuggestions`, `luxia.document-tag-suggestions.v1`) | Background AI tagging task (not built; spec D5) | The spec: runs after extraction (or after upload, reading the PDF text layer), uses ~2,000 **tokens** plus the filename, prefers the Data Source's vocabulary and proposes at most one new tag per file. The simulator reads 2,000 **words** and has no text layer; it is user-started and labelled "Prototype rules". Suggestion storage and accept/reject endpoints do not exist yet. |

## Not adapters (product or backend decisions)

- Who may extract, edit and approve (spec proposal: owner or Manage; backend today: Manage).
- Read-only status access for non-owners who build Constellations (`POST statuses` is Manage-only).
- Single-page original endpoint (spec D5; the prototype shows a sample PDF only).
- Bulk approve, AI auto-apply and facets, and the feature flag rollout.
