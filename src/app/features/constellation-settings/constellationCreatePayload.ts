import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import {
  ACCESS_LEVELS,
  CURRENT_USER_ID,
  DATA_SOURCE_CATALOG,
  getDataSourceById,
  getDataSourceOwnerDisplay,
  buildDataSourceAccessSummary,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
  type DataSourceConnector,
} from "@/app/features/permissions";
import type { ConnectedDataSource } from "./types";
import type { ConstellationCreationDraft } from "./constellationCreateDraft";
import { getEffectiveDatabaseSchema } from "./constellationCreateDraft";
import {
  buildCreationTablesFromSelection,
  buildCreationViewsFromSelection,
  CREATION_DATABASE_TABLES,
  CREATION_DATABASE_VIEWS,
} from "./creationMockData";
import {
  buildFileRecordsFromDataSource,
  buildFileRecordsFromUploads,
  getDataSourceCsvParseConfig,
  getDataSourceFileInventory,
} from "./dataSourceFileCatalog";
import {
  createSeedCapabilityBundle,
  type ConstellationCapabilityBundle,
  type CsvParseConfig,
} from "./capabilityState";

function catalogTypeForConstellation(
  type: CapsuleConstellationType,
): DataSourceCatalogItem["type"] {
  if (type === "csv") return "CSV";
  if (type === "pdf") return "File";
  return "Database";
}

export function constellationTypeFromCatalogItem(
  source: Pick<DataSourceCatalogItem, "type" | "connector">,
): CapsuleConstellationType {
  const haystack = `${source.connector ?? ""} ${source.type}`.toLowerCase();
  if (haystack.includes("csv")) return "csv";
  if (haystack.includes("pdf") || haystack.includes("file")) return "pdf";
  return "database";
}

function connectorForConstellation(
  type: CapsuleConstellationType,
): DataSourceConnector {
  if (type === "csv") return "csv";
  if (type === "pdf") return "file";
  return "postgres";
}

function connectedTypeForCatalog(
  typeLabel: string,
): ConnectedDataSource["type"] {
  const normalized = typeLabel.toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("pdf") || normalized.includes("file")) return "pdf";
  return "database";
}

export type CreationConnectedSourceResult = {
  connected: ConnectedDataSource;
  /** When creating a new source, also register this catalog row in live state. */
  catalogItem?: DataSourceCatalogItem;
};

export function buildConnectedSourceFromCreationDraft(
  draft: ConstellationCreationDraft,
  options?: {
    dataSources?: DataSourceCatalogItem[];
    accessLevels?: AccessLevelRecord[];
    currentUserId?: string;
  },
): CreationConnectedSourceResult | null {
  if (!draft.type) return null;

  const dataSources = options?.dataSources ?? DATA_SOURCE_CATALOG;
  const accessLevels = options?.accessLevels ?? ACCESS_LEVELS;
  const currentUserId = options?.currentUserId ?? CURRENT_USER_ID;

  if (draft.dataSourceMode === "existing" && draft.existingDataSourceId) {
    const catalog = getDataSourceById(draft.existingDataSourceId, dataSources);
    if (!catalog) return null;
    const sourceType = connectedTypeForCatalog(catalog.type);
    return {
      connected: {
        id: catalog.id,
        name: catalog.name,
        type: sourceType,
        ownership: catalog.ownership,
        ownerUserId: catalog.ownerUserId,
        owner: getDataSourceOwnerDisplay(catalog),
        status: catalog.status === "inactive" || catalog.status === "archived"
          ? "needs-attention" as const
          : "connected" as const,
        accessSummary: buildDataSourceAccessSummary(
          catalog,
          accessLevels,
          currentUserId,
          dataSources,
        ),
        lastUpdated: "Just now",
        usageInConstellation:
          sourceType === "database"
            ? "Active tables and metrics"
            : sourceType === "csv"
              ? "Tabular file context"
              : "Primary knowledge files",
      },
    };
  }

  const isPrivate = draft.ownership === "private";
  const ownerUserId = isPrivate ? currentUserId : "";
  const id = `ds-runtime-${Date.now()}`;
  const name = draft.dataSourceName.trim();
  const catalogItem: DataSourceCatalogItem = {
    id,
    name,
    type: catalogTypeForConstellation(draft.type),
    connector: connectorForConstellation(draft.type),
    ownership: draft.ownership,
    ownerUserId,
    status: "active",
    contentSummary:
      draft.type === "csv"
        ? {
            kind: "csv",
            fileName: draft.uploadedFiles[0]?.name,
            tableName: name,
            importedRows: undefined,
            skippedRows: 0,
          }
        : draft.type === "pdf"
          ? {
              kind: "file",
              fileNames: draft.uploadedFiles.map((file) => file.name),
            }
          : {
              kind: "database",
              database: name,
            },
  };

  return {
    connected: {
      id,
      name,
      type: draft.type,
      ownership: draft.ownership,
      ownerUserId,
      owner: getDataSourceOwnerDisplay(catalogItem),
      status: "connected",
      accessSummary: isPrivate
        ? "Owner access"
        : buildDataSourceAccessSummary(catalogItem, accessLevels, currentUserId, [
            ...dataSources,
            catalogItem,
          ]),
      lastUpdated: "Just now",
      usageInConstellation:
        draft.type === "database"
          ? "Active tables and metrics"
          : draft.type === "csv"
            ? "Tabular file context"
            : "Primary knowledge files",
    },
    catalogItem,
  };
}

function resolveCsvParseConfig(
  draft: ConstellationCreationDraft,
): CsvParseConfig | null {
  if (draft.type !== "csv") return null;
  if (draft.dataSourceMode === "new") {
    return {
      delimiter: draft.csvDelimiter.trim() || ",",
      hasHeader: draft.csvHasHeader,
    };
  }
  if (draft.existingDataSourceId) {
    return getDataSourceCsvParseConfig(draft.existingDataSourceId);
  }
  return null;
}

export function buildCapabilityBundleFromCreationDraft(
  constellationId: string,
  draft: ConstellationCreationDraft,
  connectedSource: ConnectedDataSource | null,
  instruction: string,
): ConstellationCapabilityBundle {
  if (!draft.type) {
    return createSeedCapabilityBundle(constellationId, "database", instruction);
  }

  const dataSourceName = draft.dataSourceMode === "new"
    ? draft.dataSourceName.trim()
    : connectedSource?.name ?? "";

  const bundle = createSeedCapabilityBundle(constellationId, draft.type, instruction);

  if (draft.type === "database") {
    const tables = buildCreationTablesFromSelection(
      draft.selectedTableIds,
      dataSourceName || "Data source name 01",
    );
    const views = buildCreationViewsFromSelection(
      draft.selectedViewIds,
      dataSourceName || "Data source name 01",
    );
    return {
      ...bundle,
      tables: [...tables, ...views],
      pdfFiles: [],
      csvParseConfig: null,
    };
  }

  const pdfFiles = draft.dataSourceMode === "new"
    ? buildFileRecordsFromUploads(draft.uploadedFiles, draft.type)
    : draft.existingDataSourceId
      ? buildFileRecordsFromDataSource(draft.existingDataSourceId, draft.type)
      : [];

  return {
    ...bundle,
    tables: [],
    pdfFiles,
    csvParseConfig: resolveCsvParseConfig(draft),
  };
}

export type ReviewAddedDataSummary = {
  rows: { label: string; value: string }[];
};

export function buildReviewAddedDataSummary(
  draft: ConstellationCreationDraft,
  existingSourceName?: string,
): ReviewAddedDataSummary {
  if (draft.type === "database") {
    const tableNames = draft.selectedTableIds
      .map((id) => CREATION_DATABASE_TABLES.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const viewNames = draft.selectedViewIds
      .map((id) => CREATION_DATABASE_VIEWS.find((v) => v.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const effectiveSchema = getEffectiveDatabaseSchema(draft);

    return {
      rows: [
        { label: "Schema", value: effectiveSchema || "—" },
        { label: "Tables", value: tableNames || `${draft.selectedTableIds.length} selected` },
        {
          label: "Views",
          value: viewNames || (draft.selectedViewIds.length ? `${draft.selectedViewIds.length} selected` : "—"),
        },
      ],
    };
  }

  if (draft.type === "pdf" || draft.type === "csv") {
    if (draft.dataSourceMode === "existing" && draft.existingDataSourceId) {
      const inventory = getDataSourceFileInventory(draft.existingDataSourceId);
      const sourceLabel = existingSourceName ?? "Selected Data Source";
      const rows: { label: string; value: string }[] = [
        { label: "Source", value: `${sourceLabel} (existing)` },
      ];

      if (inventory.length > 0) {
        rows.push(
          {
            label: "Files",
            value: `${inventory.length} file${inventory.length === 1 ? "" : "s"}`,
          },
          {
            label: "File names",
            value: inventory.map((file) => file.name).join(", "),
          },
        );
      } else {
        rows.push({ label: "Files", value: "Existing Data Source files will be used." });
      }

      if (draft.type === "csv") {
        const csvConfig = getDataSourceCsvParseConfig(draft.existingDataSourceId);
        if (csvConfig) {
          rows.push(
            { label: "Delimiter", value: csvConfig.delimiter || "," },
            {
              label: "Header row",
              value: csvConfig.hasHeader
                ? "First row contains column headers"
                : "No header row",
            },
          );
        }
      }

      return { rows };
    }

    const rows: { label: string; value: string }[] = [
      {
        label: "Files",
        value: `${draft.uploadedFiles.length} file${draft.uploadedFiles.length === 1 ? "" : "s"}`,
      },
      {
        label: "File names",
        value: draft.uploadedFiles.map((f) => f.name).join(", ") || "—",
      },
    ];

    if (draft.type === "csv") {
      rows.push(
        { label: "Delimiter", value: draft.csvDelimiter.trim() || "," },
        {
          label: "Header row",
          value: draft.csvHasHeader ? "First row contains column headers" : "No header row",
        },
      );
    }

    return { rows };
  }

  return { rows: [] };
}
