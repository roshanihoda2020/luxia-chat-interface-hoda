import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assignTagId,
  createTagDefinition,
  emptyTagBucket,
  fileIdentity,
  findTagByName,
  listTagDefinitions,
  resolveTagIds,
  unassignTagId,
  updateTagDefinition,
} from "./model";
import {
  commitDataSourceTagBucket,
  isTagBucketEmpty,
  readOrganizationTagLibrary,
  subscribeDataSourceTags,
  writeOrganizationTagLibrary,
  contentDerivedTagsFromLibrary,
  effectiveTagFootprintFromLibrary,
} from "./persistence";
import type {
  DataSourceTagBucket,
  DocumentTagColorId,
  DocumentTagDefinition,
  OrganizationTagLibrary,
} from "./types";

export function useDataSourceTagStore(): OrganizationTagLibrary {
  const [library, setLibrary] = useState<OrganizationTagLibrary>(() => readOrganizationTagLibrary());

  useEffect(() => subscribeDataSourceTags(() => {
    setLibrary(readOrganizationTagLibrary());
  }), []);

  return library;
}

function cloneBucket(bucket: DataSourceTagBucket): DataSourceTagBucket {
  return {
    definitions: { ...bucket.definitions },
    sourceTagIds: [...bucket.sourceTagIds],
    fileAssignments: Object.fromEntries(
      Object.entries(bucket.fileAssignments).map(([fileId, ids]) => [fileId, [...ids]]),
    ),
    tableAssignments: Object.fromEntries(
      Object.entries(bucket.tableAssignments ?? {}).map(([tableId, ids]) => [tableId, [...ids]]),
    ),
  };
}

function pruneFileAssignments(
  bucket: DataSourceTagBucket,
  retainFileNames?: readonly string[],
): DataSourceTagBucket {
  if (retainFileNames === undefined) return bucket;
  const keep = new Set(retainFileNames.map((name) => fileIdentity(name)));
  bucket.fileAssignments = Object.fromEntries(
    Object.entries(bucket.fileAssignments).filter(([fileId]) => keep.has(fileId)),
  );
  return bucket;
}

function pruneTableAssignments(
  bucket: DataSourceTagBucket,
  retainTableIds?: readonly string[],
): DataSourceTagBucket {
  if (retainTableIds === undefined) return bucket;
  const keep = new Set(retainTableIds);
  bucket.tableAssignments = Object.fromEntries(
    Object.entries(bucket.tableAssignments ?? {}).filter(([tableId]) => keep.has(tableId)),
  );
  return bucket;
}

function mergedDefinitions(
  library: OrganizationTagLibrary,
  draft: DataSourceTagBucket,
): Record<string, DocumentTagDefinition> {
  return { ...library.definitions, ...draft.definitions };
}

export type DraftTagCommitOptions = {
  retainFileNames?: readonly string[];
  retainTableIds?: readonly string[];
};

/** In-memory assignment draft. New definitions stay local until commitTo. */
export function useDraftDataSourceTags() {
  const library = useDataSourceTagStore();
  const [bucket, setBucket] = useState<DataSourceTagBucket>(() => emptyTagBucket());
  const bucketRef = useRef(bucket);
  bucketRef.current = bucket;

  const catalog = useMemo(
    () => listTagDefinitions(mergedDefinitions(library, bucket)),
    [library, bucket],
  );
  const tags = useMemo(
    () => resolveTagIds(mergedDefinitions(library, bucket), bucket.sourceTagIds),
    [library, bucket],
  );
  const isEmpty = isTagBucketEmpty(bucket);

  const writeBucket = useCallback((next: DataSourceTagBucket) => {
    bucketRef.current = next;
    setBucket(next);
  }, []);

  const snapshot = useCallback((options?: DraftTagCommitOptions) => {
    const next = pruneFileAssignments(cloneBucket(bucketRef.current), options?.retainFileNames);
    return pruneTableAssignments(next, options?.retainTableIds);
  }, []);

  const reset = useCallback(() => {
    writeBucket(emptyTagBucket());
  }, [writeBucket]);

  const commitTo = useCallback((dataSourceId: string, options?: DraftTagCommitOptions) => {
    commitDataSourceTagBucket(dataSourceId, snapshot(options));
  }, [snapshot]);

  const applyTag = useCallback((tag: DocumentTagDefinition) => {
    const next = cloneBucket(bucketRef.current);
    const assigned = assignTagId(next.sourceTagIds, tag.id);
    next.sourceTagIds = assigned.next;
    writeBucket(next);
    return { tag, applied: assigned.applied };
  }, [writeBucket]);

  const createAndApplyTag = useCallback((name: string, color: DocumentTagColorId) => {
    const defs = mergedDefinitions(readOrganizationTagLibrary(), bucketRef.current);
    const existing = findTagByName(defs, name);
    if (existing) {
      const next = cloneBucket(bucketRef.current);
      const assigned = assignTagId(next.sourceTagIds, existing.id);
      if (!assigned.applied) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, applied: false };
      }
      next.sourceTagIds = assigned.next;
      writeBucket(next);
      return { error: null as string | null, tag: existing, applied: true };
    }
    const created = createTagDefinition(defs, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, applied: false };
    }
    const next = cloneBucket(bucketRef.current);
    next.definitions[created.tag.id] = created.tag;
    const assigned = assignTagId(next.sourceTagIds, created.tag.id);
    next.sourceTagIds = assigned.next;
    writeBucket(next);
    return { error: null as string | null, tag: created.tag, applied: assigned.applied };
  }, [writeBucket]);

  const updateTag = useCallback((
    tagId: string,
    patch: { name: string; color: DocumentTagColorId },
  ) => {
    const next = cloneBucket(bucketRef.current);
    if (!next.definitions[tagId]) {
      return "Only tags created in this draft can be edited before the Data Source exists.";
    }
    const defs = mergedDefinitions(readOrganizationTagLibrary(), next);
    const updated = updateTagDefinition(defs, tagId, patch);
    if ("error" in updated) return updated.error;
    next.definitions[updated.tag.id] = updated.tag;
    writeBucket(next);
    return null;
  }, [writeBucket]);

  const isDraftCreated = useCallback((tagId: string) => {
    return Boolean(bucketRef.current.definitions[tagId]);
  }, []);

  const removeTag = useCallback((tagId: string) => {
    const next = cloneBucket(bucketRef.current);
    next.sourceTagIds = unassignTagId(next.sourceTagIds, tagId);
    writeBucket(next);
  }, [writeBucket]);

  const tagsForFileName = useCallback((fileName: string) => {
    const current = bucketRef.current;
    return resolveTagIds(
      mergedDefinitions(readOrganizationTagLibrary(), current),
      current.fileAssignments[fileIdentity(fileName)],
    );
  }, [bucket, library]);

  const applyTagToFiles = useCallback((fileNames: readonly string[], tag: DocumentTagDefinition) => {
    const next = cloneBucket(bucketRef.current);
    let appliedCount = 0;
    for (const fileName of fileNames) {
      const fileId = fileIdentity(fileName);
      const assigned = assignTagId(next.fileAssignments[fileId], tag.id);
      if (assigned.applied) {
        next.fileAssignments[fileId] = assigned.next;
        appliedCount += 1;
      }
    }
    writeBucket(next);
    return { tag, appliedCount };
  }, [writeBucket]);

  const createAndApplyTagToFiles = useCallback((
    fileNames: readonly string[],
    name: string,
    color: DocumentTagColorId,
  ) => {
    const defs = mergedDefinitions(readOrganizationTagLibrary(), bucketRef.current);
    const existing = findTagByName(defs, name);
    if (existing) {
      const next = cloneBucket(bucketRef.current);
      let appliedCount = 0;
      for (const fileName of fileNames) {
        const fileId = fileIdentity(fileName);
        const assigned = assignTagId(next.fileAssignments[fileId], existing.id);
        if (assigned.applied) {
          next.fileAssignments[fileId] = assigned.next;
          appliedCount += 1;
        }
      }
      if (appliedCount === 0) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, appliedCount: 0 };
      }
      writeBucket(next);
      return { error: null as string | null, tag: existing, appliedCount };
    }
    const created = createTagDefinition(defs, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, appliedCount: 0 };
    }
    const next = cloneBucket(bucketRef.current);
    next.definitions[created.tag.id] = created.tag;
    let appliedCount = 0;
    for (const fileName of fileNames) {
      const fileId = fileIdentity(fileName);
      const assigned = assignTagId(next.fileAssignments[fileId], created.tag.id);
      if (assigned.applied) {
        next.fileAssignments[fileId] = assigned.next;
        appliedCount += 1;
      }
    }
    writeBucket(next);
    return { error: null as string | null, tag: created.tag, appliedCount };
  }, [writeBucket]);

  const removeTagFromFile = useCallback((fileName: string, tagId: string) => {
    const next = cloneBucket(bucketRef.current);
    const fileId = fileIdentity(fileName);
    next.fileAssignments[fileId] = unassignTagId(next.fileAssignments[fileId], tagId);
    writeBucket(next);
  }, [writeBucket]);

  const clearFileAssignments = useCallback((fileName: string) => {
    const next = cloneBucket(bucketRef.current);
    delete next.fileAssignments[fileIdentity(fileName)];
    writeBucket(next);
  }, [writeBucket]);

  const tagsForTable = useCallback((tableId: string) => {
    const current = bucketRef.current;
    return resolveTagIds(
      mergedDefinitions(readOrganizationTagLibrary(), current),
      current.tableAssignments[tableId],
    );
  }, [bucket, library]);

  const applyTagToTables = useCallback((tableIds: readonly string[], tag: DocumentTagDefinition) => {
    const next = cloneBucket(bucketRef.current);
    let appliedCount = 0;
    for (const tableId of tableIds) {
      const assigned = assignTagId(next.tableAssignments[tableId], tag.id);
      if (assigned.applied) {
        next.tableAssignments[tableId] = assigned.next;
        appliedCount += 1;
      }
    }
    writeBucket(next);
    return { tag, appliedCount };
  }, [writeBucket]);

  const createAndApplyTagToTables = useCallback((
    tableIds: readonly string[],
    name: string,
    color: DocumentTagColorId,
  ) => {
    const defs = mergedDefinitions(readOrganizationTagLibrary(), bucketRef.current);
    const existing = findTagByName(defs, name);
    if (existing) {
      const next = cloneBucket(bucketRef.current);
      let appliedCount = 0;
      for (const tableId of tableIds) {
        const assigned = assignTagId(next.tableAssignments[tableId], existing.id);
        if (assigned.applied) {
          next.tableAssignments[tableId] = assigned.next;
          appliedCount += 1;
        }
      }
      if (appliedCount === 0) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, appliedCount: 0 };
      }
      writeBucket(next);
      return { error: null as string | null, tag: existing, appliedCount };
    }
    const created = createTagDefinition(defs, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, appliedCount: 0 };
    }
    const next = cloneBucket(bucketRef.current);
    next.definitions[created.tag.id] = created.tag;
    let appliedCount = 0;
    for (const tableId of tableIds) {
      const assigned = assignTagId(next.tableAssignments[tableId], created.tag.id);
      if (assigned.applied) {
        next.tableAssignments[tableId] = assigned.next;
        appliedCount += 1;
      }
    }
    writeBucket(next);
    return { error: null as string | null, tag: created.tag, appliedCount };
  }, [writeBucket]);

  const removeTagFromTable = useCallback((tableId: string, tagId: string) => {
    const next = cloneBucket(bucketRef.current);
    next.tableAssignments[tableId] = unassignTagId(next.tableAssignments[tableId], tagId);
    writeBucket(next);
  }, [writeBucket]);

  const clearTableAssignments = useCallback((tableId: string) => {
    const next = cloneBucket(bucketRef.current);
    delete next.tableAssignments[tableId];
    writeBucket(next);
  }, [writeBucket]);

  return {
    tags,
    catalog,
    isEmpty,
    isDraftCreated,
    applyTag,
    createAndApplyTag,
    updateTag,
    removeTag,
    tagsForFileName,
    applyTagToFiles,
    createAndApplyTagToFiles,
    removeTagFromFile,
    clearFileAssignments,
    tagsForTable,
    applyTagToTables,
    createAndApplyTagToTables,
    removeTagFromTable,
    clearTableAssignments,
    reset,
    snapshot,
    commitTo,
  };
}

export type DraftDataSourceTagsApi = ReturnType<typeof useDraftDataSourceTags>;

function latestLibrary(): OrganizationTagLibrary {
  return readOrganizationTagLibrary();
}

export function useDataSourceTags(dataSourceId: string) {
  const library = useDataSourceTagStore();

  const catalog = useMemo(() => listTagDefinitions(library.definitions), [library.definitions]);
  const tags = useMemo(
    () => resolveTagIds(library.definitions, library.dataSourceAssignments[dataSourceId]),
    [library.definitions, library.dataSourceAssignments, dataSourceId],
  );
  const contentDerivedTags = useMemo(
    () => contentDerivedTagsFromLibrary(library, dataSourceId),
    [library, dataSourceId],
  );
  const footprint = useMemo(
    () => effectiveTagFootprintFromLibrary(library, dataSourceId),
    [library, dataSourceId],
  );

  const applyTag = useCallback((tag: DocumentTagDefinition) => {
    const next = latestLibrary();
    const resolved = next.definitions[tag.id] ?? tag;
    if (!next.definitions[resolved.id]) next.definitions[resolved.id] = resolved;
    const result = assignTagId(next.dataSourceAssignments[dataSourceId], resolved.id);
    if (!result.applied) {
      return { tag: resolved, applied: false };
    }
    next.dataSourceAssignments[dataSourceId] = result.next;
    writeOrganizationTagLibrary(next);
    return { tag: resolved, applied: true };
  }, [dataSourceId]);

  const createAndApplyTag = useCallback((name: string, color: DocumentTagColorId) => {
    const next = latestLibrary();
    const existing = findTagByName(next.definitions, name);
    if (existing) {
      const result = assignTagId(next.dataSourceAssignments[dataSourceId], existing.id);
      if (!result.applied) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, applied: false };
      }
      next.dataSourceAssignments[dataSourceId] = result.next;
      writeOrganizationTagLibrary(next);
      return { error: null as string | null, tag: existing, applied: true };
    }
    const created = createTagDefinition(next.definitions, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, applied: false };
    }
    next.definitions[created.tag.id] = created.tag;
    const result = assignTagId(next.dataSourceAssignments[dataSourceId], created.tag.id);
    next.dataSourceAssignments[dataSourceId] = result.next;
    writeOrganizationTagLibrary(next);
    return { error: null as string | null, tag: created.tag, applied: result.applied };
  }, [dataSourceId]);

  const updateTag = useCallback((
    tagId: string,
    patch: { name: string; color: DocumentTagColorId },
  ) => {
    const next = latestLibrary();
    const updated = updateTagDefinition(next.definitions, tagId, patch);
    if ("error" in updated) return updated.error;
    next.definitions[updated.tag.id] = updated.tag;
    writeOrganizationTagLibrary(next);
    return null;
  }, []);

  const removeTag = useCallback((tagId: string) => {
    const next = latestLibrary();
    next.dataSourceAssignments[dataSourceId] = unassignTagId(
      next.dataSourceAssignments[dataSourceId],
      tagId,
    );
    writeOrganizationTagLibrary(next);
  }, [dataSourceId]);

  const tagsForFileName = useCallback((fileName: string) => {
    return resolveTagIds(
      library.definitions,
      library.fileAssignments[dataSourceId]?.[fileIdentity(fileName)],
    );
  }, [library.definitions, library.fileAssignments, dataSourceId]);

  const applyTagToFiles = useCallback((fileNames: readonly string[], tag: DocumentTagDefinition) => {
    const next = latestLibrary();
    const resolved = next.definitions[tag.id] ?? tag;
    if (!next.definitions[resolved.id]) next.definitions[resolved.id] = resolved;
    const files = { ...(next.fileAssignments[dataSourceId] ?? {}) };
    let appliedCount = 0;
    for (const fileName of fileNames) {
      const fileId = fileIdentity(fileName);
      const result = assignTagId(files[fileId], resolved.id);
      if (result.applied) {
        files[fileId] = result.next;
        appliedCount += 1;
      }
    }
    if (appliedCount > 0) {
      next.fileAssignments[dataSourceId] = files;
      writeOrganizationTagLibrary(next);
    }
    return { tag: resolved, appliedCount };
  }, [dataSourceId]);

  const createAndApplyTagToFiles = useCallback((
    fileNames: readonly string[],
    name: string,
    color: DocumentTagColorId,
  ) => {
    const next = latestLibrary();
    const existing = findTagByName(next.definitions, name);
    if (existing) {
      const files = { ...(next.fileAssignments[dataSourceId] ?? {}) };
      let appliedCount = 0;
      for (const fileName of fileNames) {
        const fileId = fileIdentity(fileName);
        const result = assignTagId(files[fileId], existing.id);
        if (result.applied) {
          files[fileId] = result.next;
          appliedCount += 1;
        }
      }
      if (appliedCount === 0) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, appliedCount: 0 };
      }
      next.fileAssignments[dataSourceId] = files;
      writeOrganizationTagLibrary(next);
      return { error: null as string | null, tag: existing, appliedCount };
    }
    const created = createTagDefinition(next.definitions, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, appliedCount: 0 };
    }
    next.definitions[created.tag.id] = created.tag;
    const files = { ...(next.fileAssignments[dataSourceId] ?? {}) };
    let appliedCount = 0;
    for (const fileName of fileNames) {
      const fileId = fileIdentity(fileName);
      const result = assignTagId(files[fileId], created.tag.id);
      if (result.applied) {
        files[fileId] = result.next;
        appliedCount += 1;
      }
    }
    next.fileAssignments[dataSourceId] = files;
    writeOrganizationTagLibrary(next);
    return { error: null as string | null, tag: created.tag, appliedCount };
  }, [dataSourceId]);

  const removeTagFromFile = useCallback((fileName: string, tagId: string) => {
    const next = latestLibrary();
    const files = { ...(next.fileAssignments[dataSourceId] ?? {}) };
    const fileId = fileIdentity(fileName);
    files[fileId] = unassignTagId(files[fileId], tagId);
    next.fileAssignments[dataSourceId] = files;
    writeOrganizationTagLibrary(next);
  }, [dataSourceId]);

  /** Drop all tag assignments for a document (e.g. after the file is deleted). */
  const clearFileAssignments = useCallback((fileName: string) => {
    const next = latestLibrary();
    const files = { ...(next.fileAssignments[dataSourceId] ?? {}) };
    delete files[fileIdentity(fileName)];
    if (Object.keys(files).length > 0) {
      next.fileAssignments[dataSourceId] = files;
    } else {
      delete next.fileAssignments[dataSourceId];
    }
    writeOrganizationTagLibrary(next);
  }, [dataSourceId]);

  const tagsForTable = useCallback((tableId: string) => {
    return resolveTagIds(
      library.definitions,
      library.tableAssignments[dataSourceId]?.[tableId],
    );
  }, [library.definitions, library.tableAssignments, dataSourceId]);

  const applyTagToTables = useCallback((tableIds: readonly string[], tag: DocumentTagDefinition) => {
    const next = latestLibrary();
    const resolved = next.definitions[tag.id] ?? tag;
    if (!next.definitions[resolved.id]) next.definitions[resolved.id] = resolved;
    const tables = { ...(next.tableAssignments[dataSourceId] ?? {}) };
    let appliedCount = 0;
    for (const tableId of tableIds) {
      const result = assignTagId(tables[tableId], resolved.id);
      if (result.applied) {
        tables[tableId] = result.next;
        appliedCount += 1;
      }
    }
    if (appliedCount > 0) {
      next.tableAssignments[dataSourceId] = tables;
      writeOrganizationTagLibrary(next);
    }
    return { tag: resolved, appliedCount };
  }, [dataSourceId]);

  const createAndApplyTagToTables = useCallback((
    tableIds: readonly string[],
    name: string,
    color: DocumentTagColorId,
  ) => {
    const next = latestLibrary();
    const existing = findTagByName(next.definitions, name);
    if (existing) {
      const tables = { ...(next.tableAssignments[dataSourceId] ?? {}) };
      let appliedCount = 0;
      for (const tableId of tableIds) {
        const result = assignTagId(tables[tableId], existing.id);
        if (result.applied) {
          tables[tableId] = result.next;
          appliedCount += 1;
        }
      }
      if (appliedCount === 0) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, appliedCount: 0 };
      }
      next.tableAssignments[dataSourceId] = tables;
      writeOrganizationTagLibrary(next);
      return { error: null as string | null, tag: existing, appliedCount };
    }
    const created = createTagDefinition(next.definitions, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, appliedCount: 0 };
    }
    next.definitions[created.tag.id] = created.tag;
    const tables = { ...(next.tableAssignments[dataSourceId] ?? {}) };
    let appliedCount = 0;
    for (const tableId of tableIds) {
      const result = assignTagId(tables[tableId], created.tag.id);
      if (result.applied) {
        tables[tableId] = result.next;
        appliedCount += 1;
      }
    }
    next.tableAssignments[dataSourceId] = tables;
    writeOrganizationTagLibrary(next);
    return { error: null as string | null, tag: created.tag, appliedCount };
  }, [dataSourceId]);

  const removeTagFromTable = useCallback((tableId: string, tagId: string) => {
    const next = latestLibrary();
    const tables = { ...(next.tableAssignments[dataSourceId] ?? {}) };
    tables[tableId] = unassignTagId(tables[tableId], tagId);
    next.tableAssignments[dataSourceId] = tables;
    writeOrganizationTagLibrary(next);
  }, [dataSourceId]);

  return {
    tags,
    contentDerivedTags,
    footprint,
    catalog,
    applyTag,
    createAndApplyTag,
    updateTag,
    removeTag,
    tagsForFileName,
    applyTagToFiles,
    createAndApplyTagToFiles,
    removeTagFromFile,
    clearFileAssignments,
    tagsForTable,
    applyTagToTables,
    createAndApplyTagToTables,
    removeTagFromTable,
  };
}
