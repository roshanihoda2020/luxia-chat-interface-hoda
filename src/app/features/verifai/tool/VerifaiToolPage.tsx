import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Download, FolderOpen, History, Plus, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { ListEmptyState, ListNoResultsState, SearchField } from "@/app/features/shared";
import { BrowserFilterDropdown, FilterToolbar, FilterToolbarRow } from "@/app/features/home/browserShared";
import type { VerifaiToolView } from "@/app/features/project/projectPaths";
import type { ProjectRole } from "@/app/features/permissions/types";
import { canRunVerifaiReview, canViewVerifaiReview, type VerifaiViewer } from "../access";
import { VerifySetupPanel, type VerifySetupSnapshot } from "../setup/VerifySetupPanel";
import { VerifaiReviewCard } from "../VerifaiReviewMessage";
import { downloadReport } from "../components/reviewActions";
import { listVerifaiReviews, startVerifaiReview, useVerifaiReview, useVerifaiReviewsVersion } from "../verifaiStore";
import type { VerifaiLaunchContext, VerifaiReview, VerifaiStartInput } from "../types";
import { clearVerifaiDraft, draftFromReview, readVerifaiDraft, writeVerifaiDraft } from "./draftStore";
import { ResultsWorkspace } from "./results/ResultsWorkspace";
import { formatReviewDate, reviewOriginLabel, ReviewsList } from "./ReviewsList";
import { ReviewLibrarySheet } from "./ReviewLibrarySheet";
import { readVerifaiToolScope, writeVerifaiToolScope, type VerifaiToolScope } from "./scopePreference";
import "./workspace.css";

export type VerifaiToolProject = { id: string; name: string; role: ProjectRole | null };
/** Only Constellations the user can Use (already filtered by membership and access). */
export type VerifaiToolConstellation = { id: string; label: string; projectId: string };

type StatusFilter = "all" | "running" | "complete" | "failed";
type OriginFilter = "all" | "chat" | "tool";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "running", label: "Running" },
  { value: "complete", label: "Complete" },
  { value: "failed", label: "Failed" },
] as const;
type SortOrder = "newest" | "oldest" | "status" | "findings";
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "status", label: "Status" },
  { value: "findings", label: "Most findings" },
] as const;
const STATUS_ORDER: Record<VerifaiReview["status"], number> = { running: 0, failed: 1, complete: 2 };

function sortReviews(reviews: VerifaiReview[], order: SortOrder): VerifaiReview[] {
  const sorted = [...reviews];
  if (order === "oldest") return sorted.sort((a, b) => a.startedAt - b.startedAt);
  if (order === "status") return sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.startedAt - a.startedAt);
  if (order === "findings") return sorted.sort((a, b) => b.findings.length - a.findings.length || b.startedAt - a.startedAt);
  return sorted.sort((a, b) => b.startedAt - a.startedAt);
}

const ORIGIN_OPTIONS = [
  { value: "all", label: "All origins" },
  { value: "chat", label: "Chat" },
  { value: "tool", label: "Tool" },
] as const;

type Props = {
  userId: string;
  projects: VerifaiToolProject[];
  constellations: VerifaiToolConstellation[];
  /** Name of a Chat the user can open, for "Chat · {name}" origins. */
  chatLabel: (chatId: string) => string | null;
  view: VerifaiToolView;
  /** Workspace: null = a new review (setup); otherwise the review shown (same id as in Chat). */
  reviewId: string | null;
  onOpenReview: (reviewId: string) => void;
  onOpenWorkspace: () => void;
  onOpenHistory: () => void;
  onNavigateHome: () => void;
  onNavigateTools: () => void;
  /** The requested review is missing or not visible to this user. */
  onReviewUnavailable: () => void;
};

function initialScope(
  userId: string,
  projects: VerifaiToolProject[],
  constellations: VerifaiToolConstellation[],
  visibleReviews: VerifaiReview[],
): VerifaiToolScope | null {
  const usable = (scope: VerifaiToolScope | null) =>
    scope
    && projects.some((p) => p.id === scope.projectId)
    && constellations.some((c) => c.projectId === scope.projectId && c.id === scope.constellationId);
  const stored = readVerifaiToolScope(userId);
  if (usable(stored)) return stored;
  // Otherwise: where the user's most recent visible review is, else the first usable Constellation.
  const recent = visibleReviews.find((review) => usable({ projectId: review.projectId, constellationId: review.scope.constellationId }));
  if (recent) return { projectId: recent.projectId, constellationId: recent.scope.constellationId };
  for (const project of projects) {
    const first = constellations.find((c) => c.projectId === project.id);
    if (first) return { projectId: project.id, constellationId: first.id };
  }
  return projects[0] ? { projectId: projects[0].id, constellationId: "" } : null;
}

/**
 * VerifAI Tool — workspace first. `/tools/verifai` opens the working application:
 *   A · Ready to review (inline setup) → B · Running → C · Complete (three panels) / D · Failed.
 * Review History (`/tools/verifai/history`) and the Review library are secondary. Every review,
 * file, rule and result comes from the shared VerifAI store and components used by Chat.
 */
export function VerifaiToolPage(props: Props) {
  const { userId, projects, constellations, view, reviewId, onReviewUnavailable } = props;
  const viewer: VerifaiViewer = useMemo(
    () => ({
      userId,
      canUseConstellation: (projectId, constellationId) =>
        constellations.some((c) => c.projectId === projectId && c.id === constellationId),
    }),
    [userId, constellations],
  );
  const version = useVerifaiReviewsVersion();
  const visibleReviews = useMemo(
    () => listVerifaiReviews((review) => canViewVerifaiReview(review, viewer)),
    // version re-reads the shared store when any review changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewer, version],
  );
  const openedReview = reviewId ? visibleReviews.find((review) => review.id === reviewId) ?? null : null;
  const visibleReviewIds = useMemo(() => new Set(visibleReviews.map((review) => review.id)), [visibleReviews]);

  // Scope (Project › Constellation), shared by the workspace and History; remembered per user.
  const [scope, setScope] = useState<VerifaiToolScope | null>(() => initialScope(userId, projects, constellations, visibleReviews));
  useEffect(() => {
    // Access changed: re-validate (never keep an inaccessible scope).
    setScope((current) =>
      current && projects.some((p) => p.id === current.projectId)
        && (!current.constellationId || constellations.some((c) => c.projectId === current.projectId && c.id === current.constellationId))
        ? current
        : initialScope(userId, projects, constellations, visibleReviews));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, constellations]);
  const chooseScope = useCallback((next: VerifaiToolScope) => {
    setScope(next);
    if (next.constellationId) writeVerifaiToolScope(userId, next);
  }, [userId]);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [draftEpoch, setDraftEpoch] = useState(0);
  const retryFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (reviewId && !openedReview) onReviewUnavailable();
  }, [reviewId, openedReview, onReviewUnavailable]);

  if (view === "workspace" && reviewId && !openedReview) return null;

  const shared = { ...props, viewer, scope, chooseScope, libraryOpen, setLibraryOpen, visibleReviewIds };

  if (view === "history") return <HistoryView {...shared} visibleReviews={visibleReviews} />;
  return (
    <WorkspaceView
      {...shared}
      review={openedReview}
      draftEpoch={draftEpoch}
      retryFocusRef={retryFocusRef}
      onTryAgain={(review) => {
        // Pre-fill the setup with the failed review's checklist and document, in its own scope.
        retryFocusRef.current = retryFocusSelector(review);
        writeVerifaiDraft(userId, review.projectId, review.scope.constellationId, draftFromReview(review, userId));
        chooseScope({ projectId: review.projectId, constellationId: review.scope.constellationId });
        setDraftEpoch((n) => n + 1);
        props.onOpenWorkspace();
      }}
    />
  );
}

type SharedProps = Props & {
  viewer: VerifaiViewer;
  scope: VerifaiToolScope | null;
  chooseScope: (scope: VerifaiToolScope) => void;
  libraryOpen: boolean;
  setLibraryOpen: (open: boolean) => void;
  visibleReviewIds: ReadonlySet<string>;
};

// ---------------------------------------------------------------------------------------------
// Shared header pieces
// ---------------------------------------------------------------------------------------------

function VerifaiTitleIcon() {
  return <ShieldCheck size={22} color="var(--luxia-brand-primary)" strokeWidth={1.75} aria-hidden />;
}

function ScopeSelectors({
  projects,
  constellations,
  scope,
  chooseScope,
}: Pick<SharedProps, "projects" | "constellations" | "scope" | "chooseScope">) {
  const project = scope ? projects.find((p) => p.id === scope.projectId) ?? null : null;
  const projectConstellations = project ? constellations.filter((c) => c.projectId === project.id) : [];
  return (
    <FilterToolbarRow className="lx-vws-scope">
      <div className="w-full min-w-0 sm:w-[15rem]">
        <BrowserFilterDropdown
          label="Project"
          value={project?.id ?? ""}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          onValueChange={(projectId) => {
            // A new Project: its first usable Constellation (never one from another Project).
            const first = constellations.find((c) => c.projectId === projectId);
            chooseScope({ projectId, constellationId: first?.id ?? "" });
          }}
          dataAttr="vfy-project"
        />
      </div>
      {projectConstellations.length ? (
        <div className="w-full min-w-0 sm:w-[15rem]">
          <BrowserFilterDropdown
            label="Constellation"
            value={scope?.constellationId ?? ""}
            options={projectConstellations.map((c) => ({ value: c.id, label: c.label }))}
            onValueChange={(constellationId) => project && chooseScope({ projectId: project.id, constellationId })}
            dataAttr="vfy-constellation"
          />
        </div>
      ) : null}
    </FilterToolbarRow>
  );
}

/**
 * A secondary header action. On phone widths it shows its icon only (the label stays as its
 * accessible name), so New review, Export, History and Review library fit on one row.
 */
function CompactAction({ icon, label, ...rest }: { icon: ReactNode; label: string } & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} className="lx-vws-compact-action" title={label} {...rest}>
      {icon}<span className="lx-vws-compact-action__label">{label}</span>
    </Button>
  );
}

function SecondaryActions({ onOpenHistory, onOpenLibrary, showHistory = true }: { onOpenHistory?: () => void; onOpenLibrary?: () => void; showHistory?: boolean }) {
  return (
    <>
      {showHistory && onOpenHistory ? (
        <CompactAction icon={<History size={14} aria-hidden />} label="History" onClick={onOpenHistory} data-vfy-tool-history="" />
      ) : null}
      {onOpenLibrary ? (
        <CompactAction icon={<FolderOpen size={14} aria-hidden />} label="Review library" onClick={onOpenLibrary} data-vfy-tool-library="" />
      ) : null}
    </>
  );
}

/**
 * Moves focus to a new state's heading when the workspace state changes (not on first render),
 * without scrolling the page header (and its actions) away; it scrolls only when the target is
 * outside the viewport.
 */
function useFocusOnChange(key: string, target: () => HTMLElement | null) {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    // A short delay: a restored setup (Try again) renders its controls one commit later.
    window.setTimeout(() => {
      const element = target();
      if (!element) return;
      element.focus({ preventScroll: true });
      const rect = element.getBoundingClientRect();
      if (rect.bottom > window.innerHeight || rect.top < 0) element.scrollIntoView({ block: "nearest" });
    }, 60);
  });
}

/** After Try again: the setup control behind the failure (the document when it was unreadable, otherwise the checklist). */
function retryFocusSelector(review: VerifaiReview): string {
  if (review.failure?.stage === "text") return "#lx-vfy-doc-select";
  if (review.checklist.source === "structured") return "#lx-vfy-structured-select";
  if (review.checklist.source === "manual") return "#lx-vfy-manual";
  return "#lx-vfy-checklist-select";
}

// ---------------------------------------------------------------------------------------------
// Workspace: A · Ready, B · Running, C · Complete, D · Failed
// ---------------------------------------------------------------------------------------------

function WorkspaceView(props: SharedProps & {
  review: VerifaiReview | null;
  draftEpoch: number;
  onTryAgain: (review: VerifaiReview) => void;
  /** Set by Try again: the setup control to focus once the setup is back. */
  retryFocusRef: { current: string | null };
}) {
  const { review: listedReview, userId, projects, constellations, scope, chooseScope, chatLabel, viewer, draftEpoch } = props;
  // Live updates for the review shown (progress, completion).
  const review = useVerifaiReview(listedReview?.id) ?? listedReview;
  const stateKey = review ? `${review.id}:${review.status}` : "ready";
  const headingRef = useRef<HTMLHeadingElement>(null);
  useFocusOnChange(stateKey, () => {
    const retryTarget = !review && props.retryFocusRef.current;
    props.retryFocusRef.current = null;
    return (retryTarget ? document.querySelector<HTMLElement>(retryTarget) : null) ?? headingRef.current;
  });

  const project = scope ? projects.find((p) => p.id === scope.projectId) ?? null : null;
  const constellation = scope ? constellations.find((c) => c.projectId === scope.projectId && c.id === scope.constellationId) ?? null : null;
  const canRun = Boolean(project && constellation && canRunVerifaiReview(project.role, true));

  // State A: the shared setup, inline. The launch context depends on ids and labels only (not on
  // object identity), so re-rendered Project lists never reset the setup or its draft.
  const projectId = project?.id ?? null;
  const projectName = project?.name ?? "";
  const constellationId = constellation?.id ?? null;
  const constellationLabel = constellation?.label ?? "";
  const context: VerifaiLaunchContext | null = useMemo(
    () => (projectId && constellationId && canRun
      ? { origin: { kind: "tool" }, userId: viewer.userId, projectId, projectName, constellations: [{ id: constellationId, label: constellationLabel }] }
      : null),
    [projectId, projectName, constellationId, constellationLabel, canRun, viewer.userId],
  );
  const draft = useMemo(
    () => (projectId && constellationId ? readVerifaiDraft(userId, projectId, constellationId) : null),
    // draftEpoch: re-read after Try again wrote a new draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, projectId, constellationId, draftEpoch],
  );
  const saveDraft = useCallback((snapshot: VerifySetupSnapshot) => {
    if (projectId && constellationId) writeVerifaiDraft(userId, projectId, constellationId, snapshot);
  }, [userId, projectId, constellationId]);
  function start(input: VerifaiStartInput) {
    const id = startVerifaiReview(input);
    clearVerifaiDraft(userId, input.projectId, input.scope.constellationId);
    props.onOpenReview(id);
  }

  function newReview() {
    if (review && constellations.some((c) => c.projectId === review.projectId && c.id === review.scope.constellationId)) {
      chooseScope({ projectId: review.projectId, constellationId: review.scope.constellationId });
    }
    props.onOpenWorkspace();
  }

  const breadcrumbItems: LuxiaBreadcrumbItem[] = review
    ? [
      { id: "home", label: "Home", destination: { kind: "home" } },
      { id: "tools", label: "Tools", destination: { kind: "tools" } },
      { id: "verifai", label: "VerifAI", destination: { kind: "verifai-tool" } },
      { id: "review", label: review.document.name, destination: { kind: "current" } },
    ]
    : [
      { id: "home", label: "Home", destination: { kind: "home" } },
      { id: "tools", label: "Tools", destination: { kind: "tools" } },
      { id: "verifai", label: "VerifAI", destination: { kind: "current" } },
    ];
  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = { onHome: props.onNavigateHome, onTools: props.onNavigateTools, onVerifaiTool: props.onOpenWorkspace };

  const reviewContext: ReactNode = review ? (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }} data-vfy-review-context="">
      <span>{review.projectName} › {review.scope.constellationLabel}</span>
      <span aria-hidden>·</span>
      <span>{review.checklist.name}</span>
      <span aria-hidden>·</span>
      <span>{formatReviewDate(review.startedAt)}</span>
      <span aria-hidden>·</span>
      <span>{reviewOriginLabel(review, chatLabel)}</span>
      {review.isDemo ? <span className="lx-vws-demo">Demo</span> : null}
    </p>
  ) : null;

  const libraryScope = review
    ? { id: review.scope.constellationId, label: review.scope.constellationLabel }
    : constellation ? { id: constellation.id, label: constellation.label } : null;

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="APPLICATION"
        title="VerifAI"
        titleStyle={{ color: "var(--luxia-brand-primary)" }}
        titleLeading={<VerifaiTitleIcon />}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={breadcrumbHandlers} />}
        guide={review ? undefined : "Verify documents against a checklist"}
        metadata={reviewContext ?? undefined}
        primaryAction={review ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={newReview} data-vfy-tool-new="">
            <Plus size={14} aria-hidden /> New review
          </Button>
        ) : undefined}
        secondaryAction={(
          // Direct children of the header's action row, so they wrap with it.
          <>
            {review?.status === "complete" ? (
              <CompactAction icon={<Download size={14} aria-hidden />} label="Export" onClick={() => downloadReport(review, { avoidHeader: true })} data-vfy-tool-export="" />
            ) : null}
            <SecondaryActions onOpenHistory={props.onOpenHistory} onOpenLibrary={libraryScope ? () => props.setLibraryOpen(true) : undefined} />
          </>
        )}
      />

      <LuxiaPageBody>
        {review ? (
          review.status === "complete" ? (
            <ResultsWorkspace ref={headingRef} review={review} />
          ) : (
            <section className="lx-vws-status-card" aria-labelledby="lx-vws-state-title" data-vfy-state={review.status}>
              {/* The review card carries the visible title; this heading names the state for assistive tech and takes focus. */}
              <h2 id="lx-vws-state-title" ref={headingRef} tabIndex={-1} className="lx-vws-state-title sr-only">
                {review.status === "running" ? "Verification in progress" : "Verification failed"}
              </h2>
              <VerifaiReviewCard review={review} />
              {review.status === "running" ? (
                <p className="lx-vws-note">This review keeps running if you leave. It appears in History.</p>
              ) : (
                // New review is in the page header; Try again is the action specific to this failure.
                <div className="lx-vws-actions">
                  <Button type="button" variant="primary" size="sm" onClick={() => props.onTryAgain(review)} data-vfy-try-again="">
                    <RotateCcw size={14} aria-hidden /> Try again
                  </Button>
                </div>
              )}
            </section>
          )
        ) : projects.length === 0 ? (
          <ListEmptyState title="No Projects yet" description="You need to be a member of a Project to verify its documents." />
        ) : (
          <section aria-labelledby="lx-vws-state-title" className="flex flex-col gap-4" data-vfy-state="ready">
            <ScopeSelectors projects={projects} constellations={constellations} scope={scope} chooseScope={chooseScope} />
            <h2 id="lx-vws-state-title" ref={headingRef} tabIndex={-1} className="lx-vws-state-title sr-only">Ready to review</h2>
            {context ? (
              <div className="lx-vws-setup">
                <VerifySetupPanel
                  active
                  variant="page"
                  context={context}
                  resetKey={`${context.projectId}:${context.constellations[0]?.id}:${draftEpoch}`}
                  initial={draft}
                  onSnapshotChange={saveDraft}
                  onStart={start}
                />
              </div>
            ) : (
              <ListEmptyState
                title="No Constellation available"
                description="You need Use access to a Constellation in this Project to run reviews."
              />
            )}
          </section>
        )}
      </LuxiaPageBody>

      {libraryScope ? (
        <ReviewLibrarySheet
          open={props.libraryOpen}
          onOpenChange={props.setLibraryOpen}
          constellationId={libraryScope.id}
          constellationLabel={libraryScope.label}
          userId={userId}
          visibleReviewIds={props.visibleReviewIds}
        />
      ) : null}
    </LuxiaPageFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// Review History (secondary page; the Phase 2 list)
// ---------------------------------------------------------------------------------------------

function HistoryView(props: SharedProps & { visibleReviews: VerifaiReview[] }) {
  const { projects, constellations, scope, chooseScope, chatLabel, visibleReviews, userId } = props;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");

  const project = scope ? projects.find((p) => p.id === scope.projectId) ?? null : null;
  const constellation = scope ? constellations.find((c) => c.projectId === scope.projectId && c.id === scope.constellationId) ?? null : null;
  // Same rule as the workspace: New review only where this viewer can run one (a Project role and a
  // usable Constellation in the current scope). Otherwise the page explains what is missing instead.
  const canRun = Boolean(project && constellation && canRunVerifaiReview(project.role, true));

  const scopedReviews = useMemo(
    () => (constellation && project
      ? visibleReviews.filter((r) => r.projectId === project.id && r.scope.constellationId === constellation.id)
      : []),
    [visibleReviews, project, constellation],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortReviews(scopedReviews.filter((review) =>
      (status === "all" || review.status === status)
      && (origin === "all" || review.origin === origin)
      && (!q
        || review.document.name.toLowerCase().includes(q)
        || review.checklist.name.toLowerCase().includes(q)
        || reviewOriginLabel(review, chatLabel).toLowerCase().includes(q))), sort);
  }, [scopedReviews, query, status, origin, chatLabel, sort]);
  const filtersActive = Boolean(query.trim()) || status !== "all" || origin !== "all";

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    { id: "tools", label: "Tools", destination: { kind: "tools" } },
    { id: "verifai", label: "VerifAI", destination: { kind: "verifai-tool" } },
    { id: "history", label: "History", destination: { kind: "current" } },
  ];
  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = { onHome: props.onNavigateHome, onTools: props.onNavigateTools, onVerifaiTool: props.onOpenWorkspace };

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="VERIFAI"
        title="Review History"
        titleStyle={{ color: "var(--luxia-brand-primary)" }}
        breadcrumb={<LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={breadcrumbHandlers} />}
        guide="Reviews are kept for this browser session only."
        primaryAction={canRun ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={props.onOpenWorkspace} data-vfy-tool-new="">
            <Plus size={14} aria-hidden /> New review
          </Button>
        ) : undefined}
        secondaryAction={constellation ? <SecondaryActions showHistory={false} onOpenLibrary={() => props.setLibraryOpen(true)} /> : undefined}
      />

      <LuxiaPageBody>
        {projects.length === 0 ? (
          <ListEmptyState title="No Projects yet" description="You need to be a member of a Project to see its reviews." />
        ) : (
          <div className="flex flex-col gap-5">
            <section aria-label="Review scope" data-vfy-tool-scope="">
              <ScopeSelectors projects={projects} constellations={constellations} scope={scope} chooseScope={chooseScope} />
            </section>
            {!constellation ? (
              <ListEmptyState title="No Constellation available" description="You need Use access to a Constellation in this Project to view reviews." />
            ) : (
              <section aria-label="Reviews" className="flex flex-col gap-3">
                <FilterToolbar>
                  <FilterToolbarRow>
                    <div className="w-full min-w-0 md:w-[20rem]">
                      <SearchField density="page" value={query} onChange={setQuery} placeholder="Search reviews" aria-label="Search reviews" />
                    </div>
                    <div className="w-[calc(50%-0.5rem)] min-w-0 md:w-[11rem]">
                      <BrowserFilterDropdown label="Status" value={status} options={STATUS_OPTIONS} onValueChange={(v) => setStatus(v as StatusFilter)} dataAttr="vfy-status" />
                    </div>
                    <div className="w-[calc(50%-0.5rem)] min-w-0 md:w-[11rem]">
                      <BrowserFilterDropdown label="Origin" value={origin} options={ORIGIN_OPTIONS} onValueChange={(v) => setOrigin(v as OriginFilter)} dataAttr="vfy-origin" />
                    </div>
                    <div className="w-[calc(50%-0.5rem)] min-w-0 md:w-[11rem]">
                      <BrowserFilterDropdown label="Sort" value={sort} options={SORT_OPTIONS} onValueChange={(v) => setSort(v as SortOrder)} dataAttr="vfy-sort" />
                    </div>
                    <p className="ml-auto pb-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} aria-live="polite" data-vfy-tool-count={filtered.length}>
                      {filtered.length} review{filtered.length === 1 ? "" : "s"}
                    </p>
                  </FilterToolbarRow>
                </FilterToolbar>
                {scopedReviews.length === 0 ? (
                  <ListEmptyState
                    title="No reviews yet"
                    description={`Reviews of ${constellation.label} started in this session appear here.`}
                    action={canRun ? (
                      <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={props.onOpenWorkspace}>
                        <Plus size={14} aria-hidden /> New review
                      </Button>
                    ) : undefined}
                  />
                ) : filtered.length === 0 ? (
                  <ListNoResultsState
                    title="No reviews match your filters."
                    onClear={filtersActive ? () => { setQuery(""); setStatus("all"); setOrigin("all"); } : undefined}
                  />
                ) : (
                  <ReviewsList reviews={filtered} chatLabel={chatLabel} onOpenReview={props.onOpenReview} />
                )}
              </section>
            )}
          </div>
        )}
      </LuxiaPageBody>

      {constellation ? (
        <ReviewLibrarySheet
          open={props.libraryOpen}
          onOpenChange={props.setLibraryOpen}
          constellationId={constellation.id}
          constellationLabel={constellation.label}
          userId={userId}
          visibleReviewIds={props.visibleReviewIds}
        />
      ) : null}
    </LuxiaPageFrame>
  );
}
