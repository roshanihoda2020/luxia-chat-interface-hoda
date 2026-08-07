import type { CapsuleConstellationType } from "@/app/features/constellation/capsuleCapabilities";

export type ConstellationLifecycleStatus = "active" | "archived";

export type ConnectedSourceOwnership = "organizational" | "private";

export type ConnectedSourceStatus =
  | "connected"
  | "needs-attention"
  | "syncing"
  | "disconnected"
  | "archived";

export interface ConnectedDataSource {
  id: string;
  name: string;
  type: "database" | "csv" | "pdf" | "extra-context";
  ownership: ConnectedSourceOwnership;
  ownerUserId: string;
  owner: string;
  status: ConnectedSourceStatus;
  accessSummary: string;
  lastUpdated: string;
  usageInConstellation: string;
  selectable?: boolean;
}

export interface SourceAccessSummaryRow {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  ownership: ConnectedSourceOwnership;
  ownerUserId: string;
  owner: string;
  requiredPermission: "View" | "Use" | "Manage";
  currentUserPermission: "View" | "Use" | "Manage" | "None";
  accessLevelName: string;
  sourceStatus: string;
  conflictStatus: "none" | "missing-source-access" | "source-archived" | "owner-access" | "no-access";
  conflictNote?: string;
}

export type ProjectRoleAction =
  | "View"
  | "Use"
  | "Configure"
  | "Archive"
  | "Delete"
  | "Create outputs";

export interface ProjectRoleCapability {
  role: string;
  actions: ProjectRoleAction[];
}

export interface CapabilitySummary {
  countLabel: string;
  statusLabel: string;
}

export interface ConstellationSettingsRecord {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description: string;
  type: CapsuleConstellationType;
  status: ConstellationLifecycleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  instructions: string;
  defaultMessage: string;
  connectedSources: ConnectedDataSource[];
  sourceAccessRows: SourceAccessSummaryRow[];
  projectRoleCapabilities: ProjectRoleCapability[];
  capabilitySummaries: Partial<Record<string, CapabilitySummary>>;
}

export interface ConstellationSettingsDraft {
  name: string;
  description: string;
}

export function constellationTypeLabel(type: CapsuleConstellationType): string {
  if (type === "database") return "Database";
  if (type === "csv") return "CSV";
  return "PDF";
}

export function draftFromSettings(record: ConstellationSettingsRecord): ConstellationSettingsDraft {
  return { name: record.name, description: record.description };
}
