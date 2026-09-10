import {
  getDataSourceOwnerDisplay,
  getOwnershipLabel,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";
import {
  countConnectedConstellations,
  getLibraryMyAccessLabel,
  getLibraryStatusLabel,
  getLibraryTypeCategory,
  getLibraryTypeLabel,
  listAccessibleDataSources,
} from "@/app/features/permissions/dataSourceVisibility";
import {
  accessAllowsManage,
  statusKeyFromLabel,
  type DataSourceLibraryRow,
} from "./types";

export function buildDataSourceLibraryRows(
  accessLevels: AccessLevelRecord[],
  dataSources: DataSourceCatalogItem[],
  userId: string,
  liveConnections?: Array<{ id: string; dataSourceIds: string[] }>,
): DataSourceLibraryRow[] {
  return listAccessibleDataSources(accessLevels, dataSources, userId).map((source) => {
    const myAccess = getLibraryMyAccessLabel(
      source.id,
      accessLevels,
      dataSources,
      userId,
    );
    if (!myAccess) {
      throw new Error(`Accessible source missing permission: ${source.id}`);
    }
    const statusLabel = getLibraryStatusLabel(source);
    return {
      id: source.id,
      name: source.name,
      typeLabel: getLibraryTypeLabel(source),
      typeCategory: getLibraryTypeCategory(source),
      ownership: source.ownership,
      ownershipLabel: getOwnershipLabel(source.ownership),
      myAccess,
      statusLabel,
      statusKey: statusKeyFromLabel(statusLabel),
      connectedConstellationCount: countConnectedConstellations(
        source.id,
        liveConnections,
      ),
      ownerLabel: getDataSourceOwnerDisplay(source),
      canManage: accessAllowsManage(myAccess),
    };
  });
}
