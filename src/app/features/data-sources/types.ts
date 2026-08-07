import type { AccessLevelPermission, DataSourceCatalogItem } from "@/app/features/permissions";
import type { LibraryMyAccessLabel, LibraryTypeCategory } from "@/app/features/permissions/dataSourceVisibility";

export type DataSourceLibraryTypeFilter = "all" | LibraryTypeCategory;
export type DataSourceLibraryOwnershipFilter = "all" | DataSourceCatalogItem["ownership"];
export type DataSourceLibraryAccessFilter = "all" | LibraryMyAccessLabel;
export type DataSourceLibraryStatusFilter =
  | "all"
  | "connected"
  | "needs-attention"
  | "ready"
  | "failed"
  | "archived";

export interface DataSourceLibraryRow {
  id: string;
  name: string;
  typeLabel: string;
  typeCategory: LibraryTypeCategory;
  ownership: DataSourceCatalogItem["ownership"];
  ownershipLabel: "Organizational" | "Private";
  myAccess: LibraryMyAccessLabel;
  statusLabel: string;
  statusKey: DataSourceLibraryStatusFilter;
  connectedConstellationCount: number;
  ownerLabel: string;
  canManage: boolean;
}

export function statusKeyFromLabel(label: string): DataSourceLibraryStatusFilter {
  const normalized = label.toLowerCase();
  if (normalized === "connected") return "connected";
  if (normalized === "needs attention") return "needs-attention";
  if (normalized === "ready") return "ready";
  if (normalized === "failed") return "failed";
  if (normalized === "archived") return "archived";
  return "all";
}

export function accessAllowsManage(access: LibraryMyAccessLabel): boolean {
  return access === "Owner" || access === "Manage";
}

export type { AccessLevelPermission };
