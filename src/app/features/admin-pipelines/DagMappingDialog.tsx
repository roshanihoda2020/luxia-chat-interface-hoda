import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
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
import { Textarea } from "@/app/components/ui/textarea";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { getProjectConstellations } from "@/app/features/constellation";
import {
  ADMIN_DAG_ACTION_LABELS,
  ADMIN_PIPELINE_DESCRIPTION_MAX,
  ADMIN_PIPELINE_DISPLAY_NAME_MAX,
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

function MappingSection({
  title,
  cue,
  children,
}: {
  title: string;
  cue?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="space-y-0.5 border-b border-[var(--luxia-border-subtle)] pb-2">
        <h3 className="luxia-type-body-small font-semibold text-[var(--luxia-text-primary)]">
          {title}
        </h3>
        {cue ? (
          <p className="luxia-type-caption text-[var(--luxia-text-muted)]">{cue}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
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
  const [description, setDescription] = useState("");
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
      description: mapping.description ?? "",
      documentationUrl: mapping.documentationUrl ?? "",
      constellationId: normalizeConstellation(mapping.constellationId),
      enabledActions: [...mapping.enabledActions],
      dagId: mapping.dagId,
    };
  }, [mode, mapping]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && mapping) {
      setDagId(mapping.dagId);
      setOrganizationId(mapping.organizationId);
      setProjectId(mapping.projectId);
      setDisplayName(mapping.displayName);
      setDescription(mapping.description ?? "");
      setDocumentationUrl(mapping.documentationUrl ?? "");
      setConstellationId(normalizeConstellation(mapping.constellationId));
      setEnabledActions([...mapping.enabledActions]);
      onOrganizationChange(mapping.organizationId);
    } else {
      setDagId(prefillDagId ?? "");
      setOrganizationId("");
      setProjectId("");
      setDisplayName("");
      setDescription("");
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

  const airflowDescription = selectedAirflowDag?.description?.trim() || "";
  const hasAirflowDescription = Boolean(airflowDescription);

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
  const displayNameTrimmed = displayName.trim();
  const displayNameMissing = !displayNameTrimmed;
  const displayNameTooLong = displayName.length > ADMIN_PIPELINE_DISPLAY_NAME_MAX;
  const descriptionTooLong = description.length > ADMIN_PIPELINE_DESCRIPTION_MAX;

  const requiredOk = Boolean(
    dagId
    && organizationId
    && projectId
    && projectsLoad.status === "ready"
    && displayNameTrimmed
    && !displayNameTooLong
    && !descriptionTooLong,
  );

  const effectiveDocs = documentationUrl.trim();
  const effectiveConstellation = constellationId;
  const effectiveDescription = description;

  const isDirty = useMemo(() => {
    if (!baseline) return true;
    // Placement (org/project) is immutable in edit mode — omit from dirty checks.
    return (
      displayNameTrimmed !== baseline.displayName.trim()
      || effectiveDescription !== baseline.description
      || effectiveDocs !== baseline.documentationUrl.trim()
      || effectiveConstellation !== baseline.constellationId
      || sortActions(enabledActions) !== sortActions(baseline.enabledActions)
    );
  }, [
    baseline,
    displayNameTrimmed,
    effectiveDescription,
    effectiveDocs,
    effectiveConstellation,
    enabledActions,
  ]);

  const canSubmit =
    requiredOk
    && !urlInvalid
    && !saving
    && (mode === "create" || isDirty);

  function handleOrganizationChange(next: string) {
    setOrganizationId(next);
    onOrganizationChange(next);
    setProjectId("");
    setConstellationId(NONE_CONSTELLATION);
  }

  function handleProjectChange(next: string) {
    setProjectId(next);
    setConstellationId(NONE_CONSTELLATION);
  }

  function toggleAction(key: AdminDagActionKey, checked: boolean) {
    setEnabledActions((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((k) => k !== key);
    });
  }

  function useAirflowDescription() {
    if (!hasAirflowDescription) return;
    const next =
      airflowDescription.length > ADMIN_PIPELINE_DESCRIPTION_MAX
        ? airflowDescription.slice(0, ADMIN_PIPELINE_DESCRIPTION_MAX)
        : airflowDescription;
    setDescription(next);
  }

  function requestClose() {
    if (saving) return;
    if (mode === "edit" && isDirty) {
      setDiscardOpen(true);
      return;
    }
    if (
      mode === "create"
      && isDirty
      && (
        dagId
        || organizationId
        || projectId
        || displayName.trim()
        || description.trim()
        || documentationUrl.trim()
        || constellationId !== NONE_CONSTELLATION
      )
    ) {
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
      displayName: displayNameTrimmed,
      description: description.trim(),
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

  const airflowStatusLabel =
    selectedAirflowDag?.status === "paused"
      ? "Paused"
      : selectedAirflowDag
        ? "Active"
        : "—";

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
            <DialogDescription className="sr-only">
              Map an Airflow DAG to a Project.
            </DialogDescription>
          </DialogHeader>

          <div
            id={formId}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-4 luxia-scrollbar"
          >
            <MappingSection title="Pipeline identity" cue="Airflow · read-only">
              {mode === "edit" ? (
                <ReadOnlyField
                  id={`${formId}-dag`}
                  label="DAG ID"
                  value={dagId}
                  required
                  mono
                  helper="Cannot change after mapping."
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
                  {touched && !dagId ? <FieldError>DAG ID is required.</FieldError> : null}
                </div>
              )}

              <div>
                <FieldLabel>Airflow description</FieldLabel>
                <div
                  className="rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-3.5 py-2.5"
                  role="text"
                  aria-readonly="true"
                >
                  <p className="luxia-type-body-small text-[var(--luxia-text-secondary)]">
                    {hasAirflowDescription
                      ? airflowDescription
                      : dagId
                        ? "No description from Airflow"
                        : "Select a DAG to see its Airflow description."}
                  </p>
                </div>
              </div>

              <div>
                <FieldLabel>Airflow status</FieldLabel>
                <div
                  className="flex h-10 min-h-10 items-center rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-3.5 luxia-type-body-small font-medium text-[var(--luxia-text-primary)]"
                  role="text"
                  aria-readonly="true"
                >
                  {airflowStatusLabel}
                </div>
                <FieldHelper>Not controlled in Luxia.</FieldHelper>
              </div>
            </MappingSection>

            <MappingSection title="Customer-facing information">
              <div>
                <FieldLabel htmlFor={`${formId}-name`} required>
                  Display name
                </FieldLabel>
                <Input
                  id={`${formId}-name`}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Pipeline name 01"
                  autoComplete="off"
                  maxLength={ADMIN_PIPELINE_DISPLAY_NAME_MAX}
                  aria-invalid={
                    (touched && displayNameMissing) || displayNameTooLong || undefined
                  }
                />
                {touched && displayNameMissing ? (
                  <FieldError>Display name is required.</FieldError>
                ) : null}
                {displayNameTooLong ? (
                  <FieldError>
                    Display name must be {ADMIN_PIPELINE_DISPLAY_NAME_MAX} characters or fewer.
                  </FieldError>
                ) : null}
              </div>

              <div>
                <FieldLabel htmlFor={`${formId}-desc`}>Description</FieldLabel>
                <Textarea
                  id={`${formId}-desc`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                  rows={3}
                  maxLength={ADMIN_PIPELINE_DESCRIPTION_MAX}
                  aria-invalid={descriptionTooLong || undefined}
                />
                {hasAirflowDescription ? (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      className="luxia-type-caption font-medium text-[var(--luxia-purple-60)] underline-offset-2 hover:underline"
                      onClick={useAirflowDescription}
                    >
                      Use Airflow description
                    </button>
                  </div>
                ) : null}
                {descriptionTooLong ? (
                  <FieldError>
                    Description must be {ADMIN_PIPELINE_DESCRIPTION_MAX} characters or fewer.
                  </FieldError>
                ) : null}
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
                ) : null}
              </div>
            </MappingSection>

            <MappingSection title="Project placement">
              <OrganizationSelect
                id={`${formId}-org`}
                value={organizationId}
                organizations={organizations}
                onChange={handleOrganizationChange}
                locked={mode === "edit"}
                lockedHelper=""
              />
              {mode === "create" && touched && !organizationId ? (
                <FieldError>Organization is required.</FieldError>
              ) : null}

              <ProjectSelect
                id={`${formId}-project`}
                value={projectId}
                onChange={handleProjectChange}
                projects={projects}
                projectsLoad={projectsLoad}
                organizationSelected={Boolean(organizationId)}
                locked={mode === "edit"}
                lockedHelper=""
              />
              {mode === "create"
              && touched
              && organizationId
              && !projectId
              && projectsLoad.status === "ready" ? (
                <FieldError>Project is required.</FieldError>
              ) : null}

              {mode === "edit" ? (
                <FieldHelper>
                  Placement cannot be changed after mapping. To use this DAG in another
                  Project, create another mapping.
                </FieldHelper>
              ) : null}

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
              </div>
            </MappingSection>

            <MappingSection title="Customer capabilities">
              <fieldset className="space-y-2.5">
                <legend className="sr-only">Enabled actions</legend>
                {ALL_ACTIONS.map((key) => {
                  const checked = enabledActions.includes(key);
                  const checkboxId = `${formId}-action-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={checkboxId}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] px-3 py-2.5 hover:bg-[var(--luxia-surface-subtle)] focus-within:ring-2 focus-within:ring-[var(--luxia-opacity-brand-secondary-32)]"
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={(next) => toggleAction(key, next === true)}
                      />
                      <span className="luxia-type-body-small font-medium text-[var(--luxia-text-primary)]">
                        {ADMIN_DAG_ACTION_LABELS[key]}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </MappingSection>

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
