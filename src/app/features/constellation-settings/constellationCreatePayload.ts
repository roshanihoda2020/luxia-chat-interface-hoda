import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";
import {
  ACCESS_LEVELS,
  CURRENT_USER_ID,
  DATA_SOURCE_CATALOG,
  getDataSourceById,
  getDataSourceOwnerDisplay,
  buildDataSourceAccessSummary,
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

export function buildConnectedSourceFromCreationDraft(
  draft: ConstellationCreationDraft,
): ConnectedDataSource | null {
  if (!draft.type) return null;

  if (draft.dataSourceMode === "existing" && draft.existingDataSourceId) {
    const catalog = getDataSourceById(draft.existingDataSourceId)
      ?? DATA_SOURCE_CATALOG.find((item) => item.id === draft.existingDataSourceId);
    if (!catalog) return null;
    const typeLabel = catalog.type.toLowerCase();
    const sourceType = typeLabel.includes("csv")
      ? "csv" as const
      : typeLabel.includes("pdf")
        ? "pdf" as const
        : "database" as const;
    return {
      id: catalog.id,
      name: catalog.name,
      type: sourceType,
      ownership: catalog.ownership,
      ownerUserId: catalog.ownerUserId,
      owner: getDataSourceOwnerDisplay(catalog),
      status: catalog.status === "inactive" || catalog.status === "archived"
        ? "needs-attention" as const
        : "connected" as const,
      accessSummary: buildDataSourceAccessSummary(catalog, ACCESS_LEVELS, CURRENT_USER_ID),
      lastUpdated: "Just now",
      usageInConstellation: "Primary connected source",
    };
  }

  const isPrivate = draft.ownership === "private";
  const ownerUserId = isPrivate ? CURRENT_USER_ID : "";
  const runtimeSource = {
    id: `ds-runtime-${Date.now()}`,
    ownership: draft.ownership,
    ownerUserId,
  };
  return {
    id: runtimeSource.id,
    name: draft.dataSourceName.trim(),
    type: draft.type,
    ownership: draft.ownership,
    ownerUserId,
    owner: getDataSourceOwnerDisplay(runtimeSource),
    status: "connected",
    accessSummary: isPrivate
      ? "Owner access"
      : buildDataSourceAccessSummary(
          { id: runtimeSource.id, ownership: "organizational", ownerUserId: "" },
          ACCESS_LEVELS,
          CURRENT_USER_ID,
        ),
    lastUpdated: "Just now",
    usageInConstellation: "Primary connected source",
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
