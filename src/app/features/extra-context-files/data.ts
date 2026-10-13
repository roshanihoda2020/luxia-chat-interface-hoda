import { SAMPLE_PDF_PREVIEW_URL } from "@/app/features/pdf-files/data";
import type { DatasourceCatalogFile, ExtraContextFile } from "./types";

export const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".docx", ".pptx", ".md", ".txt"];

export const INITIAL_CONTEXT_FILES: ExtraContextFile[] = [
    {
        id: "ecf1",
        name: "Context File A.pdf",
        fileType: "PDF",
        sizeLabel: "3.68 MB",
        source: "upload",
        status: "ready",
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "ecf2",
        name: "Context File B.md",
        fileType: "MD",
        sizeLabel: "12 KB",
        source: "datasource",
        status: "ready",
        previewable: true,
        previewUrl: null,
    },
    {
        id: "ecf3",
        name: "Sales Playbook.docx",
        fileType: "DOCX",
        sizeLabel: "840 KB",
        source: "datasource",
        status: "ready",
        previewable: false,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
];

export const DATASOURCE_CATALOG: DatasourceCatalogFile[] = [
    {
        id: "ds1",
        name: "Product Overview.pdf",
        fileType: "PDF",
        sizeLabel: "2.1 MB",
        previewable: true,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "ds2",
        name: "Sales Playbook.docx",
        fileType: "DOCX",
        sizeLabel: "840 KB",
        previewable: false,
        // URL present so Open in new tab can be exercised without inline preview.
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "ds3",
        name: "Release Notes.md",
        fileType: "MD",
        sizeLabel: "48 KB",
        previewable: true,
        previewUrl: null,
    },
    {
        id: "ds4",
        name: "Training Deck.pptx",
        fileType: "PPTX",
        sizeLabel: "5.2 MB",
        previewable: false,
        previewUrl: SAMPLE_PDF_PREVIEW_URL,
    },
    {
        id: "ds5",
        name: "FAQ.txt",
        fileType: "TXT",
        sizeLabel: "6 KB",
        previewable: true,
        previewUrl: null,
    },
];
