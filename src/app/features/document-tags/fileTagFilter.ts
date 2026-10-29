import { tagsForDocumentInSource, tagsForFileInSources } from "./persistence";
import type { DocumentTagDefinition } from "./types";

/** A listed file plus the Data Sources its File Tags may come from (see sourceIdsForFileRecord). */
export type FileTagTarget = {
  fileName: string;
  sourceIds: readonly string[];
  /** Exact document reference. When set, tags come from that one document only. */
  document?: { dataSourceId: string; localDocumentId: string };
};

/** Tags of a listed file: by document reference when known, otherwise by filename in its sources. */
export function tagsForFileTarget(file: FileTagTarget): DocumentTagDefinition[] {
  return file.document
    ? tagsForDocumentInSource(file.document.dataSourceId, {
        localDocumentId: file.document.localDocumentId,
        fileName: file.fileName,
      })
    : tagsForFileInSources(file.fileName, file.sourceIds);
}

/**
 * Unique File Tag options derived only from the given files, each read from its own sources.
 * Uses File assignments — never Data Source assignments.
 */
export function collectFileTagOptions(files: readonly FileTagTarget[]): DocumentTagDefinition[] {
  const byId = new Map<string, DocumentTagDefinition>();
  for (const file of files) {
    for (const tag of tagsForFileTarget(file)) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filesHaveUntagged(files: readonly FileTagTarget[]): boolean {
  return files.some((file) => tagsForFileTarget(file).length === 0);
}

/** Match a file against selected Organization Tag IDs (OR) plus optional Untagged. */
export function fileMatchesTagFilter(
  file: FileTagTarget,
  selectedTagIds: readonly string[],
  includeUntagged: boolean,
): boolean {
  if (selectedTagIds.length === 0 && !includeUntagged) return true;
  const tags = tagsForFileTarget(file);
  const selected = new Set(selectedTagIds);
  const matchesTag = tags.some((tag) => selected.has(tag.id));
  const matchesUntagged = includeUntagged && tags.length === 0;
  return matchesTag || matchesUntagged;
}

/**
 * Data Sources to read a listed file's File Tags from.
 * A file whose `catalogId` is a connected Data Source reads only that source,
 * so identical filenames in other connected sources never contribute.
 * Otherwise (uploads, or library ids such as "pdf-c1") there is no owning
 * source to resolve, and tags still come from every connected source by filename.
 */
export function sourceIdsForFileRecord(
  catalogId: string | undefined,
  connectedSourceIds: readonly string[],
): string[] {
  if (catalogId && connectedSourceIds.includes(catalogId)) return [catalogId];
  if (catalogId) return [catalogId, ...connectedSourceIds];
  return [...connectedSourceIds];
}
