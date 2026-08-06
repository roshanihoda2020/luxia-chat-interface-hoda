import type { AccessLevelRecord } from "./types";
import type { SourceAccessSummaryRow } from "@/app/features/constellation-settings/types";
import type { ConnectedDataSource } from "@/app/features/constellation-settings/types";
import {
  CURRENT_USER_ID,
  getDataSourceById,
  isDataSourceUsable,
  permissionRank,
  resolveUserDataSourceAccess,
} from "./data";
import {
  buildAccessLevelNameForSource,
  getDataSourceOwnerDisplay,
} from "./ownershipDisplay";

export function buildSourceAccessSummaryRow(
  source: Pick<
    ConnectedDataSource,
    "id" | "name" | "type" | "ownership" | "ownerUserId" | "owner" | "status"
  >,
  accessLevels: AccessLevelRecord[],
  userId: string = CURRENT_USER_ID,
): SourceAccessSummaryRow {
  const requiredPermission = "Use" as const;
  const resolved = resolveUserDataSourceAccess(
    userId,
    source.id,
    accessLevels,
  );

  const catalog = getDataSourceById(source.id);
  const sourceUsable = catalog
    ? isDataSourceUsable(catalog.status)
    : source.status !== "archived"
      && source.status !== "disconnected"
      && source.status !== "needs-attention";

  let conflictStatus: SourceAccessSummaryRow["conflictStatus"] = "none";
  if (!sourceUsable || source.status === "archived" || source.status === "disconnected") {
    conflictStatus = "source-archived";
  } else if (resolved.viaOwner) {
    conflictStatus = "owner-access";
  } else if (!resolved.permission) {
    conflictStatus = "missing-source-access";
  } else if (permissionRank(resolved.permission) < permissionRank(requiredPermission)) {
    conflictStatus = "missing-source-access";
  }

  const ownerFields = {
    ownership: source.ownership,
    ownerUserId: source.ownerUserId,
    id: source.id,
  };

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    ownership: source.ownership,
    ownerUserId: source.ownerUserId,
    owner: source.owner || getDataSourceOwnerDisplay(ownerFields),
    requiredPermission,
    currentUserPermission: resolved.permission ?? "None",
    accessLevelName: buildAccessLevelNameForSource(ownerFields, accessLevels, userId),
    sourceStatus: source.status,
    conflictStatus,
  };
}
