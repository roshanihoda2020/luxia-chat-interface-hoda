import {
  CANONICAL_CONSTELLATIONS,
  type CanonicalConstellationRecord,
  type CapsuleConstellationType,
} from "@/app/features/constellation";
import { getProjectNameById } from "@/app/features/project/data";
import {
  ACCESS_LEVELS,
  CURRENT_USER_ID,
  DATA_SOURCE_CATALOG,
  ORGANIZATION_USERS,
  buildDataSourceAccessSummary,
  getDataSourceById,
  getDataSourceOwnerDisplay,
  isDataSourceUsable,
  buildSourceAccessSummaryRow,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";
import type {
  ConstellationSettingsRecord,
  ConnectedDataSource,
  ProjectRoleCapability,
  SourceAccessSummaryRow,
} from "./types";
import {
  createSeedCapabilityBundle,
  summarizeCapabilityBundle,
} from "./capabilityState";

const ROLE_MATRIX: ProjectRoleCapability[] = [
  { role: "Project Owner", actions: ["View", "Use", "Configure", "Archive", "Delete"] },
  { role: "Project Manager", actions: ["View", "Use", "Configure", "Archive", "Delete"] },
  { role: "Analyst", actions: ["View", "Use", "Create outputs"] },
  { role: "Member", actions: ["View", "Use"] },
];

function mapCatalogType(
  type: string,
): ConnectedDataSource["type"] {
  const normalized = type.toLowerCase();
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("pdf")) return "pdf";
  return "database";
}

function connectedFromCatalog(sourceId: string): ConnectedDataSource | null {
  const item = getDataSourceById(sourceId);
  if (!item) return null;
  const accessSummary = buildDataSourceAccessSummary(item, ACCESS_LEVELS, CURRENT_USER_ID);

  return {
    id: item.id,
    name: item.name,
    type: mapCatalogType(item.type),
    ownership: item.ownership,
    ownerUserId: item.ownerUserId,
    owner: getDataSourceOwnerDisplay(item),
    status: !isDataSourceUsable(item.status) ? "needs-attention" : "connected",
    accessSummary,
    lastUpdated: "Recently",
    usageInConstellation:
      mapCatalogType(item.type) === "database"
        ? "Active tables and metrics"
        : mapCatalogType(item.type) === "csv"
          ? "Tabular file context"
          : "Primary knowledge files",
  };
}

function accessRowFromSource(
  source: ConnectedDataSource,
  accessLevels: AccessLevelRecord[],
  userId: string = CURRENT_USER_ID,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): SourceAccessSummaryRow {
  return buildSourceAccessSummaryRow(source, accessLevels, userId, dataSources);
}

/** Derive Access rows from live Access Level state (same session). */
export function buildSourceAccessRows(
  sources: ConnectedDataSource[],
  accessLevels: AccessLevelRecord[],
  userId: string = CURRENT_USER_ID,
  dataSources: DataSourceCatalogItem[] = DATA_SOURCE_CATALOG,
): SourceAccessSummaryRow[] {
  return sources.map((source) =>
    accessRowFromSource(source, accessLevels, userId, dataSources),
  );
}

function createdByLabel(userId: string): string {
  return ORGANIZATION_USERS.find((user) => user.id === userId)?.name ?? "User name 01";
}

function instructionsForType(type: CapsuleConstellationType): string {
  if (type === "database") {
    return "Answer based on the connected data sources and documents.";
  }
  if (type === "csv") {
    return "Answer based on the connected CSV tabular data.";
  }
  return "Extract and summarise information from the connected PDF files.";
}

function defaultMessageForType(type: CapsuleConstellationType): string {
  if (type === "database") {
    return "Ask a question about the connected data for this Constellation.";
  }
  if (type === "csv") {
    return "Ask a question about the connected files for this Constellation.";
  }
  return "Ask a question about the connected documents.";
}

function buildRecordFromCanonical(
  item: CanonicalConstellationRecord,
): ConstellationSettingsRecord {
  const connectedSources = item.dataSourceIds
    .map((id) => connectedFromCatalog(id))
    .filter((source): source is ConnectedDataSource => Boolean(source));

  const seed = createSeedCapabilityBundle(item.id, item.type, instructionsForType(item.type));

  return {
    id: item.id,
    projectId: item.projectId,
    projectName: getProjectNameById(item.projectId),
    name: item.name,
    description: item.description,
    type: item.type,
    status: item.status,
    createdBy: createdByLabel(item.createdByUserId),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    instructions: seed.instruction.text,
    defaultMessage: defaultMessageForType(item.type),
    connectedSources,
    sourceAccessRows: connectedSources.map((source) =>
      accessRowFromSource(source, ACCESS_LEVELS),
    ),
    projectRoleCapabilities: ROLE_MATRIX,
    capabilitySummaries: summarizeCapabilityBundle(seed),
  };
}

export const CONSTELLATION_SETTINGS_RECORDS: ConstellationSettingsRecord[] =
  CANONICAL_CONSTELLATIONS.map(buildRecordFromCanonical);

export function cloneConstellationSettingsRecord(
  record: ConstellationSettingsRecord,
): ConstellationSettingsRecord {
  return {
    ...record,
    connectedSources: record.connectedSources.map((item) => ({ ...item })),
    sourceAccessRows: record.sourceAccessRows.map((item) => ({ ...item })),
    projectRoleCapabilities: record.projectRoleCapabilities.map((item) => ({
      ...item,
      actions: [...item.actions],
    })),
    capabilitySummaries: { ...record.capabilitySummaries },
  };
}

export function getConstellationSettingsRecord(
  constellationId: string,
): ConstellationSettingsRecord | undefined {
  return CONSTELLATION_SETTINGS_RECORDS.find((item) => item.id === constellationId);
}

export function resolveConstellationSettingsRecord(
  constellationId: string,
): ConstellationSettingsRecord | undefined {
  return getConstellationSettingsRecord(constellationId);
}

export function buildSettingsForConstellation(input: {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description: string;
  type: CapsuleConstellationType;
}): ConstellationSettingsRecord {
  const seed = createSeedCapabilityBundle(input.id, input.type, instructionsForType(input.type));
  // New Constellations start with no connected sources — do not invent a first-catalog fallback.
  const connectedSources: ConnectedDataSource[] = [];
  return {
    id: input.id,
    projectId: input.projectId,
    projectName: input.projectName,
    name: input.name,
    description: input.description,
    type: input.type,
    status: "active",
    createdBy: createdByLabel("user-01"),
    createdAt: "Today",
    updatedAt: "Just now",
    instructions: seed.instruction.text,
    defaultMessage: defaultMessageForType(input.type),
    connectedSources,
    sourceAccessRows: connectedSources.map((source) =>
      accessRowFromSource(source, ACCESS_LEVELS),
    ),
    projectRoleCapabilities: ROLE_MATRIX.map((item) => ({
      ...item,
      actions: [...item.actions],
    })),
    capabilitySummaries: summarizeCapabilityBundle(seed),
  };
}

export const AVAILABLE_SOURCES_CATALOG: ConnectedDataSource[] = DATA_SOURCE_CATALOG.map(
  (item) =>
    connectedFromCatalog(item.id) ?? {
      id: item.id,
      name: item.name,
      type: mapCatalogType(item.type),
      ownership: item.ownership,
      ownerUserId: item.ownerUserId,
      owner: getDataSourceOwnerDisplay(item),
      status: "connected" as const,
      accessSummary: "Use available",
      lastUpdated: "Recently",
      usageInConstellation: "Not connected",
      selectable: true,
    },
).map((source) => ({ ...source, selectable: true, usageInConstellation: "Not connected" }));
