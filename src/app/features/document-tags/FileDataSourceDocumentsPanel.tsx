import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  LuxiaEntityOptionsMenu,
  type LuxiaEntityOptionsItem,
} from "@/app/components/LuxiaEntityOptionsMenu";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { FileInUseDialog } from "@/app/features/data-sources/FileInUseDialog";
import {
  getDocumentInUseDependencies,
  type FileInUseDependency,
} from "@/app/features/data-sources/fileInUse";
import { HS } from "@/app/features/home/homeSurfaces";
import { canManageOrganizationTagDefinitions } from "@/app/features/permissions";
import { PDFPreviewDialog } from "@/app/features/pdf-files/PDFPreviewDialog";
import type { PDFPreviewTarget } from "@/app/features/pdf-files/types";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_SETTINGS_LIST_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { BulkRemoveTagButton } from "./BulkRemoveTagButton";
import { DocumentTagChip, TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { resolveDocumentPreviewTarget } from "./documentPreviewMock";
import { ManagedTagChip } from "./ManagedTagChip";
import { TagMultiSelectFilter } from "./TagMultiSelectFilter";
import {
  clearDocumentExtractionStatus,
  DEFAULT_DOCUMENT_EXTRACTION_STATUS,
  DOCUMENT_EXTRACTION_STATUSES,
  DocumentExtractionStatusCell,
  documentExtractionStatusLabel,
  ExtractDocumentsDialog,
  getDocumentExtractionStatus,
  isDocumentExtractionStatus,
  isExtractableDocument,
  listAvailableExtractionEngines,
  planExtraction,
  recoverInterruptedPrototypeRuns,
  startPrototypeExtraction,
  useDataSourceExtractionStatuses,
  type DataSourceDocumentRecord,
  type DocumentExtractionStatus,
  type ExtractionBatchResult,
  type ExtractionEngineId,
  type ExtractionPlan,
} from "@/app/features/data-sources/documents";
import {
  clearDocumentReviewContent,
  DocumentReviewWorkspace,
  getDocumentReviewContent,
  hasReviewableContent,
  isReviewSampleFixtureDocument,
} from "@/app/features/document-review";
import { RetryAction } from "@/app/features/shared/RetryAction";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
import { SuggestedTagChip } from "./SuggestedTagChip";
import { conceptKeyForTagName, generateTagSuggestions, suggestionsAreOutdated } from "./tagSuggestionEngine";
import {
  clearDocumentTagSuggestions,
  readTagSuggestionSnapshot,
  setTagSuggestionState,
  useDataSourceTagSuggestions,
  writeDocumentTagSuggestions,
  type TagSuggestionItem,
} from "./tagSuggestionStore";
import { suggestTagColor } from "./tagTone";
import type { UnsavedNavigationGuard } from "@/app/features/shared/unsavedNavigationGuard";
import { BrowserFilterSelect } from "@/app/features/home/browserShared";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import { useDataSourceTags } from "./useDataSourceTags";

const TABLE_HEADER_CELL =
  "px-4 py-2.5 align-middle whitespace-nowrap luxia-type-label-small";
const TABLE_BODY_CELL = "px-4 py-3 align-middle luxia-type-body-dense";
/**
 * Review gets its own same-URL history entry, so browser Back closes it and
 * Forward reopens it. The entry's state carries the reviewed document ID.
 */
const REVIEW_HISTORY_KEY = "luxiaReviewDocumentId";

function readReviewHistoryId(): string | null {
  if (typeof window === "undefined") return null;
  const state: unknown = window.history.state;
  if (!state || typeof state !== "object") return null;
  const id = (state as Record<string, unknown>)[REVIEW_HISTORY_KEY];
  return typeof id === "string" ? id : null;
}

function writeReviewHistory(documentId: string, mode: "push" | "replace") {
  if (typeof window === "undefined") return;
  const current: unknown = window.history.state;
  const state = { ...(current && typeof current === "object" ? current : {}), [REVIEW_HISTORY_KEY]: documentId };
  if (mode === "push") window.history.pushState(state, "", window.location.href);
  else window.history.replaceState(state, "", window.location.href);
}

const STATUS_SUMMARY_ORDER: readonly DocumentExtractionStatus[] = [
  "EXTRACTED",
  "PROCESSING",
  "FAILED",
  "PENDING",
  "REVIEWED",
];

/**
 * Rows, selection, delete and File Tags are all keyed by `localDocumentId`,
 * so documents that share a filename keep independent tags.
 */
export function FileDataSourceDocumentsPanel({
  dataSourceId,
  dataSourceName = "",
  documents,
  canEdit,
  currentUserId,
  onDeleteDocument,
  onOpenConstellation,
  navigationGuardRef,
  reviewPortalHost = null,
  onReviewActiveChange,
  selectedDocumentIds,
  onSelectedDocumentIdsChange,
  lockedDocumentIds,
  reviewBackLabel,
}: {
  /**
   * Picker mode: the checkbox selection is owned by the host (e.g. which
   * documents a Constellation uses) and is shown even without Manage. Tagging,
   * extraction and delete still require `canEdit`.
   */
  selectedDocumentIds?: readonly string[];
  onSelectedDocumentIdsChange?: (ids: string[]) => void;
  /**
   * Picker mode: documents the host already uses (e.g. already added to the
   * Constellation). Shown checked and disabled, labelled "Already added", and
   * never part of the host selection.
   */
  lockedDocumentIds?: readonly string[];
  /** Label of the Review workspace's back button. */
  reviewBackLabel?: string;
  dataSourceId: string;
  /** Shown in the Review workspace header. */
  dataSourceName?: string;
  documents: readonly DataSourceDocumentRecord[];
  canEdit: boolean;
  currentUserId?: string;
  /** Lets host navigation protect unsaved Review edits. */
  navigationGuardRef?: MutableRefObject<UnsavedNavigationGuard | null>;
  /** Element that receives the Review workspace, so the host can give it the full content area. */
  reviewPortalHost?: HTMLElement | null;
  /** Lets the host hide its own chrome (header, tabs) while Review is open. */
  onReviewActiveChange?: (active: boolean) => void;
  /**
   * Persist removal from the canonical Data Source document list.
   * Only called after ConfirmDialog when the file is unused.
   */
  onDeleteDocument?: (document: DataSourceDocumentRecord) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [untaggedSelected, setUntaggedSelected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DocumentExtractionStatus | "all">("all");
  /** Selected `localDocumentId`s; host-owned in picker mode. */
  const [ownSelected, setOwnSelected] = useState<string[]>([]);
  const pickerMode = Boolean(onSelectedDocumentIdsChange);
  const selected: string[] = pickerMode ? [...(selectedDocumentIds ?? [])] : ownSelected;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const setSelected = (next: string[] | ((current: string[]) => string[])) => {
    const value = typeof next === "function" ? next(selectedRef.current) : next;
    if (pickerMode) onSelectedDocumentIdsChange?.(value);
    else setOwnSelected(value);
  };
  const showSelection = canEdit || pickerMode;
  const lockedIds = useMemo(() => new Set(pickerMode ? lockedDocumentIds ?? [] : []), [pickerMode, lockedDocumentIds]);
  const [deleteTarget, setDeleteTarget] = useState<DataSourceDocumentRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PDFPreviewTarget | null>(null);
  const [inUse, setInUse] = useState<{
    fileName: string;
    dependencies: FileInUseDependency[];
  } | null>(null);

  const {
    catalog,
    tagsForDocument,
    applyTagToDocuments,
    createAndApplyTagToDocuments,
    removeTagFromDocument,
    removeTagFromDocuments,
    clearDocumentAssignments,
    updateTag,
  } = useDataSourceTags(dataSourceId, documents);
  const canManageDefinitions = canManageOrganizationTagDefinitions(currentUserId);
  const canDelete = Boolean(canEdit && onDeleteDocument);
  const extractionRecords = useDataSourceExtractionStatuses(dataSourceId);
  const statusFor = (document: DataSourceDocumentRecord): DocumentExtractionStatus =>
    extractionRecords[document.localDocumentId]?.status ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
  const [extractRequest, setExtractRequest] = useState<{
    plan: ExtractionPlan;
    mode: "extract" | "reextract";
  } | null>(null);
  const statusSummary = useMemo(() => {
    const counts = new Map<DocumentExtractionStatus, number>();
    let extractableCount = 0;
    for (const document of documents) {
      // Formats outside extraction have no lifecycle to summarise.
      if (!isExtractableDocument(document)) continue;
      extractableCount += 1;
      const status = extractionRecords[document.localDocumentId]?.status ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    // All Not extracted says nothing beyond the document count.
    if ((counts.get("PENDING") ?? 0) === extractableCount) return "";
    return STATUS_SUMMARY_ORDER
      .filter((status) => (counts.get(status) ?? 0) > 0)
      .map((status) => `${counts.get(status)} ${documentExtractionStatusLabel(status).toLowerCase()}`)
      .join(" · ");
  }, [documents, extractionRecords]);

  /** Review workspace target. The queue is fixed when Review opens so approvals don't reshuffle it. */
  const [review, setReview] = useState<{
    documentId: string;
    queueIds: string[];
    sampleMode: boolean;
  } | null>(null);
  const reviewDocument = review
    ? documents.find((document) => document.localDocumentId === review.documentId) ?? null
    : null;

  const reviewRef = useRef(review);
  reviewRef.current = review;
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  /** The workspace registers here; the host guard below delegates to it. */
  const reviewGuardRef = useRef<UnsavedNavigationGuard | null>(null);
  const closingViaHistoryRef = useRef(false);

  /** To review with content: simulated extractions without text cannot be reviewed, so they are not queued. */
  function reviewableNow(item: DataSourceDocumentRecord): boolean {
    return statusFor(item) === "EXTRACTED"
      && hasReviewableContent(getDocumentReviewContent(dataSourceId, item.localDocumentId));
  }

  function queueFor(document: DataSourceDocumentRecord): string[] {
    return visible
      .filter((item) => item.localDocumentId === document.localDocumentId || reviewableNow(item))
      .map((item) => item.localDocumentId);
  }

  const queueForRef = useRef(queueFor);
  queueForRef.current = queueFor;

  function openReview(document: DataSourceDocumentRecord) {
    setReview({ documentId: document.localDocumentId, queueIds: queueFor(document), sampleMode: false });
    writeReviewHistory(document.localDocumentId, readReviewHistoryId() === null ? "push" : "replace");
  }

  function closeReview() {
    // Pop our own history entry so browser Back/Forward stay in step.
    if (readReviewHistoryId() !== null) {
      closingViaHistoryRef.current = true;
      window.history.back();
    } else {
      setReview(null);
    }
  }

  // One registration in the host guard, delegating to whichever review is open.
  useEffect(() => {
    if (!navigationGuardRef) return;
    navigationGuardRef.current = {
      isDirty: () => reviewGuardRef.current?.isDirty() ?? false,
      requestLeaveConfirmation: (onConfirmed) => {
        if (reviewGuardRef.current) reviewGuardRef.current.requestLeaveConfirmation(onConfirmed);
        else onConfirmed();
      },
    };
    return () => {
      navigationGuardRef.current = null;
    };
  }, [navigationGuardRef]);

  // Browser Back/Forward between the Documents list and Review (same URL,
  // different history entries). Leaving to another page is guarded by App.
  useEffect(() => {
    const path = window.location.pathname;
    const reopen = (id: string | null) => {
      const document = id ? documentsRef.current.find((item) => item.localDocumentId === id) : undefined;
      if (document) {
        setReview({ documentId: document.localDocumentId, queueIds: queueForRef.current(document), sampleMode: false });
      }
    };
    // Returning to a Review entry after visiting another page.
    reopen(readReviewHistoryId());
    const onPopState = () => {
      if (window.location.pathname !== path) return;
      // App re-pushed this page to guard a cross-page Back; it is already asking.
      const state: unknown = window.history.state;
      if (state && typeof state === "object" && (state as Record<string, unknown>).luxiaReviewRestore) return;
      const id = readReviewHistoryId();
      const current = reviewRef.current;
      if (current && id === null) {
        if (closingViaHistoryRef.current) {
          closingViaHistoryRef.current = false;
          setReview(null);
          return;
        }
        const guard = reviewGuardRef.current;
        if (guard?.isDirty()) {
          // Stay on Review until the user decides.
          writeReviewHistory(current.documentId, "push");
          guard.requestLeaveConfirmation(() => {
            closingViaHistoryRef.current = true;
            window.history.back();
          });
          return;
        }
        setReview(null);
      } else if (!current && id !== null) {
        reopen(id);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Host closed while Review was open (e.g. a creation dialog was cancelled):
      // drop our Review history entry so Back/Forward do not land on a stale Review.
      // Navigation to another page has already pushed its own entry, so nothing is popped then.
      if (reviewRef.current && readReviewHistoryId() !== null && window.location.pathname === path) {
        window.history.back();
      }
    };
  }, []);

  const reviewActive = Boolean(review && reviewDocument);
  useEffect(() => {
    onReviewActiveChange?.(reviewActive);
  }, [reviewActive, onReviewActiveChange]);
  useEffect(() => () => onReviewActiveChange?.(false), [onReviewActiveChange]);
  // The reviewed document was deleted elsewhere.
  useEffect(() => {
    if (review && !reviewDocument) setReview(null);
  }, [review, reviewDocument]);

  /** Next queued document still in To review, after the current one, wrapping once. */
  function nextToReviewId(): string | null {
    if (!review) return null;
    const { queueIds, documentId } = review;
    const start = queueIds.indexOf(documentId);
    for (let step = 1; step < queueIds.length; step += 1) {
      const id = queueIds[(start + step) % queueIds.length]!;
      const document = documents.find((item) => item.localDocumentId === id);
      if (document && reviewableNow(document)) return id;
    }
    return null;
  }

  // Runs cut off by a reload would stay PROCESSING forever; let them be retried.
  useEffect(() => {
    recoverInterruptedPrototypeRuns(dataSourceId);
  }, [dataSourceId]);

  function openExtract(targets: readonly DataSourceDocumentRecord[], mode: "extract" | "reextract" = "extract") {
    setExtractRequest({
      plan: planExtraction(targets, statusFor, { allowReviewed: mode === "reextract" }),
      mode,
    });
  }

  function reportExtraction(result: ExtractionBatchResult, targets: readonly DataSourceDocumentRecord[]) {
    // Only documents with prototype content can actually be reviewed.
    const reviewable = targets.filter((document) =>
      getDocumentExtractionStatus(dataSourceId, document.localDocumentId) === "EXTRACTED"
      && hasReviewableContent(getDocumentReviewContent(dataSourceId, document.localDocumentId)),
    ).length;
    const extractedDetail = reviewable > 0
      ? `${reviewable} with content to review.`
      : "No extracted content is available in this prototype.";
    if (result.failed > 0) {
      luxiaToast.error({
        title: `Simulated extraction failed for ${result.failed} document${result.failed === 1 ? "" : "s"}`,
        description: result.extracted > 0
          ? `${result.extracted} finished, ${extractedDetail} Retry the failed documents from their row.`
          : "Retry from the document row.",
      });
    } else if (result.extracted > 0) {
      luxiaToast.success({
        title: `Simulated extraction finished for ${result.extracted} document${result.extracted === 1 ? "" : "s"}`,
        description: extractedDetail,
      });
    }
  }

  function runExtraction(
    targets: readonly DataSourceDocumentRecord[],
    engineId: ExtractionEngineId,
    allowReviewed = false,
  ) {
    const pending = startPrototypeExtraction(dataSourceId, targets, engineId, {
      allowReviewed,
      // A fresh extraction replaces earlier edits: the sample falls back to its
      // fixture Markdown, other documents have no extracted text.
      onExtracted: (localDocumentId) => clearDocumentReviewContent(dataSourceId, localDocumentId),
    });
    void pending.then((result) => reportExtraction(result, targets));
  }

  function handleConfirmExtract(engineId: ExtractionEngineId) {
    if (!extractRequest) return;
    const { plan, mode } = extractRequest;
    setExtractRequest(null);
    runExtraction(plan.eligible, engineId, mode === "reextract");
  }

  function retryExtraction(document: DataSourceDocumentRecord) {
    const previousEngine = extractionRecords[document.localDocumentId]?.engineId;
    const engine = listAvailableExtractionEngines().find((item) => item.id === previousEngine)
      ?? listAvailableExtractionEngines()[0];
    if (engine) runExtraction([document], engine.id);
  }

  const fileTagOptions = useMemo(() => {
    const seen = new Set<string>();
    const tags: DocumentTagDefinition[] = [];
    for (const document of documents) {
      for (const tag of tagsForDocument(document)) {
        if (seen.has(tag.id)) continue;
        seen.add(tag.id);
        tags.push(tag);
      }
    }
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  }, [documents, tagsForDocument]);

  const hasUntaggedDocuments = useMemo(
    () => documents.some((document) => tagsForDocument(document).length === 0),
    [documents, tagsForDocument],
  );

  useEffect(() => {
    const valid = new Set(fileTagOptions.map((tag) => tag.id));
    setSelectedTagIds((current) => {
      const next = current.filter((id) => valid.has(id));
      return next.length === current.length ? current : next;
    });
  }, [fileTagOptions]);

  useEffect(() => {
    if (!hasUntaggedDocuments) setUntaggedSelected(false);
  }, [hasUntaggedDocuments]);

  useEffect(() => {
    const valid = new Set(documents.map((document) => document.localDocumentId));
    const current = selectedRef.current;
    const next = current.filter((id) => valid.has(id));
    // Only report real changes, so a host-owned selection is not rewritten each render.
    if (next.length !== current.length) setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedIdSet = new Set(selectedTagIds);
    const tagFiltersActive = selectedIdSet.size > 0 || untaggedSelected;
    return documents.filter((document) => {
      const fileTags = tagsForDocument(document);
      if (tagFiltersActive) {
        const matchesTag = fileTags.some((tag) => selectedIdSet.has(tag.id));
        const matchesUntagged = untaggedSelected && fileTags.length === 0;
        if (!matchesTag && !matchesUntagged) return false;
      }
      if (statusFilter !== "all") {
        const status = extractionRecords[document.localDocumentId]?.status
          ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
        if (status !== statusFilter) return false;
        // "Not extracted" means extraction applies but has not run.
        if (status === "PENDING" && !isExtractableDocument(document)) return false;
      }
      if (q && !document.fileName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documents, extractionRecords, query, selectedTagIds, statusFilter, tagsForDocument, untaggedSelected]);

  const filteredEmpty = documents.length > 0 && visible.length === 0;
  const visibleSelected = visible.filter((document) => selected.includes(document.localDocumentId));
  // Already-added documents are fixed; select-all works on the rest.
  const visibleSelectable = visible.filter((document) => !lockedIds.has(document.localDocumentId));
  const allVisibleSelected = visibleSelectable.length > 0 && visibleSelected.length === visibleSelectable.length;
  const someVisibleSelected = visibleSelected.length > 0 && !allVisibleSelected;
  const hasActiveTagFilters = selectedTagIds.length > 0 || untaggedSelected;
  const hasActiveFilters = hasActiveTagFilters || statusFilter !== "all";

  function clearTagFilters() {
    setSelectedTagIds([]);
    setUntaggedSelected(false);
  }

  function clearFilters() {
    clearTagFilters();
    setStatusFilter("all");
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  function selectTagFilter(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current : [...current, tagId],
    );
  }

  const tagsOnSelection = useMemo(() => {
    const byId = new Map<string, DocumentTagDefinition>();
    for (const document of visibleSelected) {
      for (const tag of tagsForDocument(document)) {
        if (!byId.has(tag.id)) byId.set(tag.id, tag);
      }
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleSelected, tagsForDocument]);

  function toggleFile(documentId: string, checked: boolean) {
    if (lockedIds.has(documentId)) return;
    setSelected((current) => {
      if (checked) return current.includes(documentId) ? current : [...current, documentId];
      return current.filter((item) => item !== documentId);
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      if (checked) {
        const next = new Set(current);
        visibleSelectable.forEach((document) => next.add(document.localDocumentId));
        return [...next];
      }
      const hidden = new Set(visibleSelectable.map((document) => document.localDocumentId));
      return current.filter((id) => !hidden.has(id));
    });
  }

  function handleApplyToFiles(targets: readonly DataSourceDocumentRecord[], tag: DocumentTagDefinition) {
    const result = applyTagToDocuments(targets, tag);
    if (result.appliedCount === 0) {
      toast.message(`“${result.tag.name}” is already on the selected document${targets.length === 1 ? "" : "s"}.`);
      return;
    }
    toast.success(
      targets.length === 1
        ? "Tag added."
        : `Tag added to ${result.appliedCount} document${result.appliedCount === 1 ? "" : "s"}.`,
    );
  }

  function handleRemoveFromSelected(tag: DocumentTagDefinition) {
    const result = removeTagFromDocuments(visibleSelected, tag.id);
    if (result.removedCount === 0) {
      toast.message(`“${tag.name}” is not on the selected documents.`);
      return;
    }
    toast.message(
      result.removedCount === 1
        ? `Removed “${tag.name}”.`
        : `Removed “${tag.name}” from ${result.removedCount} documents.`,
    );
  }

  function handleCreateForFiles(
    targets: readonly DataSourceDocumentRecord[],
    input: { name: string; color: DocumentTagColorId },
  ) {
    const result = createAndApplyTagToDocuments(targets, input.name, input.color);
    if (result.error) return result.error;
    toast.success(
      targets.length === 1
        ? "Tag added."
        : `Tag added to ${result.appliedCount} document${result.appliedCount === 1 ? "" : "s"}.`,
    );
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = updateTag(tag.id, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  function handleConfirmDelete() {
    if (!deleteTarget || !onDeleteDocument) return;
    const target = deleteTarget;
    const fileName = target.fileName;
    // Re-resolve on every attempt — never cache a stale in-use decision.
    // By document reference; same-name documents are not blocked.
    const dependencies = getDocumentInUseDependencies(dataSourceId, target);
    setDeleteTarget(null);

    if (dependencies.length > 0) {
      // Hard block: no file, tag, or selection mutation.
      setInUse({ fileName, dependencies });
      return;
    }

    // Only this document's tags; a same-name document keeps its own.
    clearDocumentAssignments(target);
    // Also drops its extraction record, which discards any run still in progress.
    clearDocumentExtractionStatus(dataSourceId, target.localDocumentId);
    clearDocumentTagSuggestions(dataSourceId, target.localDocumentId);
    onDeleteDocument(target);
    setSelected((current) => current.filter((id) => id !== target.localDocumentId));
    luxiaToast.success({
      title: "File deleted",
      description: fileName,
    });
  }

  // ---- AI tag suggestions (prototype rules). Manage only; never in picker mode.
  const suggestionsEnabled = canEdit && !pickerMode;
  const suggestionRecords = useDataSourceTagSuggestions(dataSourceId);
  const [suggesting, setSuggesting] = useState(false);
  const suggestingRef = useRef(false);
  // The current document-tag vocabulary by concept. Pending suggestions are
  // resolved against it on every render, so a tag accepted (or removed) on
  // another document updates "New" here without regenerating.
  const vocabularyByConcept = new Map<string, DocumentTagDefinition>();
  for (const document of documents) {
    for (const tag of tagsForDocument(document)) {
      const key = conceptKeyForTagName(tag.name);
      if (!vocabularyByConcept.has(key)) vocabularyByConcept.set(key, tag);
    }
  }
  const pendingSuggestionsFor = (document: DataSourceDocumentRecord): TagSuggestionItem[] => {
    const assigned = new Set(tagsForDocument(document).map((tag) => conceptKeyForTagName(tag.name)));
    return (suggestionRecords[document.localDocumentId]?.items ?? [])
      // Already on this document (accepted elsewhere or added by hand): nothing to suggest.
      .filter((item) => item.state === "pending" && !assigned.has(item.conceptKey))
      .map((item) => {
        const existing = vocabularyByConcept.get(item.conceptKey);
        return existing
          ? { ...item, label: existing.name, tagId: existing.id, isNewToVocabulary: false }
          : { ...item, isNewToVocabulary: true };
      });
  };
  const pendingSuggestionCount = suggestionsEnabled
    ? documents.reduce((sum, document) => sum + pendingSuggestionsFor(document).length, 0)
    : 0;
  const suggestionTargets = visibleSelected.length > 0 ? visibleSelected : visible;
  const selectedPendingCount = visibleSelected.reduce((sum, document) => sum + pendingSuggestionsFor(document).length, 0);

  function runTagSuggestions(targets: readonly DataSourceDocumentRecord[]) {
    if (!suggestionsEnabled || suggestingRef.current || targets.length === 0) return;
    suggestingRef.current = true;
    setSuggesting(true);
    // Simulated latency so the busy state is visible; results are deterministic rules.
    window.setTimeout(() => {
      try {
        const outcomes = generateTagSuggestions({
          dataSourceId,
          targets,
          allDocuments: documents,
          previous: readTagSuggestionSnapshot()[dataSourceId] ?? {},
        });
        let added = 0;
        let documentsWithSuggestions = 0;
        const noSignal: string[] = [];
        for (const outcome of outcomes) {
          if (outcome.kind === "no-signal") {
            noSignal.push(outcome.document.fileName);
            continue;
          }
          if (!writeDocumentTagSuggestions(dataSourceId, outcome.document.localDocumentId, outcome.record)) {
            throw new Error("storage");
          }
          added += outcome.added;
          if (outcome.added > 0) documentsWithSuggestions += 1;
        }
        if (documentsWithSuggestions > 0) {
          luxiaToast.success({
            title: `${added} new suggestion${added === 1 ? "" : "s"} for ${documentsWithSuggestions} document${documentsWithSuggestions === 1 ? "" : "s"}`,
            description: "Prototype rules, not an AI model. Accept or reject each one.",
          });
        }
        if (noSignal.length > 0) {
          luxiaToast.info({
            title: `No suggestions for ${noSignal.length} document${noSignal.length === 1 ? "" : "s"}`,
            description: "No extracted text and no clear filename signal. Tag these manually.",
          });
        }
        if (documentsWithSuggestions === 0 && noSignal.length < outcomes.length) {
          luxiaToast.info({
            title: "No new tag suggestions",
            description: "Existing tags, pending suggestions and earlier decisions already cover this content.",
          });
        }
      } catch {
        luxiaToast.error({
          title: "Could not save tag suggestions",
          description: "Storage is unavailable in this browser.",
          action: { label: "Retry", onClick: () => runTagSuggestions(targets) },
        });
      } finally {
        suggestingRef.current = false;
        setSuggesting(false);
      }
    }, 700);
  }

  /** Accepting applies a normal document tag through the existing Tag store. */
  function acceptSuggestions(document: DataSourceDocumentRecord, items: readonly TagSuggestionItem[]): number {
    let accepted = 0;
    for (const item of items) {
      const definition = item.tagId ? catalog.find((tag) => tag.id === item.tagId) : undefined;
      let tagId: string | null = null;
      if (definition) {
        applyTagToDocuments([document], definition);
        tagId = definition.id;
      } else {
        const result = createAndApplyTagToDocuments([document], item.label, suggestTagColor(item.label));
        // "Already exists" with nothing applied means the document already has it.
        tagId = result.tag?.id ?? null;
        if (!tagId) continue;
      }
      setTagSuggestionState(dataSourceId, document.localDocumentId, [item.id], "accepted", tagId);
      accepted += 1;
    }
    return accepted;
  }

  function rejectSuggestions(document: DataSourceDocumentRecord, items: readonly TagSuggestionItem[]) {
    setTagSuggestionState(dataSourceId, document.localDocumentId, items.map((item) => item.id), "rejected");
  }

  function acceptSelectedSuggestions() {
    let accepted = 0;
    for (const document of visibleSelected) accepted += acceptSuggestions(document, pendingSuggestionsFor(document));
    toast.success(`Accepted ${accepted} suggested tag${accepted === 1 ? "" : "s"}.`);
  }

  function rejectSelectedSuggestions() {
    let rejected = 0;
    for (const document of visibleSelected) {
      const items = pendingSuggestionsFor(document);
      rejected += items.length;
      if (items.length > 0) rejectSuggestions(document, items);
    }
    toast.message(`Rejected ${rejected} suggested tag${rejected === 1 ? "" : "s"}.`);
  }

  const hiddenSelectedCount = selected.length - visibleSelected.length;
  const extractEligibleCount = canEdit ? planExtraction(visibleSelected, statusFor).eligible.length : 0;
  const bulkBar = showSelection && (pickerMode || visibleSelected.length > 0) ? (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} aria-live="polite">
        {pickerMode && lockedIds.size > 0
          ? `${selected.length} new document${selected.length === 1 ? "" : "s"} selected · ${lockedIds.size} already added`
            + (hiddenSelectedCount > 0 ? ` (${hiddenSelectedCount} selected hidden by filters)` : "")
          : pickerMode
          ? `${selected.length} of ${documents.length} document${documents.length === 1 ? "" : "s"} selected`
            + (hiddenSelectedCount > 0 ? ` (${hiddenSelectedCount} hidden by filters)` : "")
          : `${visibleSelected.length} file${visibleSelected.length === 1 ? "" : "s"} selected`}
      </p>
      {canEdit && visibleSelected.length > 0 ? (
        <>
          {/* Shows how many of the selection can start extraction now; the dialog lists the rest. */}
          {extractEligibleCount > 0 ? (
            <Button type="button" variant="secondary" size="compact" onClick={() => openExtract(visibleSelected)}>
              {extractEligibleCount === visibleSelected.length
                ? "Extract"
                : `Extract ${extractEligibleCount} of ${visibleSelected.length}`}
            </Button>
          ) : null}
          <DocumentTagPicker
            catalog={catalog}
            variant="secondary"
            ariaLabel="Add tag to selected files"
            onApply={(tag) => handleApplyToFiles(visibleSelected, tag)}
            onCreate={(input) => handleCreateForFiles(visibleSelected, input)}
          />
          <BulkRemoveTagButton
            tags={tagsOnSelection}
            onRemove={handleRemoveFromSelected}
          />
          {suggestionsEnabled && selectedPendingCount > 0 ? (
            <>
              <Button type="button" variant="secondary" size="compact" onClick={acceptSelectedSuggestions}>
                Accept {selectedPendingCount} suggestion{selectedPendingCount === 1 ? "" : "s"}
              </Button>
              <Button type="button" variant="tertiary" size="compact" onClick={rejectSelectedSuggestions}>
                Reject suggestions
              </Button>
            </>
          ) : null}
        </>
      ) : null}
      {selected.length > 0 ? (
        <Button type="button" variant="tertiary" size="compact" onClick={() => setSelected([])}>
          Clear selection
        </Button>
      ) : null}
    </div>
  ) : null;

  if (review && reviewDocument) {
    const nextId = nextToReviewId();
    const goTo = (id: string | null) => {
      if (!id) {
        closeReview();
        return;
      }
      setReview({ ...review, documentId: id, sampleMode: false });
      writeReviewHistory(id, "replace");
    };
    const position = review.queueIds.indexOf(review.documentId) + 1;
    const workspace = (
      <DocumentReviewWorkspace
        dataSourceId={dataSourceId}
        dataSourceName={dataSourceName}
        document={reviewDocument}
        canEdit={canEdit}
        currentUserId={currentUserId}
        sampleMode={review.sampleMode}
        queue={position > 0 ? { position, total: review.queueIds.length } : null}
        onBack={closeReview}
        backLabel={reviewBackLabel}
        onNextToReview={nextId ? () => goTo(nextId) : null}
        onReviewLater={() => goTo(nextId)}
        onOpenSamplePreview={
          review.sampleMode ? undefined : () => setReview({ ...review, sampleMode: true })
        }
        navigationGuardRef={reviewGuardRef}
      />
    );
    // The host gives Review the full content area; without one it sits in place.
    return reviewPortalHost
      ? createPortal(workspace, reviewPortalHost)
      : <div style={{ height: "max(36rem, calc(100vh - 16rem))" }}>{workspace}</div>;
  }

  return (
    <div className="space-y-4">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        {documents.length.toLocaleString()} document{documents.length === 1 ? "" : "s"}
        {statusSummary ? ` · ${statusSummary}` : ""}
        {pendingSuggestionCount > 0
          ? ` · ${pendingSuggestionCount} prototype AI suggestion${pendingSuggestionCount === 1 ? "" : "s"} to review, not applied until accepted`
          : ""}
      </p>

      {documents.length === 0 ? (
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          This Data Source has no documents yet. Documents appear here after they are added to the Data Source.
        </p>
      ) : (
        <>
          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="file-ds-document-search" className="sr-only">
                Search documents
              </Label>
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                id="file-ds-document-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search documents"
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
            <TagMultiSelectFilter
              options={fileTagOptions}
              hasUntagged={hasUntaggedDocuments}
              selectedTagIds={selectedTagIds}
              untaggedSelected={untaggedSelected}
              onToggleTag={toggleTagFilter}
              onToggleUntagged={() => setUntaggedSelected((current) => !current)}
              onClear={clearTagFilters}
            />
            <BrowserFilterSelect
              label="Extraction status"
              className="w-[11rem] shrink-0"
              value={statusFilter}
              onChange={(event) => {
                const value = event.target.value;
                setStatusFilter(isDocumentExtractionStatus(value) ? value : "all");
              }}
            >
              <option value="all">All statuses</option>
              {DOCUMENT_EXTRACTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {documentExtractionStatusLabel(status)}
                </option>
              ))}
            </BrowserFilterSelect>
            {suggestionsEnabled && suggestionTargets.length > 0 ? (
              <LuxiaAiButton
                className="h-10 shrink-0"
                disabled={suggesting}
                aria-busy={suggesting}
                aria-label={`Suggest tags for ${suggestionTargets.length} ${visibleSelected.length > 0 ? "selected" : "listed"} document${suggestionTargets.length === 1 ? "" : "s"}`}
                onClick={() => runTagSuggestions(suggestionTargets)}
              >
                {suggesting
                  ? "Suggesting…"
                  : visibleSelected.length > 0
                    ? `Suggest tags · ${visibleSelected.length} selected`
                    : "Suggest tags"}
              </LuxiaAiButton>
            ) : null}
          </div>

          {bulkBar}

          {filteredEmpty ? (
            <div className="space-y-2">
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                No documents match these filters.
              </p>
              {hasActiveFilters ? (
                <Button type="button" variant="tertiary" size="compact" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} overflow-x-auto`}>
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <caption className="sr-only">Documents in this Data Source</caption>
                <thead>
                  <tr style={{ color: "var(--luxia-text-secondary)" }}>
                    {showSelection ? (
                      <th scope="col" className={`${TABLE_HEADER_CELL} w-10`}>
                        <Checkbox
                          checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                          onCheckedChange={(value) => toggleAllVisible(value === true)}
                          aria-label="Select all visible documents"
                        />
                      </th>
                    ) : null}
                    <th scope="col" className={TABLE_HEADER_CELL}>Document</th>
                    <th scope="col" className={TABLE_HEADER_CELL}>Format</th>
                    <th scope="col" className={TABLE_HEADER_CELL}>Extraction status</th>
                    <th scope="col" className={TABLE_HEADER_CELL}>Tags</th>
                    <th scope="col" className={`${TABLE_HEADER_CELL} w-12`}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((document) => {
                    const name = document.fileName;
                    const fileTags = tagsForDocument(document);
                    const status = statusFor(document);
                    const extractable = isExtractableDocument(document);
                    const record = extractionRecords[document.localDocumentId];
                    // Review and view open for anyone with access (read-only without Manage).
                    // One entry point per action and status:
                    //   PENDING    Extract                → row menu
                    //   PROCESSING none (status badge shows progress)
                    //   EXTRACTED  Review / View          → button beside the status
                    //   FAILED     Retry                  → button beside the status
                    //   REVIEWED   View reviewed content, Re-extract → row menu
                    // Preview and Delete always stay in the row menu.
                    const reviewItem: LuxiaEntityOptionsItem | null = status === "REVIEWED"
                      ? {
                          id: "view-reviewed",
                          label: "View reviewed content",
                          ariaLabel: `View reviewed content for ${name}`,
                          onSelect: () => openReview(document),
                        }
                      : null;
                    // Extraction actions are Manage only.
                    const extractionItem: LuxiaEntityOptionsItem | null = !canEdit || !extractable
                      ? null
                      : status === "PENDING"
                        ? { id: "extract", label: "Extract", ariaLabel: `Extract ${name}`, onSelect: () => openExtract([document]) }
                        : status === "REVIEWED"
                          ? { id: "reextract", label: "Re-extract", ariaLabel: `Re-extract ${name}`, onSelect: () => openExtract([document], "reextract") }
                          : null;
                    const statusTitle = status === "FAILED"
                      ? record?.failureReason ?? undefined
                      : undefined;
                    const menuItems: LuxiaEntityOptionsItem[] = [
                      {
                        id: "preview",
                        label: "Preview",
                        ariaLabel: `Preview ${name}`,
                        onSelect: () => setPreviewTarget(resolveDocumentPreviewTarget(name, {
                          sample: isReviewSampleFixtureDocument(dataSourceId, document.localDocumentId),
                          uploaded: document.localDocumentIdOrigin === "upload",
                        })),
                      },
                      ...(reviewItem ? [reviewItem] : []),
                      ...(extractionItem ? [extractionItem] : []),
                      ...(canDelete
                        ? [
                            {
                              id: "delete",
                              label: "Delete",
                              ariaLabel: `Delete ${name}`,
                              destructive: true,
                              separatorBefore: true,
                              onSelect: () => setDeleteTarget(document),
                            } satisfies LuxiaEntityOptionsItem,
                          ]
                        : []),
                    ];
                    return (
                      <tr
                        key={document.localDocumentId}
                        data-document-id={document.localDocumentId}
                        className="luxia-settings-row hover:bg-[var(--luxia-surface-hover)]"
                      >
                        {showSelection ? (
                          <td className={`${TABLE_BODY_CELL} w-10`}>
                            <Checkbox
                              checked={lockedIds.has(document.localDocumentId) || selected.includes(document.localDocumentId)}
                              disabled={lockedIds.has(document.localDocumentId)}
                              onCheckedChange={(value) => toggleFile(document.localDocumentId, value === true)}
                              aria-label={lockedIds.has(document.localDocumentId) ? `${name} is already added` : `Select ${name}`}
                            />
                          </td>
                        ) : null}
                        <td className={`${TABLE_BODY_CELL} min-w-0`}>
                          <span
                            className="block break-words luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {name}
                          </span>
                          {lockedIds.has(document.localDocumentId) ? (
                            <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                              Already added
                            </span>
                          ) : null}
                        </td>
                        <td className={TABLE_BODY_CELL} style={{ color: "var(--luxia-text-secondary)" }}>
                          {document.fileFormat}
                        </td>
                        <td className={`${TABLE_BODY_CELL} whitespace-nowrap`}>
                          <div className="flex items-center gap-2">
                            <DocumentExtractionStatusCell
                              fileFormat={document.fileFormat}
                              status={status}
                              title={statusTitle}
                              contentAvailable={hasReviewableContent(getDocumentReviewContent(dataSourceId, document.localDocumentId))}
                            />
                            {canEdit && extractable && status === "FAILED" ? (
                              <RetryAction
                                label="Retry"
                                onRetry={() => retryExtraction(document)}
                                className="h-7"
                              />
                            ) : null}
                            {status === "EXTRACTED" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="compact"
                                className="h-7"
                                aria-label={`${canEdit ? "Review" : "View"} ${name}`}
                                onClick={() => openReview(document)}
                              >
                                {canEdit ? "Review" : "View"}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                        <td className={TABLE_BODY_CELL}>
                          <div className={`min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
                            {fileTags.map((tag) =>
                              canEdit ? (
                                <ManagedTagChip
                                  key={tag.id}
                                  tag={tag}
                                  className="max-w-[min(100%,12rem)]"
                                  removeAriaLabel={`Remove ${tag.name} from ${name}`}
                                  onEdit={canManageDefinitions ? (input) => handleUpdate(tag, input) : undefined}
                                  onActivate={
                                    canManageDefinitions
                                      ? undefined
                                      : () => selectTagFilter(tag.id)
                                  }
                                  onRemove={() => {
                                    removeTagFromDocument(document, tag.id);
                                    toast.message(`Removed “${tag.name}”.`);
                                  }}
                                />
                              ) : (
                                <DocumentTagChip
                                  key={tag.id}
                                  tag={tag}
                                  className="max-w-[min(100%,12rem)]"
                                  interactive
                                  aria-label={`Filter by ${tag.name}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    selectTagFilter(tag.id);
                                  }}
                                />
                              ),
                            )}
                            {suggestionsEnabled
                              ? (() => {
                                  const record = suggestionRecords[document.localDocumentId];
                                  const pending = pendingSuggestionsFor(document);
                                  if (!record || pending.length === 0) return null;
                                  const outdated = suggestionsAreOutdated(dataSourceId, document, record);
                                  return pending.map((item) => (
                                    <SuggestedTagChip
                                      key={item.id}
                                      item={item}
                                      documentName={name}
                                      outdated={outdated}
                                      onAccept={() => {
                                        if (acceptSuggestions(document, [item]) > 0) toast.success(`Accepted “${item.label}”.`);
                                      }}
                                      onReject={() => {
                                        rejectSuggestions(document, [item]);
                                        toast.message(`Rejected “${item.label}”.`);
                                      }}
                                    />
                                  ));
                                })()
                              : null}
                            {canEdit ? (
                              <DocumentTagPicker
                                catalog={catalog}
                                variant="secondary"
                                iconOnly={fileTags.length > 0}
                                ariaLabel={`Add tag to ${name}`}
                                excludeIds={fileTags.map((tag) => tag.id)}
                                onApply={(tag) => handleApplyToFiles([document], tag)}
                                onCreate={(input) => handleCreateForFiles([document], input)}
                              />
                            ) : null}
                          </div>
                        </td>
                        <td className={`${TABLE_BODY_CELL} w-12`}>
                          <LuxiaEntityOptionsMenu
                            entityLabel={name}
                            entityType="document"
                            ariaLabel={`Options for ${name}`}
                            items={menuItems}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.fileName ?? "file"}?`}
        description="The file will be removed from this Data Source and from search. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="destructive"
        onConfirm={handleConfirmDelete}
      />

      <FileInUseDialog
        open={Boolean(inUse)}
        fileName={inUse?.fileName ?? ""}
        dependencies={inUse?.dependencies ?? []}
        onClose={() => setInUse(null)}
        onOpenConstellation={onOpenConstellation}
      />

      <PDFPreviewDialog
        open={Boolean(previewTarget)}
        onOpenChange={(next) => {
          if (!next) setPreviewTarget(null);
        }}
        file={previewTarget}
      />

      {canEdit ? (
        <ExtractDocumentsDialog
          open={Boolean(extractRequest)}
          plan={extractRequest?.plan ?? { eligible: [], excluded: [] }}
          mode={extractRequest?.mode}
          onOpenChange={(open) => {
            if (!open) setExtractRequest(null);
          }}
          onConfirm={handleConfirmExtract}
        />
      ) : null}
    </div>
  );
}
