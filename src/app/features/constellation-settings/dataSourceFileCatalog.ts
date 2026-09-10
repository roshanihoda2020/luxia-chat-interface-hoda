import type { PDFFileRecord } from "@/app/features/pdf-files/types";
import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import type { CreationUploadedFile } from "./constellationCreateDraft";

export type DataSourceFileCatalogEntry = {
  id: string;
  name: string;
  sizeLabel: string;
  sizeBytes: number;
};

export type DataSourceCsvParseConfig = {
  delimiter: string;
  hasHeader: boolean;
};

/** Canonical file inventory for catalog Data Sources used during creation. */
export const DATA_SOURCE_FILE_CATALOG: Record<string, DataSourceFileCatalogEntry[]> = {
  "ds-pdf-01": [
    {
      id: "ds-pdf-01-f1",
      name: "master-services-agreement.pdf",
      sizeLabel: "420 KB",
      sizeBytes: 430080,
    },
  ],
  "ds-pdf-02": [
    {
      id: "ds-pdf-02-f1",
      name: "employee-handbook.pdf",
      sizeLabel: "1.1 MB",
      sizeBytes: 1153434,
    },
  ],
  "ds-pdf-03": [
    {
      id: "ds-pdf-03-f1",
      name: "runbook.pdf",
      sizeLabel: "280 KB",
      sizeBytes: 286720,
    },
  ],
  "ds-csv-01": [
    {
      id: "ds-csv-01-f1",
      name: "orders.csv",
      sizeLabel: "245 KB",
      sizeBytes: 250880,
    },
  ],
  "ds-csv-03": [
    {
      id: "ds-csv-03-f1",
      name: "operations.csv",
      sizeLabel: "180 KB",
      sizeBytes: 184320,
    },
  ],
  "ds-csv-04": [
    {
      id: "ds-csv-04-f1",
      name: "customers.csv",
      sizeLabel: "310 KB",
      sizeBytes: 317440,
    },
  ],
};

export const DATA_SOURCE_CSV_PARSE_CONFIG: Record<string, DataSourceCsvParseConfig> = {
  "ds-csv-01": { delimiter: ",", hasHeader: true },
  "ds-csv-03": { delimiter: ",", hasHeader: true },
  "ds-csv-04": { delimiter: ",", hasHeader: true },
};

export function getDataSourceFileInventory(
  dataSourceId: string,
): DataSourceFileCatalogEntry[] {
  return DATA_SOURCE_FILE_CATALOG[dataSourceId] ?? [];
}

export function getDataSourceCsvParseConfig(
  dataSourceId: string,
): DataSourceCsvParseConfig | null {
  return DATA_SOURCE_CSV_PARSE_CONFIG[dataSourceId] ?? null;
}

export function buildFileRecordsFromDataSource(
  dataSourceId: string,
  type: Extract<CapsuleConstellationType, "pdf" | "csv">,
): PDFFileRecord[] {
  return getDataSourceFileInventory(dataSourceId).map((file) => ({
    id: file.id,
    name: file.name,
    sizeLabel: file.sizeLabel,
    sizeBytes: file.sizeBytes,
    source: "catalog" as const,
    catalogId: dataSourceId,
    previewable: type === "pdf",
  }));
}

export function buildFileRecordsFromUploads(
  files: readonly CreationUploadedFile[],
  type: Extract<CapsuleConstellationType, "pdf" | "csv">,
): PDFFileRecord[] {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    sizeLabel: file.sizeLabel,
    sizeBytes: file.sizeBytes,
    source: "upload" as const,
    previewable: type === "pdf",
  }));
}
