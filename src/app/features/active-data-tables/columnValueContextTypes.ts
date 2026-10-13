export type CvcEntityKind = "table" | "view";

export type CvcRetrieveMode = "distinct" | "frequent" | "sum";

export type CvcOrder = "asc" | "desc";

export type CvcValueRow = {
  value: string;
  /** Count (frequent) or sum metric (By sum). */
  metric?: string;
};

/** Persisted database Column Value Context snapshot (prototype mock). */
export type ColumnValueContextSnapshot = {
  constellationId: string;
  entityKind: CvcEntityKind;
  entityId: string;
  columnId: string;
  retrieveMode: CvcRetrieveMode;
  order: CvcOrder;
  limit: number;
  sumColumnId: string | null;
  values: CvcValueRow[];
  manualEdited: boolean;
  retrievedAt: string;
};

export type ColumnValueContextDraft = {
  retrieveMode: CvcRetrieveMode;
  order: CvcOrder;
  limit: number;
  sumColumnId: string | null;
  values: CvcValueRow[];
  manualEdited: boolean;
  /** True after a successful Retrieve in this dialog session (unsaved until Save). */
  hasRetrieved: boolean;
};

export const CVC_LIMIT_DEFAULT = 50;
export const CVC_LIMIT_MIN = 1;
export const CVC_LIMIT_MAX = 100;

export const CVC_RETRIEVE_DELAY_MS = 500;
export const CVC_SAVE_DELAY_MS = 500;
export const CVC_REMOVE_DELAY_MS = 500;
export const CVC_OPEN_LOAD_DELAY_MS = 280;

export function clampCvcLimit(value: number): number {
  if (!Number.isFinite(value)) return CVC_LIMIT_DEFAULT;
  return Math.min(CVC_LIMIT_MAX, Math.max(CVC_LIMIT_MIN, Math.round(value)));
}

export function emptyCvcDraft(): ColumnValueContextDraft {
  return {
    retrieveMode: "distinct",
    order: "asc",
    limit: CVC_LIMIT_DEFAULT,
    sumColumnId: null,
    values: [],
    manualEdited: false,
    hasRetrieved: false,
  };
}

export function draftFromSnapshot(snapshot: ColumnValueContextSnapshot): ColumnValueContextDraft {
  return {
    retrieveMode: snapshot.retrieveMode,
    order: snapshot.order,
    limit: snapshot.limit,
    sumColumnId: snapshot.sumColumnId,
    values: snapshot.values.map((row) => ({ ...row })),
    manualEdited: snapshot.manualEdited,
    hasRetrieved: snapshot.values.length > 0,
  };
}

export function buildCvcSnapshotKey(
  constellationId: string,
  entityKind: CvcEntityKind,
  entityId: string,
  columnId: string,
): string {
  return `${constellationId}::${entityKind}::${entityId}::${columnId}`;
}
