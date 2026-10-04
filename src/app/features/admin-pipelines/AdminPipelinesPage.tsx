import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/components/ui/utils";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { FilterToolbar, FilterToolbarRow } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { toast } from "sonner";
import {
  ADMIN_PIPELINES_CONTENT_CLASS,
  isAirflowInventoryFilterDisabled,
} from "./adminTable";
import { AirflowDagsTab } from "./AirflowDagsTab";
import { AirflowVariablesTab } from "./AirflowVariablesTab";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { DagMappingDialog } from "./DagMappingDialog";
import { DagsTab } from "./DagsTab";
import {
  ManageVariablesDialog,
  MANAGE_VARIABLES_DIALOG_FOCUS_ID,
} from "./ManageVariablesDialog";
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
    /** Manage variables → New variable: lock org/project to mapping context. */
    lockPlacementToMapping?: boolean;
  }>({ open: false, mode: "create" });

  const [manageMapping, setManageMapping] = useState<AdminDagMapping | null>(null);
  const [highlightVariableId, setHighlightVariableId] = useState<string | null>(null);
  /** Restore keyboard focus to Manage variables after nested New Variable closes. */
  const restoreManageFocusRef = useRef(false);
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
      label: "Pipeline Admin",
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

  const airflowDagsFilterDisabled = isAirflowInventoryFilterDisabled(
    store.airflowState,
    store.airflowDags.length,
  );
  const airflowVariablesFilterDisabled = isAirflowInventoryFilterDisabled(
    store.airflowState,
    store.airflowVariables.length,
  );

  const openNewMapping = (prefillDagId?: string | null) =>
    setDagDialog({
      open: true,
      mode: "create",
      mapping: null,
      prefillDagId: prefillDagId ?? null,
    });

  const openNewVariable = (prefillKey?: string | null) => {
    restoreManageFocusRef.current = false;
    setVariableDialog({
      open: true,
      mode: "create",
      variable: null,
      prefillKey: prefillKey ?? null,
      seedOrgId: null,
      seedProjectId: null,
      lockPlacementToMapping: false,
    });
  };

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
        title="Pipeline Admin"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={PAGE_GUIDANCE}
        primaryAction={primaryAction}
      />

      <LuxiaPageBody>
        <div className={`${ADMIN_PIPELINES_CONTENT_CLASS} space-y-4`}>
          <Tabs value={tab} onValueChange={handleTabChange} className="gap-4">
            <div className="w-full min-w-0 overflow-x-auto">
              <TabsList
                aria-label="Pipeline Admin sections"
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
                    seedOrgId: null,
                    seedProjectId: null,
                    lockPlacementToMapping: false,
                  })
                }
                onDelete={setDeleteVariable}
              />
            </TabsContent>

            <TabsContent value="airflow-dags" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={cn(
                    "flex items-center gap-2 luxia-type-body-small text-[var(--luxia-text-secondary)]",
                    airflowDagsFilterDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer",
                  )}
                  title={
                    airflowDagsFilterDisabled
                      ? "Available when Airflow DAG inventory is loaded"
                      : undefined
                  }
                >
                  <Checkbox
                    checked={showUnmappedOnly}
                    disabled={airflowDagsFilterDisabled}
                    onCheckedChange={(next) => setShowUnmappedOnly(next === true)}
                    aria-describedby={
                      airflowDagsFilterDisabled
                        ? "admin-airflow-dags-filter-hint"
                        : undefined
                    }
                  />
                  Show only unmapped
                </label>
                {airflowDagsFilterDisabled ? (
                  <span id="admin-airflow-dags-filter-hint" className="sr-only">
                    Available when Airflow DAG inventory is loaded
                  </span>
                ) : null}
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
                <label
                  className={cn(
                    "flex items-center gap-2 luxia-type-body-small text-[var(--luxia-text-secondary)]",
                    airflowVariablesFilterDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer",
                  )}
                  title={
                    airflowVariablesFilterDisabled
                      ? "Available when Airflow variable inventory is loaded"
                      : undefined
                  }
                >
                  <Checkbox
                    checked={showUndeclaredOnly}
                    disabled={airflowVariablesFilterDisabled}
                    onCheckedChange={(next) => setShowUndeclaredOnly(next === true)}
                    aria-describedby={
                      airflowVariablesFilterDisabled
                        ? "admin-airflow-variables-filter-hint"
                        : undefined
                    }
                  />
                  Show only undeclared
                </label>
                {airflowVariablesFilterDisabled ? (
                  <span id="admin-airflow-variables-filter-hint" className="sr-only">
                    Available when Airflow variable inventory is loaded
                  </span>
                ) : null}
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
            toast.success("DAG mapping updated");
            return { ok: true };
          }
          const result = await store.createMapping(input);
          if (!result.ok) return result;
          toast.success("DAG mapping created");
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
        highlightVariableId={highlightVariableId}
        suspended={
          Boolean(manageMappingLive)
          && variableDialog.open
          && Boolean(variableDialog.lockPlacementToMapping)
        }
        onOpenChange={(open) => {
          if (!open) {
            setManageMapping(null);
            setHighlightVariableId(null);
          }
        }}
        onAttach={async (variableId) => {
          if (!manageMappingLive) return;
          const result = await store.attachVariable(
            manageMappingLive.id,
            variableId,
          );
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          if (!result.alreadyAttached) {
            toast.success("Variable attached");
          }
        }}
        onDetach={async (variableId) => {
          if (!manageMappingLive) return;
          await store.detachVariable(manageMappingLive.id, variableId);
          toast.success("Variable detached");
        }}
        onCreateVariable={() => {
          const seed = manageMappingLive;
          restoreManageFocusRef.current = true;
          setVariableDialog({
            open: true,
            mode: "create",
            variable: null,
            prefillKey: null,
            seedOrgId: seed?.organizationId ?? null,
            seedProjectId: seed?.projectId ?? null,
            lockPlacementToMapping: true,
          });
          if (seed) store.loadProjectsForOrganization(seed.organizationId);
        }}
      />

      <VariableDialog
        open={variableDialog.open}
        mode={variableDialog.mode}
        variable={variableDialog.variable}
        prefillKey={variableDialog.prefillKey}
        seedOrganizationId={variableDialog.seedOrgId}
        seedProjectId={variableDialog.seedProjectId}
        lockPlacementToMapping={Boolean(variableDialog.lockPlacementToMapping)}
        existingVariables={store.variables}
        organizations={store.organizations}
        projects={store.projects}
        projectsLoad={store.projectsLoad}
        airflowVariables={store.airflowVariables}
        onOrganizationChange={onOrgChangeForForms}
        onOpenChange={(open) => {
          if (!open) {
            setVariableDialog((prev) => ({
              ...prev,
              open: false,
              lockPlacementToMapping: false,
            }));
          }
        }}
        onCloseAutoFocus={(event) => {
          if (!restoreManageFocusRef.current) return;
          restoreManageFocusRef.current = false;
          event.preventDefault();
          window.requestAnimationFrame(() => {
            document.getElementById(MANAGE_VARIABLES_DIALOG_FOCUS_ID)?.focus();
          });
        }}
        onSubmit={async (input) => {
          if (variableDialog.mode === "edit" && variableDialog.variable) {
            const result = await store.updateVariable(variableDialog.variable.id, input);
            if (!result.ok) return result;
            toast.success("Variable updated");
            return { ok: true };
          }
          const fromManage = Boolean(variableDialog.lockPlacementToMapping);
          const result = await store.createVariable(input);
          if (!result.ok) return result;
          toast.success("Variable declared");
          if (fromManage && manageMappingLive) {
            setHighlightVariableId(result.variable.id);
            window.setTimeout(() => setHighlightVariableId(null), 4000);
          }
          return { ok: true };
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteMapping)}
        title="Delete DAG mapping?"
        description={
          <>
            <p>
              Remove the Luxia mapping for{" "}
              <strong>{deleteMapping?.displayName || deleteMapping?.dagId}</strong>
              {deleteMapping ? (
                <>
                  {" "}
                  (<span className="font-mono text-[0.95em]">{deleteMapping.dagId}</span>
                  {" · "}
                  {store.getProjectName(deleteMapping.projectId)})
                </>
              ) : null}
              .
              {deleteMapping && deleteMapping.attachedVariableIds.length > 0
                ? ` Also detaches ${deleteMapping.attachedVariableIds.length} variable${
                    deleteMapping.attachedVariableIds.length === 1 ? "" : "s"
                  }.`
                : ""}
            </p>
            <p>The Airflow DAG is not deleted.</p>
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
              Delete the Luxia declaration for{" "}
              <strong>{deleteVariable?.key}</strong>. The Airflow variable is not deleted.
            </p>
            {deleteVariable && store.dagsForVariable(deleteVariable.id).length > 0 ? (
              <p>
                Detaches from {store.dagsForVariable(deleteVariable.id).length}{" "}
                mapping
                {store.dagsForVariable(deleteVariable.id).length === 1 ? "" : "s"}.
              </p>
            ) : null}
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
