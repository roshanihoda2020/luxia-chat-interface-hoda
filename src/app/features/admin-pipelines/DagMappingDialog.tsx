import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { getProjectConstellations } from "@/app/features/constellation";
import {
  ADMIN_DAG_ACTION_HELPERS,
  ADMIN_DAG_ACTION_LABELS,
  isValidHttpUrl,
} from "./format";
import { DiscardAdminChangesDialog } from "./DiscardAdminChangesDialog";
import {
  FieldError,
  FieldHelper,
  FieldLabel,
  OrganizationSelect,
  ProjectSelect,
  ReadOnlyField,
} from "./OrgProjectFields";
import type {
  AdminAirflowDag,
  AdminDagActionKey,
  AdminDagMapping,
  AdminDagMappingInput,
  AdminOrganization,
  AdminProject,
  AdminProjectsLoadState,
} from "./types";

const ALL_ACTIONS: AdminDagActionKey[] = [
  "trigger",
  "clear_task",
  "update_variables",
];

const NONE_CONSTELLATION = "__none__";

function sortActions(actions: AdminDagActionKey[]): string {
  return [...actions].sort().join("|");
}

function normalizeConstellation(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : NONE_CONSTELLATION;
}

export interface DagMappingDialogProps {
  open: boolean;
  mode: "create" | "edit";
  mapping?: AdminDagMapping | null;
  /** Prefill DAG ID when launched from Airflow DAGs → Map to project. */
  prefillDagId?: string | null;
  organizations: AdminOrganization[];
  projects: AdminProject[];
  airflowDags: AdminAirflowDag[];
  projectsLoad: AdminProjectsLoadState;
  onOrganizationChange: (organizationId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: AdminDagMappingInput) => Promise<{ ok: boolean; error?: string }>;
}

const EMPTY_ACTIONS: AdminDagActionKey[] = [];

export function DagMappingDialog({
  open,
  mode,
  mapping,
  prefillDagId,
  organizations,
  projects,
  airflowDags,
  projectsLoad,
  onOrganizationChange,
  onOpenChange,
  onSubmit,
}: DagMappingDialogProps) {
  const formId = useId();
  const [dagId, setDagId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [constellationId, setConstellationId] = useState(NONE_CONSTELLATION);
  const [enabledActions, setEnabledActions] = useState<AdminDagActionKey[]>(EMPTY_ACTIONS);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const baseline = useMemo(() => {
    if (mode !== "edit" || !mapping) return null;
    return {
      organizationId: mapping.organizationId,
      projectId: mapping.projectId,
      displayName: mapping.displayName,
      documentationUrl: mapping.documentationUrl ?? "",
      constellationId: normalizeConstellation(mapping.constellationId),
      enabledActions: [...mapping.enabledActions],
      attachedVariableIds: [...mapping.attachedVariableIds],
      dagId: mapping.dagId,
    };
  }, [mode, mapping]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && mapping) {
      setDagId(mapping.dagId);
      setOrganizationId(mapping.organizationId);
      setProjectId(mapping.projectId);
      setDisplayName(
        mapping.displayName === mapping.dagId ? "" : mapping.displayName,
      );
      setDocumentationUrl(mapping.documentationUrl ?? "");
      setConstellationId(normalizeConstellation(mapping.constellationId));
      setEnabledActions([...mapping.enabledActions]);
      onOrganizationChange(mapping.organizationId);
    } else {
      setDagId(prefillDagId ?? "");
      setOrganizationId("");
      setProjectId("");
      setDisplayName("");
      setDocumentationUrl("");
      setConstellationId(NONE_CONSTELLATION);
      setEnabledActions(["trigger", "update_variables"]);
      onOrganizationChange("");
    }
    setSaving(false);
    setSubmitError(null);
    setTouched(false);
    setDiscardOpen(false);
  }, [open, mode, mapping, prefillDagId, onOrganizationChange]);

  useEffect(() => {
    if (!open || !projectId) return;
    setConstellationId((prev) => {
      if (prev === NONE_CONSTELLATION) return prev;
      const options = getProjectConstellations(projectId);
      if (options.some((item) => item.id === prev)) return prev;
      return NONE_CONSTELLATION;
    });
  }, [projectId, open]);

  const selectedAirflowDag = useMemo(
    () => airflowDags.find((dag) => dag.dagId === dagId) ?? null,
    [airflowDags, dagId],
  );

  const dagOptions = useMemo(
    () =>
      airflowDags.map((dag) => ({
        value: dag.dagId,
        label: dag.dagId,
        content: (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{dag.dagId}</span>
            {dag.description ? (
              <span className="truncate luxia-type-caption text-[var(--luxia-text-muted)]">
                {dag.description}
              </span>
            ) : null}
          </span>
        ),
      })),
    [airflowDags],
  );

  const constellationOptions = useMemo(() => {
    if (!projectId) return [];
    return getProjectConstellations(projectId).map((item) => ({
      value: item.id,
      label: item.name,
    }));
  }, [projectId]);

  const projectReady = Boolean(projectId) && projectsLoad.status === "ready";
  const urlInvalid =
    documentationUrl.trim().length > 0 && !isValidHttpUrl(documentationUrl.trim());
  const requiredOk = Boolean(
    dagId && organizationId && projectId && projectsLoad.status === "ready",
  );

  const effectiveDisplayName = displayName.trim() || dagId;
  const effectiveDocs = documentationUrl.trim();
  const effectiveConstellation = constellationId;

  const isDirty = useMemo(() => {
    if (!baseline) return true;
    return (
      organizationId !== baseline.organizationId
      || projectId !== baseline.projectId
      || effectiveDisplayName !== (baseline.displayName.trim() || baseline.dagId)
      || effectiveDocs !== baseline.documentationUrl.trim()
      || effectiveConstellation !== baseline.constellationId
      || sortActions(enabledActions) !== sortActions(baseline.enabledActions)
    );
  }, [
    baseline,
    organizationId,
    projectId,
    effectiveDisplayName,
    effectiveDocs,
    effectiveConstellation,
    enabledActions,
  ]);

  const projectChangedFromOriginal =
    Boolean(baseline)
    && Boolean(projectId)
    && projectId !== baseline!.projectId
    && baseline!.attachedVariableIds.length > 0;

  const canSubmit =
    requiredOk
    && !urlInvalid
    && !saving
    && (mode === "create" || isDirty);

  function handleOrganizationChange(next: string) {
    setOrganizationId(next);
    onOrganizationChange(next);
    if (baseline && next === baseline.organizationId) {
      setProjectId(baseline.projectId);
      setConstellationId(baseline.constellationId);
      return;
    }
    setProjectId("");
    setConstellationId(NONE_CONSTELLATION);
  }

  function handleProjectChange(next: string) {
    setProjectId(next);
    if (
      baseline
      && organizationId === baseline.organizationId
      && next === baseline.projectId
    ) {
      setConstellationId(baseline.constellationId);
      return;
    }
    setConstellationId(NONE_CONSTELLATION);
  }

  function toggleAction(key: AdminDagActionKey, checked: boolean) {
    setEnabledActions((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((k) => k !== key);
    });
  }

  function requestClose() {
    if (saving) return;
    if (mode === "edit" && isDirty) {
      setDiscardOpen(true);
      return;
    }
    if (mode === "create" && isDirty && (dagId || organizationId || projectId || displayName.trim() || documentationUrl.trim() || constellationId !== NONE_CONSTELLATION)) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function handleSubmit() {
    setTouched(true);
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    const result = await onSubmit({
      dagId,
      displayName: displayName.trim(),
      organizationId,
      projectId,
      documentationUrl: documentationUrl.trim(),
      constellationId: constellationId === NONE_CONSTELLATION ? "" : constellationId,
      enabledActions,
    });
    setSaving(false);
    if (!result.ok) {
      setSubmitError(result.error ?? "Could not save mapping.");
      return;
    }
    onOpenChange(false);
  }

  const constellationDisabled = !projectReady;
  let constellationPlaceholder = "Optional constellation";
  if (!organizationId) constellationPlaceholder = "Select a project first";
  else if (!projectId) {
    if (projectsLoad.status === "loading") constellationPlaceholder = "Waiting for project…";
    else if (projectsLoad.status === "empty") constellationPlaceholder = "No project available";
    else constellationPlaceholder = "Select a project first";
  } else if (constellationOptions.length === 0) {
    constellationPlaceholder = "No constellations available";
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogContent className="flex max-h-[min(92vh,42rem)] w-[min(100%,34rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle>
              {mode === "edit" ? "Edit DAG mapping" : "New DAG mapping"}
            </DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Update how this Airflow DAG appears in the customer Project Pipelines view."
                : "Map an Airflow DAG to a tenant project so customers can see and run it."}
            </DialogDescription>
          </DialogHeader>

          <div
            id={formId}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 luxia-scrollbar"
          >
            {mode === "edit" ? (
              <ReadOnlyField
                id={`${formId}-dag`}
                label="DAG ID"
                value={dagId}
                required
                secondary={selectedAirflowDag?.description ?? undefined}
                helper="DAG ID cannot change after mapping is created."
              />
            ) : (
              <div>
                <FieldLabel htmlFor={`${formId}-dag`} required>
                  DAG ID
                </FieldLabel>
                <SearchableSelect
                  id={`${formId}-dag`}
                  value={dagId}
                  onValueChange={setDagId}
                  options={dagOptions}
                  placeholder="Select Airflow DAG"
                  searchPlaceholder="Search DAG IDs…"
                  emptyText="No Airflow DAGs available"
                  noResultsText="No matching DAGs"
                />
                {prefillDagId ? (
                  <FieldHelper>Prefilled from Airflow inventory.</FieldHelper>
                ) : (
                  <FieldHelper>
                    Choose from the live Airflow inventory available to Luxia.
                  </FieldHelper>
                )}
                {touched && !dagId ? <FieldError>DAG ID is required.</FieldError> : null}
              </div>
            )}

            <OrganizationSelect
              id={`${formId}-org`}
              value={organizationId}
              organizations={organizations}
              onChange={handleOrganizationChange}
            />
            {touched && !organizationId ? (
              <FieldError>Organization is required.</FieldError>
            ) : null}

            <ProjectSelect
              id={`${formId}-project`}
              value={projectId}
              onChange={handleProjectChange}
              projects={projects}
              projectsLoad={projectsLoad}
              organizationSelected={Boolean(organizationId)}
            />
            {touched && organizationId && !projectId && projectsLoad.status === "ready" ? (
              <FieldError>Project is required.</FieldError>
            ) : null}

            {projectChangedFromOriginal ? (
              <div
                className="rounded-[var(--luxia-radius-8)] border border-[var(--luxia-warning-border,rgba(180,120,20,0.35))] bg-[var(--luxia-warning-soft,rgba(255,200,80,0.12))] px-3 py-2.5"
                role="status"
              >
                <p className="luxia-type-body-small font-medium text-[var(--luxia-text-primary)]">
                  Changing the project will detach attached variables
                </p>
                <p className="mt-1 luxia-type-caption text-[var(--luxia-text-secondary)]">
                  {baseline!.attachedVariableIds.length} variable
                  {baseline!.attachedVariableIds.length === 1 ? "" : "s"} currently
                  attached to this mapping will be removed when you save. Re-attach them
                  from Manage variables after saving if needed.
                </p>
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor={`${formId}-name`}>Display name</FieldLabel>
              <Input
                id={`${formId}-name`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={dagId || "Optional customer-facing name"}
                autoComplete="off"
              />
              <FieldHelper>
                Optional. If blank, customers see the DAG ID as the pipeline name.
              </FieldHelper>
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-docs`}>Documentation URL</FieldLabel>
              <Input
                id={`${formId}-docs`}
                value={documentationUrl}
                onChange={(e) => setDocumentationUrl(e.target.value)}
                placeholder="https://"
                inputMode="url"
                type="url"
                autoComplete="off"
                name={`${formId}-documentation-url`}
                aria-invalid={urlInvalid || undefined}
              />
              {urlInvalid ? (
                <FieldError>Enter a valid http(s) URL.</FieldError>
              ) : (
                <FieldHelper>Optional link shown to customers.</FieldHelper>
              )}
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-constellation`}>Constellation</FieldLabel>
              <SearchableSelect
                id={`${formId}-constellation`}
                value={constellationId}
                onValueChange={setConstellationId}
                options={[
                  { value: NONE_CONSTELLATION, label: "No constellation" },
                  ...constellationOptions,
                ]}
                placeholder={constellationPlaceholder}
                searchPlaceholder="Search constellations…"
                emptyText="No constellations available"
                noResultsText="No matching constellations"
                disabled={constellationDisabled}
                clearValue={NONE_CONSTELLATION}
                clearAriaLabel="Clear selection"
              />
              <FieldHelper>
                Optional. Clear selection or choose “No constellation”.
              </FieldHelper>
            </div>

            <fieldset className="space-y-2.5">
              <legend className="mb-1 luxia-type-caption font-medium text-[var(--luxia-text-secondary)]">
                Enabled actions
              </legend>
              <FieldHelper>
                Controls what customers with write access can do for this mapping.
              </FieldHelper>
              {ALL_ACTIONS.map((key) => {
                const checked = enabledActions.includes(key);
                const checkboxId = `${formId}-action-${key}`;
                return (
                  <label
                    key={key}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-start gap-2.5 rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] px-3 py-2.5 hover:bg-[var(--luxia-surface-subtle)] focus-within:ring-2 focus-within:ring-[var(--luxia-opacity-brand-secondary-32)]"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(next) => toggleAction(key, next === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block luxia-type-body-small font-medium text-[var(--luxia-text-primary)]">
                        {ADMIN_DAG_ACTION_LABELS[key]}
                      </span>
                      <span className="block luxia-type-caption text-[var(--luxia-text-muted)]">
                        {ADMIN_DAG_ACTION_HELPERS[key]}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {submitError ? <FieldError>{submitError}</FieldError> : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-[var(--luxia-border-subtle)] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={requestClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {saving
                ? mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : mode === "edit"
                  ? "Save changes"
                  : "Create mapping"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscardAdminChangesDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={() => {
          setDiscardOpen(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
