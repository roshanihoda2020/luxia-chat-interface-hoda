export type ExtraContextFileSource = "upload" | "datasource";

export type ExtraContextFileStatus = "ready" | "uploading" | "upload-failed" | "new";

export interface ExtraContextFile {
    id: string;
    name: string;
    fileType: string;
    sizeLabel?: string;
    source: ExtraContextFileSource;
    status: ExtraContextFileStatus;
    markedForRemoval?: boolean;
    previewable?: boolean;
}

export interface DatasourceCatalogFile {
    id: string;
    name: string;
    fileType: string;
    sizeLabel?: string;
    previewable?: boolean;
}
