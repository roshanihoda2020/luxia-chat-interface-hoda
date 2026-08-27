import type { CsvImportFileDraft, CsvTableMetaOrigin } from "./fileDraft";

function originOf(value: CsvTableMetaOrigin | undefined): CsvTableMetaOrigin {
  return value ?? "unset";
}

export function tableNameNeedsAi(file: CsvImportFileDraft): boolean {
  return originOf(file.tableNameOrigin) === "unset" || !file.tableName.trim();
}

export function tableDescriptionNeedsAi(file: CsvImportFileDraft): boolean {
  return originOf(file.tableDescriptionOrigin) === "unset" || !file.tableDescription.trim();
}

export function tableMetaNeedsAi(file: CsvImportFileDraft): boolean {
  return tableNameNeedsAi(file) || tableDescriptionNeedsAi(file);
}

export function anyTableMetaFilled(files: CsvImportFileDraft[]): boolean {
  return files.some(
    (file) => originOf(file.tableNameOrigin) !== "unset" || originOf(file.tableDescriptionOrigin) !== "unset",
  );
}

export function bulkTableMetaActionLabel(files: CsvImportFileDraft[]): string {
  return anyTableMetaFilled(files)
    ? "Generate missing names & descriptions"
    : "Generate all table names & descriptions with AI";
}

export function tableMetaStatusLabel(file: CsvImportFileDraft): "Missing" | "AI generated" | "Edited" {
  const name = originOf(file.tableNameOrigin);
  const description = originOf(file.tableDescriptionOrigin);
  if (name === "edited" || description === "edited") return "Edited";
  if (tableMetaNeedsAi(file)) return "Missing";
  if (name === "ai" || description === "ai") return "AI generated";
  return "Missing";
}

export function mergeGeneratedTableMeta(
  file: CsvImportFileDraft,
  generated: { tableName: string; tableDescription: string },
): CsvImportFileDraft {
  const next: CsvImportFileDraft = { ...file };
  const name = generated.tableName.trim();
  const description = generated.tableDescription.trim();
  if (tableNameNeedsAi(file) && name) {
    next.tableName = name;
    next.tableNameOrigin = "ai";
    next.tableMetaAiGenerated = true;
  }
  if (tableDescriptionNeedsAi(file) && description) {
    next.tableDescription = description;
    next.tableDescriptionOrigin = "ai";
    next.tableMetaAiGenerated = true;
  }
  return next;
}

export function bulkTableMetaNotice(input: {
  generated: number;
  alreadyComplete: number;
  failed: number;
}): string {
  const parts: string[] = [];
  if (input.generated > 0) {
    parts.push(
      input.alreadyComplete === 0 && input.failed === 0
        ? `${input.generated.toLocaleString()} table${input.generated === 1 ? "" : "s"} updated`
        : `${input.generated.toLocaleString()} generated`,
    );
  }
  if (input.alreadyComplete > 0) {
    parts.push(`${input.alreadyComplete.toLocaleString()} already complete`);
  }
  if (input.failed > 0) {
    parts.push(`${input.failed.toLocaleString()} need attention`);
  }
  if (parts.length === 0) return "No tables needed generation.";
  return parts.join(" · ");
}
