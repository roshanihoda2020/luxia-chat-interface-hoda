/**
 * Canonical Constellation catalog — single source of truth for Project counts,
 * Overview previews, Settings, and Chat constellation identity.
 */

import type { CapsuleConstellationType } from "./capsuleCapabilities";

export type ConstellationLifecycleStatus = "active" | "archived";

export interface CanonicalConstellationRecord {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: CapsuleConstellationType;
  status: ConstellationLifecycleStatus;
  dataSourceIds: string[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stable sample Data Source IDs — reuse the small canonical Data Source catalog
 * (ds-db-01, ds-db-02, ds-pdf-01, ds-pdf-02, ds-csv-01).
 */
export const SAMPLE_DATA_SOURCE_IDS = {
  ds01: "ds-db-01",
  ds02: "ds-db-02",
  ds03: "ds-pdf-01",
  ds04: "ds-csv-01",
  ds05: "ds-db-01",
  ds06: "ds-pdf-02",
  ds07: "ds-pdf-01",
  ds08: "ds-csv-01",
  ds09: "ds-db-02",
  ds10: "ds-pdf-02",
  ds11: "ds-db-01",
  ds12: "ds-db-02",
  ds13: "ds-csv-01",
  ds14: "ds-pdf-01",
  ds15: "ds-csv-01",
  ds16: "ds-pdf-02",
  ds17: "ds-db-02",
  ds18: "ds-csv-01",
  ds19: "ds-pdf-01",
} as const;

/**
 * Target prototype sizes:
 * - Project 01 → 5 active (full role matrix + mixed sources)
 * - Project 02 → 3 active (secondary membership pattern)
 * - Project 03 → 2 active (light collection)
 * - Project 04 → 4 active (database-heavy)
 * - Project 05 → 2 active (long Project name + low Chat count)
 * - Project 06 → 10 active (Sidebar large-list / search quick-cap)
 *
 * IDs stay in the existing `conN` family so Chat/Settings routes remain stable.
 */
export const CANONICAL_CONSTELLATIONS: CanonicalConstellationRecord[] = [
  {
    id: "con1",
    projectId: "project-01",
    name: "Constellation name 01",
    description:
      "Primary database Constellation for Project name 01.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01, SAMPLE_DATA_SOURCE_IDS.ds02],
    createdByUserId: "user-01",
    createdAt: "12 Jan 2026",
    updatedAt: "2h ago",
  },
  {
    id: "con2",
    projectId: "project-01",
    name: "Constellation name 02",
    description: "PDF Constellation for Project name 01.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "14 Jan 2026",
    updatedAt: "5h ago",
  },
  {
    id: "con3",
    projectId: "project-01",
    name: "Constellation name 03",
    description: "CSV Constellation for Project name 01.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-02",
    createdAt: "16 Jan 2026",
    updatedAt: "1d ago",
  },
  {
    id: "con4",
    projectId: "project-01",
    name: "Constellation name 04",
    description: "Secondary database Constellation for Project name 01.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds05],
    createdByUserId: "user-01",
    createdAt: "18 Jan 2026",
    updatedAt: "3d ago",
  },
  {
    id: "con5",
    projectId: "project-01",
    name: "Constellation name 05",
    description: "Secondary PDF Constellation for Project name 01.",
    type: "pdf",
    status: "active",
    // Organizational PDF connected to an Owner-demo Constellation.
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-02",
    createdAt: "20 Jan 2026",
    updatedAt: "4d ago",
  },
  {
    id: "con6",
    projectId: "project-02",
    name: "Constellation name 06",
    description: "Database Constellation for Project name 02.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "22 Jan 2026",
    updatedAt: "6h ago",
  },
  {
    id: "con7",
    projectId: "project-02",
    name: "Constellation name 07",
    description: "CSV Constellation for Project name 02.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds08],
    createdByUserId: "user-03",
    createdAt: "24 Jan 2026",
    updatedAt: "2d ago",
  },
  {
    id: "con8",
    projectId: "project-02",
    name: "Constellation name 08",
    description: "PDF Constellation for Project name 02.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds07],
    createdByUserId: "user-02",
    createdAt: "26 Jan 2026",
    updatedAt: "3d ago",
  },
  {
    id: "con9",
    projectId: "project-03",
    name: "Constellation name 09",
    description: "Database Constellation for Project name 03.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "28 Jan 2026",
    updatedAt: "1d ago",
  },
  {
    id: "con10",
    projectId: "project-03",
    name: "Constellation name 10",
    description: "PDF Constellation for Project name 03.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "30 Jan 2026",
    updatedAt: "5d ago",
  },
  {
    id: "con11",
    projectId: "project-04",
    name: "Constellation name 11",
    description: "Primary database Constellation for Project name 04.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "01 Feb 2026",
    updatedAt: "4h ago",
  },
  {
    id: "con12",
    projectId: "project-04",
    name: "Constellation name 12",
    description: "Secondary database Constellation for Project name 04.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "02 Feb 2026",
    updatedAt: "1d ago",
  },
  {
    id: "con13",
    projectId: "project-04",
    name: "Constellation name 13",
    description: "CSV Constellation for Project name 04.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-01",
    createdAt: "03 Feb 2026",
    updatedAt: "2d ago",
  },
  {
    id: "con14",
    projectId: "project-04",
    name: "Constellation name 14",
    description: "PDF Constellation for Project name 04.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "04 Feb 2026",
    updatedAt: "3d ago",
  },
  {
    id: "con15",
    projectId: "project-05",
    name: "Constellation name 15",
    description: "CSV Constellation for Project name 05.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-01",
    createdAt: "05 Feb 2026",
    updatedAt: "8h ago",
  },
  {
    id: "con16",
    projectId: "project-05",
    name: "Constellation name 16",
    description: "PDF Constellation for Project name 05.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "06 Feb 2026",
    updatedAt: "2d ago",
  },
  {
    id: "con17",
    projectId: "project-06",
    name: "Constellation name 17",
    description: "Database Constellation for Project name 06.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "07 Feb 2026",
    updatedAt: "5h ago",
  },
  {
    id: "con18",
    projectId: "project-06",
    name: "Constellation name 18",
    description: "CSV Constellation for Project name 06.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-01",
    createdAt: "08 Feb 2026",
    updatedAt: "1d ago",
  },
  {
    id: "con19",
    projectId: "project-06",
    name: "Constellation name 19",
    description: "PDF Constellation for Project name 06.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "09 Feb 2026",
    updatedAt: "4d ago",
  },
  {
    id: "con20",
    projectId: "project-06",
    name: "Constellation name 20",
    description: "Secondary database Constellation for Project name 06.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "10 Feb 2026",
    updatedAt: "6h ago",
  },
  {
    id: "con21",
    projectId: "project-06",
    name: "Constellation name 21",
    description: "Secondary CSV Constellation for Project name 06.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-01",
    createdAt: "11 Feb 2026",
    updatedAt: "7h ago",
  },
  {
    id: "con22",
    projectId: "project-06",
    name: "Constellation name 22",
    description: "Secondary PDF Constellation for Project name 06.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "12 Feb 2026",
    updatedAt: "8h ago",
  },
  {
    id: "con23",
    projectId: "project-06",
    name: "Constellation name 23",
    description: "Tertiary database Constellation for Project name 06.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "13 Feb 2026",
    updatedAt: "9h ago",
  },
  {
    id: "con24",
    projectId: "project-06",
    name: "Constellation name 24",
    description: "Tertiary CSV Constellation for Project name 06.",
    type: "csv",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds04],
    createdByUserId: "user-01",
    createdAt: "14 Feb 2026",
    updatedAt: "10h ago",
  },
  {
    id: "con25",
    projectId: "project-06",
    name: "Constellation name 25",
    description: "Tertiary PDF Constellation for Project name 06.",
    type: "pdf",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds03],
    createdByUserId: "user-01",
    createdAt: "15 Feb 2026",
    updatedAt: "11h ago",
  },
  {
    id: "con26",
    projectId: "project-06",
    name: "Constellation name 26",
    description: "Quaternary database Constellation for Project name 06.",
    type: "database",
    status: "active",
    dataSourceIds: [SAMPLE_DATA_SOURCE_IDS.ds01],
    createdByUserId: "user-01",
    createdAt: "16 Feb 2026",
    updatedAt: "12h ago",
  },
];

export function getCanonicalConstellationById(
  constellationId: string,
): CanonicalConstellationRecord | undefined {
  return CANONICAL_CONSTELLATIONS.find((item) => item.id === constellationId);
}

export function getProjectConstellations(
  projectId: string,
  options?: { includeArchived?: boolean },
): CanonicalConstellationRecord[] {
  return CANONICAL_CONSTELLATIONS.filter((item) => {
    if (item.projectId !== projectId) return false;
    if (!options?.includeArchived && item.status === "archived") return false;
    return true;
  });
}

export function getProjectConstellationCount(projectId: string): number {
  return getProjectConstellations(projectId).length;
}

export function getConstellationSourceCount(constellationId: string): number {
  return getCanonicalConstellationById(constellationId)?.dataSourceIds.length ?? 0;
}

/** Map of constellationId → connected source count (derived, not hardcoded). */
export function buildConstellationSourceCountMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of CANONICAL_CONSTELLATIONS) {
    map[item.id] = item.dataSourceIds.length;
  }
  return map;
}
