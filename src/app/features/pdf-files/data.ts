import type { PDFCatalogFile, PDFFileRecord } from "./types";

/** Local static sample PDF for prototype iframe previews only (no API). */
export const SAMPLE_PDF_PREVIEW_URL = "/mock/verification-test-document.pdf";

export const PDF_CATALOG: PDFCatalogFile[] = [
    {
        id: "pdf-c1",
        name: "Annual Report 2024.pdf",
        sizeLabel: "2.4 MB",
        sizeBytes: 2516582,
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "pdf-c2",
        name: "Product Guide.pdf",
        sizeLabel: "890 KB",
        sizeBytes: 911360,
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "pdf-c3",
        name: "Policy Handbook.pdf",
        sizeLabel: "1.1 MB",
        sizeBytes: 1153434,
        previewable: false,
        previewUrl: null,
    },
    {
        id: "pdf-c4",
        name: "Onboarding Pack.pdf",
        sizeLabel: "540 KB",
        sizeBytes: 552960,
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
];

export const INITIAL_PDF_FILES: PDFFileRecord[] = [
    {
        id: "pdf1",
        name: "Report A.pdf",
        sizeLabel: "38.79 KB",
        sizeBytes: 39721,
        source: "catalog",
        catalogId: "pdf-c1",
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "pdf2",
        name: "Guide B.pdf",
        sizeLabel: "890 KB",
        sizeBytes: 911360,
        source: "catalog",
        catalogId: "pdf-c2",
        previewable: true,
        // Intentionally missing preview URL to exercise unavailable state.
        previewUrl: null,
    },
];
