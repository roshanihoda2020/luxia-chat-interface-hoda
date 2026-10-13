import { INITIAL_ACTIVE_TABLES } from "@/app/features/active-data-tables/data";
import type { DataTableRecord } from "@/app/features/active-data-tables/types";
import { cloneTable } from "@/app/features/active-data-tables/utils";
import { INITIAL_CRAWLER_STATE } from "@/app/features/crawler/data";
import type { CrawlerState } from "@/app/features/crawler/types";
import { activeCrawlerCount, cloneCrawlerState } from "@/app/features/crawler/utils";
import { INITIAL_CONTEXT_FILES } from "@/app/features/extra-context-files/data";
import type { ExtraContextFile } from "@/app/features/extra-context-files/types";
import { activeFileCount, cloneFiles } from "@/app/features/extra-context-files/utils";
import type { InstructionData } from "@/app/features/instruction/types";
import {
  KB_DEFAULTS,
  type KnowledgeBaseEntry,
} from "@/app/features/knowledge-base/data";
import { INITIAL_METRICS } from "@/app/features/metrics/data";
import type { MetricRecord } from "@/app/features/metrics/types";
import { activeMetricCount, cloneMetrics } from "@/app/features/metrics/utils";
import { INITIAL_PDF_FILES } from "@/app/features/pdf-files/data";
import type { PDFFileRecord } from "@/app/features/pdf-files/types";
import { activePdfCount, clonePdfFiles } from "@/app/features/pdf-files/utils";
import { INITIAL_RELATIONSHIPS } from "@/app/features/relationship/data";
import type { RelationshipRecord } from "@/app/features/relationship/types";
import {
  activeRelationshipCount,
  cloneRelationships,
} from "@/app/features/relationship/utils";
import type {
  CapsuleCapabilityId,
  CapsuleConstellationType,
} from "@/app/features/constellation/capsuleCapabilities";
import { VIEW_CATALOG } from "@/app/features/data-views/catalog";
import { MAX_CONSTELLATION_VIEWS } from "@/app/features/data-views/constants";
import type { CapabilitySummary } from "./types";

export type CsvParseConfig = {
  delimiter: string;
  hasHeader: boolean;
};

export type ConstellationCapabilityBundle = {
  tables: DataTableRecord[];
  /** Database views selected for this Constellation — separate from Active Data Tables. */
  views: DataTableRecord[];
  knowledgeBase: KnowledgeBaseEntry[];
  instruction: InstructionData;
  contextFiles: ExtraContextFile[];
  relationships: RelationshipRecord[];
  metrics: MetricRecord[];
  pdfFiles: PDFFileRecord[];
  crawler: CrawlerState;
  /** CSV parse options when the Constellation type is CSV. */
  csvParseConfig: CsvParseConfig | null;
};

const DEFAULT_INSTRUCTION =
  "Answer based on the connected data sources and documents.";

function constellationSeedIndex(constellationId: string): number {
  const match = constellationId.match(/(\d+)/);
  const value = match ? Number(match[1]) : 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function sliceCloneTables(count: number): DataTableRecord[] {
  const source = INITIAL_ACTIVE_TABLES;
  if (source.length === 0) return [];
  const take = Math.max(1, Math.min(count, source.length));
  return source.slice(0, take).map((table, index) => {
    const cloned = cloneTable(table);
    return {
      ...cloned,
      displayName: `Table name ${String(index + 1).padStart(2, "0")}`,
    };
  });
}

/**
 * Demo Views seed — catalog clones into `bundle.views` only (never tables).
 * Count may be 0 for empty-state demos; capped at MAX_CONSTELLATION_VIEWS.
 */
function sliceCloneViews(count: number): DataTableRecord[] {
  const source = VIEW_CATALOG;
  if (count <= 0 || source.length === 0) return [];
  const take = Math.min(count, MAX_CONSTELLATION_VIEWS, source.length);
  return source.slice(0, take).map((view) => ({
    ...cloneTable(view),
    active: true,
  }));
}

/** Rotating demo counts: empty, 1, multi, and max-5 for visual QA. */
function demoDatabaseViewCount(seedIndex: number): number {
  const pattern = [0, 1, 2, 3, 5, 2, 1, 0, 3, 5] as const;
  return pattern[(seedIndex - 1) % pattern.length];
}

function sliceKb(count: number): KnowledgeBaseEntry[] {
  const take = Math.max(1, Math.min(count, KB_DEFAULTS.length));
  return KB_DEFAULTS.slice(0, take).map((entry, index) => ({
    ...entry,
    id: `kb-seed-${index + 1}`,
    question: `Knowledge entry ${String(index + 1).padStart(2, "0")}`,
  }));
}

function sliceContextFiles(count: number): ExtraContextFile[] {
  const take = Math.max(1, Math.min(count, INITIAL_CONTEXT_FILES.length));
  return cloneFiles(INITIAL_CONTEXT_FILES.slice(0, take)).map((file, index) => ({
    ...file,
    name: `File name ${String(index + 1).padStart(2, "0")}.${file.fileType.toLowerCase()}`,
  }));
}

function sliceRelationships(count: number): RelationshipRecord[] {
  const source = INITIAL_RELATIONSHIPS;
  if (source.length === 0) return [];
  const take = Math.max(1, Math.min(count, source.length));
  return cloneRelationships(source.slice(0, take));
}

function sliceMetrics(count: number): MetricRecord[] {
  const source = INITIAL_METRICS;
  if (source.length === 0) return [];
  const take = Math.max(1, Math.min(count, source.length));
  return cloneMetrics(source.slice(0, take)).map((item, index) => ({
    ...item,
    name: `Metric name ${String(index + 1).padStart(2, "0")}`,
  }));
}

function slicePdfs(count: number): PDFFileRecord[] {
  const source = INITIAL_PDF_FILES;
  if (source.length === 0) return [];
  const take = Math.max(1, Math.min(count, source.length));
  return clonePdfFiles(source.slice(0, take));
}

function sliceCrawler(count: number): CrawlerState {
  const cloned = cloneCrawlerState(INITIAL_CRAWLER_STATE);
  const take = Math.max(1, Math.min(count, cloned.entries.length));
  return {
    ...cloned,
    entries: cloned.entries.slice(0, take).map((entry, index) => ({
      ...entry,
      description: `Crawler URL ${String(index + 1).padStart(2, "0")}`,
    })),
  };
}

export function createDefaultCapabilityBundle(
  instructions?: string,
): ConstellationCapabilityBundle {
  return {
    tables: INITIAL_ACTIVE_TABLES.map((table) => cloneTable(table)),
    views: [],
    knowledgeBase: KB_DEFAULTS.map((entry) => ({ ...entry })),
    instruction: {
      text: instructions?.trim() || DEFAULT_INSTRUCTION,
      attachment: null,
    },
    contextFiles: cloneFiles(INITIAL_CONTEXT_FILES),
    relationships: cloneRelationships(INITIAL_RELATIONSHIPS),
    metrics: cloneMetrics(INITIAL_METRICS),
    pdfFiles: clonePdfFiles(INITIAL_PDF_FILES),
    crawler: cloneCrawlerState(INITIAL_CRAWLER_STATE),
    csvParseConfig: null,
  };
}

/**
 * Small type-specific seed for Settings prototype state.
 * Each constellationId gets an independent clone (no shared mutable refs).
 */
export function createSeedCapabilityBundle(
  constellationId: string,
  type: CapsuleConstellationType,
  instructions?: string,
): ConstellationCapabilityBundle {
  const n = constellationSeedIndex(constellationId);
  const instructionText = instructions?.trim() || DEFAULT_INSTRUCTION;

  if (type === "database") {
    return {
      tables: sliceCloneTables(3 + ((n - 1) % 6)),
      views: sliceCloneViews(demoDatabaseViewCount(n)),
      knowledgeBase: sliceKb(2 + ((n - 1) % 3)),
      instruction: { text: instructionText, attachment: null },
      contextFiles: sliceContextFiles(1 + ((n - 1) % 3)),
      relationships: sliceRelationships(1 + ((n - 1) % 4)),
      metrics: sliceMetrics(1 + ((n - 1) % 4)),
      pdfFiles: [],
      crawler: { entries: [], settings: { ...INITIAL_CRAWLER_STATE.settings } },
      csvParseConfig: null,
    };
  }

  return {
    tables: [],
    views: [],
    knowledgeBase: sliceKb(2 + ((n - 1) % 3)),
    instruction: { text: instructionText, attachment: null },
    contextFiles: [],
    relationships: [],
    metrics: [],
    pdfFiles: slicePdfs(2 + ((n - 1) % 4)),
    crawler: sliceCrawler(1 + ((n - 1) % 2)),
    csvParseConfig: type === "csv" ? { delimiter: ",", hasHeader: true } : null,
  };
}

/**
 * Ensure older in-memory / HMR bundles always expose `views` separately from tables.
 * Missing `views` previously crashed Configuration summaries and the Views manage page.
 */
export function normalizeCapabilityBundle(
  bundle: ConstellationCapabilityBundle | (Omit<ConstellationCapabilityBundle, "views"> & {
    views?: DataTableRecord[];
  }),
): ConstellationCapabilityBundle {
  return {
    ...bundle,
    tables: Array.isArray(bundle.tables) ? bundle.tables : [],
    views: Array.isArray(bundle.views) ? bundle.views : [],
  };
}

export function cloneCapabilityBundle(
  bundle: ConstellationCapabilityBundle,
): ConstellationCapabilityBundle {
  const normalized = normalizeCapabilityBundle(bundle);
  return {
    tables: normalized.tables.map((table) => cloneTable(table)),
    views: normalized.views.map((view) => cloneTable(view)),
    knowledgeBase: normalized.knowledgeBase.map((entry) => ({ ...entry })),
    instruction: {
      text: normalized.instruction.text,
      attachment: normalized.instruction.attachment
        ? { ...normalized.instruction.attachment }
        : null,
    },
    contextFiles: cloneFiles(normalized.contextFiles),
    relationships: cloneRelationships(normalized.relationships),
    metrics: cloneMetrics(normalized.metrics),
    pdfFiles: clonePdfFiles(normalized.pdfFiles),
    crawler: cloneCrawlerState(normalized.crawler),
    csvParseConfig: normalized.csvParseConfig
      ? { ...normalized.csvParseConfig }
      : null,
  };
}

export function summarizeCapabilityBundle(
  bundle: ConstellationCapabilityBundle,
): Partial<Record<CapsuleCapabilityId, CapabilitySummary>> {
  const normalized = normalizeCapabilityBundle(bundle);
  const activeTables = normalized.tables.filter((table) => table.active).length;
  const activeViews = normalized.views.filter((view) => view.active).length;
  const relationships = activeRelationshipCount(normalized.relationships);
  const metrics = activeMetricCount(normalized.metrics);
  const pdfs = activePdfCount(normalized.pdfFiles);
  const crawlers = activeCrawlerCount(normalized.crawler.entries);
  const context = activeFileCount(normalized.contextFiles);

  return {
    dataTable: {
      countLabel: `${activeTables} active`,
      statusLabel: activeTables > 0 ? "Valid" : "Needs attention",
    },
    views: {
      countLabel: `${activeViews} ${activeViews === 1 ? "view" : "views"}`,
      statusLabel: activeViews > 0 ? "Valid" : "Empty",
    },
    kb: {
      countLabel: `${normalized.knowledgeBase.length} ${normalized.knowledgeBase.length === 1 ? "entry" : "entries"}`,
      statusLabel: "Updated recently",
    },
    instr: {
      countLabel: normalized.instruction.text.trim() ? "Configured" : "Empty",
      statusLabel: "Saved",
    },
    contextFiles: {
      countLabel: `${context} ${context === 1 ? "file" : "files"}`,
      statusLabel: "Available",
    },
    relationship: {
      countLabel: `${relationships} ${relationships === 1 ? "relationship" : "relationships"}`,
      statusLabel: "Valid",
    },
    metrics: {
      countLabel: `${metrics} ${metrics === 1 ? "metric" : "metrics"}`,
      statusLabel: "Valid",
    },
    pdfFiles: {
      countLabel: `${pdfs} ${pdfs === 1 ? "file" : "files"}`,
      statusLabel: "Processed",
    },
    crawler: {
      countLabel: `${crawlers} ${crawlers === 1 ? "URL" : "URLs"}`,
      statusLabel: "Active",
    },
  };
}
