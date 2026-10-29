import {
  isReviewSampleFixtureDocument,
  REVIEW_SAMPLE_PAGE_COUNT,
  REVIEW_SAMPLE_PDF_URL,
} from "./reviewSampleFixtures";

/**
 * Original-document preview adapter for the Review workspace.
 *
 * Production today returns one presigned URL for the whole file; the product
 * spec calls for a future single-page endpoint. Neither exists in this
 * prototype, so only the sample fixture has an original to show, and it is
 * always labelled as a sample. Every other document is "unavailable" rather
 * than showing unrelated PDF content.
 */
export type OriginalDocumentPreview =
  | {
      kind: "sample";
      /** Whole-file URL; pages are addressed with the PDF `#page=` fragment. */
      url: string;
      pageCount: number;
    }
  | { kind: "unavailable"; reason: "no-original" | "unsupported-format" };

export function resolveOriginalDocumentPreview(input: {
  dataSourceId: string;
  localDocumentId: string;
  fileFormat: string;
  /** Explicit sample-preview mode for a document without content. */
  sampleMode?: boolean;
}): OriginalDocumentPreview {
  if (input.sampleMode || isReviewSampleFixtureDocument(input.dataSourceId, input.localDocumentId)) {
    return { kind: "sample", url: REVIEW_SAMPLE_PDF_URL, pageCount: REVIEW_SAMPLE_PAGE_COUNT };
  }
  if (input.fileFormat.toUpperCase() !== "PDF") return { kind: "unavailable", reason: "unsupported-format" };
  return { kind: "unavailable", reason: "no-original" };
}

/**
 * Classes for a Dialog that hosts the Review workspace. Chrome paints its
 * built-in PDF viewer blank inside a translated or scaled ancestor, and the
 * default DialogContent centres with translate and a zoom animation, so the
 * host is centred with inset and auto margins instead.
 */
export const PDF_SAFE_DIALOG_CONTENT_CLASS =
  "!inset-0 !m-auto !translate-x-0 !translate-y-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none";

export function originalPageUrl(url: string, pageNumber: number, fit: "width" | "page"): string {
  return `${url}#page=${pageNumber}&view=${fit === "width" ? "FitH" : "Fit"}&toolbar=0&navpanes=0`;
}
