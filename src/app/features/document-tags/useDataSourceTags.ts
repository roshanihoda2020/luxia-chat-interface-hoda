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
  documentTagIdsFromLibrary,
  isDocumentTagSourceMigrated,
  isTagBucketEmpty,
  migrateLegacyFileTags,
  migrateLegacyFileTagsInLibrary,
  readOrganizationTagLibrary,
  subscribeDataSourceTags,
  writeOrganizationTagLibrary,
  contentDerivedTagsFromLibrary,
  effectiveTagFootprintFromLibrary,
  type TaggableDocument,
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
  /** Draft file keys to keep: filenames, or localDocumentIds when `documents` is set. */
  retainFileNames?: readonly string[];
  retainTableIds?: readonly string[];
  /** When set, draft file keys are localDocumentIds and commit as document assignments. */
  documents?: readonly TaggableDocument[];
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
    commitDataSourceTagBucket(dataSourceId, snapshot(options), { documents: options?.documents });
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

const NO_DOCUMENTS: readonly TaggableDocument[] = [];

/**
 * Tag API for one Data Source. Pass `documents` (the source's full document
 * list) to use document File Tags; without it the source is never migrated.
 */
export function useDataSourceTags(
  dataSourceId: string,
  documents: readonly TaggableDocument[] = NO_DOCUMENTS,
) {
  const hasDocuments = documents !== NO_DOCUMENTS;
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

  // Document File Tags. Every write first migrates this source's legacy filename
  // tags using the full document list, then writes by localDocumentId only.
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const documentsSignature = useMemo(
    () => documents.map((document) => `${document.localDocumentId}\u0000${document.fileName}`).join("\u0001"),
    [documents],
  );

  useEffect(() => {
    if (!dataSourceId || !hasDocuments) return;
    if (isDocumentTagSourceMigrated(latestLibrary(), dataSourceId)) return;
    migrateLegacyFileTags(dataSourceId, documentsRef.current);
  }, [dataSourceId, documentsSignature, hasDocuments]);

  const tagsForDocument = useCallback((document: TaggableDocument) => {
    return resolveTagIds(library.definitions, documentTagIdsFromLibrary(library, dataSourceId, document));
  }, [library, dataSourceId]);

  /** Latest library with this source migrated, plus a writable copy of its document map. */
  const openDocumentWrite = useCallback(() => {
    const next = latestLibrary();
    // Without a real document list a migration would orphan every legacy tag.
    if (documentsRef.current !== NO_DOCUMENTS) {
      migrateLegacyFileTagsInLibrary(next, dataSourceId, documentsRef.current);
    }
    const assignments = { ...(next.documentAssignments[dataSourceId] ?? {}) };
    const names = { ...(next.documentFileNames[dataSourceId] ?? {}) };
    const commit = () => {
      if (Object.keys(assignments).length > 0) next.documentAssignments[dataSourceId] = assignments;
      else delete next.documentAssignments[dataSourceId];
      next.documentFileNames[dataSourceId] = names;
      writeOrganizationTagLibrary(next);
    };
    return { next, assignments, names, commit };
  }, [dataSourceId]);

  const assignToDocuments = useCallback((
    write: ReturnType<typeof openDocumentWrite>,
    targets: readonly TaggableDocument[],
    tagId: string,
  ) => {
    let appliedCount = 0;
    for (const document of targets) {
      const result = assignTagId(write.assignments[document.localDocumentId], tagId);
      if (result.applied) {
        write.assignments[document.localDocumentId] = result.next;
        write.names[document.localDocumentId] = document.fileName;
        appliedCount += 1;
      }
    }
    return appliedCount;
  }, []);

  const applyTagToDocuments = useCallback((
    targets: readonly TaggableDocument[],
    tag: DocumentTagDefinition,
  ) => {
    const write = openDocumentWrite();
    const resolved = write.next.definitions[tag.id] ?? tag;
    if (!write.next.definitions[resolved.id]) write.next.definitions[resolved.id] = resolved;
    const appliedCount = assignToDocuments(write, targets, resolved.id);
    if (appliedCount > 0) write.commit();
    return { tag: resolved, appliedCount };
  }, [assignToDocuments, openDocumentWrite]);

  const createAndApplyTagToDocuments = useCallback((
    targets: readonly TaggableDocument[],
    name: string,
    color: DocumentTagColorId,
  ) => {
    const write = openDocumentWrite();
    const existing = findTagByName(write.next.definitions, name);
    if (existing) {
      const appliedCount = assignToDocuments(write, targets, existing.id);
      if (appliedCount === 0) {
        return { error: `A tag named “${existing.name}” already exists.`, tag: existing, appliedCount: 0 };
      }
      write.commit();
      return { error: null as string | null, tag: existing, appliedCount };
    }
    const created = createTagDefinition(write.next.definitions, name, color);
    if ("error" in created) {
      return { error: created.error, tag: null as DocumentTagDefinition | null, appliedCount: 0 };
    }
    write.next.definitions[created.tag.id] = created.tag;
    const appliedCount = assignToDocuments(write, targets, created.tag.id);
    write.commit();
    return { error: null as string | null, tag: created.tag, appliedCount };
  }, [assignToDocuments, openDocumentWrite]);

  /** Remove a tag from the given documents only. Does not delete the tag definition. */
  const removeTagFromDocuments = useCallback((targets: readonly TaggableDocument[], tagId: string) => {
    const write = openDocumentWrite();
    let removedCount = 0;
    for (const document of targets) {
      const current = write.assignments[document.localDocumentId] ?? [];
      if (!current.includes(tagId)) continue;
      const remaining = unassignTagId(current, tagId);
      if (remaining.length > 0) write.assignments[document.localDocumentId] = remaining;
      else delete write.assignments[document.localDocumentId];
      removedCount += 1;
    }
    if (removedCount > 0) write.commit();
    return { removedCount };
  }, [openDocumentWrite]);

  const removeTagFromDocument = useCallback((document: TaggableDocument, tagId: string) => {
    removeTagFromDocuments([document], tagId);
  }, [removeTagFromDocuments]);

  /** Drop one document's tag assignments (after it is deleted). Same-name documents are untouched. */
  const clearDocumentAssignments = useCallback((document: TaggableDocument) => {
    const write = openDocumentWrite();
    delete write.assignments[document.localDocumentId];
    delete write.names[document.localDocumentId];
    write.commit();
  }, [openDocumentWrite]);

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
    tagsForDocument,
    applyTagToDocuments,
    createAndApplyTagToDocuments,
    removeTagFromDocument,
    removeTagFromDocuments,
    clearDocumentAssignments,
    tagsForTable,
    applyTagToTables,
    createAndApplyTagToTables,
    removeTagFromTable,
  };
}
