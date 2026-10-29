/**
 * PROTOTYPE extraction simulator. No network calls, no files read, no Markdown
 * produced: it only moves document statuses through the production transitions
 *   PENDING → PROCESSING → EXTRACTED | FAILED, FAILED → PROCESSING → …
 * and never sets REVIEWED (approval belongs to the future Review step).
 */
import { isExtractableDocument, type ExtractionEngineId } from "./extractionEngines";
import {
  DEFAULT_DOCUMENT_EXTRACTION_STATUS,
  type DocumentExtractionStatus,
} from "./extractionStatus";
import {
  completeDocumentExtractionRun,
  getDocumentExtractionRecord,
  readExtractionStatusSnapshot,
  setDocumentExtractionStatus,
} from "./extractionStatusStore";
import type { DataSourceDocumentRecord } from "./types";

export type ExtractionExclusionReason =
  | "unsupported-format"
  | "processing"
  | "awaiting-review"
  | "approved";

export const EXTRACTION_EXCLUSION_LABELS: Record<ExtractionExclusionReason, string> = {
  "unsupported-format": "Format not supported",
  processing: "Already extracting",
  "awaiting-review": "Waiting for review",
  approved: "Approved, re-extract on its own",
};

/**
 * Why a document cannot start extraction now, or null when it can.
 * REVIEWED needs `allowReviewed` — the prototype equivalent of the backend's
 * 409 response that must be repeated with force.
 */
export function extractionStartBlocker(
  document: Pick<DataSourceDocumentRecord, "fileFormat">,
  status: DocumentExtractionStatus,
  options: { allowReviewed?: boolean } = {},
): ExtractionExclusionReason | null {
  if (!isExtractableDocument(document)) return "unsupported-format";
  if (status === "PROCESSING") return "processing";
  if (status === "EXTRACTED") return "awaiting-review";
  if (status === "REVIEWED" && !options.allowReviewed) return "approved";
  return null;
}

export interface ExtractionPlan {
  eligible: DataSourceDocumentRecord[];
  excluded: Array<{ document: DataSourceDocumentRecord; reason: ExtractionExclusionReason }>;
}

export function planExtraction(
  documents: readonly DataSourceDocumentRecord[],
  statusOf: (document: DataSourceDocumentRecord) => DocumentExtractionStatus,
  options: { allowReviewed?: boolean } = {},
): ExtractionPlan {
  const plan: ExtractionPlan = { eligible: [], excluded: [] };
  for (const document of documents) {
    const reason = extractionStartBlocker(document, statusOf(document), options);
    if (reason) plan.excluded.push({ document, reason });
    else plan.eligible.push(document);
  }
  return plan;
}

export interface ExtractionBatchResult {
  started: number;
  extracted: number;
  failed: number;
  /** Runs whose result was discarded (document deleted or run superseded). */
  discarded: number;
  /** Documents that could not start (already processing, ineligible). */
  skipped: number;
}

const MIN_RUN_MS = 1600;
const RUN_SPREAD_MS = 2400;
/** A PROCESSING record older than this with no live run in this tab was interrupted. */
const INTERRUPTED_AFTER_MS = MIN_RUN_MS + RUN_SPREAD_MS + 10_000;

const activeRunIds = new Set<string>();
let runSequence = 0;

/**
 * Deterministic outcomes so demos are repeatable (no random failures):
 * - a name containing "always-fail" fails on every attempt;
 * - a name containing "fail" or "corrupt" fails once, then succeeds on Retry;
 * - everything else succeeds.
 */
export function simulatedExtractionOutcome(
  fileName: string,
  attempt: number,
): { status: "EXTRACTED" | "FAILED"; reason: string | null } {
  if (/always-fail/i.test(fileName)) {
    return { status: "FAILED", reason: "Simulated failure: the file could not be read." };
  }
  if (/fail|corrupt/i.test(fileName) && attempt === 1) {
    return { status: "FAILED", reason: "Simulated failure: the file could not be read." };
  }
  return { status: "EXTRACTED", reason: null };
}

function currentStatus(dataSourceId: string, localDocumentId: string): DocumentExtractionStatus {
  return getDocumentExtractionRecord(dataSourceId, localDocumentId)?.status
    ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
}

/**
 * Start simulated extraction for each document independently. Status is
 * re-checked from the store at start, so a document already PROCESSING (from
 * another click or tab) is skipped rather than started twice.
 */
export function startPrototypeExtraction(
  dataSourceId: string,
  documents: readonly DataSourceDocumentRecord[],
  engineId: ExtractionEngineId,
  options: {
    allowReviewed?: boolean;
    /**
     * Called once per document whose run succeeded, so the host can replace
     * earlier review content with the fresh extraction. Failed runs keep it.
     */
    onExtracted?: (localDocumentId: string) => void;
  } = {},
): Promise<ExtractionBatchResult> {
  const result: ExtractionBatchResult = { started: 0, extracted: 0, failed: 0, discarded: 0, skipped: 0 };
  const runs: Array<Promise<void>> = [];
  for (const document of documents) {
    const id = document.localDocumentId;
    if (extractionStartBlocker(document, currentStatus(dataSourceId, id), options)) {
      result.skipped += 1;
      continue;
    }
    const previous = getDocumentExtractionRecord(dataSourceId, id);
    runSequence += 1;
    const runId = `prototype-run-${Date.now().toString(36)}-${runSequence.toString(36)}`;
    const attempt = (previous?.attempts ?? 0) + 1;
    const started = setDocumentExtractionStatus(dataSourceId, id, "PROCESSING", {
      engineId,
      runId,
      attempts: attempt,
      failureReason: null,
      lastReviewedAt: previous?.status === "REVIEWED" ? previous.updatedAt : previous?.lastReviewedAt ?? null,
    });
    if (!started) {
      result.skipped += 1;
      continue;
    }
    result.started += 1;
    activeRunIds.add(runId);
    runs.push(new Promise<void>((resolve) => {
      window.setTimeout(() => {
        activeRunIds.delete(runId);
        const outcome = simulatedExtractionOutcome(document.fileName, attempt);
        const written = completeDocumentExtractionRun(dataSourceId, id, runId, outcome.status, outcome.reason);
        if (!written) result.discarded += 1;
        else if (outcome.status === "EXTRACTED") {
          result.extracted += 1;
          options.onExtracted?.(id);
        } else result.failed += 1;
        resolve();
      }, MIN_RUN_MS + Math.random() * RUN_SPREAD_MS);
    }));
  }
  return Promise.all(runs).then(() => result);
}

/**
 * A reload drops in-flight timers, which would leave documents PROCESSING
 * forever. Mark such stale runs FAILED so they can be retried.
 */
export function recoverInterruptedPrototypeRuns(dataSourceId: string): number {
  const records = readExtractionStatusSnapshot()[dataSourceId] ?? {};
  let recovered = 0;
  for (const [localDocumentId, record] of Object.entries(records)) {
    if (record.status !== "PROCESSING" || !record.runId || activeRunIds.has(record.runId)) continue;
    const age = Date.now() - Date.parse(record.updatedAt);
    if (!Number.isFinite(age) || age < INTERRUPTED_AFTER_MS) continue;
    if (completeDocumentExtractionRun(
      dataSourceId,
      localDocumentId,
      record.runId,
      "FAILED",
      "Processing was interrupted.",
    )) {
      recovered += 1;
    }
  }
  return recovered;
}
