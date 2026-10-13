import { useSyncExternalStore } from "react";
import {
  buildCvcSnapshotKey,
  type ColumnValueContextSnapshot,
  type CvcEntityKind,
  type CvcOrder,
  type CvcRetrieveMode,
  type CvcValueRow,
} from "./columnValueContextTypes";

const snapshots = new Map<string, ColumnValueContextSnapshot>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshotVersion(): string {
  return JSON.stringify(
    [...snapshots.entries()].map(([key, value]) => [key, value.retrievedAt, value.values.length, value.manualEdited]),
  );
}

export function getColumnValueContextSnapshot(
  constellationId: string,
  entityKind: CvcEntityKind,
  entityId: string,
  columnId: string,
): ColumnValueContextSnapshot | null {
  return snapshots.get(buildCvcSnapshotKey(constellationId, entityKind, entityId, columnId)) ?? null;
}

export function saveColumnValueContextSnapshot(
  input: Omit<ColumnValueContextSnapshot, "retrievedAt"> & { retrievedAt?: string },
): ColumnValueContextSnapshot {
  const key = buildCvcSnapshotKey(
    input.constellationId,
    input.entityKind,
    input.entityId,
    input.columnId,
  );
  const next: ColumnValueContextSnapshot = {
    ...input,
    values: input.values.map((row) => ({ ...row })),
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
  };
  snapshots.set(key, next);
  emit();
  return next;
}

export function removeColumnValueContextSnapshot(
  constellationId: string,
  entityKind: CvcEntityKind,
  entityId: string,
  columnId: string,
): boolean {
  const key = buildCvcSnapshotKey(constellationId, entityKind, entityId, columnId);
  const existed = snapshots.delete(key);
  if (existed) emit();
  return existed;
}

/** Deterministic mock retrieve — no backend. */
export function mockRetrieveColumnValues(args: {
  constellationId: string;
  entityKind: CvcEntityKind;
  entityId: string;
  entityName: string;
  columnId: string;
  columnName: string;
  retrieveMode: CvcRetrieveMode;
  order: CvcOrder;
  limit: number;
  sumColumnId: string | null;
  sumColumnName: string | null;
}): CvcValueRow[] {
  const seed = [
    args.constellationId,
    args.entityKind,
    args.entityId,
    args.columnId,
    args.retrieveMode,
    args.order,
    String(args.limit),
    args.sumColumnId ?? "",
  ].join("|");

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const baseLabels = [
    args.columnName || "Value",
    args.entityName.split(" ")[0] || "Entity",
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
  ];

  const count = Math.max(1, Math.min(args.limit, 12));
  const rows: CvcValueRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const n = (hash + i * 17) % 97;
    const label = `${baseLabels[i % baseLabels.length]} ${n + 1}`;
    if (args.retrieveMode === "distinct") {
      rows.push({ value: label });
    } else if (args.retrieveMode === "frequent") {
      rows.push({ value: label, metric: String(40 - (i % 12) * 3 + (n % 5)) });
    } else {
      const sumLabel = args.sumColumnName ? args.sumColumnName : "Sum";
      rows.push({
        value: label,
        metric: `${(n + 1) * 125 + i * 17} (${sumLabel})`,
      });
    }
  }

  if (args.order === "desc") {
    rows.reverse();
  }
  return rows;
}

export function useColumnValueContextSnapshot(
  constellationId: string,
  entityKind: CvcEntityKind,
  entityId: string | null,
  columnId: string | null,
): ColumnValueContextSnapshot | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!entityId || !columnId) return null;
      // Touch version so subscribers refresh when any snapshot changes.
      void getSnapshotVersion();
      return getColumnValueContextSnapshot(constellationId, entityKind, entityId, columnId);
    },
    () => null,
  );
}
