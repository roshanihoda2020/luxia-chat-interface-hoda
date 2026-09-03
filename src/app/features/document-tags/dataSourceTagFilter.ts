import { effectiveTagsForDataSource } from "./persistence";
import type { DocumentTagDefinition } from "./types";

/**
 * Unique Tag options from accessible sources' effective Tags
 * (direct Data Source assignments ∪ content/file assignments).
 */
export function collectAccessibleDataSourceTagOptions(
  sourceIds: readonly string[],
): DocumentTagDefinition[] {
  const byId = new Map<string, DocumentTagDefinition>();
  for (const sourceId of sourceIds) {
    for (const tag of effectiveTagsForDataSource(sourceId)) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function accessibleSourcesHaveUntagged(sourceIds: readonly string[]): boolean {
  return sourceIds.some((sourceId) => effectiveTagsForDataSource(sourceId).length === 0);
}

/** Match a Data Source against effective Tags (OR) plus optional Untagged. */
export function dataSourceMatchesTagFilter(
  dataSourceId: string,
  selectedTagIds: readonly string[],
  includeUntagged: boolean,
): boolean {
  if (selectedTagIds.length === 0 && !includeUntagged) return true;
  const tags = effectiveTagsForDataSource(dataSourceId);
  const selected = new Set(selectedTagIds);
  const matchesTag = tags.some((tag) => selected.has(tag.id));
  const matchesUntagged = includeUntagged && tags.length === 0;
  return matchesTag || matchesUntagged;
}
