import { SAMPLE_PDF_PREVIEW_URL } from "@/app/features/pdf-files/data";
import type { PDFPreviewTarget } from "@/app/features/pdf-files/types";

/**
 * Prototype-only document preview targets for File Data Source document rows.
 * No API / S3 / presign — static URLs keyed by known demo filenames.
 */
const DOCUMENT_PREVIEW_BY_NAME: Record<string, PDFPreviewTarget> = {
    "master-services-agreement.pdf": {
        name: "master-services-agreement.pdf",
        sizeLabel: "1.8 MB",
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    "vendor-addendum.pdf": {
        name: "vendor-addendum.pdf",
        sizeLabel: "420 KB",
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    // Intentionally unavailable for parity testing.
    "draft-nda-template.pdf": {
        name: "draft-nda-template.pdf",
        sizeLabel: "96 KB",
        previewUrl: null,
    },
    "employee-handbook.pdf": {
        name: "employee-handbook.pdf",
        sizeLabel: "2.4 MB",
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    "runbook.pdf": {
        name: "runbook.pdf",
        sizeLabel: "310 KB",
        previewUrl: null,
    },
};

export function resolveDocumentPreviewTarget(fileName: string): PDFPreviewTarget {
    const known = DOCUMENT_PREVIEW_BY_NAME[fileName];
    if (known) return { ...known, name: fileName };

    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) {
        return {
            name: fileName,
            sizeLabel: undefined,
            previewUrl: SAMPLE_PDF_PREVIEW_URL,
        };
    }

    return {
        name: fileName,
        previewUrl: null,
    };
}
