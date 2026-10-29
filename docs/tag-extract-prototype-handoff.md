# Tag & Extract — Prototype handoff

This prototype shows the Tag & Extract experience end to end. **It has no backend.** Every Data Source, document, extraction result, approval and AI suggestion lives in the browser. Use this page to tell example records apart from production requirements.

Backend facts, endpoints and adapter notes are in [tag-extract-backend-contract.md](./tag-extract-backend-contract.md). This page links to that contract rather than repeating it.

## 1. Specification and scope

The source is the four-page Tag & Extract specification (`tag.pdf`).

| Deliverable | Spec | Prototype |
|---|---|---|
| D1 Reusable review component | Document list, extraction, review panel with the original PDF page beside its Markdown (rendered / edit), *Approve & save*, *Next to review*; reused in Data Source creation, Data Source settings and Constellation settings | `DocumentReviewWorkspace`, `FileDataSourceDocumentsPanel` |
| D2 Data Source flow | Upload → Extract → Review → Tag; later from a *Documents* tab in Data Source settings | Creation dialog plus the **Tag & Extract** tab. Whether to rename it *Documents* is open. |
| D3 Constellation file picker | Tag filter, status summary, *Extract / review* opening the Data Source flow **in a new tab**; refresh on return; sync progress after Create | `CreationDocumentPicker` and Settings → Add documents. Review opens as an **overlay**, not a new tab (open decision). No sync progress. |
| D4 AI tag suggestions | Proposed from the document's text; accepted or rejected by the user | Rule-based simulator (see §5) |
| D5 Backend support | Single-page original endpoint, permission change, tagging task | **Not built.** Backend work. |

Milestones: M1 covers D1, D2, the page endpoint and the permission change; M2 covers D3; M3 covers D4.

## 2. User journey (what to demo)

1. **Data Sources → New Data Source → File.** Upload files, or use **Add sample document**.
2. **Extract**, optional. Choose the engine and start a simulated run.
3. **Review**, optional. Original page on the left, Markdown on the right. Choose **Edit Markdown**, **Save changes**, **Approve & save**, **Review later** or **Next to review**.
4. **Tag**: manual tags, or **Suggest tags** (prototype AI suggestions, dashed chips). Accept or reject them.
5. **Create Data Source.** Review never blocks creation.
6. Later, in **Data Source settings → Tag & Extract**, the same panel and workspace are available.
7. In **Constellation creation → Add Data**, pick documents. The picker shows statuses and accepted tags only. **Constellation settings → PDF Files → Add PDF Files** adds more, merge-only.
8. A document used by a Constellation cannot be deleted from its Data Source (file-in-use block).

## 3. Reusable components (real frontend functionality)

| Component | Path | Used in |
|---|---|---|
| `FileDataSourceDocumentsPanel` | `src/app/features/document-tags/` | Creation dialog, Data Source settings, Constellation picker (`pickerMode`), Add documents |
| `DocumentReviewWorkspace` | `src/app/features/document-review/` | Portalled into each host above; one workspace, never duplicated |
| `ExtractDocumentsDialog`, `DocumentExtractionStatusCell` | `src/app/features/data-sources/documents/` | Panel, Constellation PDF rows |
| `SuggestedTagChip` | `src/app/features/document-tags/` | Panel only (never in picker mode) |
| `CreationDocumentPicker` | `src/app/features/constellation-settings/` | Constellation creation |

The flow, statuses, guards (unsaved changes, history entries), filters, selection, file-in-use protection and the accept/reject model are real UX. They are what should ship.

## 4. Demo data (seeded records)

None of these are production requirements. Replace them with API data.

| Fixture | Location | Notes |
|---|---|---|
| Demo Data Sources (`ds-pdf-01`, `ds-csv-01`, `ds-db-01`…) and their file names | `src/app/features/permissions/data.ts` | `contentSummary.fileNames` produce derived document IDs |
| Demo tags and assignments | `src/app/features/document-tags/persistence.ts` (`DEMO_TAG_LIBRARY`, `DEMO_FILE_ASSIGNMENTS`, …) | Seeded into `luxia.organization-tags.v1` |
| Demo document previews | `src/app/features/document-tags/documentPreviewMock.ts` | Seeded names use a **placeholder PDF** (`public/mock/verification-test-document.pdf`); the preview dialog labels it "Demo data" |
| Seeded Constellation PDF files | `src/app/features/pdf-files/data.ts` | Legacy library records without document references |
| Static Constellation file catalog | `src/app/features/constellation-settings/dataSourceFileCatalog.ts` | Fallback when a source has no document records |
| Seeded file-in-use map | `src/app/features/data-sources/fileInUse.ts` | Applies to derived (demo) documents only |

### Sample content

There is exactly one sample: **Master Services Agreement**.
- Markdown: `src/app/features/document-review/reviewSampleFixtures.ts` (`REVIEW_SAMPLE_PAGES`, 3 pages).
- Original: `public/mock/review-sample-document.pdf` (3 pages, page-for-page the same text, marked "SAMPLE DOCUMENT - PROTOTYPE FIXTURE").
- Attached to the demo document `ds-pdf-01 / master-services-agreement.pdf`, and to any document added with **Add sample document** (IDs prefixed `local-doc-sample-`).
- The workspace shows a "Sample content" badge and one short note. **Layout preview with sample content** is read-only and never approvable.

## 5. Simulated behavior

| Behavior | Location | How it is marked in the UI |
|---|---|---|
| Extraction runs | `data-sources/documents/extractionPrototype.ts` | Toasts say "Simulated extraction"; the Extract dialog footer explains it. Names containing `always-fail` always fail; `fail` or `corrupt` fail once (to demo Retry). |
| Extracted text | Only the sample document has text | Other files reach *To review* with a **No text** marker. Their Review shows "No extracted content available", with Edit and Approve unavailable. |
| Engine list | `data-sources/documents/extractionEngines.ts` | "The engine list is a fixed example." |
| Approval | `document-review/reviewContentStore.ts` | Local only. **Nothing is republished**, and no copy claims it was. |
| AI suggestions | `document-tags/tagSuggestionEngine.ts` (fixed concept list), `tagSuggestionStore.ts` | "Prototype AI suggestion" on chips and in the count line; the toast says "Prototype rules, not an AI model". No LLM is called. |
| Original page | `document-review/originalDocumentPreview.ts` | The whole sample PDF, addressed with `#page=`. Other documents show "The original file is not available in this prototype." |
| Uploaded files | Never stored | Preview says the file cannot be previewed; no stand-in PDF is shown. |

Browser storage keys (per origin): `luxia.organization-tags.v1`, `luxia.document-extraction-status.v1`, `luxia.document-review-content.v1`, `luxia.document-tag-suggestions.v1`. Created Data Sources and Constellations are in memory only, so a full reload drops them.

## 6. Not implemented

- Real OCR, file storage, the single-page original endpoint, and republish status.
- Background AI tagging, the PDF text layer as AI input, token-based limits, facets, and auto-apply.
- The *Extract / review* action opening in a new tab, and sync progress after Create.
- Feature flag (`Document-Classification`) handling.

## 7. What the real backend already supports

Summary only; details and file references are in the [contract](./tag-extract-backend-contract.md).
- `/document-classification`: list files with classification, bulk tags, statuses, save tags, start extraction jobs (PDF/DOCX, 100 files, 409 for re-extracting approved files), get and save Markdown, approve, job progress, available engines.
- Approval triggers `republishApproved` (background, not awaited, no status reported). Ingestion prefers approved Markdown for REVIEWED files.
- Data Source file listing with a tag filter, `file-ids`, `file-tags` (vocabulary), and Constellation create with `s3FileMetadataIds`.
- Format support:

  | Format | Upload (v2) | Extraction | Classic Constellation ingestion |
  |---|---|---|---|
  | PDF | ✓ | ✓ | ✓ |
  | DOCX | ✓ | ✓ | ✓ |
  | PPTX | ✓ | — | ✓ |
  | MD / TXT | ✓ | — | ✓ |

  No format is excluded from Constellation picking. Which formats a "PDF" Constellation should accept is a product decision.

## 8. Replacing fixtures with real data

Each adapter has one seam; swap it without touching the UI components.

| Prototype seam | Replace with |
|---|---|
| `readDataSourceDocuments(dsId, contentSummary)` | `GET /document-classification/datasource/:uuid/files`, mapping `uuid` → `fileMetadataId` |
| `localDocumentId` | Keep it as the UI key. Set `DataSourceDocumentRecord.fileMetadataId` from the API and send that ID to every call. Drafts that exist before Create have no `fileMetadataId`; whether review before Create is allowed is an **open decision**. |
| `listAvailableExtractionEngines()` | `GET /document-classification/engines` |
| `startPrototypeExtraction` + `extractionStatusStore` | `POST /extract`, then job progress (`GET job/:jobId` or the socket) and `POST statuses` |
| `getDocumentReviewContent` / `saveDocumentReviewContent` | `GET` / `PUT /:fileMetadataId/markdown`. **Save format:** one whole-document Markdown string. Join the per-page drafts with the backend's page-break marker; the backend re-splits pages. An edit overwrites the approved text and resets the status to EXTRACTED. |
| `approveDocumentReview` | `POST /:fileMetadataId/approve`. Show republish as background work; do not claim completion. |
| Organization tag definitions (id, name, colour) | Plain file-tag strings: lowercased, at most 20 per file and 50 characters each, full-array replace (`PUT`) or bulk `add`. Derive colour from the name. Accepting a new suggestion must not create an organization-wide definition. |
| `generateTagSuggestions` + `tagSuggestionStore` | The backend tagging task and suggestion storage (to be built). Keep `SuggestedTagChip` and the accept/reject UX. |
| `resolveOriginalDocumentPreview` | The single-page endpoint (D5). Keep the error state and Retry. |

## 9. Decisions still open (not made by the prototype)

- **Permissions.** The spec proposes owner *or* Manage; the backend today is Manage plus a same-organization check; the prototype is Manage only. Also open: read-only statuses for people who build Constellations but don't own the Data Source.
- **Product.** Bulk approve; AI auto-apply and facets; the feature flag (keep `Document-Classification` or default-on with v2); new tab or overlay for review from the picker; the tab name; review before Create; formats per Constellation type.

## 10. Known limitations

- The original page uses the browser's built-in PDF viewer. If inline PDFs are disabled or set to download, the pane shows an error with **Retry** and **Open PDF in new tab** after the file check or an 8-second timeout. It never spins indefinitely.
- Created Data Sources and Constellations are lost on a full reload (in-memory state).
- Read-only View/Use behaviour is enforced in code (`canEdit` = Manage) but has not been checked in the browser.
- Pending suggestions are shown against the live vocabulary, but stored records keep their original "New" flag until regenerated.

## 11. Run and test

```bash
npm install
npm run dev
```

- The dev server runs on port 5241 (`.claude/launch.json`). To get past sign-in without credentials, set sessionStorage `luxia.prototype-signed-in.v1` to `1`.
- Use a separate origin (for example `http://localhost:5241` instead of `http://127.0.0.1:5241`) so test data doesn't mix with your normal browser data. Storage is per origin.
- Checks: `npm run typecheck`, `npm run build`.
- Demo script:
  1. Create a File Data Source with **Add sample document** plus a few uploads, including one named `…always-fail.pdf`.
  2. Extract, Retry, Review and approve the sample.
  3. Tag manually and with Suggest tags.
  4. Create, then pick documents in a new Constellation.
  5. Try deleting a used document.
