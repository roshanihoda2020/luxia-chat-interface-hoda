/**
 * Capsule capability map — product source of truth for Constellation Settings Configuration.
 * Mirrors App.tsx SectionId / CONSTELLATION_SECTIONS. Do not invent capabilities here.
 */

import {
  BarChart3,
  BookOpen,
  Cpu,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Network,
  Table2,
  type LucideIcon,
} from "lucide-react";

export type CapsuleCapabilityId =
  | "kb"
  | "dataTable"
  | "views"
  | "contextFiles"
  | "relationship"
  | "metrics"
  | "instr"
  | "pdfFiles"
  | "crawler";

export type CapsuleConstellationType = "database" | "pdf" | "csv";

/**
 * Approved Chat Constellation capsule icons — single shared map for Configuration
 * rows, capability page headers, and the Chat capsule (via SECTION_META).
 */
export const CAPSULE_CAPABILITY_ICON: Record<CapsuleCapabilityId, LucideIcon> = {
  dataTable: Table2,
  views: Layers,
  kb: BookOpen,
  instr: Cpu,
  contextFiles: FolderOpen,
  relationship: Network,
  metrics: BarChart3,
  pdfFiles: FileText,
  crawler: Globe,
};

export const CAPSULE_CAPABILITY_META: Record<
  CapsuleCapabilityId,
  {
    label: string;
    purpose: string;
    manageLabel: string;
  }
> = {
  dataTable: {
    label: "Active Data Tables",
    purpose: "Choose which database tables are available to this Constellation.",
    manageLabel: "Manage Active Data Tables",
  },
  views: {
    label: "Views",
    purpose: "Choose which database views are available to this Constellation.",
    manageLabel: "Manage Views",
  },
  kb: {
    label: "Knowledge Base",
    purpose: "Manage structured knowledge used as additional context.",
    manageLabel: "Manage Knowledge Base",
  },
  instr: {
    label: "Instruction",
    purpose: "Define how this Constellation interprets requests and responds.",
    manageLabel: "Edit Instruction",
  },
  contextFiles: {
    label: "Extra Context Files",
    purpose: "Manage supporting files used as additional context.",
    manageLabel: "Manage Extra Context Files",
  },
  relationship: {
    label: "Relationships",
    purpose: "Define relationships between active data structures.",
    manageLabel: "Manage Relationships",
  },
  metrics: {
    label: "Metrics",
    purpose: "Manage reusable analytical metrics.",
    manageLabel: "Manage Metrics",
  },
  pdfFiles: {
    label: "PDF Files",
    purpose: "Manage the primary PDF documents used by this Constellation.",
    manageLabel: "Manage PDF Files",
  },
  crawler: {
    label: "Crawler URLs",
    purpose: "Manage website sources used by this Constellation.",
    manageLabel: "Manage Crawler URLs",
  },
};

/** Exact capsule order for Database Constellations. */
export const DATABASE_CAPSULE_CAPABILITIES: CapsuleCapabilityId[] = [
  "dataTable",
  "views",
  "kb",
  "instr",
  "contextFiles",
  "relationship",
  "metrics",
];

/**
 * PDF Constellations — file capsule capabilities.
 * Order matches App.tsx FILE_BASED_SECTIONS.
 */
export const PDF_CAPSULE_CAPABILITIES: CapsuleCapabilityId[] = [
  "pdfFiles",
  "kb",
  "instr",
  "crawler",
];

/**
 * CSV Constellations — same managers as the Chat CSV capsule (file list + KB +
 * Instruction + Crawler), but Settings labels must not say "PDF Files".
 * Internal id remains `pdfFiles` so existing managers/routes stay stable.
 */
export const CSV_CAPSULE_CAPABILITIES: CapsuleCapabilityId[] = [
  "pdfFiles",
  "kb",
  "instr",
  "crawler",
];

/** @deprecated Prefer PDF_CAPSULE_CAPABILITIES / CSV_CAPSULE_CAPABILITIES. */
export const FILE_BASED_CAPSULE_CAPABILITIES = PDF_CAPSULE_CAPABILITIES;

export const CAPSULE_CAPABILITIES_BY_TYPE: Record<
  CapsuleConstellationType,
  CapsuleCapabilityId[]
> = {
  database: DATABASE_CAPSULE_CAPABILITIES,
  pdf: PDF_CAPSULE_CAPABILITIES,
  csv: CSV_CAPSULE_CAPABILITIES,
};

export function capabilityMetaForType(
  capabilityId: CapsuleCapabilityId,
  type: CapsuleConstellationType,
): { label: string; purpose: string; manageLabel: string; icon: LucideIcon } {
  const icon = CAPSULE_CAPABILITY_ICON[capabilityId];
  const base = CAPSULE_CAPABILITY_META[capabilityId];
  if (capabilityId === "pdfFiles" && type === "csv") {
    return {
      label: "CSV Files",
      purpose: "Manage the primary CSV source files used by this Constellation.",
      manageLabel: "Manage CSV Files",
      icon,
    };
  }
  return { ...base, icon };
}

export const CAPSULE_CAPABILITY_PATH: Record<CapsuleCapabilityId, string> = {
  dataTable: "active-data-tables",
  views: "views",
  kb: "knowledge-base",
  instr: "instruction",
  contextFiles: "extra-context-files",
  relationship: "relationships",
  metrics: "metrics",
  pdfFiles: "pdf-files",
  crawler: "crawler-urls",
};

export function capsuleCapabilitiesForType(
  type: CapsuleConstellationType,
): CapsuleCapabilityId[] {
  return CAPSULE_CAPABILITIES_BY_TYPE[type];
}

export function isCapsuleCapabilityAllowed(
  capabilityId: CapsuleCapabilityId,
  type: CapsuleConstellationType,
): boolean {
  return CAPSULE_CAPABILITIES_BY_TYPE[type].includes(capabilityId);
}

const CAPABILITY_PATH_TO_ID = Object.entries(CAPSULE_CAPABILITY_PATH).reduce(
  (acc, [id, path]) => {
    acc[path] = id as CapsuleCapabilityId;
    return acc;
  },
  {} as Record<string, CapsuleCapabilityId>,
);

export function capabilityIdFromPath(path: string): CapsuleCapabilityId | null {
  return CAPABILITY_PATH_TO_ID[path] ?? null;
}

export function isValidCapabilityPath(path: string): boolean {
  return path in CAPABILITY_PATH_TO_ID;
}
