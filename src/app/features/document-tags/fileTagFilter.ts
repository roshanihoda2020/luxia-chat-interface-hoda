import { tagsForFileInSources } from "./persistence";
import type { DocumentTagDefinition } from "./types";

/**
 * Unique File Tag options derived only from the given files in the given sources.
 * Uses File assignments — never Data Source assignments.
 */
export function collectFileTagOptions(
  fileNames: readonly string[],
  sourceIds: readonly string[],
): DocumentTagDefinition[] {
  const byId = new Map<string, DocumentTagDefinition>();
  for (const fileName of fileNames) {
    for (const tag of tagsForFileInSources(fileName, sourceIds)) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filesHaveUntagged(
  fileNames: readonly string[],
  sourceIds: readonly string[],
): boolean {
  return fileNames.some((fileName) => tagsForFileInSources(fileName, sourceIds).length === 0);
}

/** Match a file against selected Organization Tag IDs (OR) plus optional Untagged. */
export function fileMatchesTagFilter(
  fileName: string,
  sourceIds: readonly string[],
  selectedTagIds: readonly string[],
  includeUntagged: boolean,
): boolean {
  if (selectedTagIds.length === 0 && !includeUntagged) return true;
  const tags = tagsForFileInSources(fileName, sourceIds);
  const selected = new Set(selectedTagIds);
  const matchesTag = tags.some((tag) => selected.has(tag.id));
  const matchesUntagged = includeUntagged && tags.length === 0;
  return matchesTag || matchesUntagged;
}

export function sourceIdsForFileRecord(
  catalogId: string | undefined,
  connectedSourceIds: readonly string[],
): string[] {
  if (catalogId && !connectedSourceIds.includes(catalogId)) {
    return [catalogId, ...connectedSourceIds];
  }
  return [...connectedSourceIds];
}
