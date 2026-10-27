import type { CsvAiProposal, CsvColumnTypeSnapshot, CsvFixMeta, CsvImportFileDraft } from "./fileDraft";
import { columnReviewReason, inferColumnType } from "./schema";

export function columnTypeSnapshot(file: CsvImportFileDraft): CsvColumnTypeSnapshot[] {
  return file.columns.map((column) => ({
    id: column.id,
    type: column.type,
    detectedType: column.detectedType,
    status: column.status,
    dateFormat: column.dateFormat,
    warning: column.warning,
  }));
}

export function restoreColumnSnapshot(file: CsvImportFileDraft): CsvImportFileDraft {
  const saved = file.columnTypeSnapshot;
  const cleared: CsvImportFileDraft = {
    ...file,
    importAsText: false,
    columnTypeSnapshot: null,
    validationStrategy: file.validationStrategy === "text" ? null : file.validationStrategy,
    appliedResolutions: file.appliedResolutions.filter((kind) => kind !== "import-as-text"),
  };
  if (!saved) {
    return {
      ...cleared,
      columns: file.columns.map((column, index) => {
        const values = (file.parsed?.records ?? []).map((record) => record.fields[index] ?? "");
        const inferred = inferColumnType(values);
        return {
          ...column,
          type: inferred.type,
          detectedType: inferred.type,
          dateFormat: inferred.dateFormat,
          status: inferred.needsReview ? "needs-review" as const : "inferred" as const,
          warning: inferred.needsReview
            ? columnReviewReason({ type: inferred.type, values })
            : undefined,
        };
      }),
    };
  }
  const byId = new Map(saved.map((item) => [item.id, item]));
  return {
    ...cleared,
    columns: file.columns.map((column) => {
      const previous = byId.get(column.id);
      if (!previous) return column;
      return {
        ...column,
        type: previous.type,
        detectedType: previous.detectedType,
        status: previous.status,
        dateFormat: previous.dateFormat,
        warning: previous.warning,
      };
    }),
  };
}

export function asTextColumns(file: CsvImportFileDraft): CsvImportFileDraft {
  return {
    ...file,
    importAsText: true,
    columnTypeSnapshot: file.importAsText && file.columnTypeSnapshot
      ? file.columnTypeSnapshot
      : columnTypeSnapshot(file),
    columns: file.columns.map((column) => ({
      ...column,
      type: "Text",
      status: column.detectedType === "Text"
        ? column.status === "needs-review" ? "confirmed" as const : column.status
        : "modified" as const,
      warning: undefined,
    })),
  };
}

export function writeCellFix(
  file: CsvImportFileDraft,
  rowNumber: number,
  columnId: string,
  value: string,
  origin: CsvFixMeta["origin"],
  originalValue: string,
): CsvImportFileDraft {
  return {
    ...file,
    overrides: {
      ...file.overrides,
      [rowNumber]: {
        ...(file.overrides[rowNumber] ?? {}),
        [columnId]: value,
      },
    },
    fixMeta: {
      ...file.fixMeta,
      [rowNumber]: {
        ...(file.fixMeta[rowNumber] ?? {}),
        [columnId]: { origin, originalValue },
      },
    },
  };
}

export function clearCellFix(file: CsvImportFileDraft, rowNumber: number, columnId: string): CsvImportFileDraft {
  const overrides = { ...file.overrides };
  const rowOverrides = { ...(overrides[rowNumber] ?? {}) };
  delete rowOverrides[columnId];
  if (Object.keys(rowOverrides).length === 0) delete overrides[rowNumber];
  else overrides[rowNumber] = rowOverrides;
  const fixMeta = { ...file.fixMeta };
  const rowMeta = { ...(fixMeta[rowNumber] ?? {}) };
  delete rowMeta[columnId];
  if (Object.keys(rowMeta).length === 0) delete fixMeta[rowNumber];
  else fixMeta[rowNumber] = rowMeta;
  return { ...file, overrides, fixMeta };
}

export function hasFixOrigin(file: CsvImportFileDraft, origin: CsvFixMeta["origin"]): boolean {
  return Object.values(file.fixMeta).some((cells) => Object.values(cells).some((meta) => meta.origin === origin));
}

export function keptReviewedProposals(file: CsvImportFileDraft, replaced: Set<string>): CsvAiProposal[] {
  return file.aiProposals.filter((proposal) => {
    const key = `${proposal.rowNumber}:${proposal.columnId}`;
    if (replaced.has(key)) return false;
    return proposal.status === "accepted" || proposal.status === "rejected";
  });
}
