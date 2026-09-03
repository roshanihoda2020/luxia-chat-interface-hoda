import type {
  DataSourceTagBucket,
  DocumentTagColorId,
  DocumentTagDefinition,
  OrganizationTagLibrary,
  OrganizationTagStore,
} from "./types";
import { isDocumentTagColorId, suggestTagColor } from "./tagTone";

export const PROTOTYPE_ORGANIZATION_ID = "org-luxia-demo";

export function normalizeTag(value: string): string | null {
  const tag = value.trim().replace(/\s+/g, " ");
  return tag ? tag : null;
}

export function tagsEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function emptyTagBucket(): DataSourceTagBucket {
  return { definitions: {}, sourceTagIds: [], fileAssignments: {}, tableAssignments: {} };
}

export function emptyTagLibrary(organizationId: string = PROTOTYPE_ORGANIZATION_ID): OrganizationTagLibrary {
  return {
    organizationId,
    definitions: {},
    dataSourceAssignments: {},
    fileAssignments: {},
    tableAssignments: {},
  };
}

/** Synthesized id when a CSV Data Source only has singular table fields. */
export const CSV_LEGACY_TABLE_ID = "legacy";

/** Stable identity for a persisted CSV imported table. */
export function csvTableIdentity(table: {
  id: string;
  fileName?: string;
  tableName?: string;
}): string {
  if (table.id && table.id !== CSV_LEGACY_TABLE_ID) return table.id;
  return `legacy:${(table.fileName ?? "").trim()}|${(table.tableName ?? "").trim()}`;
}

export function emptyTagStore(): OrganizationTagStore {
  return { organizations: {} };
}

export function slugTagId(name: string): string {
  const slug = (normalizeTag(name) ?? "tag")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "tag";
  return `tag_${slug}`;
}

export function allocateTagId(name: string, taken: Iterable<string>): string {
  const takenSet = new Set(taken);
  const base = slugTagId(name);
  if (!takenSet.has(base)) return base;
  let suffix = 2;
  while (takenSet.has(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

export function listTagDefinitions(
  definitions: Record<string, DocumentTagDefinition>,
): DocumentTagDefinition[] {
  return Object.values(definitions).sort((a, b) => a.name.localeCompare(b.name));
}

export function findTagByName(
  definitions: Record<string, DocumentTagDefinition>,
  name: string,
): DocumentTagDefinition | null {
  const normalized = normalizeTag(name);
  if (!normalized) return null;
  return listTagDefinitions(definitions).find((tag) => tagsEqual(tag.name, normalized)) ?? null;
}

export function resolveTagIds(
  definitions: Record<string, DocumentTagDefinition>,
  tagIds: readonly string[] | undefined,
): DocumentTagDefinition[] {
  const resolved: DocumentTagDefinition[] = [];
  const seen = new Set<string>();
  for (const tagId of tagIds ?? []) {
    const tag = definitions[tagId];
    if (!tag || seen.has(tag.id)) continue;
    seen.add(tag.id);
    resolved.push(tag);
  }
  return resolved;
}

export function createTagDefinition(
  definitions: Record<string, DocumentTagDefinition>,
  rawName: string,
  color: DocumentTagColorId,
): { tag: DocumentTagDefinition } | { error: string } {
  const name = normalizeTag(rawName);
  if (!name) return { error: "Enter a tag name." };
  const existing = findTagByName(definitions, name);
  if (existing) return { error: `A tag named “${existing.name}” already exists.` };
  const tag: DocumentTagDefinition = {
    id: allocateTagId(name, Object.keys(definitions)),
    name,
    color: isDocumentTagColorId(color) ? color : suggestTagColor(name),
  };
  return { tag };
}

export function updateTagDefinition(
  definitions: Record<string, DocumentTagDefinition>,
  tagId: string,
  patch: { name: string; color: DocumentTagColorId },
): { tag: DocumentTagDefinition } | { error: string } {
  const current = definitions[tagId];
  if (!current) return { error: "That tag no longer exists." };
  const name = normalizeTag(patch.name);
  if (!name) return { error: "Enter a tag name." };
  const duplicate = findTagByName(definitions, name);
  if (duplicate && duplicate.id !== tagId) {
    return { error: `A tag named “${duplicate.name}” already exists.` };
  }
  return {
    tag: {
      ...current,
      name,
      color: isDocumentTagColorId(patch.color) ? patch.color : current.color,
    },
  };
}

export function assignTagId(
  current: readonly string[] | undefined,
  tagId: string,
): { next: string[]; applied: boolean } {
  const ids = current ?? [];
  if (ids.includes(tagId)) return { next: [...ids], applied: false };
  return { next: [...ids, tagId], applied: true };
}

export function unassignTagId(
  current: readonly string[] | undefined,
  tagId: string,
): string[] {
  return (current ?? []).filter((id) => id !== tagId);
}

export function fileIdentity(fileName: string): string {
  return fileName;
}
