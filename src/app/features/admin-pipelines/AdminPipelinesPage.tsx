import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, RotateCcw, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { FilterToolbar, FilterToolbarRow } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { toast } from "sonner";
import { ADMIN_PIPELINES_CONTENT_CLASS } from "./adminTable";
import { AirflowDagsTab } from "./AirflowDagsTab";
import { AirflowVariablesTab } from "./AirflowVariablesTab";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { DagMappingDialog } from "./DagMappingDialog";
import { DagsTab } from "./DagsTab";
import { ManageVariablesDialog } from "./ManageVariablesDialog";
import { FilterOrganizationSelect, FilterProjectSelect } from "./OrgProjectFields";
import { useAdminPipelinesStore } from "./store";
import type {
  AdminDagMapping,
  AdminPipelinesTabId,
  AdminVariableDeclaration,
} from "./types";
import { parseAdminPipelinesTab } from "./types";
import { VariableDialog } from "./VariableDialog";
import { VariablesTab } from "./VariablesTab";

const PAGE_GUIDANCE =
  "Map Airflow DAGs and declare variables for tenant projects.";

const ADMIN_PIPELINES_TABS = [
  { id: "dags" as const, label: "DAGs" },
  { id: "variables" as const, label: "Variables" },
  { id: "airflow-dags" as const, label: "Airflow DAGs" },
  { id: "airflow-variables" as const, label: "Airflow Variables" },
];

const ADMIN_PIPELINES_TAB_COUNT = ADMIN_PIPELINES_TABS.length;

function readTabFromLocation(): AdminPipelinesTabId {
  if (typeof window === "undefined") return "dags";
  return parseAdminPipelinesTab(new URLSearchParams(window.location.search).get("tab"));
}

function writeTabToLocation(tab: AdminPipelinesTabId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (tab === "dags") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  window.history.replaceState(
    { ...(window.history.state ?? {}), luxiaView: "admin-pipelines", tab },
    "",
    `${url.pathname}${url.search}`,
  );
}

export interface AdminPipelinesPageProps {
  onNavigateHome: () => void;
  initialTab?: AdminPipelinesTabId;
}

export function AdminPipelinesPage({
  onNavigateHome,
  initialTab,
}: AdminPipelinesPageProps) {
  const store = useAdminPipelinesStore();
  const [tab, setTab] = useState<AdminPipelinesTabId>(
    () => initialTab ?? readTabFromLocation(),
  );

  const [filterOrg, setFilterOrg] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [tableQuery, setTableQuery] = useState("");
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
  const [showUndeclaredOnly, setShowUndeclaredOnly] = useState(false);

  const [dagDialog, setDagDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    mapping?: AdminDagMapping | null;
    prefillDagId?: string | null;
  }>({ open: false, mode: "create" });

  const [variableDialog, setVariableDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    variable?: AdminVariableDeclaration | null;
    prefillKey?: string | null;
    seedOrgId?: string | null;
    seedProjectId?: string | null;
  }>({ open: false, mode: "create" });

  const [manageMapping, setManageMapping] = useState<AdminDagMapping | null>(null);
  const [deleteMapping, setDeleteMapping] = useState<AdminDagMapping | null>(null);
  const [deleteVariable, setDeleteVariable] = useState<AdminVariableDeclaration | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    writeTabToLocation(tab);
  }, [tab]);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "admin-pipelines",
      label: "Pipelines administration",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  const handleFilterOrgChange = (next: string) => {
    setFilterOrg(next);
    setFilterProject("all");
  };

  const handleTabChange = (next: string) => {
    setTab(next as AdminPipelinesTabId);
    setTableQuery("");
  };

  const filteredMappings = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    return store.mappings.filter((row) => {
      if (filterOrg !== "all" && row.organizationId !== filterOrg) return false;
      if (filterProject !== "all" && row.projectId !== filterProject) return false;
      if (!q) return true;
      return (
        row.dagId.toLowerCase().includes(q)
        || row.displayName.toLowerCase().includes(q)
        || store.getOrganizationName(row.organizationId).toLowerCase().includes(q)
        || store.getProjectName(row.projectId).toLowerCase().includes(q)
      );
    });
  }, [store, filterOrg, filterProject, tableQuery]);

  const filteredVariables = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    return store.variables.filter((row) => {
      if (filterOrg !== "all" && row.organizationId !== filterOrg) return false;
      if (filterProject !== "all" && row.projectId !== filterProject) return false;
      if (!q) return true;
      return (
        row.key.toLowerCase().includes(q)
        || row.label.toLowerCase().includes(q)
        || store.getOrganizationName(row.organizationId).toLowerCase().includes(q)
        || store.getProjectName(row.projectId).toLowerCase().includes(q)
      );
    });
  }, [store, filterOrg, filterProject, tableQuery]);

  const manageProjectVariables = useMemo(() => {
    if (!manageMapping) return [];
    return store.variables.filter(
      (v) =>
        v.organizationId === manageMapping.organizationId
        && v.projectId === manageMapping.projectId,
    );
  }, [manageMapping, store.variables]);

  const manageMappingLive = useMemo(() => {
    if (!manageMapping) return null;
    return store.mappings.find((m) => m.id === manageMapping.id) ?? manageMapping;
  }, [manageMapping, store.mappings]);

  const loadProjectsForOrganization = store.loadProjectsForOrganization;
  const onOrgChangeForForms = useCallback(
    (organizationId: string) => {
      loadProjectsForOrganization(organizationId || null);
    },
    [loadProjectsForOrganization],
  );

  const openNewMapping = (prefillDagId?: string | null) =>
    setDagDialog({
      open: true,
      mode: "create",
      mapping: null,
      prefillDagId: prefillDagId ?? null,
    });

  const openNewVariable = (prefillKey?: string | null) =>
    setVariableDialog({
      open: true,
      mode: "create",
      variable: null,
      prefillKey: prefillKey ?? null,
    });

  const primaryAction =
    tab === "dags" || tab === "airflow-dags" ? (
      <Button
        type="button"
        {...LUXIA_PAGE_HEADER_ACTION.primary}
        aria-label="New DAG mapping"
        onClick={() => openNewMapping()}
      >
        <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
        New DAG mapping
      </Button>
    ) : tab === "variables" || tab === "airflow-variables" ? (
      <Button
        type="button"
        {...LUXIA_PAGE_HEADER_ACTION.primary}
        aria-label="New variable"
        onClick={() => openNewVariable()}
      >
        <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
        New variable
      </Button>
    ) : null;

  return (
    <LuxiaPageFrame variant="standard">
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ADMINISTRATION"
        title="Pipelines administration"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PAGE_GUIDANCE}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--luxia-text-muted)]"
                aria-label="Prototype state controls"
                title="Prototype"
              >
                <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Prototype controls</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => store.setAirflowState("ready")}>
                Airflow: ready
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => store.simulateAirflowLoad()}>
                Airflow: loading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => store.setAirflowState("unavailable")}>
                Airflow: unavailable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => store.setAirflowState("empty")}>
                Airflow: empty inventory
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => store.resetPrototype()}>
                <RotateCcw size={14} aria-hidden className="mr-2" />
                Reset prototype data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        primaryAction={primaryAction}
      />

      <LuxiaPageBody>
        <div className={`${ADMIN_PIPELINES_CONTENT_CLASS} space-y-4`}>
          <Tabs value={tab} onValueChange={handleTabChange} className="gap-4">
            <div className="w-full min-w-0 overflow-x-auto">
              <TabsList
                aria-label="Pipeline Administration sections"
                className={LUXIA_SETTINGS_TABLIST_CLASS}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${ADMIN_PIPELINES_TAB_COUNT}, minmax(0, 1fr))`,
                  width: "100%",
                  minWidth: `${ADMIN_PIPELINES_TAB_COUNT * 8.8}rem`,
                  boxSizing: "border-box",
                }}
              >
                {ADMIN_PIPELINES_TABS.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    title={section.label}
                    className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS}
                  >
                    <span className="block w-full truncate text-center">{section.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="dags" className="space-y-3">
              <FilterToolbar>
                <label className="block min-w-0 w-full max-w-md">
                  <span className="sr-only">Search DAG mappings</span>
                  <div className="relative">
                    <Search
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--luxia-text-muted)]"
                    />
                    <Input
                      value={tableQuery}
                      onChange={(e) => setTableQuery(e.target.value)}
                      placeholder="Search DAG ID, name, org, or project"
                      className="h-10 pl-9"
                    />
                  </div>
                </label>
                <FilterToolbarRow>
                  <FilterOrganizationSelect
                    value={filterOrg}
                    onChange={handleFilterOrgChange}
                    organizations={store.organizations}
                  />
                  <FilterProjectSelect
                    value={filterProject}
                    onChange={setFilterProject}
                    projects={store.projects}
                    organizationId={filterOrg}
                  />
                </FilterToolbarRow>
              </FilterToolbar>
              <DagsTab
                rows={filteredMappings}
                totalCount={store.mappings.length}
                filteredEmpty={filteredMappings.length === 0 && store.mappings.length > 0}
                getOrganizationName={store.getOrganizationName}
                getProjectName={store.getProjectName}
                onNew={() => openNewMapping()}
                onEdit={(mapping) =>
                  setDagDialog({ open: true, mode: "edit", mapping, prefillDagId: null })
                }
                onDelete={setDeleteMapping}
                onManageVariables={setManageMapping}
              />
            </TabsContent>

            <TabsContent value="variables" className="space-y-3">
              <FilterToolbar>
                <label className="block min-w-0 w-full max-w-md">
                  <span className="sr-only">Search variables</span>
                  <div className="relative">
                    <Search
                      size={16}
                      strokeWidth={1.75}
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--luxia-text-muted)]"
                    />
                    <Input
                      value={tableQuery}
                      onChange={(e) => setTableQuery(e.target.value)}
                      placeholder="Search key, label, org, or project"
                      className="h-10 pl-9"
                    />
                  </div>
                </label>
                <FilterToolbarRow>
                  <FilterOrganizationSelect
                    value={filterOrg}
                    onChange={handleFilterOrgChange}
                    organizations={store.organizations}
                  />
                  <FilterProjectSelect
                    value={filterProject}
                    onChange={setFilterProject}
                    projects={store.projects}
                    organizationId={filterOrg}
                  />
                </FilterToolbarRow>
              </FilterToolbar>
              <VariablesTab
                rows={filteredVariables}
                totalCount={store.variables.length}
                filteredEmpty={
                  filteredVariables.length === 0 && store.variables.length > 0
                }
                getOrganizationName={store.getOrganizationName}
                getProjectName={store.getProjectName}
                dagsForVariable={store.dagsForVariable}
                onNew={() => openNewVariable()}
                onEdit={(variable) =>
                  setVariableDialog({
                    open: true,
                    mode: "edit",
                    variable,
                    prefillKey: null,
                  })
                }
                onDelete={setDeleteVariable}
              />
            </TabsContent>

            <TabsContent value="airflow-dags" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 luxia-type-body-small text-[var(--luxia-text-secondary)]">
                  <Checkbox
                    checked={showUnmappedOnly}
                    onCheckedChange={(next) => setShowUnmappedOnly(next === true)}
                  />
                  Show only unmapped
                </label>
              </div>
              <AirflowDagsTab
                dags={store.airflowDags}
                mappings={store.mappings}
                airflowState={store.airflowState}
                showUnmappedOnly={showUnmappedOnly}
                onMapToProject={(dagId) => {
                  setTab("dags");
                  openNewMapping(dagId);
                }}
                onRetry={() => store.simulateAirflowLoad()}
              />
            </TabsContent>

            <TabsContent value="airflow-variables" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 luxia-type-body-small text-[var(--luxia-text-secondary)]">
                  <Checkbox
                    checked={showUndeclaredOnly}
                    onCheckedChange={(next) => setShowUndeclaredOnly(next === true)}
                  />
                  Show only undeclared
                </label>
              </div>
              <AirflowVariablesTab
                airflowVariables={store.airflowVariables}
                declarations={store.variables}
                airflowState={store.airflowState}
                showUndeclaredOnly={showUndeclaredOnly}
                onDeclare={(key) => {
                  setTab("variables");
                  openNewVariable(key);
                }}
                onRetry={() => store.simulateAirflowLoad()}
              />
            </TabsContent>
          </Tabs>
        </div>
      </LuxiaPageBody>

      <DagMappingDialog
        open={dagDialog.open}
        mode={dagDialog.mode}
        mapping={dagDialog.mapping}
        prefillDagId={dagDialog.prefillDagId}
        organizations={store.organizations}
        projects={store.projects}
        airflowDags={store.airflowDags}
        projectsLoad={store.projectsLoad}
        onOrganizationChange={onOrgChangeForForms}
        onOpenChange={(open) => {
          if (!open) setDagDialog((prev) => ({ ...prev, open: false }));
        }}
        onSubmit={async (input) => {
          if (dagDialog.mode === "edit" && dagDialog.mapping) {
            const result = await store.updateMapping(dagDialog.mapping.id, input);
            if (!result.ok) return result;
            if (result.detachedVariables) {
              toast.message("Variables detached", {
                description:
                  "Attached variables were removed because the project changed. Re-attach from Manage variables if needed.",
              });
            } else {
              toast.success("DAG mapping updated");
            }
            return { ok: true };
          }
          const result = await store.createMapping(input);
          if (!result.ok) return result;
          toast.success("DAG mapping created");
          return { ok: true };
        }}
      />

      <VariableDialog
        open={variableDialog.open}
        mode={variableDialog.mode}
        variable={variableDialog.variable}
        prefillKey={variableDialog.prefillKey}
        seedOrganizationId={variableDialog.seedOrgId}
        seedProjectId={variableDialog.seedProjectId}
        organizations={store.organizations}
        projects={store.projects}
        projectsLoad={store.projectsLoad}
        airflowVariables={store.airflowVariables}
        onOrganizationChange={onOrgChangeForForms}
        onOpenChange={(open) => {
          if (!open) setVariableDialog((prev) => ({ ...prev, open: false }));
        }}
        onSubmit={async (input) => {
          if (variableDialog.mode === "edit" && variableDialog.variable) {
            const result = await store.updateVariable(variableDialog.variable.id, input);
            if (!result.ok) return result;
            toast.success("Variable updated");
            return { ok: true };
          }
          const result = await store.createVariable(input);
          if (!result.ok) return result;
          toast.success("Variable declared");
          return { ok: true };
        }}
      />

      <ManageVariablesDialog
        open={Boolean(manageMappingLive)}
        mapping={manageMappingLive}
        organizationName={
          manageMappingLive
            ? store.getOrganizationName(manageMappingLive.organizationId)
            : ""
        }
        projectName={
          manageMappingLive
            ? store.getProjectName(manageMappingLive.projectId)
            : ""
        }
        projectVariables={manageProjectVariables}
        onOpenChange={(open) => {
          if (!open) setManageMapping(null);
        }}
        onAttach={async (variableId) => {
          if (!manageMappingLive) return;
          await store.attachVariable(manageMappingLive.id, variableId);
          toast.success("Variable attached");
        }}
        onDetach={async (variableId) => {
          if (!manageMappingLive) return;
          await store.detachVariable(manageMappingLive.id, variableId);
          toast.success("Variable detached");
        }}
        onCreateVariable={() => {
          const seed = manageMappingLive;
          setVariableDialog({
            open: true,
            mode: "create",
            variable: null,
            prefillKey: null,
            seedOrgId: seed?.organizationId,
            seedProjectId: seed?.projectId,
          });
          if (seed) store.loadProjectsForOrganization(seed.organizationId);
          setTab("variables");
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteMapping)}
        title="Delete DAG mapping?"
        description={
          <>
            <p>
              Removing the Luxia mapping for{" "}
              <strong>{deleteMapping?.displayName || deleteMapping?.dagId}</strong>
              {deleteMapping ? (
                <>
                  {" "}
                  (<span className="font-mono text-[0.95em]">{deleteMapping.dagId}</span>
                  {" · "}
                  {store.getProjectName(deleteMapping.projectId)})
                </>
              ) : null}{" "}
              removes this Pipeline from the mapped Project&apos;s Pipelines view.
            </p>
            <p>
              The Airflow DAG itself is not deleted — only the Luxia tenant mapping
              {deleteMapping && deleteMapping.attachedVariableIds.length > 0
                ? ` and its ${deleteMapping.attachedVariableIds.length} variable attachment${
                    deleteMapping.attachedVariableIds.length === 1 ? "" : "s"
                  }`
                : ""}
              .
            </p>
          </>
        }
        confirmLabel="Delete mapping"
        busy={deleteBusy}
        onOpenChange={(open) => {
          if (!open) setDeleteMapping(null);
        }}
        onConfirm={async () => {
          if (!deleteMapping) return;
          setDeleteBusy(true);
          await store.deleteMapping(deleteMapping.id);
          setDeleteBusy(false);
          setDeleteMapping(null);
          toast.success("Mapping deleted");
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteVariable)}
        title="Delete variable declaration?"
        description={
          <>
            <p>
              Deleting the Luxia declaration for{" "}
              <strong>{deleteVariable?.key}</strong> does not delete the Airflow variable.
            </p>
            {deleteVariable && store.dagsForVariable(deleteVariable.id).length > 0 ? (
              <p>
                It is currently attached to{" "}
                {store.dagsForVariable(deleteVariable.id).length} DAG mapping
                {store.dagsForVariable(deleteVariable.id).length === 1 ? "" : "s"} and will be
                detached on delete. Customer exposure through those pipelines will disappear.
              </p>
            ) : (
              <p>
                Any future attachments to DAG mappings will no longer be possible until the key
                is declared again for a project.
              </p>
            )}
          </>
        }
        confirmLabel="Delete declaration"
        busy={deleteBusy}
        onOpenChange={(open) => {
          if (!open) setDeleteVariable(null);
        }}
        onConfirm={async () => {
          if (!deleteVariable) return;
          setDeleteBusy(true);
          await store.deleteVariable(deleteVariable.id);
          setDeleteBusy(false);
          setDeleteVariable(null);
          toast.success("Variable declaration deleted");
        }}
      />
    </LuxiaPageFrame>
  );
}
