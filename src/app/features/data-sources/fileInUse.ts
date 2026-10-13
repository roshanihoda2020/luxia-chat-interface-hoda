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
