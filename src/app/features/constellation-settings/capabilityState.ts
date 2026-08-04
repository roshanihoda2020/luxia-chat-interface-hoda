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
import type { CapabilitySummary } from "./types";

export type ConstellationCapabilityBundle = {
  tables: DataTableRecord[];
  knowledgeBase: KnowledgeBaseEntry[];
  instruction: InstructionData;
  contextFiles: ExtraContextFile[];
  relationships: RelationshipRecord[];
  metrics: MetricRecord[];
  pdfFiles: PDFFileRecord[];
  crawler: CrawlerState;
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
  return clonePdfFiles(source.slice(0, take)).map((item, index) => ({
    ...item,
    name: `File name ${String(index + 1).padStart(2, "0")}.pdf`,
  }));
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
      knowledgeBase: sliceKb(2 + ((n - 1) % 3)),
      instruction: { text: instructionText, attachment: null },
      contextFiles: sliceContextFiles(1 + ((n - 1) % 3)),
      relationships: sliceRelationships(1 + ((n - 1) % 4)),
      metrics: sliceMetrics(1 + ((n - 1) % 4)),
      pdfFiles: [],
      crawler: { entries: [], settings: { ...INITIAL_CRAWLER_STATE.settings } },
    };
  }

  return {
    tables: [],
    knowledgeBase: sliceKb(2 + ((n - 1) % 3)),
    instruction: { text: instructionText, attachment: null },
    contextFiles: [],
    relationships: [],
    metrics: [],
    pdfFiles: slicePdfs(2 + ((n - 1) % 4)),
    crawler: sliceCrawler(1 + ((n - 1) % 2)),
  };
}

export function cloneCapabilityBundle(
  bundle: ConstellationCapabilityBundle,
): ConstellationCapabilityBundle {
  return {
    tables: bundle.tables.map((table) => cloneTable(table)),
    knowledgeBase: bundle.knowledgeBase.map((entry) => ({ ...entry })),
    instruction: {
      text: bundle.instruction.text,
      attachment: bundle.instruction.attachment
        ? { ...bundle.instruction.attachment }
        : null,
    },
    contextFiles: cloneFiles(bundle.contextFiles),
    relationships: cloneRelationships(bundle.relationships),
    metrics: cloneMetrics(bundle.metrics),
    pdfFiles: clonePdfFiles(bundle.pdfFiles),
    crawler: cloneCrawlerState(bundle.crawler),
  };
}

export function summarizeCapabilityBundle(
  bundle: ConstellationCapabilityBundle,
): Partial<Record<CapsuleCapabilityId, CapabilitySummary>> {
  const activeTables = bundle.tables.filter((table) => table.active).length;
  const relationships = activeRelationshipCount(bundle.relationships);
  const metrics = activeMetricCount(bundle.metrics);
  const pdfs = activePdfCount(bundle.pdfFiles);
  const crawlers = activeCrawlerCount(bundle.crawler.entries);
  const context = activeFileCount(bundle.contextFiles);

  return {
    dataTable: {
      countLabel: `${activeTables} active`,
      statusLabel: activeTables > 0 ? "Valid" : "Needs attention",
    },
    kb: {
      countLabel: `${bundle.knowledgeBase.length} ${bundle.knowledgeBase.length === 1 ? "entry" : "entries"}`,
      statusLabel: "Updated recently",
    },
    instr: {
      countLabel: bundle.instruction.text.trim() ? "Configured" : "Empty",
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
