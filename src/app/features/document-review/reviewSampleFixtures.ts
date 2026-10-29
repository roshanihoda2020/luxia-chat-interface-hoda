import { deriveLegacyDocumentId, isSampleFixtureDocumentId } from "@/app/features/data-sources/documents";

/**
 * PROTOTYPE SAMPLE FIXTURE. Hand-written Markdown used to demonstrate the
 * Review workspace. It is not OCR output and was not produced by Azure or
 * Docling. It is attached to exactly one known demo document, and to the
 * explicitly labelled "sample preview" mode for any other document.
 */
export interface ReviewPage {
  pageNumber: number;
  markdown: string;
}

export const REVIEW_SAMPLE_PDF_URL = "/mock/review-sample-document.pdf";
export const REVIEW_SAMPLE_PAGE_COUNT = 3;

export const REVIEW_SAMPLE_PAGES: readonly ReviewPage[] = [
  {
    pageNumber: 1,
    markdown: [
      "# Master Services Agreement",
      "",
      "This Master Services Agreement is entered into between **Northwind Analytics Ltd.** (\"Provider\") and **Contoso Retail Group** (\"Client\").",
      "",
      "## 1. Scope of services",
      "",
      "Provider will deliver the services described in each Statement of Work, including:",
      "",
      "- Data platform onboarding",
      "- Monthly reporting and analytics",
      "- Support during business hours",
    ].join("\n"),
  },
  {
    pageNumber: 2,
    markdown: [
      "## 2. Fees and payment",
      "",
      "| Service | Billing | Amount |",
      "| --- | --- | --- |",
      "| Platform onboarding | One-time | EUR 12,000 |",
      "| Reporting and analytics | Monthly | EUR 3,500 |",
      "| Extended support | Monthly | EUR 900 |",
      "",
      "Invoices are payable within 30 days of receipt.",
    ].join("\n"),
  },
  {
    pageNumber: 3,
    markdown: [
      "## 3. Term and termination",
      "",
      "1. The Agreement starts on the Effective Date and runs for 24 months.",
      "2. Either party may terminate with 60 days written notice.",
      "3. Sections 4 to 6 survive termination.",
      "",
      "## 4. Confidentiality",
      "",
      "Each party keeps the other party's *Confidential Information* private and uses it only to perform this Agreement.",
    ].join("\n"),
  },
];

/** Documents that carry the sample fixture as their prototype extraction. */
const FIXTURE_DOCUMENT_KEYS = new Set([
  `ds-pdf-01::${deriveLegacyDocumentId("ds-pdf-01", "master-services-agreement.pdf", 0)}`,
]);

/** File name used by the explicit "Add sample document" action in File Data Source creation. */
export const REVIEW_SAMPLE_FILE_NAME = "sample-master-services-agreement.pdf";
export const REVIEW_SAMPLE_FILE_BYTES = 2529;

/** The known demo document, or a document the user explicitly added as a sample. */
export function isReviewSampleFixtureDocument(dataSourceId: string, localDocumentId: string): boolean {
  return FIXTURE_DOCUMENT_KEYS.has(`${dataSourceId}::${localDocumentId}`)
    || isSampleFixtureDocumentId(localDocumentId);
}

export function cloneReviewPages(pages: readonly ReviewPage[]): ReviewPage[] {
  return pages.map((page) => ({ ...page }));
}
