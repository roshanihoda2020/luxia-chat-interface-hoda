import { cloneCapabilityBundle, type ConstellationCapabilityBundle } from "./capabilityState";
import { cloneConstellationSettingsRecord } from "./data";
import { cloneResponseConfidencePolicy } from "./responseConfidence/defaults";
import {
  loadResponseConfidencePolicy,
  saveResponseConfidencePolicy,
} from "./responseConfidence/persistence";
import type { ConstellationSettingsRecord } from "./types";
import { summarizeCapabilityBundle } from "./capabilityState";

export type DuplicateSourceConstellation = {
  id: string;
  label: string;
  type: ConstellationSettingsRecord["type"];
  projectId: string;
  description: string;
};

export type LocalConstellationDuplicateDraft = {
  constellation: DuplicateSourceConstellation;
  settings: ConstellationSettingsRecord;
  bundle: ConstellationCapabilityBundle;
  /** Applied only on successful commit — response confidence localStorage clone. */
  responseConfidenceSourceId: string;
};

let duplicateSeq = 0;

function nextDuplicateToken(prefix: string): string {
  duplicateSeq += 1;
  return `${prefix}-${Date.now()}-${duplicateSeq}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Deep-clone capability data for Duplicate, reminting nested entity ids and
 * clearing Relationships (Dev does not copy relationships).
 */
export function cloneCapabilityBundleForDuplicate(
  source: ConstellationCapabilityBundle,
): ConstellationCapabilityBundle {
  const cloned = cloneCapabilityBundle(source);
  return {
    ...cloned,
    tables: cloned.tables.map((table) => {
      const columnIdMap = new Map<string, string>();
      const columns = table.columns.map((column) => {
        const nextId = nextDuplicateToken("col");
        columnIdMap.set(column.id, nextId);
        return { ...column, id: nextId };
      });
      return {
        ...table,
        id: nextDuplicateToken("tbl"),
        columns,
        rows: table.rows.map((row) => {
          const values: Record<string, string> = {};
          for (const [key, value] of Object.entries(row.values)) {
            values[columnIdMap.get(key) ?? key] = value;
          }
          return { id: nextDuplicateToken("row"), values };
        }),
      };
    }),
    knowledgeBase: cloned.knowledgeBase.map((entry) => ({
      ...entry,
      id: nextDuplicateToken("kb"),
    })),
    contextFiles: cloned.contextFiles.map((file) => ({
      ...file,
      id: nextDuplicateToken("ctx"),
    })),
    // Dev Duplicate does not copy Relationships.
    relationships: [],
    metrics: cloned.metrics.map((metric) => ({
      ...metric,
      id: nextDuplicateToken("metric"),
    })),
    pdfFiles: cloned.pdfFiles.map((file) => ({
      ...file,
      id: nextDuplicateToken("pdf"),
    })),
    crawler: {
      ...cloned.crawler,
      entries: cloned.crawler.entries.map((entry) => ({
        ...entry,
        id: nextDuplicateToken("crawl"),
      })),
      settings: { ...cloned.crawler.settings },
    },
  };
}

/**
 * Build a full in-memory duplicate. Does not write to React state or localStorage.
 * Call commitLocalConstellationDuplicate only after a successful mock job.
 */
export function buildLocalConstellationDuplicate(input: {
  sourceConstellation: DuplicateSourceConstellation;
  sourceSettings: ConstellationSettingsRecord;
  sourceBundle: ConstellationCapabilityBundle;
  name: string;
  createdBy?: string;
}): LocalConstellationDuplicateDraft {
  const trimmedName = input.name.trim();
  const newId = nextDuplicateToken("con-dup");
  const bundle = cloneCapabilityBundleForDuplicate(input.sourceBundle);
  const settingsBase = cloneConstellationSettingsRecord(input.sourceSettings);

  const settings: ConstellationSettingsRecord = {
    ...settingsBase,
    id: newId,
    name: trimmedName,
    description: input.sourceConstellation.description || settingsBase.description,
    type: input.sourceConstellation.type,
    projectId: input.sourceConstellation.projectId,
    projectName: settingsBase.projectName,
    status: "active",
    createdBy: input.createdBy ?? settingsBase.createdBy,
    createdAt: "Just now",
    updatedAt: "Just now",
    // Welcome / default dialog copy (design stand-in for welcome messages).
    defaultMessage: settingsBase.defaultMessage,
    instructions: bundle.instruction.text,
    connectedSources: settingsBase.connectedSources.map((source) => ({ ...source })),
    sourceAccessRows: settingsBase.sourceAccessRows.map((row) => ({ ...row })),
    capabilitySummaries: {
      ...settingsBase.capabilitySummaries,
      ...summarizeCapabilityBundle(bundle),
    },
  };

  const constellation: DuplicateSourceConstellation = {
    id: newId,
    label: trimmedName,
    type: input.sourceConstellation.type,
    projectId: input.sourceConstellation.projectId,
    description: input.sourceConstellation.description,
  };

  return {
    constellation,
    settings,
    bundle,
    responseConfidenceSourceId: input.sourceConstellation.id,
  };
}

/** Persist response-confidence policy for the new id (atomic with successful commit). */
export function commitDuplicateResponseConfidence(
  draft: LocalConstellationDuplicateDraft,
): void {
  const policy = loadResponseConfidencePolicy(draft.responseConfidenceSourceId);
  saveResponseConfidencePolicy(
    draft.constellation.id,
    cloneResponseConfidencePolicy(policy),
  );
}

/** Deterministic prototype failure trigger — not shown in UI. */
export function shouldFailDuplicatePrototype(name: string): boolean {
  return name.includes("__duplicate_fail");
}
