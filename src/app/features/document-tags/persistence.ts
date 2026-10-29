import {
  allocateTagId,
  createTagDefinition,
  csvTableIdentity,
  emptyTagLibrary,
  fileIdentity,
  findTagByName,
  listTagDefinitions,
  PROTOTYPE_ORGANIZATION_ID,
  resolveTagIds,
  tagsEqual,
} from "./model";
import { isDocumentTagColorId, suggestTagColor } from "./tagTone";
import type {
  DataSourceEffectiveTag,
  DataSourceTagBucket,
  DocumentTagColorId,
  DocumentTagDefinition,
  DocumentTagMigrationRecord,
  OrganizationTagLibrary,
  OrganizationTagStore,
} from "./types";

const LEGACY_DOC_V1 = "luxia.document-tags.v1";
const LEGACY_DOC_V2 = "luxia.document-tags.v2";
const LEGACY_DS_V1 = "luxia.data-source-tags.v1";
const LEGACY_DS_V2 = "luxia.data-source-tags.v2";
const STORAGE_KEY = "luxia.organization-tags.v1";

/**
 * Concise Organization Tag Library for the Luxia demo.
 * Colors use the existing palette tokens only.
 */
const DEMO_TAG_LIBRARY: ReadonlyArray<{ name: string; color: DocumentTagColorId }> = [
  { name: "Analytics", color: "amber" },
  { name: "Compliance", color: "green" },
  { name: "Contracts", color: "orange" },
  { name: "Customer Data", color: "blue" },
  { name: "Finance", color: "green" },
  { name: "HR", color: "rose" },
  { name: "Internal", color: "teal" },
  { name: "Legal", color: "blue" },
  { name: "Operations", color: "teal" },
  { name: "Policy", color: "amber" },
  { name: "Production", color: "purple" },
  { name: "Reporting", color: "purple" },
];

const DEMO_TAG_NAME_SET = new Set(
  DEMO_TAG_LIBRARY.map((tag) => tag.name.trim().toLowerCase()),
);

/**
 * Semantic Data Source assignments for catalog sources.
 * Direct assignments only. File/Table Tags are seeded separately and
 * contribute to effective discovery Tags.
 * Untagged (effective empty): ds-db-02, ds-csv-02.
 */
const DEMO_SOURCE_ASSIGNMENTS: Record<string, readonly string[]> = {
  "ds-db-01": ["Analytics", "Production"],
  "ds-pdf-01": ["Legal", "Production"],
  "ds-pdf-02": ["HR", "Production"],
  "ds-pdf-03": ["Policy"],
  "ds-csv-01": ["Finance"],
  "ds-csv-03": ["Operations"],
  "ds-csv-04": ["Customer Data"],
  "ds-db-03": ["Operations", "Production"],
  "ds-db-04": ["Customer Data", "Production"],
  "ds-db-05": ["Analytics", "Reporting"],
  "ds-db-06": ["Analytics", "Customer Data"],
};

/**
 * Direct assignments only. These IDs have no Data Source-level Tags.
 * ds-csv-02 is private to another user and stays effectively untagged.
 */
const DEMO_UNTAGGED_SOURCE_IDS = ["ds-db-02", "ds-csv-02"] as const;

/**
 * File Tags are independent assignments. They contribute to effective Data Source Tags.
 * Keys must match catalog contentSummary.fileNames for that Data Source.
 * Compliance / Internal / Operations are File-only on their parent sources.
 */
const DEMO_FILE_ASSIGNMENTS: Record<string, Record<string, readonly string[]>> = {
  "ds-pdf-01": {
    "master-services-agreement.pdf": ["Compliance"],
  },
  "ds-pdf-02": {
    "employee-handbook.pdf": ["Internal"],
  },
  "ds-pdf-03": {
    "runbook.pdf": ["Operations"],
  },
};

const DEMO_FILE_CATALOG: Record<string, readonly string[]> = {
  "ds-pdf-01": [
    "master-services-agreement.pdf",
    "vendor-addendum.pdf",
    "draft-nda-template.pdf",
  ],
  "ds-pdf-02": ["employee-handbook.pdf"],
  "ds-pdf-03": ["runbook.pdf"],
};

/** Move stale demo File keys onto the real catalog file, then drop orphans. */
const DEMO_FILE_ORPHAN_REMAP: Record<string, Record<string, string>> = {};

/**
 * CSV imported-table Tags. Keys are csvTableIdentity values.
 * Reporting and Analytics are Table-only on their parent sources.
 * ds-csv-02 stays empty so it remains effectively untagged.
 */
const DEMO_TABLE_ASSIGNMENTS: Record<string, Record<string, readonly string[]>> = {
  "ds-csv-01": {
    [csvTableIdentity({
      id: "tbl-finance-orders",
      fileName: "orders.csv",
      tableName: "finance_orders",
    })]: ["Reporting"],
  },
  "ds-csv-04": {
    [csvTableIdentity({
      id: "tbl-customer-metrics",
      fileName: "customers.csv",
      tableName: "customer_metrics",
    })]: ["Analytics"],
  },
};

/** Playground / test names. Matched case-insensitively. Not product Tags. */
const ACCIDENTAL_TEST_TAG_NAMES = new Set([
  "hoda",
  "caca",
  "dwcf",
  "vvfa",
]);

let memory: OrganizationTagStore | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDataSourceTags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeDefinition(value: unknown): DocumentTagDefinition | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { id?: unknown; name?: unknown; color?: unknown };
  if (typeof record.id !== "string" || !record.id) return null;
  if (typeof record.name !== "string" || !record.name.trim()) return null;
  const name = record.name.trim().replace(/\s+/g, " ");
  const color = typeof record.color === "string" && isDocumentTagColorId(record.color)
    ? record.color
    : suggestTagColor(name);
  return { id: record.id, name, color };
}

function upsertDefinition(
  definitions: Record<string, DocumentTagDefinition>,
  name: string,
  color?: DocumentTagColorId,
): DocumentTagDefinition {
  const existing = findTagByName(definitions, name);
  if (existing) return existing;
  const tag: DocumentTagDefinition = {
    id: allocateTagId(name, Object.keys(definitions)),
    name: name.trim().replace(/\s+/g, " "),
    color: color && isDocumentTagColorId(color) ? color : suggestTagColor(name),
  };
  definitions[tag.id] = tag;
  return tag;
}

function sanitizeIdList(value: unknown, definitions: Record<string, DocumentTagDefinition>): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value.filter((tagId): tagId is string => typeof tagId === "string" && Boolean(definitions[tagId])),
  )];
}

function isAccidentalTestTagName(name: string): boolean {
  return ACCIDENTAL_TEST_TAG_NAMES.has(name.trim().toLowerCase());
}

function pruneAssignmentIds(
  ids: readonly string[] | undefined,
  dropIds: ReadonlySet<string>,
  definitions: Record<string, DocumentTagDefinition>,
): string[] {
  return [...new Set(
    (ids ?? []).filter((id) => !dropIds.has(id) && Boolean(definitions[id])),
  )];
}

/** Remove known playground Tag names and every assignment that referenced them. */
function stripAccidentalTestTags(library: OrganizationTagLibrary): boolean {
  const dropIds = new Set(
    Object.values(library.definitions)
      .filter((tag) => isAccidentalTestTagName(tag.name))
      .map((tag) => tag.id),
  );
  if (dropIds.size === 0) return false;

  for (const id of dropIds) delete library.definitions[id];

  for (const [sourceId, ids] of Object.entries(library.dataSourceAssignments)) {
    const next = pruneAssignmentIds(ids, dropIds, library.definitions);
    if (next.length > 0) library.dataSourceAssignments[sourceId] = next;
    else delete library.dataSourceAssignments[sourceId];
  }

  pruneNestedAssignmentIds(library.fileAssignments, dropIds, library.definitions);
  pruneNestedAssignmentIds(library.tableAssignments, dropIds, library.definitions);
  pruneNestedAssignmentIds(library.documentAssignments, dropIds, library.definitions);

  return true;
}

function pruneNestedAssignmentIds(
  nested: Record<string, Record<string, string[]>> | undefined,
  dropIds: Set<string>,
  definitions: Record<string, DocumentTagDefinition>,
): void {
  if (!nested) return;
  for (const [sourceId, inner] of Object.entries(nested)) {
    const mapped: Record<string, string[]> = {};
    for (const [entityId, ids] of Object.entries(inner)) {
      const next = pruneAssignmentIds(ids, dropIds, definitions);
      if (next.length > 0) mapped[entityId] = next;
    }
    if (Object.keys(mapped).length > 0) nested[sourceId] = mapped;
    else delete nested[sourceId];
  }
}

function remapNestedAssignmentIds(
  nested: Record<string, Record<string, string[]>> | undefined,
  idMap: Map<string, string>,
  definitions: Record<string, DocumentTagDefinition>,
): void {
  if (!nested) return;
  for (const [sourceId, inner] of Object.entries(nested)) {
    const mapped: Record<string, string[]> = {};
    for (const [entityId, ids] of Object.entries(inner)) {
      const next = remapIds(ids, idMap).filter((id) => definitions[id]);
      if (next.length > 0) mapped[entityId] = next;
    }
    if (Object.keys(mapped).length > 0) nested[sourceId] = mapped;
    else delete nested[sourceId];
  }
}

function cloneNestedAssignments(
  nested: Record<string, Record<string, string[]>> | undefined,
): Record<string, Record<string, string[]>> {
  return Object.fromEntries(
    Object.entries(nested ?? {}).map(([sourceId, inner]) => [
      sourceId,
      Object.fromEntries(Object.entries(inner).map(([entityId, ids]) => [entityId, [...ids]])),
    ]),
  );
}

function sanitizeNestedAssignments(
  raw: unknown,
  definitions: Record<string, DocumentTagDefinition>,
): Record<string, Record<string, string[]>> {
  const nested: Record<string, Record<string, string[]>> = {};
  if (!raw || typeof raw !== "object") return nested;
  for (const [sourceId, inner] of Object.entries(raw as Record<string, unknown>)) {
    if (!inner || typeof inner !== "object") continue;
    const mapped: Record<string, string[]> = {};
    for (const [entityId, tagIds] of Object.entries(inner as Record<string, unknown>)) {
      const ids = sanitizeIdList(tagIds, definitions);
      if (ids.length > 0) mapped[entityId] = ids;
    }
    if (Object.keys(mapped).length > 0) nested[sourceId] = mapped;
  }
  return nested;
}

function collectNestedAssignmentIds(
  nested: Record<string, Record<string, string[]>> | undefined,
  into: Set<string>,
): void {
  for (const inner of Object.values(nested ?? {})) {
    for (const ids of Object.values(inner)) {
      for (const id of ids) into.add(id);
    }
  }
}

function idsForTagNames(
  definitions: Record<string, DocumentTagDefinition>,
  names: readonly string[],
): string[] {
  const ids: string[] = [];
  for (const name of names) {
    const tag = findTagByName(definitions, name);
    if (tag && !ids.includes(tag.id)) ids.push(tag.id);
  }
  return ids;
}

function ensureCanonicalDefinitions(library: OrganizationTagLibrary): void {
  for (const item of DEMO_TAG_LIBRARY) {
    const existing = findTagByName(library.definitions, item.name);
    if (existing) {
      if (existing.name !== item.name || existing.color !== item.color) {
        library.definitions[existing.id] = {
          ...existing,
          name: item.name,
          color: item.color,
        };
      }
      continue;
    }
    upsertDefinition(library.definitions, item.name, item.color);
  }
}

/** Same normalized name → one definition. Canonical casing/color wins when present. */
function collapseDuplicateNormalizedNames(library: OrganizationTagLibrary): void {
  const groups = new Map<string, DocumentTagDefinition[]>();
  for (const tag of Object.values(library.definitions)) {
    const key = tag.name.trim().toLowerCase();
    const group = groups.get(key) ?? [];
    group.push(tag);
    groups.set(key, group);
  }
  const idMap = new Map<string, string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const canonical = group.find((tag) => DEMO_TAG_NAME_SET.has(tag.name.trim().toLowerCase()))
      ?? group[0]!;
    for (const extra of group) {
      if (extra.id === canonical.id) continue;
      idMap.set(extra.id, canonical.id);
      delete library.definitions[extra.id];
    }
  }
  if (idMap.size === 0) return;

  for (const [sourceId, ids] of Object.entries(library.dataSourceAssignments)) {
    const next = remapIds(ids, idMap).filter((id) => library.definitions[id]);
    if (next.length > 0) library.dataSourceAssignments[sourceId] = next;
    else delete library.dataSourceAssignments[sourceId];
  }
  remapNestedAssignmentIds(library.fileAssignments, idMap, library.definitions);
  remapNestedAssignmentIds(library.tableAssignments, idMap, library.definitions);
  remapNestedAssignmentIds(library.documentAssignments, idMap, library.definitions);
}

function pruneUnassignedNonCanonicalDefinitions(library: OrganizationTagLibrary): void {
  const assigned = new Set<string>();
  for (const ids of Object.values(library.dataSourceAssignments)) {
    for (const id of ids) assigned.add(id);
  }
  // Legacy fileAssignments still count, so tags kept only by migrated-away legacy rows survive.
  collectNestedAssignmentIds(library.fileAssignments, assigned);
  collectNestedAssignmentIds(library.tableAssignments, assigned);
  collectNestedAssignmentIds(library.documentAssignments, assigned);
  for (const [id, tag] of Object.entries(library.definitions)) {
    if (assigned.has(id)) continue;
    if (DEMO_TAG_NAME_SET.has(tag.name.trim().toLowerCase())) continue;
    delete library.definitions[id];
  }
}

function cloneLibrary(library: OrganizationTagLibrary): OrganizationTagLibrary {
  return {
    organizationId: library.organizationId,
    definitions: { ...library.definitions },
    dataSourceAssignments: Object.fromEntries(
      Object.entries(library.dataSourceAssignments).map(([id, ids]) => [id, [...ids]]),
    ),
    fileAssignments: cloneNestedAssignments(library.fileAssignments),
    tableAssignments: cloneNestedAssignments(library.tableAssignments),
    documentAssignments: cloneNestedAssignments(library.documentAssignments),
    documentFileNames: Object.fromEntries(
      Object.entries(library.documentFileNames ?? {}).map(([sourceId, names]) => [sourceId, { ...names }]),
    ),
    documentTagMigrations: Object.fromEntries(
      Object.entries(library.documentTagMigrations ?? {}).map(([sourceId, record]) => [
        sourceId,
        {
          ...record,
          ambiguousFileNames: [...record.ambiguousFileNames],
          unmatchedFileNames: [...record.unmatchedFileNames],
        },
      ]),
    ),
    demoAssignmentsSeeded: library.demoAssignmentsSeeded,
  };
}

/**
 * Fold a per-source definition into the Organization library.
 * Same normalized name → one definition. First-seen color wins when colors conflict.
 */
function mergeDefinitionIntoLibrary(
  library: OrganizationTagLibrary,
  incoming: DocumentTagDefinition,
): string {
  const existingByName = findTagByName(library.definitions, incoming.name);
  if (existingByName) return existingByName.id;

  const occupying = library.definitions[incoming.id];
  if (occupying && !tagsEqual(occupying.name, incoming.name)) {
    const created = createTagDefinition(library.definitions, incoming.name, incoming.color);
    if ("tag" in created) {
      library.definitions[created.tag.id] = created.tag;
      return created.tag.id;
    }
    return occupying.id;
  }

  library.definitions[incoming.id] = {
    id: incoming.id,
    name: incoming.name,
    color: incoming.color,
  };
  return incoming.id;
}

function remapIds(ids: readonly string[] | undefined, idMap: Map<string, string>): string[] {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const id of ids ?? []) {
    const mapped = idMap.get(id) ?? id;
    if (!mapped || seen.has(mapped)) continue;
    seen.add(mapped);
    next.push(mapped);
  }
  return next;
}

type LegacyBucket = {
  definitions: Record<string, DocumentTagDefinition>;
  sourceTagIds: string[];
  fileAssignments: Record<string, string[]>;
  tableAssignments: Record<string, string[]>;
};

function sanitizeLegacyBucket(raw: unknown): LegacyBucket | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as {
    definitions?: unknown;
    sourceTagIds?: unknown;
    fileAssignments?: unknown;
    tableAssignments?: unknown;
  };
  if (!record.definitions || typeof record.definitions !== "object") return null;
  const definitions: Record<string, DocumentTagDefinition> = {};
  for (const [id, value] of Object.entries(record.definitions as Record<string, unknown>)) {
    const tag = sanitizeDefinition({ ...(value as object), id: (value as { id?: string }).id ?? id });
    if (tag) definitions[tag.id] = tag;
  }
  const fileAssignments: Record<string, string[]> = {};
  if (record.fileAssignments && typeof record.fileAssignments === "object") {
    for (const [fileId, tagIds] of Object.entries(record.fileAssignments as Record<string, unknown>)) {
      fileAssignments[fileId] = sanitizeIdList(tagIds, definitions);
    }
  }
  const tableAssignments: Record<string, string[]> = {};
  if (record.tableAssignments && typeof record.tableAssignments === "object") {
    for (const [tableId, tagIds] of Object.entries(record.tableAssignments as Record<string, unknown>)) {
      tableAssignments[tableId] = sanitizeIdList(tagIds, definitions);
    }
  }
  return {
    definitions,
    sourceTagIds: sanitizeIdList(record.sourceTagIds, definitions),
    fileAssignments,
    tableAssignments,
  };
}

function migratePerSourceBuckets(
  sources: Record<string, LegacyBucket>,
  organizationId: string,
): OrganizationTagLibrary {
  // Data Source ids then tag names are sorted so color conflicts are deterministic:
  // the first-seen definition for a normalized name keeps its color.
  const library = emptyTagLibrary(organizationId);
  for (const dataSourceId of Object.keys(sources).sort()) {
    const bucket = sources[dataSourceId];
    if (!bucket) continue;
    const idMap = new Map<string, string>();
    const defs = Object.values(bucket.definitions).sort((a, b) => a.name.localeCompare(b.name));
    for (const def of defs) {
      const canonicalId = mergeDefinitionIntoLibrary(library, def);
      idMap.set(def.id, canonicalId);
    }
    const sourceIds = remapIds(bucket.sourceTagIds, idMap).filter((id) => library.definitions[id]);
    if (sourceIds.length > 0) library.dataSourceAssignments[dataSourceId] = sourceIds;
    const files: Record<string, string[]> = {};
    for (const [fileId, tagIds] of Object.entries(bucket.fileAssignments)) {
      const next = remapIds(tagIds, idMap).filter((id) => library.definitions[id]);
      if (next.length > 0) files[fileId] = next;
    }
    if (Object.keys(files).length > 0) library.fileAssignments[dataSourceId] = files;
    const tables: Record<string, string[]> = {};
    for (const [tableId, tagIds] of Object.entries(bucket.tableAssignments ?? {})) {
      const next = remapIds(tagIds, idMap).filter((id) => library.definitions[id]);
      if (next.length > 0) tables[tableId] = next;
    }
    if (Object.keys(tables).length > 0) library.tableAssignments[dataSourceId] = tables;
  }
  return library;
}

function sanitizeLibrary(raw: unknown, fallbackOrgId: string): OrganizationTagLibrary | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as {
    organizationId?: unknown;
    definitions?: unknown;
    dataSourceAssignments?: unknown;
    fileAssignments?: unknown;
    tableAssignments?: unknown;
    documentAssignments?: unknown;
    documentFileNames?: unknown;
    documentTagMigrations?: unknown;
    demoAssignmentsSeeded?: unknown;
  };
  if (!record.definitions || typeof record.definitions !== "object") return null;
  const definitions: Record<string, DocumentTagDefinition> = {};
  for (const [id, value] of Object.entries(record.definitions as Record<string, unknown>)) {
    const tag = sanitizeDefinition({ ...(value as object), id: (value as { id?: string }).id ?? id });
    if (tag) definitions[tag.id] = tag;
  }
  const dataSourceAssignments: Record<string, string[]> = {};
  if (record.dataSourceAssignments && typeof record.dataSourceAssignments === "object") {
    for (const [sourceId, tagIds] of Object.entries(record.dataSourceAssignments as Record<string, unknown>)) {
      dataSourceAssignments[sourceId] = sanitizeIdList(tagIds, definitions);
    }
  }
  const fileAssignments = sanitizeNestedAssignments(record.fileAssignments, definitions);
  const tableAssignments = sanitizeNestedAssignments(record.tableAssignments, definitions);
  const documentAssignments = sanitizeNestedAssignments(record.documentAssignments, definitions);
  return {
    organizationId: typeof record.organizationId === "string" && record.organizationId
      ? record.organizationId
      : fallbackOrgId,
    definitions,
    dataSourceAssignments,
    fileAssignments,
    tableAssignments,
    documentAssignments,
    documentFileNames: sanitizeDocumentFileNames(record.documentFileNames),
    documentTagMigrations: sanitizeDocumentTagMigrations(record.documentTagMigrations),
    demoAssignmentsSeeded: record.demoAssignmentsSeeded === true,
  };
}

function sanitizeDocumentFileNames(raw: unknown): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [sourceId, inner] of Object.entries(raw as Record<string, unknown>)) {
    if (!inner || typeof inner !== "object") continue;
    const names: Record<string, string> = {};
    for (const [documentId, fileName] of Object.entries(inner as Record<string, unknown>)) {
      if (typeof fileName === "string") names[documentId] = fileName;
    }
    if (Object.keys(names).length > 0) result[sourceId] = names;
  }
  return result;
}

function sanitizeStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sanitizeDocumentTagMigrations(raw: unknown): Record<string, DocumentTagMigrationRecord> {
  const result: Record<string, DocumentTagMigrationRecord> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [sourceId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    if (typeof record.version !== "number") continue;
    result[sourceId] = {
      version: record.version,
      migratedAt: typeof record.migratedAt === "string" ? record.migratedAt : "",
      ambiguousFileNames: sanitizeStringList(record.ambiguousFileNames),
      unmatchedFileNames: sanitizeStringList(record.unmatchedFileNames),
    };
  }
  return result;
}

function sanitizeOrgStore(raw: unknown): OrganizationTagStore | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { organizations?: unknown };
  if (record.organizations && typeof record.organizations === "object") {
    const organizations: Record<string, OrganizationTagLibrary> = {};
    for (const [orgId, value] of Object.entries(record.organizations as Record<string, unknown>)) {
      const library = sanitizeLibrary(value, orgId);
      if (library) organizations[library.organizationId] = library;
    }
    if (Object.keys(organizations).length > 0) return { organizations };
  }
  const single = sanitizeLibrary(raw, PROTOTYPE_ORGANIZATION_ID);
  if (single) return { organizations: { [single.organizationId]: single } };
  return null;
}

function sanitizeLegacyV2(raw: unknown): Record<string, LegacyBucket> | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { sources?: unknown; byDataSourceId?: unknown };
  const bucketsRaw = record.sources ?? record.byDataSourceId;
  if (!bucketsRaw || typeof bucketsRaw !== "object") return null;
  const sources: Record<string, LegacyBucket> = {};
  for (const [dataSourceId, value] of Object.entries(bucketsRaw as Record<string, unknown>)) {
    const bucket = sanitizeLegacyBucket(value);
    if (bucket) sources[dataSourceId] = bucket;
  }
  return Object.keys(sources).length > 0 ? sources : null;
}

function sanitizeLegacyGlobalStore(raw: unknown): OrganizationTagLibrary | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as { definitions?: unknown; assignments?: unknown };
  if (!record.definitions || typeof record.definitions !== "object") return null;
  if (!record.assignments || typeof record.assignments !== "object") return null;
  const library = emptyTagLibrary(PROTOTYPE_ORGANIZATION_ID);
  for (const [id, value] of Object.entries(record.definitions as Record<string, unknown>)) {
    const tag = sanitizeDefinition({ ...(value as object), id: (value as { id?: string }).id ?? id });
    if (tag) library.definitions[tag.id] = tag;
  }
  for (const [dataSourceId, tagIds] of Object.entries(record.assignments as Record<string, unknown>)) {
    const ids = sanitizeIdList(tagIds, library.definitions);
    if (ids.length > 0) library.dataSourceAssignments[dataSourceId] = ids;
  }
  return library;
}

function mergeTagIdLists(
  current: readonly string[] | undefined,
  incoming: readonly string[],
  definitions: Record<string, DocumentTagDefinition>,
): string[] {
  return [...new Set([...(current ?? []), ...incoming])].filter((id) => definitions[id]);
}

/**
 * Initial seed only. Never call on an already-seeded library — that would
 * overwrite persisted user edits to demo catalog Data Sources.
 */
function applyDemoAssignments(library: OrganizationTagLibrary): void {
  for (const [dataSourceId, names] of Object.entries(DEMO_SOURCE_ASSIGNMENTS)) {
    const ids = idsForTagNames(library.definitions, names);
    if (ids.length > 0) library.dataSourceAssignments[dataSourceId] = ids;
    else delete library.dataSourceAssignments[dataSourceId];
  }
  for (const sourceId of DEMO_UNTAGGED_SOURCE_IDS) {
    delete library.dataSourceAssignments[sourceId];
  }
  for (const [dataSourceId, files] of Object.entries(DEMO_FILE_ASSIGNMENTS)) {
    const fileMap: Record<string, string[]> = {};
    for (const [fileName, names] of Object.entries(files)) {
      const ids = idsForTagNames(library.definitions, names);
      if (ids.length > 0) fileMap[fileIdentity(fileName)] = ids;
    }
    if (Object.keys(fileMap).length > 0) library.fileAssignments[dataSourceId] = fileMap;
    else delete library.fileAssignments[dataSourceId];
  }
  for (const [dataSourceId, tables] of Object.entries(DEMO_TABLE_ASSIGNMENTS)) {
    const tableMap: Record<string, string[]> = {};
    for (const [tableId, names] of Object.entries(tables)) {
      const ids = idsForTagNames(library.definitions, names);
      if (ids.length > 0) tableMap[tableId] = ids;
    }
    if (!library.tableAssignments) library.tableAssignments = {};
    if (Object.keys(tableMap).length > 0) library.tableAssignments[dataSourceId] = tableMap;
    else delete library.tableAssignments[dataSourceId];
  }
}

/**
 * Drop File assignment keys that are not catalog files on demo File sources.
 * Remap known stale keys onto the real file so demo Tags are not lost.
 * Does not rewrite assignments on files that actually exist.
 */
function alignDemoFileAssignments(library: OrganizationTagLibrary): void {
  for (const [sourceId, allowedNames] of Object.entries(DEMO_FILE_CATALOG)) {
    const allowed = new Set(allowedNames.map((name) => fileIdentity(name)));
    const files = { ...(library.fileAssignments[sourceId] ?? {}) };
    const remaps = DEMO_FILE_ORPHAN_REMAP[sourceId] ?? {};
    for (const [orphanName, targetName] of Object.entries(remaps)) {
      const orphanId = fileIdentity(orphanName);
      const targetId = fileIdentity(targetName);
      const orphanTags = files[orphanId];
      if (!orphanTags?.length) continue;
      files[targetId] = mergeTagIdLists(files[targetId], orphanTags, library.definitions);
      delete files[orphanId];
    }
    for (const key of Object.keys(files)) {
      if (!allowed.has(key)) delete files[key];
    }
    if (Object.keys(files).length > 0) library.fileAssignments[sourceId] = files;
    else delete library.fileAssignments[sourceId];
  }
}

/**
 * Demo vocabulary + one-time assignment seed.
 * `seedAssignments` is true only when creating a library that has never lived
 * in luxia.organization-tags.v1. Existing stores keep persisted user edits.
 */
function reconcileDemoVocabulary(
  library: OrganizationTagLibrary,
  seedAssignments: boolean,
): boolean {
  const before = JSON.stringify(library);
  stripAccidentalTestTags(library);
  collapseDuplicateNormalizedNames(library);
  ensureCanonicalDefinitions(library);
  if (seedAssignments && !library.demoAssignmentsSeeded) {
    applyDemoAssignments(library);
  }
  alignDemoFileAssignments(library);
  library.demoAssignmentsSeeded = true;
  pruneUnassignedNonCanonicalDefinitions(library);
  return JSON.stringify(library) !== before;
}

function reconcileDemoVocabularyInStore(
  store: OrganizationTagStore,
  seedAssignments: boolean,
): boolean {
  let changed = false;
  for (const library of Object.values(store.organizations)) {
    if (reconcileDemoVocabulary(library, seedAssignments)) changed = true;
  }
  return changed;
}

function clearLegacyKeys(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_DOC_V1);
    window.localStorage.removeItem(LEGACY_DOC_V2);
    window.localStorage.removeItem(LEGACY_DS_V1);
    window.localStorage.removeItem(LEGACY_DS_V2);
  } catch {
    // Prototype persistence is best-effort.
  }
}

function bootstrapStore(): OrganizationTagStore {
  const current = sanitizeOrgStore(readJson(STORAGE_KEY));
  if (current) {
    if (reconcileDemoVocabularyInStore(current, false)) writeStore(current);
    return current;
  }

  let library: OrganizationTagLibrary | null = null;
  const v2 = sanitizeLegacyV2(readJson(LEGACY_DS_V2))
    ?? sanitizeLegacyV2(readJson(LEGACY_DOC_V2));
  if (v2) {
    library = migratePerSourceBuckets(v2, PROTOTYPE_ORGANIZATION_ID);
  }

  const global = sanitizeLegacyGlobalStore(readJson(LEGACY_DS_V1));
  if (global) {
    if (!library) {
      library = global;
    } else {
      for (const def of Object.values(global.definitions)) {
        mergeDefinitionIntoLibrary(library, def);
      }
      for (const [sourceId, ids] of Object.entries(global.dataSourceAssignments)) {
        const currentIds = library.dataSourceAssignments[sourceId] ?? [];
        const mapped = ids.map((id) => {
          const def = global.definitions[id];
          if (!def) return id;
          return findTagByName(library!.definitions, def.name)?.id ?? id;
        });
        library.dataSourceAssignments[sourceId] = [...new Set([...currentIds, ...mapped.filter((id) => library!.definitions[id])])];
      }
    }
  }

  if (!library) library = emptyTagLibrary(PROTOTYPE_ORGANIZATION_ID);
  const seedAssignments =
    Object.keys(library.dataSourceAssignments).length === 0
    && Object.keys(library.fileAssignments).length === 0
    && Object.keys(library.tableAssignments ?? {}).length === 0;
  reconcileDemoVocabulary(library, seedAssignments);

  const bootstrapped = { organizations: { [library.organizationId]: library } };
  writeStore(bootstrapped);
  clearLegacyKeys();
  return bootstrapped;
}

function readStore(): OrganizationTagStore {
  if (memory) return memory;
  memory = bootstrapStore();
  return memory;
}

function writeStore(next: OrganizationTagStore): void {
  memory = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Prototype persistence is best-effort.
    }
  }
  notify();
}

export function currentOrganizationId(): string {
  return PROTOTYPE_ORGANIZATION_ID;
}

export function readOrganizationTagLibrary(
  organizationId: string = currentOrganizationId(),
): OrganizationTagLibrary {
  const store = readStore();
  return cloneLibrary(store.organizations[organizationId] ?? emptyTagLibrary(organizationId));
}

export function writeOrganizationTagLibrary(library: OrganizationTagLibrary): void {
  const store = readStore();
  writeStore({
    organizations: {
      ...store.organizations,
      [library.organizationId]: cloneLibrary(library),
    },
  });
}

/** @deprecated Use readOrganizationTagLibrary. Returns the current Organization library. */
export function readDataSourceTagStore(): OrganizationTagLibrary {
  return readOrganizationTagLibrary();
}

/** @deprecated Use writeOrganizationTagLibrary. */
export function writeDataSourceTagStore(next: OrganizationTagLibrary): void {
  writeOrganizationTagLibrary(next);
}

export function isTagBucketEmpty(bucket: DataSourceTagBucket): boolean {
  return Object.keys(bucket.definitions).length === 0
    && bucket.sourceTagIds.length === 0
    && Object.keys(bucket.fileAssignments).length === 0
    && Object.keys(bucket.tableAssignments ?? {}).length === 0;
}

/**
 * Promote a creation-session draft into the Organization library + assignments.
 * With `documents`, the draft's file keys are localDocumentIds and are written
 * as document assignments; without it they are legacy filenames.
 */
export function commitDataSourceTagBucket(
  dataSourceId: string,
  bucket: DataSourceTagBucket,
  options?: { documents?: readonly TaggableDocument[] },
): void {
  const documents = options?.documents;
  if (!dataSourceId) return;
  if (isTagBucketEmpty(bucket)) {
    // Still record the source as document-keyed so later reads never fall back to filenames.
    if (documents) migrateLegacyFileTags(dataSourceId, documents);
    return;
  }
  const library = readOrganizationTagLibrary();
  const idMap = new Map<string, string>();
  for (const def of Object.values(bucket.definitions)) {
    idMap.set(def.id, mergeDefinitionIntoLibrary(library, def));
  }
  const sourceIds = remapIds(bucket.sourceTagIds, idMap).filter((id) => library.definitions[id]);
  if (sourceIds.length > 0) library.dataSourceAssignments[dataSourceId] = sourceIds;
  else delete library.dataSourceAssignments[dataSourceId];

  const files: Record<string, string[]> = {};
  for (const [fileId, tagIds] of Object.entries(bucket.fileAssignments)) {
    const next = remapIds(tagIds, idMap).filter((id) => library.definitions[id]);
    if (next.length > 0) files[fileId] = next;
  }
  if (documents) {
    migrateLegacyFileTagsInLibrary(library, dataSourceId, documents);
    const known = new Set(documents.map((document) => document.localDocumentId));
    const assignments = { ...(library.documentAssignments[dataSourceId] ?? {}) };
    for (const [documentId, tagIds] of Object.entries(files)) {
      if (known.has(documentId)) assignments[documentId] = tagIds;
    }
    if (Object.keys(assignments).length > 0) library.documentAssignments[dataSourceId] = assignments;
  } else if (Object.keys(files).length > 0) {
    library.fileAssignments[dataSourceId] = files;
  } else {
    delete library.fileAssignments[dataSourceId];
  }

  const tables: Record<string, string[]> = {};
  for (const [tableId, tagIds] of Object.entries(bucket.tableAssignments ?? {})) {
    const next = remapIds(tagIds, idMap).filter((id) => library.definitions[id]);
    if (next.length > 0) tables[tableId] = next;
  }
  if (Object.keys(tables).length > 0) library.tableAssignments[dataSourceId] = tables;
  else delete library.tableAssignments[dataSourceId];

  writeOrganizationTagLibrary(library);
}

/** Bump when the migration rules change; sources below this version migrate again. */
export const DOCUMENT_TAG_MIGRATION_VERSION = 1;

/** Minimal document shape the tag store needs. Matches DataSourceDocumentRecord. */
export type TaggableDocument = { localDocumentId: string; fileName: string };

export function isDocumentTagSourceMigrated(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): boolean {
  return (library.documentTagMigrations[dataSourceId]?.version ?? 0) >= DOCUMENT_TAG_MIGRATION_VERSION;
}

/** The File Tag map that is authoritative for a source: document-keyed once migrated, legacy otherwise. */
export function fileLevelAssignments(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): Record<string, string[]> {
  return isDocumentTagSourceMigrated(library, dataSourceId)
    ? library.documentAssignments[dataSourceId] ?? {}
    : library.fileAssignments[dataSourceId] ?? {};
}

/**
 * Move one Data Source's filename-keyed File Tags onto its document IDs.
 * Mutates `library`; returns true when it changed. Runs once per source per
 * migration version, and only with a real document list.
 *
 * - Each legacy name's tags go to every document with that name. A name held by
 *   several documents is recorded in `ambiguousFileNames` (the tags were shown
 *   on all of them before, so all of them keep them).
 * - A legacy name with no document is recorded in `unmatchedFileNames`.
 * - fileAssignments is never modified or deleted.
 */
export function migrateLegacyFileTagsInLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
  documents: readonly TaggableDocument[],
): boolean {
  if (!dataSourceId || isDocumentTagSourceMigrated(library, dataSourceId)) return false;
  const byName = new Map<string, TaggableDocument[]>();
  for (const document of documents) {
    const group = byName.get(document.fileName) ?? [];
    group.push(document);
    byName.set(document.fileName, group);
  }
  const assignments = { ...(library.documentAssignments[dataSourceId] ?? {}) };
  const names = { ...(library.documentFileNames[dataSourceId] ?? {}) };
  const ambiguousFileNames: string[] = [];
  const unmatchedFileNames: string[] = [];
  const legacy = library.fileAssignments[dataSourceId] ?? {};
  for (const fileName of Object.keys(legacy).sort()) {
    const tagIds = legacy[fileName] ?? [];
    const matches = byName.get(fileName) ?? [];
    if (matches.length === 0) {
      if (tagIds.length > 0) unmatchedFileNames.push(fileName);
      continue;
    }
    if (matches.length > 1) ambiguousFileNames.push(fileName);
    for (const document of matches) {
      const merged = mergeTagIdLists(assignments[document.localDocumentId], tagIds, library.definitions);
      if (merged.length > 0) assignments[document.localDocumentId] = merged;
    }
  }
  for (const document of documents) names[document.localDocumentId] = document.fileName;
  if (Object.keys(assignments).length > 0) library.documentAssignments[dataSourceId] = assignments;
  if (Object.keys(names).length > 0) library.documentFileNames[dataSourceId] = names;
  library.documentTagMigrations[dataSourceId] = {
    version: DOCUMENT_TAG_MIGRATION_VERSION,
    migratedAt: new Date().toISOString(),
    ambiguousFileNames,
    unmatchedFileNames,
  };
  return true;
}

/** Persisting wrapper. Call from effects or event handlers, never during render. */
export function migrateLegacyFileTags(
  dataSourceId: string,
  documents: readonly TaggableDocument[],
): void {
  const library = readOrganizationTagLibrary();
  if (migrateLegacyFileTagsInLibrary(library, dataSourceId, documents)) {
    writeOrganizationTagLibrary(library);
  }
}

/**
 * Tags for one document. Before migration this falls back to the legacy
 * filename key of the same source, which is what was shown before.
 */
export function documentTagIdsFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
  document: TaggableDocument,
): string[] {
  if (isDocumentTagSourceMigrated(library, dataSourceId)) {
    return library.documentAssignments[dataSourceId]?.[document.localDocumentId] ?? [];
  }
  return library.fileAssignments[dataSourceId]?.[fileIdentity(document.fileName)] ?? [];
}

/**
 * Remove every assignment of one Data Source ID. Only for a creation draft that
 * was discarded before the source existed, so no real source data is touched.
 * Tag definitions are kept.
 */
export function discardDraftDataSourceTagData(dataSourceId: string): void {
  const library = readOrganizationTagLibrary();
  const had = [
    library.dataSourceAssignments,
    library.fileAssignments,
    library.tableAssignments,
    library.documentAssignments,
    library.documentFileNames,
    library.documentTagMigrations,
  ].some((map) => dataSourceId in map);
  if (!had) return;
  delete library.dataSourceAssignments[dataSourceId];
  delete library.fileAssignments[dataSourceId];
  delete library.tableAssignments[dataSourceId];
  delete library.documentAssignments[dataSourceId];
  delete library.documentFileNames[dataSourceId];
  delete library.documentTagMigrations[dataSourceId];
  writeOrganizationTagLibrary(library);
}

/**
 * Remove one document's File Tags from a creation draft (the document was
 * removed before the Data Source existed). Other documents, including
 * same-name ones, are untouched.
 */
export function discardDraftDocumentTagData(dataSourceId: string, localDocumentId: string): void {
  const library = readOrganizationTagLibrary();
  const assignments = library.documentAssignments[dataSourceId];
  const names = library.documentFileNames[dataSourceId];
  if (!(assignments && localDocumentId in assignments) && !(names && localDocumentId in names)) return;
  if (assignments) delete assignments[localDocumentId];
  if (names) delete names[localDocumentId];
  writeOrganizationTagLibrary(library);
}

/** Tags of one document, read from its own Data Source only. */
export function tagsForDocumentInSource(
  dataSourceId: string,
  document: TaggableDocument,
): DocumentTagDefinition[] {
  const library = readOrganizationTagLibrary();
  return resolveTagIds(library.definitions, documentTagIdsFromLibrary(library, dataSourceId, document));
}

export function tagsForDataSource(dataSourceId: string): DocumentTagDefinition[] {
  const library = readOrganizationTagLibrary();
  return resolveTagIds(library.definitions, library.dataSourceAssignments[dataSourceId]);
}

function uniqueDefinedTagIds(
  library: OrganizationTagLibrary,
  ids: readonly string[],
): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const id of ids) {
    if (!library.definitions[id] || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

/** Content/file Tag IDs owned by this Data Source. Direct DS assignments are not included. */
export function contentTagIdsFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): string[] {
  const files = fileLevelAssignments(library, dataSourceId);
  const tables = library.tableAssignments?.[dataSourceId] ?? {};
  const ids: string[] = [];
  for (const tagIds of Object.values(files)) {
    ids.push(...tagIds);
  }
  for (const tagIds of Object.values(tables)) {
    ids.push(...tagIds);
  }
  return uniqueDefinedTagIds(library, ids);
}

/** Direct ∪ content Tag IDs. Derived; not written back as Data Source assignments. */
export function effectiveTagIdsFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): string[] {
  return uniqueDefinedTagIds(library, [
    ...(library.dataSourceAssignments[dataSourceId] ?? []),
    ...contentTagIdsFromLibrary(library, dataSourceId),
  ]);
}

/** Content Tags that are not also assigned directly to the Data Source. */
export function contentDerivedTagsFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): DocumentTagDefinition[] {
  const direct = new Set(library.dataSourceAssignments[dataSourceId] ?? []);
  const ids = contentTagIdsFromLibrary(library, dataSourceId).filter((id) => !direct.has(id));
  return resolveTagIds(library.definitions, ids).sort((a, b) => a.name.localeCompare(b.name));
}

export function effectiveTagsFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): DocumentTagDefinition[] {
  return resolveTagIds(
    library.definitions,
    effectiveTagIdsFromLibrary(library, dataSourceId),
  ).sort((a, b) => a.name.localeCompare(b.name));
}

/** Effective Tags with direct/content provenance. Derived; assignments stay separate. */
export function effectiveTagFootprintFromLibrary(
  library: OrganizationTagLibrary,
  dataSourceId: string,
): DataSourceEffectiveTag[] {
  const direct = new Set(library.dataSourceAssignments[dataSourceId] ?? []);
  const content = new Set(contentTagIdsFromLibrary(library, dataSourceId));
  return effectiveTagsFromLibrary(library, dataSourceId).map((tag) => ({
    tag,
    direct: direct.has(tag.id),
    fromContent: content.has(tag.id),
  }));
}

export function contentDerivedTagsForDataSource(dataSourceId: string): DocumentTagDefinition[] {
  return contentDerivedTagsFromLibrary(readOrganizationTagLibrary(), dataSourceId);
}

export function effectiveTagsForDataSource(dataSourceId: string): DocumentTagDefinition[] {
  return effectiveTagsFromLibrary(readOrganizationTagLibrary(), dataSourceId);
}

export function tagsForTable(dataSourceId: string, tableId: string): DocumentTagDefinition[] {
  const library = readOrganizationTagLibrary();
  return resolveTagIds(
    library.definitions,
    library.tableAssignments?.[dataSourceId]?.[tableId],
  );
}

/** Table Tags for a table identity, limited to the given Data Sources (access-safe). */
export function tagsForTableInSources(
  tableId: string,
  sourceIds: readonly string[],
): DocumentTagDefinition[] {
  const byId = new Map<string, DocumentTagDefinition>();
  for (const sourceId of sourceIds) {
    for (const tag of tagsForTable(sourceId, tableId)) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * File Tags for a filename in one Data Source, for consumers that have no
 * document ID (Constellation file lists). On a migrated source this is the
 * union of that source's documents with this name — never other sources.
 */
export function tagsForFile(dataSourceId: string, fileName: string): DocumentTagDefinition[] {
  const library = readOrganizationTagLibrary();
  if (!isDocumentTagSourceMigrated(library, dataSourceId)) {
    return resolveTagIds(
      library.definitions,
      library.fileAssignments[dataSourceId]?.[fileIdentity(fileName)],
    );
  }
  const names = library.documentFileNames[dataSourceId] ?? {};
  const ids: string[] = [];
  for (const [documentId, tagIds] of Object.entries(library.documentAssignments[dataSourceId] ?? {})) {
    if (names[documentId] === fileName) ids.push(...tagIds);
  }
  return resolveTagIds(library.definitions, ids);
}

/** File Tags for a filename, limited to the given Data Sources (access-safe). */
export function tagsForFileInSources(
  fileName: string,
  sourceIds: readonly string[],
): DocumentTagDefinition[] {
  const byId = new Map<string, DocumentTagDefinition>();
  for (const sourceId of sourceIds) {
    for (const tag of tagsForFile(sourceId, fileName)) {
      if (!byId.has(tag.id)) byId.set(tag.id, tag);
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function listOrganizationTagDefinitions(): DocumentTagDefinition[] {
  return listTagDefinitions(readOrganizationTagLibrary().definitions);
}

/** Lightweight assignment footprint for picker hints. Prototype client-side only. */
export type TagUsageCount = {
  dataSources: number;
  files: number;
  tables: number;
  total: number;
};

export function countTagUsage(tagId: string): TagUsageCount {
  const library = readOrganizationTagLibrary();
  let dataSources = 0;
  let files = 0;
  let tables = 0;
  for (const ids of Object.values(library.dataSourceAssignments)) {
    if (ids.includes(tagId)) dataSources += 1;
  }
  const fileSourceIds = new Set([
    ...Object.keys(library.fileAssignments),
    ...Object.keys(library.documentAssignments),
  ]);
  for (const sourceId of fileSourceIds) {
    for (const ids of Object.values(fileLevelAssignments(library, sourceId))) {
      if (ids.includes(tagId)) files += 1;
    }
  }
  for (const inner of Object.values(library.tableAssignments ?? {})) {
    for (const ids of Object.values(inner)) {
      if (ids.includes(tagId)) tables += 1;
    }
  }
  return {
    dataSources,
    files,
    tables,
    total: dataSources + files + tables,
  };
}

export function formatTagUsageSummary(usage: TagUsageCount): string | null {
  if (usage.total <= 0) return null;
  const parts: string[] = [];
  if (usage.dataSources > 0) {
    parts.push(
      `${usage.dataSources} data source${usage.dataSources === 1 ? "" : "s"}`,
    );
  }
  if (usage.files > 0) {
    parts.push(`${usage.files} file${usage.files === 1 ? "" : "s"}`);
  }
  if (usage.tables > 0) {
    parts.push(`${usage.tables} table${usage.tables === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return `Used in ${parts[0]}`;
  if (parts.length === 2) return `Used in ${parts[0]}, ${parts[1]}`;
  return `Used in ${parts[0]}, ${parts[1]}, ${parts[2]}`;
}

export { emptyTagStore, emptyTagBucket, emptyTagLibrary, PROTOTYPE_ORGANIZATION_ID } from "./model";
export { fileIdentity };
