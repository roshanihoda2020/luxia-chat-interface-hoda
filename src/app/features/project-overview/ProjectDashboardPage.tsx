import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  buildProjectDashboardBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
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
import type { ProjectRole } from "@/app/features/permissions";
import {
  DashboardOutputPreviewGraphic,
  outputTypeLabel,
} from "./DashboardOutputPreviews";
import { getProjectDashboardOutputs } from "./data";
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

function matchesSearch(item: ProjectDashboardOutput, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q)
    || outputTypeLabel(item.outputType).toLowerCase().includes(q)
    || item.sourceContext.toLowerCase().includes(q)
  );
}

function outputCountLabel(count: number): string {
  return `${count} ${count === 1 ? "output" : "outputs"}`;
}

function canMutateDashboardOutputs(role: ProjectRole | null | undefined): boolean {
  return role === "Project Owner" || role === "Project Manager" || role === "Analyst";
}

export interface ProjectDashboardPageProps {
  projectId: string | null;
  projects: HomeProjectCard[];
  projectRole?: ProjectRole | null;
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenProjectOverview: (projectId: string) => void;
  onOpenGalaxy?: (projectId: string) => void;
}

export function ProjectDashboardPage({
  projectId,
  projects,
  projectRole = null,
  onNavigateHome,
  onViewProjects,
  onOpenProjectOverview,
  onOpenGalaxy,
}: ProjectDashboardPageProps) {
  const [typeFilter, setTypeFilter] = useState<OutputTypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<ConversationSourceFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [outputs, setOutputs] = useState<ProjectDashboardOutput[]>([]);
  const [viewOutputId, setViewOutputId] = useState<string | null>(null);
  const [renameOutputId, setRenameOutputId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteOutputId, setDeleteOutputId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  const filteredOutputs = useMemo(() => {
    return outputs.filter((item) => {
      if (typeFilter !== "all" && item.outputType !== typeFilter) return false;
      if (sourceFilter !== "all" && item.conversationSource !== sourceFilter) return false;
      return matchesSearch(item, searchQuery);
    });
  }, [outputs, typeFilter, sourceFilter, searchQuery]);

  const filtersActive = typeFilter !== "all" || sourceFilter !== "all" || searchQuery.trim().length > 0;
  const canMutate = canMutateDashboardOutputs(projectRole);

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
    if (!canMutate) return;
    const target = outputs.find((item) => item.id === outputId);
    if (!target) return;
    setRenameOutputId(outputId);
    setRenameValue(target.name);
    setRenameError(null);
  }

  function submitRename(event?: FormEvent) {
    event?.preventDefault();
    if (!canMutate || !renameOutputId) return;
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
    if (!canMutate || !deleteOutputId) return;
    setOutputs((prev) => prev.filter((item) => item.id !== deleteOutputId));
    if (viewOutputId === deleteOutputId) setViewOutputId(null);
    if (renameOutputId === deleteOutputId) setRenameOutputId(null);
    setDeleteOutputId(null);
  }

  useEffect(() => {
    if (!renameOutputId) return;
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [renameOutputId]);

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
      />

      {outputs.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-3">
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <CollectionFilterBar>
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
            <ResultsCount>{outputCountLabel(filteredOutputs.length)}</ResultsCount>
          </div>
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
      ) : (
        <div
          className="grid min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          style={{ gap: 16 }}
        >
          {filteredOutputs.map((item) => (
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
              <div className="absolute right-2 top-2 z-[1]">
                <LuxiaEntityOptionsMenu
                  entityLabel={item.name}
                  entityType="Output"
                  ariaLabel="Output options"
                  align="end"
                  items={[
                    {
                      id: "view",
                      label: "View",
                      onSelect: () => openView(item.id),
                    },
                    ...(canMutate
                      ? [
                          {
                            id: "rename",
                            label: "Rename",
                            onSelect: () => openRename(item.id),
                          },
                          {
                            id: "delete",
                            label: "Delete",
                            destructive: true as const,
                            separatorBefore: true,
                            onSelect: () => setDeleteOutputId(item.id),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <button
                type="button"
                className="min-w-0 flex-1 rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                onClick={() => openView(item.id)}
                aria-label={`View ${item.name}`}
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
          ))}
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
            <div className="mt-1">
              <DashboardOutputPreviewGraphic variant={viewOutput.outputType} size="full" />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {canMutate && viewOutput ? (
              <AlertDialogAction
                onClick={() => {
                  const id = viewOutput.id;
                  setViewOutputId(null);
                  openRename(id);
                }}
              >
                Rename
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(renameOutput)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameOutputId(null);
            setRenameValue("");
            setRenameError(null);
          }
        }}
      >
        <AlertDialogContent>
          <form onSubmit={submitRename}>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename output</AlertDialogTitle>
              <AlertDialogDescription>
                Change only this output name. Source conversations stay unchanged.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 space-y-2">
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
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button type="submit" variant="primary" size="compact">
                Save name
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

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
