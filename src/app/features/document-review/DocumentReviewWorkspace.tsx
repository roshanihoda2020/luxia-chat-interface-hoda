import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, FileX2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/app/components/ui/resizable";
import { Textarea } from "@/app/components/ui/textarea";
import {
  DocumentExtractionStatusCell,
  DEFAULT_DOCUMENT_EXTRACTION_STATUS,
  useDataSourceExtractionStatuses,
  type DataSourceDocumentRecord,
} from "@/app/features/data-sources/documents";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { DiscardChangesDialog } from "@/app/features/shared/DiscardChangesDialog";
import { LuxiaSpinner } from "@/app/features/shared/Loading";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_DIRTY_STATE_COPY } from "@/app/features/shared/luxiaSettingsUx";
import { StatusBadge } from "@/app/features/shared/StatusBadge";
import {
  useBeforeUnloadWhenDirty,
  type UnsavedNavigationGuard,
} from "@/app/features/shared/unsavedNavigationGuard";
import { MarkdownView } from "./MarkdownView";
import { originalPageUrl, resolveOriginalDocumentPreview } from "./originalDocumentPreview";
import {
  approveDocumentReview,
  hasReviewableContent,
  saveDocumentReviewContent,
  useDocumentReviewContent,
} from "./reviewContentStore";
import { cloneReviewPages, REVIEW_SAMPLE_PAGES, type ReviewPage } from "./reviewSampleFixtures";

export interface DocumentReviewWorkspaceProps {
  dataSourceId: string;
  dataSourceName: string;
  document: DataSourceDocumentRecord;
  /** Manage permission. Without it the workspace is read-only. */
  canEdit: boolean;
  currentUserId?: string;
  /**
   * Shows the labelled sample fixture for a document that has no content.
   * Always read-only and never approvable.
   */
  sampleMode?: boolean;
  /** Position in the review queue, shown when more than one document is queued. */
  queue?: { position: number; total: number } | null;
  backLabel?: string;
  onBack: () => void;
  /** Next document waiting for review, or null when there is none. */
  onNextToReview?: (() => void) | null;
  /** Leave this document at To review and move on. */
  onReviewLater?: (() => void) | null;
  onOpenSamplePreview?: () => void;
  /** Registered so host navigation (sidebar, browser Back) can ask before discarding edits. */
  navigationGuardRef?: MutableRefObject<UnsavedNavigationGuard | null>;
}

const BAR_STYLE = { borderColor: "var(--luxia-border-subtle)", background: "var(--luxia-surface)" };
const PANE_HEADER =
  "flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2";
/** Below this workspace width the panes stack (original above Markdown). */
const STACK_BELOW_PX = 960;

/** A PDF page that has not reported loading by then is shown as failed, never as an endless spinner. */
const ORIGINAL_LOAD_TIMEOUT_MS = 8000;

/**
 * One page of the original PDF in the browser's own viewer. The browser
 * reports nothing when it cannot show a PDF inline (viewer disabled, or set to
 * download PDFs), and a missing asset returns the app's HTML fallback, so the
 * file is checked first and the frame load is bounded by a timeout. Every
 * failure ends in an error state with Retry and a direct link.
 */
function OriginalPageFrame({
  url,
  pageNumber,
  pageCount,
  fit,
}: {
  url: string;
  pageNumber: number;
  pageCount: number;
  fit: "width" | "page";
}) {
  const [attempt, setAttempt] = useState(0);
  const [assetOk, setAssetOk] = useState<boolean | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  // Keyed by frame, so a load that lands before the timeout effect runs is never lost.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [timedOutKey, setTimedOutKey] = useState<string | null>(null);
  const frameKey = `${url}|${pageNumber}|${fit}|${attempt}`;
  const ready = loadedKey === frameKey;
  const pageUrl = originalPageUrl(url, pageNumber, fit);

  // Asset check, once per file and Retry: a 200 that is not a PDF is the SPA fallback.
  useEffect(() => {
    let cancelled = false;
    setAssetOk(null);
    setAssetError(null);
    if (typeof navigator !== "undefined" && navigator.pdfViewerEnabled === false) {
      setAssetOk(false);
      setAssetError("This browser does not display PDFs inline.");
      return;
    }
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (cancelled) return;
        const type = response.headers.get("content-type") ?? "";
        if (!response.ok || !type.includes("pdf")) {
          setAssetOk(false);
          setAssetError(response.ok ? "The original file could not be found." : `The original file could not be loaded (${response.status}).`);
        } else {
          setAssetOk(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAssetOk(false);
        setAssetError("The original file could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  // Each frame (page, fit, Retry) starts loading and must report within the timeout.
  useEffect(() => {
    if (!assetOk) return;
    const timer = window.setTimeout(() => setTimedOutKey(frameKey), ORIGINAL_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [frameKey, assetOk]);

  const error = assetOk === false
    ? assetError ?? "The original file could not be loaded."
    : timedOutKey === frameKey && !ready ? "The page did not load in this browser." : null;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" role="alert">
        <FileX2 size={22} strokeWidth={1.5} aria-hidden style={{ color: "var(--luxia-text-muted)" }} />
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {error}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="secondary" size="compact" onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </Button>
          <Button asChild variant="tertiary" size="compact">
            <a href={pageUrl} target="_blank" rel="noreferrer">Open PDF in new tab</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {assetOk !== true || !ready ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ background: "var(--luxia-surface-muted)" }}>
          <LuxiaSpinner label="Loading original page" />
        </div>
      ) : null}
      {assetOk ? (
        <iframe
          key={frameKey}
          src={pageUrl}
          title={`Sample original, page ${pageNumber} of ${pageCount}`}
          className="h-full w-full border-0"
          onLoad={() => setLoadedKey(frameKey)}
        />
      ) : null}
    </>
  );
}

/**
 * Reusable Extract → Review → Approve workspace for one document. Fills its
 * container (give it a definite height) and holds no host-specific state, so
 * Data Source Settings, File Data Source creation and the Constellation file
 * picker can all mount it with their own navigation.
 */
export function DocumentReviewWorkspace({
  dataSourceId,
  dataSourceName,
  document,
  canEdit,
  currentUserId,
  sampleMode = false,
  queue,
  backLabel = "Back to Documents",
  onBack,
  onNextToReview,
  onReviewLater,
  onOpenSamplePreview,
  navigationGuardRef,
}: DocumentReviewWorkspaceProps) {
  const records = useDataSourceExtractionStatuses(dataSourceId);
  const record = records[document.localDocumentId];
  const status = record?.status ?? DEFAULT_DOCUMENT_EXTRACTION_STATUS;
  const content = useDocumentReviewContent(dataSourceId, document.localDocumentId);
  const pages: ReviewPage[] = useMemo(
    () => (sampleMode ? cloneReviewPages(REVIEW_SAMPLE_PAGES) : content?.pages ?? []),
    [sampleMode, content],
  );
  const hasContent = sampleMode ? true : hasReviewableContent(content);
  const isSample = sampleMode || content?.origin === "sample-fixture";
  const preview = resolveOriginalDocumentPreview({
    dataSourceId,
    localDocumentId: document.localDocumentId,
    fileFormat: document.fileFormat,
    sampleMode,
  });

  const [pageIndex, setPageIndex] = useState(0);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [fit, setFit] = useState<"width" | "page">("width");
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [stacked, setStacked] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // New document: start on page 1 in view mode.
  useEffect(() => {
    setPageIndex(0);
    setMode("view");
    setDrafts({});
  }, [document.localDocumentId, sampleMode]);

  useEffect(() => {
    const node = bodyRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setStacked((entry?.contentRect.width ?? STACK_BELOW_PX) < STACK_BELOW_PX);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasContent]);

  // Page model. Markdown is per page when the extraction has page data; one
  // block without page data is shown for the whole document, never split up.
  const originalPageCount = preview.kind === "sample" ? preview.pageCount : 0;
  const markdownPerPage = pages.length > 1 || originalPageCount <= 1;
  const pageCount = Math.max(originalPageCount, markdownPerPage ? pages.length : 1, 1);
  const pageNumber = Math.min(pageIndex, pageCount - 1) + 1;
  const currentPage = markdownPerPage ? pages[pageNumber - 1] : pages[0];

  const editable = canEdit && !sampleMode && hasContent && (status === "EXTRACTED" || status === "REVIEWED");
  const approvable = canEdit && !sampleMode && hasContent && status === "EXTRACTED";
  const dirty = pages.some((page) => drafts[page.pageNumber] !== undefined && drafts[page.pageNumber] !== page.markdown);

  // Losing edit rights (e.g. status changed elsewhere) drops back to view mode.
  useEffect(() => {
    if (!editable && mode === "edit" && !dirty) setMode("view");
  }, [editable, mode, dirty]);

  useBeforeUnloadWhenDirty(dirty);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  function requestLeave(action: () => void) {
    if (dirtyRef.current) setPendingLeave(() => action);
    else action();
  }
  const requestLeaveRef = useRef(requestLeave);
  requestLeaveRef.current = requestLeave;

  useEffect(() => {
    if (!navigationGuardRef) return;
    navigationGuardRef.current = {
      isDirty: () => dirtyRef.current,
      requestLeaveConfirmation: (onConfirmed) => requestLeaveRef.current(onConfirmed),
    };
    return () => {
      navigationGuardRef.current = null;
    };
  }, [navigationGuardRef]);

  function editedPages(): ReviewPage[] {
    return pages.map((page) => ({ ...page, markdown: drafts[page.pageNumber] ?? page.markdown }));
  }

  function discardDrafts() {
    setDrafts({});
    setMode("view");
  }

  /** Persist drafts. Returns false when nothing could be saved. */
  function commitSave(): boolean {
    const result = saveDocumentReviewContent(dataSourceId, document.localDocumentId, editedPages(), currentUserId ?? null);
    if (!result.saved) {
      luxiaToast.error({ title: "Changes were not saved", description: "Storage is unavailable in this browser." });
      return false;
    }
    setDrafts({});
    setMode("view");
    if (result.reopenedForReview) {
      luxiaToast.success({ title: "Changes saved", description: "The document is back in To review. Approve it again when ready." });
    } else if (result.changed) {
      luxiaToast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
    }
    return true;
  }

  function handleSave() {
    if (!dirty) {
      discardDrafts();
      return;
    }
    if (status === "REVIEWED") {
      setConfirmReopen(true);
      return;
    }
    commitSave();
  }

  /** Saves pending edits first, then records the explicit approval. */
  function handleApprove() {
    if (!approvable) return;
    if (dirty && !commitSave()) return;
    if (approveDocumentReview(dataSourceId, document.localDocumentId, currentUserId ?? null)) {
      luxiaToast.success({ title: "Document approved", description: document.fileName });
    } else {
      luxiaToast.error({ title: "Could not approve", description: "Only documents in To review with content can be approved." });
    }
  }

  const statusLabelId = `review-status-${document.localDocumentId}`;
  const savedAt = content?.record?.savedAt;
  const approvedAt = status === "REVIEWED" ? content?.record?.approvedAt : null;
  // Deferring a review is an editor action; read-only viewers just go back.
  const showReviewLater = canEdit && Boolean(onReviewLater) && status === "EXTRACTED" && !sampleMode;
  const hasActions = showReviewLater || editable || approvable || Boolean(onNextToReview);

  const pageNav = (
    <nav className="flex items-center gap-1" aria-label="Page navigation">
      <Button
        type="button"
        variant="secondary"
        size="iconCompact"
        aria-label="Previous page"
        disabled={pageNumber <= 1}
        onClick={() => setPageIndex(Math.max(0, pageNumber - 2))}
      >
        <ChevronLeft size={16} aria-hidden />
      </Button>
      <p className="min-w-[5.5rem] text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }} aria-live="polite">
        Page {pageNumber} of {pageCount}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="iconCompact"
        aria-label="Next page"
        disabled={pageNumber >= pageCount}
        onClick={() => setPageIndex(Math.min(pageCount - 1, pageNumber))}
      >
        <ChevronRight size={16} aria-hidden />
      </Button>
    </nav>
  );

  const originalPane = (
    <div className="flex h-full min-h-0 min-w-0 flex-col" role="region" aria-label="Original document">
      <div className={PANE_HEADER} style={BAR_STYLE}>
        <p className="luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>
          Original document{preview.kind === "sample" ? " (sample PDF)" : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {pageNav}
          {preview.kind === "sample" ? (
            <div className="flex gap-1" role="group" aria-label="Page fit">
              {(["width", "page"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={fit === option ? "secondary" : "tertiary"}
                  size="compact"
                  aria-pressed={fit === option}
                  onClick={() => setFit(option)}
                >
                  {fit === option ? <Check size={14} aria-hidden /> : null}
                  {option === "width" ? "Fit width" : "Fit page"}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="relative min-h-0 flex-1" style={{ background: "var(--luxia-surface-muted)" }}>
        {preview.kind === "sample" ? (
          <OriginalPageFrame
            url={preview.url}
            pageNumber={pageNumber}
            pageCount={preview.pageCount}
            fit={fit}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <FileX2 size={22} strokeWidth={1.5} aria-hidden style={{ color: "var(--luxia-text-muted)" }} />
            <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              {preview.reason === "unsupported-format"
                ? `Page preview is not available for ${document.fileFormat} files.`
                : "The original file is not available in this prototype."}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const markdownPane = (
    <div className="flex h-full min-h-0 min-w-0 flex-col" role="region" aria-label="Extracted Markdown">
      <div className={PANE_HEADER} style={BAR_STYLE}>
        <p className="luxia-type-label-form" style={{ color: "var(--luxia-text-primary)" }}>
          Extracted Markdown
          <span className="ml-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {markdownPerPage ? `Page ${pageNumber}` : "Whole document, no page data"}
          </span>
        </p>
        <p className="luxia-type-caption" style={{ color: dirty ? "var(--luxia-text-primary)" : "var(--luxia-text-muted)" }} aria-live="polite">
          {mode === "edit"
            ? dirty ? `Editing · ${LUXIA_DIRTY_STATE_COPY.unsaved.toLowerCase()}` : "Editing · no changes yet"
            : savedAt ? `Saved ${new Date(savedAt).toLocaleString()}` : null}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {mode === "edit" && currentPage ? (
          <>
            <label htmlFor="review-markdown-editor" className="sr-only">
              Markdown for {markdownPerPage ? `page ${pageNumber}` : "the whole document"}
            </label>
            <Textarea
              id="review-markdown-editor"
              value={drafts[currentPage.pageNumber] ?? currentPage.markdown}
              onChange={(event) => {
                const value = event.target.value;
                setDrafts((current) => ({ ...current, [currentPage.pageNumber]: value }));
              }}
              className="h-full min-h-[20rem] w-full resize-none font-mono luxia-type-body-dense"
            />
          </>
        ) : currentPage ? (
          // Reading width is capped for line length; the editor uses the full pane.
          <div className="max-w-[72ch]">
            <MarkdownView markdown={drafts[currentPage.pageNumber] ?? currentPage.markdown} />
          </div>
        ) : (
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            No extracted content for page {pageNumber}.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col" aria-label={`Review ${document.fileName}`}>
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-6 py-3" style={BAR_STYLE}>
        <Button type="button" variant="secondary" size="compact" onClick={() => requestLeave(onBack)}>
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            {dataSourceName}
          </p>
          <div className="flex min-w-0 flex-wrap items-center gap-2" id={statusLabelId}>
            <h1 className="min-w-0 truncate luxia-type-title-component" style={{ color: "var(--luxia-text-primary)" }}>
              {document.fileName}
            </h1>
            <DocumentExtractionStatusCell
              fileFormat={document.fileFormat}
              status={status}
              contentAvailable={sampleMode ? undefined : hasContent}
            />
            {isSample ? <StatusBadge tone="neutral" label="Sample content" /> : null}
            {approvedAt ? (
              <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                Approved {new Date(approvedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
        {queue && queue.total > 1 ? (
          // Document navigation (the review queue); page navigation lives in the original pane.
          <p className="shrink-0 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            Review queue · document {queue.position} of {queue.total}
          </p>
        ) : null}
      </header>

      {isSample ? (
        <p className="shrink-0 border-b px-6 py-2 luxia-type-caption" style={{ ...BAR_STYLE, color: "var(--luxia-text-muted)" }} role="note">
          {sampleMode
            ? `Layout preview with sample content, not ${document.fileName}'s extraction. It cannot be edited or approved.`
            : "Sample content: hand-written Markdown and a matching sample PDF, not OCR output."}
        </p>
      ) : null}

      {!hasContent ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <FileX2 size={24} strokeWidth={1.5} aria-hidden style={{ color: "var(--luxia-text-muted)" }} />
          <div className="space-y-1">
            <p className="luxia-type-body-default-strong" style={{ color: "var(--luxia-text-primary)" }}>
              No extracted content available
            </p>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              This prototype has no extraction output for this document, so it cannot be reviewed or approved.
            </p>
          </div>
          {onOpenSamplePreview ? (
            <Button type="button" variant="secondary" size="compact" onClick={onOpenSamplePreview}>
              Preview layout with sample content
            </Button>
          ) : null}
        </div>
      ) : (
        <div ref={bodyRef} className="min-h-0 flex-1">
          <ResizablePanelGroup key={stacked ? "vertical" : "horizontal"} direction={stacked ? "vertical" : "horizontal"}>
            <ResizablePanel defaultSize={50} minSize={stacked ? 25 : 30}>
              {originalPane}
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize panes" />
            <ResizablePanel defaultSize={50} minSize={stacked ? 25 : 30}>
              {markdownPane}
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      )}

      {hasActions ? (
        <footer
          className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-6 py-3"
          style={BAR_STYLE}
          aria-label="Review actions"
        >
          <div className="flex flex-wrap gap-2">
            {showReviewLater ? (
              <Button type="button" variant="secondary" size="compact" onClick={() => requestLeave(onReviewLater!)}>
                Review later
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mode === "edit" ? (
              <>
                <Button type="button" variant="secondary" size="compact" onClick={discardDrafts}>
                  {LUXIA_DIRTY_STATE_COPY.cancel}
                </Button>
                <Button type="button" variant="secondary" size="compact" onClick={handleSave} disabled={!dirty}>
                  {LUXIA_DIRTY_STATE_COPY.save}
                </Button>
              </>
            ) : editable ? (
              <Button type="button" variant="secondary" size="compact" onClick={() => setMode("edit")}>
                Edit Markdown
              </Button>
            ) : null}
            {approvable ? (
              <Button type="button" variant="primary" size="compact" onClick={handleApprove} aria-describedby={statusLabelId}>
                Approve &amp; save
              </Button>
            ) : null}
            {onNextToReview ? (
              <Button type="button" variant="secondary" size="compact" onClick={() => requestLeave(onNextToReview)}>
                Next to review
                <ChevronRight size={16} aria-hidden />
              </Button>
            ) : null}
          </div>
        </footer>
      ) : null}

      <DiscardChangesDialog
        open={Boolean(pendingLeave)}
        onOpenChange={(open) => {
          if (!open) setPendingLeave(null);
        }}
        onDiscard={() => {
          const action = pendingLeave;
          setPendingLeave(null);
          discardDrafts();
          action?.();
        }}
        onSave={status === "REVIEWED" ? undefined : () => {
          const action = pendingLeave;
          setPendingLeave(null);
          if (commitSave()) action?.();
        }}
      />

      <ConfirmDialog
        open={confirmReopen}
        onOpenChange={(open) => {
          if (!open) setConfirmReopen(false);
        }}
        title="Save changes to approved content?"
        description="Saving replaces the approved text and returns this document to To review. It needs to be approved again."
        confirmLabel="Save changes"
        onConfirm={() => {
          setConfirmReopen(false);
          commitSave();
        }}
      />
    </section>
  );
}
