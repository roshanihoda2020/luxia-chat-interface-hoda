import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Check, Search } from "lucide-react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildProjectDashboardBreadcrumbItems,
  buildProjectNamedDashboardBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { LUXIA_SETTINGS_TAB_TRIGGER_CLASS, LUXIA_SETTINGS_TABLIST_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { ProjectDashboardPage } from "./ProjectDashboardPage";
import { LuxiaEntityOptionsMenu, type LuxiaEntityOptionsItem } from "@/app/components/LuxiaEntityOptionsMenu";
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
import { HS } from "@/app/features/home/homeSurfaces";
import { getProjectNameById } from "@/app/features/project";
import type { HomeProjectCard } from "@/app/features/project/types";
import { CURRENT_USER_ID } from "@/app/features/permissions";
import type { ProjectRole } from "@/app/features/permissions";
import { LuxiaDashboardIcon } from "@/assets/icons";
import {
  canCreateDashboard,
  canEditDashboard,
  DASHBOARD_CREATE_DENIED_MESSAGE,
  DASHBOARD_EDIT_DENIED_MESSAGE,
} from "./dashboardAccess";
import { DashboardOutputPreviewGraphic, outputTypeLabel } from "./DashboardOutputPreviews";
import { getProjectDashboardOutputs } from "./data";
import { subscribeDashboardOutputStore } from "./dashboardOutputStore";
import {
  createProjectDashboard,
  deleteProjectDashboard,
  listProjectDashboards,
  moveOutputOnProjectDashboard,
  nextDashboardName,
  removeOutputFromProjectDashboard,
  renameProjectDashboard,
  setProjectDashboardOutputs,
  addOutputsToProjectDashboard,
  useProjectDashboards,
  validateDashboardName,
} from "./projectDashboardStore";
import { ProjectNotFoundState } from "./ProjectHeader";
import { ProjectModuleEmptyState } from "./ProjectModuleShared";
import type { ProjectDashboard, ProjectDashboardOutput } from "./types";

const PROJECT_NAME_FALLBACK = "Project name 01";

const CARD_BORDER = "1px solid color-mix(in srgb, var(--luxia-blue-20) 45%, var(--luxia-neutral-200))";
const PANEL_BORDER = "1px solid color-mix(in srgb, var(--luxia-blue-20) 40%, var(--luxia-neutral-200))";

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "Just now", "5m ago", "3h ago", "Yesterday", "4d ago", "2w ago", or a date. */
export function formatDashboardUpdated(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 35 * day) return `${Math.floor(diff / (7 * day))}w ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A Project's saved outputs, live (re-reads when outputs are created elsewhere). */
export function useProjectOutputs(projectId: string | null): ProjectDashboardOutput[] {
  const [outputs, setOutputs] = useState<ProjectDashboardOutput[]>(() =>
    projectId ? getProjectDashboardOutputs(projectId) : []);
  useEffect(() => {
    setOutputs(projectId ? getProjectDashboardOutputs(projectId) : []);
    if (!projectId) return;
    return subscribeDashboardOutputStore(() => setOutputs(getProjectDashboardOutputs(projectId)));
  }, [projectId]);
  return outputs;
}

/** A Dashboard's outputs in its own order; IDs that no longer resolve to an output are skipped. */
export function resolveDashboardOutputs(
  dashboard: Pick<ProjectDashboard, "outputIds">,
  outputs: readonly ProjectDashboardOutput[],
): ProjectDashboardOutput[] {
  const byId = new Map(outputs.map((output) => [output.id, output]));
  return dashboard.outputIds.flatMap((id) => {
    const output = byId.get(id);
    return output ? [output] : [];
  });
}

export function canManageProjectDashboard(
  projectRole: ProjectRole | null | undefined,
  dashboard: Pick<ProjectDashboard, "createdByUserId">,
  currentUserId: string,
): boolean {
  return canEditDashboard({ projectRole, dashboardOwnerId: dashboard.createdByUserId, currentUserId });
}

// Shared pieces

/** Up to two symbolic type pictures; they say "a chart", "a table" — never real values. */
function DashboardMosaic({ outputs }: { outputs: readonly ProjectDashboardOutput[] }) {
  const shown = outputs.slice(0, 2);
  if (shown.length === 0) {
    return (
      <div
        className="flex h-[96px] items-center justify-center rounded-[10px]"
        style={{ background: "var(--luxia-opacity-brand-primary-04)", color: "var(--luxia-purple-40)" }}
        aria-hidden
      >
        <LuxiaDashboardIcon size={28} color="currentColor" />
      </div>
    );
  }
  return (
    <div className={`grid h-[96px] min-w-0 gap-1.5 overflow-hidden ${shown.length === 2 ? "grid-cols-2" : "grid-cols-1"}`} aria-hidden>
      {shown.map((output) => (
        <div key={output.id} className="min-w-0 overflow-hidden">
          <DashboardOutputPreviewGraphic variant={output.outputType} />
        </div>
      ))}
    </div>
  );
}

export function OutputPreviewDialog({
  output,
  onClose,
  footerStart,
}: {
  output: ProjectDashboardOutput | null;
  onClose: () => void;
  footerStart?: ReactNode;
}) {
  return (
    <AlertDialog open={Boolean(output)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{output?.name ?? "Output"}</AlertDialogTitle>
          <AlertDialogDescription>
            {output
              ? `${outputTypeLabel(output.outputType)} from ${output.sourceContext}. Updated ${output.updatedAt}.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {output ? (
          <div className="mt-1 px-6 py-4">
            <DashboardOutputPreviewGraphic variant={output.outputType} size="full" />
          </div>
        ) : null}
        <AlertDialogFooter>
          {footerStart}
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DashboardNameDialog({
  open,
  mode,
  projectId,
  initialName,
  dashboardId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "rename";
  projectId: string;
  initialName: string;
  dashboardId?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `dashboard-name-${mode}`;

  useEffect(() => {
    if (!open) return;
    setValue(initialName);
    setError(null);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, initialName]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const problem = validateDashboardName(projectId, value, dashboardId);
    if (problem) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }
    onSubmit(value.trim());
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "New Dashboard" : "Rename Dashboard"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Give it a name, then choose which saved outputs it shows."
                : "Only the Dashboard's name changes. Its outputs stay the same."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 py-4">
            <Label htmlFor={inputId}>Dashboard name</Label>
            <Input
              ref={inputRef}
              id={inputId}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              autoComplete="off"
            />
            {error ? (
              <p id={`${inputId}-error`} className="luxia-type-caption" style={{ color: "var(--luxia-error)" }} role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="compact">
              {mode === "create" ? "Create Dashboard" : "Save name"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDashboardDialog({
  dashboard,
  outputCount,
  onClose,
  onConfirm,
}: {
  dashboard: ProjectDashboard | null;
  outputCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={Boolean(dashboard)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dashboard ? `Delete “${dashboard.name}”?` : "Delete Dashboard?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {outputCount > 0
              ? `The Dashboard is removed for everyone in this Project. Its ${plural(outputCount, "output")} ${outputCount === 1 ? "stays" : "stay"} in All outputs and on any other Dashboards.`
              : "The Dashboard is removed for everyone in this Project. No outputs are deleted."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="luxia-button luxia-button--destructive" onClick={onConfirm}>
            Delete Dashboard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Choose outputs: a searchable checklist of All outputs. Outputs already on
 * the Dashboard keep their place; newly ticked ones are added at the end.
 */
function ChooseOutputsDialog({
  open,
  dashboard,
  outputs,
  onClose,
  onSave,
}: {
  open: boolean;
  dashboard: ProjectDashboard;
  outputs: readonly ProjectDashboardOutput[];
  onClose: () => void;
  onSave: (outputIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(dashboard.outputIds);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(dashboard.outputIds.filter((id) => outputs.some((output) => output.id === id)));
    setQuery("");
  }, [open, dashboard.outputIds, outputs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return outputs;
    return outputs.filter((output) =>
      `${output.name} ${outputTypeLabel(output.outputType)} ${output.sourceContext}`.toLowerCase().includes(needle));
  }, [outputs, query]);

  function toggle(outputId: string) {
    setSelected((prev) => (prev.includes(outputId) ? prev.filter((id) => id !== outputId) : [...prev, outputId]));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[min(640px,90vh)] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose outputs</DialogTitle>
          <DialogDescription>
            {`Select the saved outputs “${dashboard.name}” shows. Outputs you leave out stay in All outputs.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-3">
          <label className="relative block">
            <span className="sr-only">Search outputs</span>
            <Search size={16} strokeWidth={1.75} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" style={{ color: "var(--luxia-text-muted)" }} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search outputs"
              aria-label="Search outputs"
              className="h-10 w-full pl-9"
              style={{ background: HS.searchBg, borderColor: HS.searchBorder }}
            />
          </label>
          {outputs.length === 0 ? (
            <p className="py-6 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
              This Project has no saved outputs yet. Save charts, tables or reports from its Chats and Galaxy first.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>No outputs match your search.</p>
          ) : (
            <ul className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1" aria-label="Saved outputs">
              {filtered.map((output) => {
                const checked = selected.includes(output.id);
                return (
                  <li key={output.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(output.id)}
                      className="flex w-full min-w-0 items-center gap-3 rounded-[10px] border px-2.5 py-2 text-left outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                      style={{
                        borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
                        background: checked ? "var(--luxia-opacity-brand-primary-04)" : "var(--luxia-surface)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border"
                        style={{
                          borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-neutral-300, #CBD5E1)",
                          background: checked ? "var(--luxia-purple-60)" : "var(--luxia-surface)",
                          color: "#fff",
                        }}
                      >
                        {checked ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                      <span className="w-[64px] shrink-0 overflow-hidden rounded-[6px] [&>div]:!h-[40px]" aria-hidden>
                        <DashboardOutputPreviewGraphic variant={output.outputType} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{output.name}</span>
                        <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {`${outputTypeLabel(output.outputType)} · ${output.sourceContext}`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter className="items-center">
          <span className="mr-auto luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }} aria-live="polite">
            {`${selected.length} selected`}
          </span>
          <Button type="button" variant="secondary" size="compact" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="primary" size="compact" onClick={() => onSave(selected)}>Save outputs</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Add one output to a Dashboard (used by All outputs): pick an existing
 * Dashboard the user can manage, or name a new one. One step.
 */
export function AddToDashboardDialog({
  output,
  projectId,
  projectRole,
  currentUserId,
  onClose,
  onOpenDashboard,
}: {
  output: ProjectDashboardOutput | null;
  projectId: string;
  projectRole: ProjectRole | null | undefined;
  currentUserId: string;
  onClose: () => void;
  onOpenDashboard?: (dashboardId: string) => void;
}) {
  useProjectDashboards();
  const dashboards = listProjectDashboards(projectId);
  const manageable = dashboards.filter((item) => canManageProjectDashboard(projectRole, item, currentUserId));
  const canCreate = canCreateDashboard(projectRole);
  const [choice, setChoice] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!output) return;
    const firstFree = manageable.find((item) => !item.outputIds.includes(output.id));
    setChoice(firstFree?.id ?? (canCreate ? "new" : manageable[0]?.id ?? ""));
    setNewName(nextDashboardName(projectId));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output?.id]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!output) return;
    if (choice === "new") {
      if (!canCreate) {
        toast.error(DASHBOARD_CREATE_DENIED_MESSAGE);
        return;
      }
      const problem = validateDashboardName(projectId, newName);
      if (problem) {
        setError(problem);
        return;
      }
      const created = createProjectDashboard({ projectId, name: newName, createdByUserId: currentUserId, outputIds: [output.id] });
      if (!created) return;
      onClose();
      toast.success(`Added to ${created.name}`, {
        action: onOpenDashboard ? { label: "Open", onClick: () => onOpenDashboard(created.id) } : undefined,
      });
      return;
    }
    const target = manageable.find((item) => item.id === choice);
    if (!target) {
      toast.error(DASHBOARD_EDIT_DENIED_MESSAGE);
      return;
    }
    if (target.outputIds.includes(output.id)) {
      onClose();
      return;
    }
    addOutputsToProjectDashboard(target.id, [output.id]);
    onClose();
    toast.success(`Added to ${target.name}`, {
      action: onOpenDashboard ? { label: "Open", onClick: () => onOpenDashboard(target.id) } : undefined,
    });
  }

  const options = [
    ...manageable.map((item) => ({
      id: item.id,
      label: item.name,
      detail: output && item.outputIds.includes(output.id) ? "Already on this Dashboard" : plural(item.outputIds.length, "output"),
      disabled: Boolean(output && item.outputIds.includes(output.id)),
    })),
  ];

  return (
    <Dialog open={Boolean(output)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add to Dashboard</DialogTitle>
            <DialogDescription>
              {output ? `Show “${output.name}” on a Dashboard. It also stays in All outputs.` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 py-4" role="radiogroup" aria-label="Dashboard">
            {options.length === 0 && !canCreate ? (
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                There are no Dashboards in this Project you can change.
              </p>
            ) : null}
            {options.map((option) => {
              const checked = choice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  disabled={option.disabled}
                  onClick={() => setChoice(option.id)}
                  className="flex w-full min-w-0 items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:cursor-default disabled:opacity-60"
                  style={{
                    borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
                    background: checked ? "var(--luxia-opacity-brand-primary-04)" : "var(--luxia-surface)",
                  }}
                >
                  <RadioDot checked={checked} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{option.label}</span>
                    <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>{option.detail}</span>
                  </span>
                </button>
              );
            })}
            {canCreate ? (
              <div
                className="rounded-[10px] border px-3 py-2.5"
                style={{
                  borderColor: choice === "new" ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
                  background: choice === "new" ? "var(--luxia-opacity-brand-primary-04)" : "var(--luxia-surface)",
                }}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={choice === "new"}
                  onClick={() => setChoice("new")}
                  className="flex w-full items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                >
                  <RadioDot checked={choice === "new"} />
                  <span className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>New Dashboard</span>
                </button>
                {choice === "new" ? (
                  <div className="mt-2 pl-7">
                    <Label htmlFor="add-to-dashboard-new" className="sr-only">New Dashboard name</Label>
                    <Input
                      id="add-to-dashboard-new"
                      value={newName}
                      onChange={(event) => {
                        setNewName(event.target.value);
                        if (error) setError(null);
                      }}
                      aria-invalid={Boolean(error)}
                      autoComplete="off"
                    />
                    {error ? <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-error)" }} role="alert">{error}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="compact" disabled={!choice}>Add to Dashboard</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className="flex size-4 shrink-0 items-center justify-center rounded-full border"
      style={{ borderColor: checked ? "var(--luxia-purple-60)" : "var(--luxia-neutral-300, #CBD5E1)" }}
    >
      {checked ? <span className="size-2 rounded-full" style={{ background: "var(--luxia-purple-60)" }} /> : null}
    </span>
  );
}

function stop(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

// Page

export type ProjectDashboardTab = "dashboards" | "outputs";

export interface ProjectDashboardsPageProps {
  projectId: string | null;
  /** The open named Dashboard, or null for the Dashboard page itself. */
  dashboardId: string | null;
  /** Which tab of the Dashboard page is showing. */
  tab: ProjectDashboardTab;
  projects: HomeProjectCard[];
  projectRole?: ProjectRole | null;
  currentUserId?: string;
  onNavigateHome: () => void;
  onViewProjects: () => void;
  onOpenProjectOverview: (projectId: string) => void;
  /** Opens one named Dashboard, or the Dashboards tab when `dashboardId` is null. */
  onOpenDashboard: (projectId: string, dashboardId: string | null) => void;
  /** Opens the All outputs tab. */
  onOpenAllOutputs: (projectId: string) => void;
  /** All outputs tab: an output whose preview should open, and view-reset plumbing. */
  focusOutputId?: string | null;
  viewResetKey?: number;
  onViewOutputIdChange?: (outputId: string | null) => void;
  onOpenGalaxy?: (projectId: string) => void;
}

/** A tab panel's first row: what it holds on the left, its one action on the right. */
export function DashboardTabToolbar({ summary, action }: { summary: string; action?: ReactNode }) {
  if (!summary && !action) return null;
  return (
    <div className="mb-4 flex min-h-9 min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="min-w-0 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>{summary}</p>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * The Project's Dashboard page (one sidebar item, "Dashboard"), with two tabs:
 * - Dashboards: the Project's named Dashboards (each a selection of outputs);
 * - All outputs: every saved output in the Project, on a Dashboard or not.
 * A named Dashboard opens as a child page of it (Home › Project › Dashboard › name).
 */
export function ProjectDashboardsPage(props: ProjectDashboardsPageProps) {
  const { projectId, projects, dashboardId, onNavigateHome, onViewProjects } = props;
  const project = projectId ? projects.find((entry) => entry.id === projectId) : undefined;
  if (!projectId || !project) {
    return <ProjectNotFoundState onBackHome={onNavigateHome} onViewProjects={onViewProjects} />;
  }
  return dashboardId
    ? <DashboardDetail {...props} projectId={projectId} dashboardId={dashboardId} project={project} />
    : <DashboardPageTabs {...props} projectId={projectId} project={project} />;
}

const DASHBOARD_TABS: Array<{ id: ProjectDashboardTab; label: string }> = [
  { id: "dashboards", label: "Dashboards" },
  { id: "outputs", label: "All outputs" },
];

function DashboardPageTabs(props: ProjectDashboardsPageProps & { projectId: string; project: HomeProjectCard }) {
  const { projectId, project, projects, tab, onNavigateHome, onOpenProjectOverview, onOpenDashboard, onOpenAllOutputs } = props;
  useProjectDashboards();
  const dashboardCount = listProjectDashboards(projectId).length;
  const outputs = useProjectOutputs(projectId);
  const projectName = getProjectNameById(projectId, projects, PROJECT_NAME_FALLBACK);

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
            items={buildProjectDashboardBreadcrumbItems({ projectId, projectName })}
            handlers={{ onHome: onNavigateHome, onProject: onOpenProjectOverview }}
          />
        }
        context={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            <span>{plural(dashboardCount, "Dashboard")}</span>
            <span aria-hidden="true">·</span>
            <span>{plural(outputs.length, "saved output")}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{projectName}</span>
          </div>
        }
        guide="Dashboards show the saved outputs you choose for them. All outputs lists every saved output in this Project."
      />

      <Tabs
        value={tab}
        onValueChange={(next) => (next === "outputs" ? onOpenAllOutputs(projectId) : onOpenDashboard(projectId, null))}
        className="gap-4"
      >
        <TabsList
          aria-label="Dashboard sections"
          className={`${LUXIA_SETTINGS_TABLIST_CLASS} !min-w-0 max-w-[22rem]`}
          style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          {DASHBOARD_TABS.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id} className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS} data-dashboard-tab={entry.id}>
              <span className="block w-full truncate text-center">{entry.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="dashboards" className="m-0 outline-none">
          {tab === "dashboards" ? <DashboardsList {...props} projectId={projectId} project={project} /> : null}
        </TabsContent>
        <TabsContent value="outputs" className="m-0 outline-none">
          {tab === "outputs" ? (
            <ProjectDashboardPage
              projectId={projectId}
              projects={projects}
              projectRole={props.projectRole}
              currentUserId={props.currentUserId}
              focusOutputId={props.focusOutputId}
              viewResetKey={props.viewResetKey}
              onViewOutputIdChange={props.onViewOutputIdChange}
              onNavigateHome={onNavigateHome}
              onViewProjects={props.onViewProjects}
              onOpenProjectOverview={onOpenProjectOverview}
              onOpenGalaxy={props.onOpenGalaxy}
              onOpenDashboard={onOpenDashboard}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardsList({
  projectId,
  project,
  projectRole = null,
  currentUserId = CURRENT_USER_ID,
  onOpenDashboard,
  onOpenAllOutputs,
}: ProjectDashboardsPageProps & { projectId: string; project: HomeProjectCard }) {
  useProjectDashboards();
  const dashboards = listProjectDashboards(projectId);
  const outputs = useProjectOutputs(projectId);
  const canCreate = canCreateDashboard(projectRole);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProjectDashboard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDashboard | null>(null);

  function create(name: string) {
    if (!canCreateDashboard(projectRole)) {
      toast.error(DASHBOARD_CREATE_DENIED_MESSAGE);
      return;
    }
    const created = createProjectDashboard({ projectId, name, createdByUserId: currentUserId });
    setCreateOpen(false);
    if (!created) return;
    toast.success(`${created.name} created`, { description: "Choose the saved outputs it shows." });
    onOpenDashboard(projectId, created.id);
  }

  return (
    <div className="min-w-0 w-full" data-dashboard-tab-panel="dashboards">
      <DashboardTabToolbar
        summary={dashboards.length === 0 ? "" : `${plural(dashboards.length, "Dashboard")} · recently updated first`}
        action={canCreate ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={() => setCreateOpen(true)}>
            New Dashboard
          </Button>
        ) : undefined}
      />

      {dashboards.length === 0 ? (
        <div className="rounded-[12px] px-6 py-12" style={{ background: "var(--luxia-surface)", border: PANEL_BORDER }}>
          <ProjectModuleEmptyState
            title="No dashboards yet"
            description={canCreate
              ? "Create a Dashboard and choose which of this Project's saved outputs it shows."
              : "Dashboards created in this Project appear here."}
            action={
              <div className="flex flex-wrap gap-2">
                {canCreate ? (
                  <Button type="button" variant="primary" size="compact" onClick={() => setCreateOpen(true)}>New Dashboard</Button>
                ) : null}
                <Button type="button" variant="secondary" size="compact" onClick={() => onOpenAllOutputs(project.id)}>View all outputs</Button>
              </div>
            }
          />
        </div>
      ) : (
        <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label={`Dashboards in ${project.name}`}>
          {dashboards.map((dashboard) => {
            const shown = resolveDashboardOutputs(dashboard, outputs);
            const manage = canManageProjectDashboard(projectRole, dashboard, currentUserId);
            const menu: LuxiaEntityOptionsItem[] = [
              { id: "open", label: "Open", onSelect: () => onOpenDashboard(projectId, dashboard.id) },
              ...(manage
                ? [
                    { id: "rename", label: "Rename", onSelect: () => setRenameTarget(dashboard) },
                    { id: "delete", label: "Delete", destructive: true, separatorBefore: true, onSelect: () => setDeleteTarget(dashboard) },
                  ]
                : []),
            ];
            return (
              <li key={dashboard.id} className="relative min-w-0" data-dashboard-card={dashboard.id}>
                <article
                  className="flex h-full min-w-0 flex-col rounded-[12px] p-3"
                  style={{ background: "var(--luxia-surface)", border: CARD_BORDER }}
                >
                  <button
                    type="button"
                    onClick={() => onOpenDashboard(projectId, dashboard.id)}
                    aria-label={`Open Dashboard ${dashboard.name}, ${plural(shown.length, "output")}`}
                    className="group min-w-0 flex-1 rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  >
                    <DashboardMosaic outputs={shown} />
                    <span className="mt-3 block min-w-0 px-0.5 pr-8">
                      <span className="block truncate luxia-type-body-dense-strong group-hover:underline" style={{ color: "var(--luxia-purple-70)" }}>
                        {dashboard.name}
                      </span>
                      <span className="mt-1 block truncate luxia-type-caption" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
                        {shown.length > 0 ? plural(shown.length, "output") : "No outputs yet"}
                      </span>
                      <span className="mt-0.5 block truncate luxia-type-caption" style={{ color: "var(--luxia-neutral-500, #64748B)" }}>
                        {`Updated ${formatDashboardUpdated(dashboard.updatedAtTimestamp)}`}
                      </span>
                    </span>
                  </button>
                </article>
                <div className="absolute right-2 bottom-2 z-[1]" onClick={stop} onPointerDown={stop}>
                  <LuxiaEntityOptionsMenu
                    entityLabel={dashboard.name}
                    entityType="Dashboard"
                    ariaLabel={`Dashboard options for ${dashboard.name}`}
                    align="end"
                    items={menu}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DashboardNameDialog
        open={createOpen}
        mode="create"
        projectId={projectId}
        initialName={createOpen ? nextDashboardName(projectId) : ""}
        onClose={() => setCreateOpen(false)}
        onSubmit={create}
      />
      <DashboardNameDialog
        open={Boolean(renameTarget)}
        mode="rename"
        projectId={projectId}
        dashboardId={renameTarget?.id}
        initialName={renameTarget?.name ?? ""}
        onClose={() => setRenameTarget(null)}
        onSubmit={(name) => {
          if (renameTarget && renameProjectDashboard(renameTarget.id, name)) toast.success("Dashboard renamed");
          setRenameTarget(null);
        }}
      />
      <DeleteDashboardDialog
        dashboard={deleteTarget}
        outputCount={deleteTarget ? resolveDashboardOutputs(deleteTarget, outputs).length : 0}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget && deleteProjectDashboard(deleteTarget.id)) {
            toast.success(`${deleteTarget.name} deleted`, { description: "Its outputs are still in All outputs." });
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function DashboardDetail({
  projectId,
  dashboardId,
  projects,
  projectRole = null,
  currentUserId = CURRENT_USER_ID,
  onNavigateHome,
  onOpenProjectOverview,
  onOpenDashboard,
  onOpenAllOutputs,
}: ProjectDashboardsPageProps & { projectId: string; dashboardId: string; project: HomeProjectCard }) {
  useProjectDashboards();
  const dashboard = listProjectDashboards(projectId).find((item) => item.id === dashboardId) ?? null;
  const outputs = useProjectOutputs(projectId);
  const projectName = getProjectNameById(projectId, projects, PROJECT_NAME_FALLBACK);
  const [chooseOpen, setChooseOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOutputId, setViewOutputId] = useState<string | null>(null);

  if (!dashboard) {
    return (
      <div className="min-w-0 w-full">
        <LuxiaPageHeader
          contentGap="page"
          className="mb-4"
          pageTypeLabel="DASHBOARD"
          title="Dashboard not available"
          titleStyle={{ color: "var(--luxia-purple-70)" }}
          breadcrumb={
            <LuxiaBreadcrumb
              tone="page"
              items={buildProjectDashboardBreadcrumbItems({ projectId, projectName })}
              handlers={{ onHome: onNavigateHome, onProject: onOpenProjectOverview }}
            />
          }
        />
        <div className="rounded-[12px] px-6 py-12" style={{ background: "var(--luxia-surface)", border: PANEL_BORDER }}>
          <ProjectModuleEmptyState
            title="This Dashboard isn't available"
            description="It may have been deleted. The Project's saved outputs are still in All outputs."
            action={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="primary" size="compact" onClick={() => onOpenDashboard(projectId, null)}>Back to Dashboard</Button>
                <Button type="button" variant="secondary" size="compact" onClick={() => onOpenAllOutputs(projectId)}>View all outputs</Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const shown = resolveDashboardOutputs(dashboard, outputs);
  const manage = canManageProjectDashboard(projectRole, dashboard, currentUserId);
  const viewOutput = viewOutputId ? outputs.find((output) => output.id === viewOutputId) ?? null : null;

  function guard(): boolean {
    if (manage) return true;
    toast.error(DASHBOARD_EDIT_DENIED_MESSAGE);
    return false;
  }

  function removeOutput(output: ProjectDashboardOutput) {
    if (!guard() || !dashboard) return;
    const before = [...dashboard.outputIds];
    removeOutputFromProjectDashboard(dashboard.id, output.id);
    toast.success(`Removed from ${dashboard.name}`, {
      description: `${output.name} is still in All outputs.`,
      action: { label: "Undo", onClick: () => setProjectDashboardOutputs(dashboard.id, before) },
    });
  }

  const dashboardMenu: LuxiaEntityOptionsItem[] = manage
    ? [
        { id: "choose", label: "Choose outputs", onSelect: () => setChooseOpen(true) },
        { id: "rename", label: "Rename", onSelect: () => setRenameOpen(true) },
        { id: "delete", label: "Delete Dashboard", destructive: true, separatorBefore: true, onSelect: () => setDeleteOpen(true) },
      ]
    : [];

  return (
    <div className="min-w-0 w-full" data-dashboard-detail={dashboard.id}>
      <LuxiaPageHeader
        contentGap="page"
        className="mb-4"
        pageTypeLabel="DASHBOARD"
        title={dashboard.name}
        titleStyle={{ color: "var(--luxia-purple-70)" }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={buildProjectNamedDashboardBreadcrumbItems({ projectId, projectName, dashboard: { id: dashboard.id, name: dashboard.name } })}
            handlers={{
              onHome: onNavigateHome,
              onProject: onOpenProjectOverview,
              onDashboard: (id) => onOpenDashboard(id, null),
            }}
          />
        }
        context={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
            <span>{plural(shown.length, "output")}</span>
            <span aria-hidden="true">·</span>
            <span>{`Updated ${formatDashboardUpdated(dashboard.updatedAtTimestamp)}`}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{projectName}</span>
          </div>
        }
        primaryAction={manage ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={() => setChooseOpen(true)}>
            Choose outputs
          </Button>
        ) : undefined}
        secondaryAction={
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={() => onOpenAllOutputs(projectId)}>
            All outputs
          </Button>
        }
        options={dashboardMenu.length > 0 ? (
          <LuxiaEntityOptionsMenu
            entityLabel={dashboard.name}
            entityType="Dashboard"
            ariaLabel={`Dashboard options for ${dashboard.name}`}
            align="end"
            items={dashboardMenu}
          />
        ) : undefined}
      />

      {shown.length === 0 ? (
        <div className="rounded-[12px] px-6 py-12" style={{ background: "var(--luxia-surface)", border: PANEL_BORDER }}>
          <ProjectModuleEmptyState
            title="No outputs on this Dashboard"
            description={manage
              ? "Choose which of this Project's saved outputs this Dashboard shows."
              : "Outputs chosen for this Dashboard appear here."}
            action={manage ? (
              <Button type="button" variant="primary" size="compact" onClick={() => setChooseOpen(true)}>Choose outputs</Button>
            ) : undefined}
          />
        </div>
      ) : (
        <ol className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label={`Outputs on ${dashboard.name}`}>
          {shown.map((output, index) => {
            const menu: LuxiaEntityOptionsItem[] = [
              { id: "view", label: "View", onSelect: () => setViewOutputId(output.id) },
              ...(manage
                ? [
                    {
                      id: "earlier",
                      label: "Move earlier",
                      icon: <ArrowUp size={14} aria-hidden />,
                      disabled: index === 0,
                      onSelect: () => moveOutputOnProjectDashboard(dashboard.id, output.id, -1),
                    },
                    {
                      id: "later",
                      label: "Move later",
                      icon: <ArrowDown size={14} aria-hidden />,
                      disabled: index === shown.length - 1,
                      onSelect: () => moveOutputOnProjectDashboard(dashboard.id, output.id, 1),
                    },
                    {
                      id: "remove",
                      label: "Remove from Dashboard",
                      separatorBefore: true,
                      onSelect: () => removeOutput(output),
                    },
                  ]
                : []),
            ];
            return (
              <li key={output.id} className="relative min-w-0" data-dashboard-output={output.id}>
                <article className="flex h-full min-w-0 flex-col rounded-[12px] p-3" style={{ background: "var(--luxia-surface)", border: CARD_BORDER }}>
                  <button
                    type="button"
                    className="min-w-0 flex-1 rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                    onClick={() => setViewOutputId(output.id)}
                    aria-label={`View output ${output.name}`}
                  >
                    <DashboardOutputPreviewGraphic variant={output.outputType} size="full" />
                    <span className="mt-3 flex min-w-0 flex-col gap-1 px-0.5 pr-8">
                      <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>{output.name}</span>
                      <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
                        {`${outputTypeLabel(output.outputType)} · ${output.sourceContext}`}
                      </span>
                      <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-neutral-500, #64748B)" }}>
                        {`Updated ${output.updatedAt}`}
                      </span>
                    </span>
                  </button>
                </article>
                <div className="absolute right-2 top-2 z-[1]" onClick={stop} onPointerDown={stop}>
                  <LuxiaEntityOptionsMenu
                    entityLabel={output.name}
                    entityType="Output"
                    ariaLabel={`Output options for ${output.name}`}
                    align="end"
                    items={menu}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <OutputPreviewDialog output={viewOutput} onClose={() => setViewOutputId(null)} />
      <ChooseOutputsDialog
        open={chooseOpen}
        dashboard={dashboard}
        outputs={outputs}
        onClose={() => setChooseOpen(false)}
        onSave={(outputIds) => {
          if (!guard()) return;
          const keep = dashboard.outputIds.filter((id) => outputIds.includes(id));
          const added = outputIds.filter((id) => !keep.includes(id));
          setProjectDashboardOutputs(dashboard.id, [...keep, ...added]);
          setChooseOpen(false);
          toast.success(`${dashboard.name} updated`, { description: `${plural(outputIds.length, "output")} selected.` });
        }}
      />
      <DashboardNameDialog
        open={renameOpen}
        mode="rename"
        projectId={projectId}
        dashboardId={dashboard.id}
        initialName={dashboard.name}
        onClose={() => setRenameOpen(false)}
        onSubmit={(name) => {
          if (renameProjectDashboard(dashboard.id, name)) toast.success("Dashboard renamed");
          setRenameOpen(false);
        }}
      />
      <DeleteDashboardDialog
        dashboard={deleteOpen ? dashboard : null}
        outputCount={shown.length}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          const name = dashboard.name;
          setDeleteOpen(false);
          if (deleteProjectDashboard(dashboard.id)) {
            toast.success(`${name} deleted`, { description: "Its outputs are still in All outputs." });
            onOpenDashboard(projectId, null);
          }
        }}
      />
    </div>
  );
}
