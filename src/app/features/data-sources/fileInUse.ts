/**
 * Prototype File-in-use dependency model.
 *
 * Mirrors Dev's per-file Constellation attachment (constellation_s3_file_metadata),
 * not whole-Data-Source connectivity. Seeded locally — no backend.
 */

import { getCanonicalConstellationById } from "@/app/features/constellation";
import { getProjectNameById } from "@/app/features/project";

export type FileInUseDependency = {
  constellationId: string;
  constellationName: string;
  projectId: string;
  projectName: string;
};

/**
 * Canonical attachment map:
 * fileAttachmentsByDataSourceId[sourceId][fileName] = constellationId[]
 *
 * Demo seed (ds-pdf-01 expanded files — see permissions/data.ts):
 * - master-services-agreement.pdf → many (con2, con5, con8, con10) across Projects
 * - vendor-addendum.pdf → one (con2)
 * - draft-nda-template.pdf → unused (absent)
 * - ds-pdf-02 / ds-pdf-03 documents → unused
 */
export const fileAttachmentsByDataSourceId: Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
> = {
  "ds-pdf-01": {
    "master-services-agreement.pdf": ["con2", "con5", "con8", "con10"],
    "vendor-addendum.pdf": ["con2"],
  },
};

/** Resolve active Constellation attachments for a Data Source file. Re-run on every delete attempt. */
export function getFileInUseDependencies(
  sourceId: string,
  fileName: string,
): FileInUseDependency[] {
  const attachedIds = fileAttachmentsByDataSourceId[sourceId]?.[fileName];
  if (!attachedIds?.length) return [];

  const seen = new Set<string>();
  const deps: FileInUseDependency[] = [];

  for (const constellationId of attachedIds) {
    if (seen.has(constellationId)) continue;
    seen.add(constellationId);

    const record = getCanonicalConstellationById(constellationId);
    if (!record || record.status !== "active") continue;

    deps.push({
      constellationId: record.id,
      constellationName: record.name,
      projectId: record.projectId,
      projectName: getProjectNameById(record.projectId),
    });
  }

  return deps;
}

export function isFileInUse(sourceId: string, fileName: string): boolean {
  return getFileInUseDependencies(sourceId, fileName).length > 0;
}

/**
 * Document-level attachments made by this session's Constellations, keyed by
 * `dataSourceId::localDocumentId`. Rebuilt by App from every capability bundle
 * whose PDF files carry a document reference. In memory, like the bundles.
 */
let documentAttachments = new Map<string, FileInUseDependency[]>();

function documentKey(dataSourceId: string, localDocumentId: string): string {
  return `${dataSourceId}::${localDocumentId}`;
}

export function replaceConstellationDocumentAttachments(
  attachments: ReadonlyArray<{
    dataSourceId: string;
    localDocumentId: string;
    dependency: FileInUseDependency;
  }>,
): void {
  const next = new Map<string, FileInUseDependency[]>();
  for (const { dataSourceId, localDocumentId, dependency } of attachments) {
    const key = documentKey(dataSourceId, localDocumentId);
    const list = next.get(key) ?? [];
    if (!list.some((item) => item.constellationId === dependency.constellationId)) list.push(dependency);
    next.set(key, list);
  }
  documentAttachments = next;
}

/**
 * Constellations using one document. Document references are matched exactly,
 * so a same-name document is never blocked. The seeded filename map applies
 * only to legacy documents whose identity was derived from the filename —
 * kept so existing demo safeguards are not weakened.
 */
export function getDocumentInUseDependencies(
  sourceId: string,
  document: { localDocumentId: string; fileName: string; localDocumentIdOrigin?: string },
): FileInUseDependency[] {
  const deps = [...(documentAttachments.get(documentKey(sourceId, document.localDocumentId)) ?? [])];
  if (document.localDocumentIdOrigin === "derived") {
    for (const dependency of getFileInUseDependencies(sourceId, document.fileName)) {
      if (!deps.some((item) => item.constellationId === dependency.constellationId)) deps.push(dependency);
    }
  }
  return deps;
}
