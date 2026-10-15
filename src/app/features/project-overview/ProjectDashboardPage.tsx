import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  buildProjectDashboardBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { getProjectNameById } from "@/app/features/project";
import type { HomeProjectCard } from "@/app/features/project/types";
import { CURRENT_USER_ID } from "@/app/features/permissions";
import type { ProjectRole } from "@/app/features/permissions";
import {
  CollectorViewToggle,
  readCollectorViewMode,
  writeCollectorViewMode,
  type CollectorViewMode,
} from "@/app/features/shared";
import { toast } from "sonner";
import {
  canCreateDashboard,
  canDeleteDashboard,
  canEditDashboard,
  canRenameDashboard,
  DASHBOARD_CREATE_DENIED_MESSAGE,
  DASHBOARD_DELETE_DENIED_MESSAGE,
  DASHBOARD_EDIT_DENIED_MESSAGE,
} from "./dashboardAccess";
import {
  DashboardOutputPreviewGraphic,
  outputTypeLabel,
} from "./DashboardOutputPreviews";
import { getProjectDashboardOutputs } from "./data";
import {
  createDashboardOutput,
  subscribeDashboardOutputStore,
} from "./dashboardOutputStore";
import { ProjectNotFoundState } from "./ProjectHeader";
import { ProjectModuleEmptyState } from "./ProjectModuleShared";
import type {
  ProjectDashboardConversationSource,
  ProjectDashboardOutput,
  ProjectDashboardOutputType,
} from "./types";

type OutputTypeFilter = "all" | ProjectDashboardOutputType;
type ConversationSourceFilter = "all" | ProjectDashboardConversationSource;

const PROJECT_NAME_FALLBACK = "Project name 01";

/**
 * Output types with a real editable prototype flow.
 * Current Dashboard outputs are snapshot previews only — no editor exists yet.
 */
const EDITABLE_DASHBOARD_OUTPUT_TYPES = new Set<ProjectDashboardOutputType>();

function canEditDashboardOutput(type: ProjectDashboardOutputType): boolean {
  return EDITABLE_DASHBOARD_OUTPUT_TYPES.has(type);
}

function matchesSearch(item: ProjectDashboardOutput, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q)
    || outputTypeLabel(item.outputType).toLowerCase().includes(q)
    || item.sourceContext.toLowerCase().includes(q)
  );
}

function filteredResultsLabel(count: number): string {
  return `${count} ${count === 1 ? "result" : "results"}`;
}

function canMutateOutput(
  projectRole: ProjectRole | null | undefined,
  output: Pick<ProjectDashboardOutput, "createdByUserId">,
  currentUserId: string,
): boolean {
  return canEditDashboard({
    projectRole,
    dashboardOwnerId: output.createdByUserId,
    currentUserId,
  });
}

function stopCardActivation(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export interface ProjectDashboardPageProps {
  projectId: string | null;
  projects: HomeProjectCard[];
  projectRole?: ProjectRole | null;
  currentUserId?: string;
  focusOutputId?: string | null;
  viewResetKey?: number;
  onViewOutputIdChange?: (outputId: string | null) => void;
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenProjectOverview: (projectId: string) => void;
  onOpenGalaxy?: (projectId: string) => void;
}

export function ProjectDashboardPage({
  projectId,
  projects,
  projectRole = null,
  currentUserId = CURRENT_USER_ID,
  focusOutputId = null,
  viewResetKey = 0,
  onViewOutputIdChange,
  onNavigateHome,
  onViewProjects,
  onOpenProjectOverview,
  onOpenGalaxy,
}: ProjectDashboardPageProps) {
  const [typeFilter, setTypeFilter] = useState<OutputTypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<ConversationSourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<CollectorViewMode>(() =>
    readCollectorViewMode("dashboard"),
  );
  const [outputs, setOutputs] = useState<ProjectDashboardOutput[]>([]);
  const [viewOutputId, setViewOutputId] = useState<string | null>(null);
  const [renameOutputId, setRenameOutputId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteOutputId, setDeleteOutputId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const outputCounterRef = useRef(0);

  const canCreate = canCreateDashboard(projectRole);

  function handleViewModeChange(mode: CollectorViewMode) {
    setViewMode(mode);
    writeCollectorViewMode("dashboard", mode);
  }

  const project = projectId
    ? projects.find((entry) => entry.id === projectId)
    : undefined;

  const projectName = projectId
    ? getProjectNameById(projectId, projects, PROJECT_NAME_FALLBACK)
    : PROJECT_NAME_FALLBACK;

  useEffect(() => {
    setOutputs(projectId ? getProjectDashboardOutputs(projectId).map((item) => ({ ...item })) : []);
    setViewOutputId(null);
    setRenameOutputId(null);
    setDeleteOutputId(null);
    setRenameValue("");
    setRenameError(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    return subscribeDashboardOutputStore(() => {
      setOutputs(getProjectDashboardOutputs(projectId).map((item) => ({ ...item })));
    });
  }, [projectId]);

  useEffect(() => {
    setViewOutputId(null);
    setRenameOutputId(null);
    setDeleteOutputId(null);
    setRenameValue("");
    setRenameError(null);
  }, [viewResetKey]);

  useEffect(() => {
    if (!focusOutputId) return;
    if (outputs.some((item) => item.id === focusOutputId)) {
      setViewOutputId(focusOutputId);
    }
  }, [focusOutputId, outputs]);

  useEffect(() => {
    onViewOutputIdChange?.(viewOutputId);
  }, [viewOutputId, onViewOutputIdChange]);

  const filteredOutputs = useMemo(() => {
    return outputs.filter((item) => {
      if (typeFilter !== "all" && item.outputType !== typeFilter) return false;
      if (sourceFilter !== "all" && item.conversationSource !== sourceFilter) return false;
      return matchesSearch(item, searchQuery);
    });
  }, [outputs, typeFilter, sourceFilter, searchQuery]);

  const filtersActive = typeFilter !== "all" || sourceFilter !== "all" || searchQuery.trim().length > 0;

  const viewOutput = viewOutputId
    ? outputs.find((item) => item.id === viewOutputId) ?? null
    : null;
  const renameOutput = renameOutputId
    ? outputs.find((item) => item.id === renameOutputId) ?? null
    : null;
  const deleteOutput = deleteOutputId
    ? outputs.find((item) => item.id === deleteOutputId) ?? null
    : null;

  function clearFilters() {
    setTypeFilter("all");
    setSourceFilter("all");
    setSearchQuery("");
  }

  function openView(outputId: string) {
    if (!outputs.some((item) => item.id === outputId)) return;
    setViewOutputId(outputId);
  }

  function openRename(outputId: string) {
    const target = outputs.find((item) => item.id === outputId);
    if (!target) return;
    if (
      !canRenameDashboard({
        projectRole,
        dashboardOwnerId: target.createdByUserId,
        currentUserId,
      })
    ) {
      toast.error(DASHBOARD_EDIT_DENIED_MESSAGE);
      return;
    }
    setRenameOutputId(outputId);
    setRenameValue(target.name);
    setRenameError(null);
  }

  function openEdit(outputId: string) {
    const target = outputs.find((item) => item.id === outputId);
    if (!target) return;
    if (
      !canEditDashboard({
        projectRole,
        dashboardOwnerId: target.createdByUserId,
        currentUserId,
      })
    ) {
      toast.error(DASHBOARD_EDIT_DENIED_MESSAGE);
      return;
    }
    if (!canEditDashboardOutput(target.outputType)) return;
  }

  function submitRename(event?: FormEvent) {
    event?.preventDefault();
    if (!renameOutputId) return;
    const target = outputs.find((item) => item.id === renameOutputId);
    if (
      !target
      || !canRenameDashboard({
        projectRole,
        dashboardOwnerId: target.createdByUserId,
        currentUserId,
      })
    ) {
      toast.error(DASHBOARD_EDIT_DENIED_MESSAGE);
      return;
    }
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Enter an output name.");
      renameInputRef.current?.focus();
      return;
    }
    setOutputs((prev) =>
      prev.map((item) =>
        item.id === renameOutputId
          ? {
            ...item,
            name: trimmed,
            updatedAt: "Just now",
            updatedAtTimestamp: Date.now(),
          }
          : item,
      ),
    );
    setRenameOutputId(null);
    setRenameValue("");
    setRenameError(null);
  }

  function confirmDelete() {
    if (!deleteOutputId) return;
    const target = outputs.find((item) => item.id === deleteOutputId);
    if (
      !target
      || !canDeleteDashboard({
        projectRole,
        dashboardOwnerId: target.createdByUserId,
        currentUserId,
      })
    ) {
      toast.error(DASHBOARD_DELETE_DENIED_MESSAGE);
      return;
    }
    setOutputs((prev) => prev.filter((item) => item.id !== deleteOutputId));
    if (viewOutputId === deleteOutputId) setViewOutputId(null);
    if (renameOutputId === deleteOutputId) setRenameOutputId(null);
    setDeleteOutputId(null);
  }

  function openDelete(outputId: string) {
    const target = outputs.find((item) => item.id === outputId);
    if (!target) return;
    if (
      !canDeleteDashboard({
        projectRole,
        dashboardOwnerId: target.createdByUserId,
        currentUserId,
      })
    ) {
      toast.error(DASHBOARD_DELETE_DENIED_MESSAGE);
      return;
    }
    setDeleteOutputId(outputId);
  }

  function getOutputMenuItems(item: ProjectDashboardOutput) {
    const canMutateItem = canMutateOutput(projectRole, item, currentUserId);
    const showEdit = canMutateItem && canEditDashboardOutput(item.outputType);
    return [
      {
        id: "view",
        label: "View",
        onSelect: () => openView(item.id),
      },
      ...(canMutateItem
        ? [
            {
              id: "rename",
              label: "Rename",
              onSelect: () => openRename(item.id),
            },
            ...(showEdit
              ? [
                  {
                    id: "edit",
                    label: "Edit",
                    onSelect: () => openEdit(item.id),
                  },
                ]
              : []),
            {
              id: "delete",
              label: "Delete",
              destructive: true as const,
              separatorBefore: true,
              onSelect: () => openDelete(item.id),
            },
          ]
        : []),
    ];
  }

  function openCreateDialog() {
    if (!canCreateDashboard(projectRole)) {
      toast.error(DASHBOARD_CREATE_DENIED_MESSAGE);
      return;
    }
    const nextIndex = outputs.length + 1;
    setCreateName(`Output name ${String(nextIndex).padStart(2, "0")}`);
    setCreateError(null);
    setCreateOpen(true);
  }

  function submitCreate(event?: FormEvent) {
    event?.preventDefault();
    if (!projectId || !canCreateDashboard(projectRole)) {
      toast.error(DASHBOARD_CREATE_DENIED_MESSAGE);
      return;
    }
    const trimmed = createName.trim();
    if (!trimmed) {
      setCreateError("Enter a Dashboard output name.");
      createInputRef.current?.focus();
      return;
    }
    outputCounterRef.current += 1;
    const record = createDashboardOutput({
      projectId,
      name: trimmed,
      createdByUserId: currentUserId,
      outputType: "metric",
      conversationSource: "galaxy",
      sourceContext: "Galaxy",
    });
    if (!record) {
      toast.error("Couldn’t create Dashboard output");
      return;
    }
    setOutputs((prev) => {
      if (prev.some((item) => item.id === record.id)) return prev;
      return [record, ...prev];
    });
    setCreateOpen(false);
    setCreateName("");
    setCreateError(null);
    toast.success("Dashboard output created");
  }

  useEffect(() => {
    if (!renameOutputId) return;
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [renameOutputId]);

  useEffect(() => {
    if (!createOpen) return;
    const frame = window.requestAnimationFrame(() => {
      createInputRef.current?.focus();
      createInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [createOpen]);

  if (!projectId || !project) {
    return (
      <ProjectNotFoundState
        onBackHome={onNavigateHome}
        onViewProjects={onViewProjects}
      />
    );
  }

  const lastUpdated = outputs[0]?.updatedAt;
  const crumbItems = buildProjectDashboardBreadcrumbItems({
    projectId: project.id,
    projectName,
  });

  return (
    <div className="min-w-0 w-full">
      <LuxiaPageHeader
        contentGap="page"
        className="mb-4"
        pageTypeLabel="DASHBOARD"
        title="Dashboard"
        titleStyle={{ color: "var(--luxia-purple-70)" }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={crumbItems}
            handlers={{
              onHome: onNavigateHome,
              onProject: onOpenProjectOverview,
            }}
          />
        }
        context={
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            <span>
              {outputs.length} {outputs.length === 1 ? "saved output" : "saved outputs"}
            </span>
            {lastUpdated ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Last updated {lastUpdated}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span className="truncate">{projectName}</span>
          </div>
        }
        guide="Saved charts, tables, reports, metrics, and analyses from Project conversations."
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={openCreateDialog}
            >
              Create Dashboard
            </Button>
          ) : undefined
        }
      />

      {outputs.length > 0 ? (
        <div
          className="flex min-w-0 flex-col gap-3"
          style={{ marginBottom: "var(--luxia-spacing-16)" }}
        >
          <label className="block w-full max-w-full">
            <span className="sr-only">Search outputs</span>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search outputs"
                aria-label="Search outputs"
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
          </label>

          <CollectionFilterBar
            style={{ columnGap: "var(--luxia-spacing-16)" }}
            trailing={
              <div
                className="flex min-w-0 flex-wrap items-center"
                style={{
                  gap: "var(--luxia-spacing-12)",
                  marginInlineStart: "var(--luxia-spacing-12)",
                }}
              >
                <CollectorViewToggle
                  value={viewMode}
                  onChange={handleViewModeChange}
                />
                {filtersActive ? (
                  <ResultsCount>{filteredResultsLabel(filteredOutputs.length)}</ResultsCount>
                ) : null}
              </div>
            }
          >
            <BrowserFilterSelect
              label="Output type"
              value={typeFilter}
              aria-label="Output type"
              onChange={(event) => setTypeFilter(event.target.value as OutputTypeFilter)}
            >
              <option value="all">All output types</option>
              <option value="chart">Chart</option>
              <option value="table">Table</option>
              <option value="report">Report</option>
              <option value="metric">Metric</option>
              <option value="analysis">Analysis</option>
              <option value="insight">Insight</option>
              <option value="comparison">Comparison</option>
              <option value="mixed">Mixed</option>
            </BrowserFilterSelect>

            <BrowserFilterSelect
              label="Conversation source"
              value={sourceFilter}
              aria-label="Conversation source"
              onChange={(event) =>
                setSourceFilter(event.target.value as ConversationSourceFilter)
              }
            >
              <option value="all">All conversations</option>
              <option value="galaxy">Galaxy</option>
              <option value="constellation-chat">Constellation Chats</option>
            </BrowserFilterSelect>
          </CollectionFilterBar>
        </div>
      ) : null}

      {outputs.length === 0 ? (
        <div
          className="rounded-[12px] px-6 py-12"
          style={{
            background: "var(--luxia-surface)",
            border:
              "1px solid color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
          }}
        >
          <ProjectModuleEmptyState
            title="No saved outputs yet"
            description="Save charts, tables, reports, metrics, and analyses from Project conversations to see them here."
            action={
              onOpenGalaxy ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => onOpenGalaxy(project.id)}
                >
                  Open Galaxy
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : filteredOutputs.length === 0 ? (
        <FilteredEmptyState
          title="No matching outputs"
          onClear={filtersActive ? clearFilters : undefined}
        />
      ) : viewMode === "grid" ? (
        <div
          className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          style={{ gap: 16 }}
        >
          {filteredOutputs.map((item) => {
            const menuItems = getOutputMenuItems(item);

            return (
              <article
                key={item.id}
                className="relative flex min-w-0 flex-col rounded-[12px] p-3"
                style={{
                  background: "var(--luxia-surface)",
                  border:
                    "1px solid color-mix(in srgb, var(--luxia-blue-20) 45%, var(--luxia-neutral-200))",
                }}
                aria-label={`${item.name}, ${outputTypeLabel(item.outputType)}, from ${item.sourceContext}, updated ${item.updatedAt}`}
              >
                <div
                  className="absolute right-2 top-2 z-[1]"
                  onClick={stopCardActivation}
                  onPointerDown={stopCardActivation}
                >
                  <LuxiaEntityOptionsMenu
                    entityLabel={item.name}
                    entityType="Output"
                    ariaLabel={`Output options for ${item.name}`}
                    align="end"
                    items={menuItems}
                  />
                </div>

                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  onClick={() => openView(item.id)}
                  aria-label={`View output ${item.name}`}
                >
                  <DashboardOutputPreviewGraphic variant={item.outputType} size="full" />
                  <div className="mt-3 flex min-w-0 flex-1 flex-col gap-1 px-0.5 pr-8">
                    <h2
                      className="truncate luxia-type-body-dense-strong"
                      style={{ color: "var(--luxia-purple-70)" }}
                    >
                      {item.name}
                    </h2>
                    <p
                      className="truncate luxia-type-caption"
                      style={{ color: "var(--luxia-neutral-600, #475569)" }}
                    >
                      {outputTypeLabel(item.outputType)} · {item.sourceContext}
                    </p>
                    <p
                      className="mt-auto pt-1 luxia-type-caption"
                      style={{ color: "var(--luxia-neutral-500, #64748B)" }}
                    >
                      Updated {item.updatedAt}
                    </p>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-[12px] border bg-[var(--luxia-surface)]"
          style={{
            borderColor:
              "color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))",
          }}
          role="list"
        >
          {filteredOutputs.map((item) => {
            const menuItems = getOutputMenuItems(item);

            return (
              <div
                key={item.id}
                role="listitem"
                className="flex min-w-0 items-center gap-3 border-b px-4 py-3 last:border-b-0"
                style={{ borderColor: "var(--luxia-border-default)" }}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-[6px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  onClick={() => openView(item.id)}
                  aria-label={`View output ${item.name}`}
                >
                  <p
                    className="truncate luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-purple-70)" }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="mt-1 truncate luxia-type-caption"
                    style={{ color: "var(--luxia-neutral-600, #475569)" }}
                  >
                    <span>{outputTypeLabel(item.outputType)}</span>
                    <span className="hidden sm:inline">{` · ${item.sourceContext}`}</span>
                    <span className="hidden md:inline">{` · Updated ${item.updatedAt}`}</span>
                  </p>
                  <p
                    className="mt-0.5 truncate luxia-type-caption sm:hidden"
                    style={{ color: "var(--luxia-neutral-500, #64748B)" }}
                  >
                    {item.sourceContext} · Updated {item.updatedAt}
                  </p>
                </button>
                <div className="shrink-0" onClick={stopCardActivation} onPointerDown={stopCardActivation}>
                  <LuxiaEntityOptionsMenu
                    entityLabel={item.name}
                    entityType="Output"
                    ariaLabel={`Output options for ${item.name}`}
                    align="end"
                    items={menuItems}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={Boolean(viewOutput)}
        onOpenChange={(open) => !open && setViewOutputId(null)}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{viewOutput?.name ?? "Output"}</AlertDialogTitle>
            <AlertDialogDescription>
              {viewOutput
                ? `${outputTypeLabel(viewOutput.outputType)} from ${viewOutput.sourceContext}. Updated ${viewOutput.updatedAt}.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {viewOutput ? (
            <div className="mt-1 px-6 py-4">
              <DashboardOutputPreviewGraphic variant={viewOutput.outputType} size="full" />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setCreateName("");
            setCreateError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCreate}>
            <DialogHeader>
              <DialogTitle>Create Dashboard</DialogTitle>
              <DialogDescription>
                Add a saved output to this Project Dashboard. It will be owned by you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 px-6 py-4">
              <Label htmlFor="dashboard-output-create">Output name</Label>
              <Input
                ref={createInputRef}
                id="dashboard-output-create"
                value={createName}
                onChange={(event) => {
                  setCreateName(event.target.value);
                  if (createError) setCreateError(null);
                }}
                aria-invalid={Boolean(createError)}
                aria-describedby={createError ? "dashboard-output-create-error" : undefined}
                autoComplete="off"
              />
              {createError ? (
                <p
                  id="dashboard-output-create-error"
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-error)" }}
                  role="alert"
                >
                  {createError}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateName("");
                  setCreateError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="compact">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameOutput)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameOutputId(null);
            setRenameValue("");
            setRenameError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename output</DialogTitle>
              <DialogDescription>
                Update the name for this Dashboard output only.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 px-6 py-4">
              <Label htmlFor="dashboard-output-rename">Output name</Label>
              <Input
                ref={renameInputRef}
                id="dashboard-output-rename"
                value={renameValue}
                onChange={(event) => {
                  setRenameValue(event.target.value);
                  if (renameError) setRenameError(null);
                }}
                aria-invalid={Boolean(renameError)}
                aria-describedby={renameError ? "dashboard-output-rename-error" : undefined}
                autoComplete="off"
              />
              {renameError ? (
                <p
                  id="dashboard-output-rename-error"
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-error)" }}
                  role="alert"
                >
                  {renameError}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => {
                  setRenameOutputId(null);
                  setRenameValue("");
                  setRenameError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="compact">
                Save name
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteOutput)}
        onOpenChange={(open) => !open && setDeleteOutputId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this output?</AlertDialogTitle>
            <AlertDialogDescription>
              This output will be removed from the Project Dashboard. Its source Chat, Galaxy, or Constellation will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={confirmDelete}
            >
              Delete output
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
