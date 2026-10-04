import { useEffect, useId, useMemo, useState } from "react";
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
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import {
  ADMIN_VARIABLE_DESCRIPTION_MAX,
  ADMIN_VARIABLE_LABEL_MAX,
  ADMIN_VARIABLE_TYPE_LABELS,
  formatAdminSelectOptionLines,
  parseAdminSelectOptionLines,
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
  AdminAirflowVariable,
  AdminOrganization,
  AdminProject,
  AdminProjectsLoadState,
  AdminVariableDeclaration,
  AdminVariableInput,
  AdminVariableType,
} from "./types";

export interface VariableDialogProps {
  open: boolean;
  mode: "create" | "edit";
  variable?: AdminVariableDeclaration | null;
  prefillKey?: string | null;
  seedOrganizationId?: string | null;
  seedProjectId?: string | null;
  /**
   * When true (Manage variables → New variable), Organization and Project are
   * fixed mapping context and are not selectable.
   */
  lockPlacementToMapping?: boolean;
  existingVariables?: AdminVariableDeclaration[];
  organizations: AdminOrganization[];
  projects: AdminProject[];
  projectsLoad: AdminProjectsLoadState;
  airflowVariables?: AdminAirflowVariable[];
  onOrganizationChange: (organizationId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    input: AdminVariableInput,
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Restore focus into Manage variables when this dialog closes over it. */
  onCloseAutoFocus?: (event: Event) => void;
}

const TYPE_OPTIONS = (Object.keys(ADMIN_VARIABLE_TYPE_LABELS) as AdminVariableType[]).map(
  (value) => ({ value, label: ADMIN_VARIABLE_TYPE_LABELS[value] }),
);

export function VariableDialog({
  open,
  mode,
  variable,
  prefillKey,
  seedOrganizationId,
  seedProjectId,
  lockPlacementToMapping = false,
  existingVariables = [],
  organizations,
  projects,
  projectsLoad,
  airflowVariables = [],
  onOrganizationChange,
  onOpenChange,
  onSubmit,
  onCloseAutoFocus,
}: VariableDialogProps) {
  const formId = useId();
  const [key, setKey] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AdminVariableType>("text");
  const [sensitive, setSensitive] = useState(false);
  const [allowedValuesText, setAllowedValuesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const lockedPlacement = mode === "edit" || lockPlacementToMapping;
  const orgLockedHelper = lockPlacementToMapping
    ? "From the current mapping."
    : mode === "edit"
      ? "Fixed after declaration."
      : "";
  const projectLockedHelper = "";

  const baseline = useMemo(() => {
    if (mode !== "edit" || !variable) return null;
    return {
      label: variable.label,
      description: variable.description,
      type: variable.type,
      sensitive: variable.sensitive,
      allowedValuesText: formatAdminSelectOptionLines(
        variable.selectOptions,
        variable.allowedValues,
      ),
      key: variable.key,
    };
  }, [mode, variable]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && variable) {
      setKey(variable.key);
      setOrganizationId(variable.organizationId);
      setProjectId(variable.projectId);
      setLabel(variable.label);
      setDescription(variable.description);
      setType(variable.type);
      setSensitive(variable.sensitive);
      setAllowedValuesText(
        formatAdminSelectOptionLines(variable.selectOptions, variable.allowedValues),
      );
      onOrganizationChange(variable.organizationId);
    } else {
      const org = seedOrganizationId ?? "";
      const project = seedProjectId ?? "";
      setKey(prefillKey ?? "");
      setOrganizationId(org);
      setProjectId(project);
      setLabel("");
      setDescription("");
      setType("text");
      setSensitive(false);
      setAllowedValuesText("");
      onOrganizationChange(org);
    }
    setSaving(false);
    setSubmitError(null);
    setTouched(false);
    setDiscardOpen(false);
  }, [open, mode, variable, prefillKey, seedOrganizationId, seedProjectId, onOrganizationChange]);

  const keyOptions = useMemo(() => {
    const declaredForProject = new Set(
      existingVariables
        .filter((row) => (projectId ? row.projectId === projectId : false))
        .map((row) => row.key),
    );
    return airflowVariables
      .filter((row) => !declaredForProject.has(row.key) || row.key === key)
      .map((row) => ({
        value: row.key,
        label: row.key,
        content: (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{row.key}</span>
            {row.description ? (
              <span className="truncate luxia-type-caption text-[var(--luxia-text-muted)]">
                {row.description}
              </span>
            ) : null}
          </span>
        ),
      }));
  }, [airflowVariables, existingVariables, projectId, key]);

  const selectedAirflowKey = useMemo(
    () => airflowVariables.find((row) => row.key === key) ?? null,
    [airflowVariables, key],
  );

  const selectOptions = parseAdminSelectOptionLines(allowedValuesText);
  const allowedValues = selectOptions.map((option) => option.value);
  const allowedValuesKey = selectOptions
    .map((option) => `${option.value}|${option.label}`)
    .join("||");

  const selectNeedsValues = type === "select" && allowedValues.length === 0;
  const labelTrimmed = label.trim();
  const labelMissing = !labelTrimmed;
  const labelTooLong = label.length > ADMIN_VARIABLE_LABEL_MAX;
  const descriptionTooLong = description.length > ADMIN_VARIABLE_DESCRIPTION_MAX;
  const airflowDescription = selectedAirflowKey?.description?.trim() || "";
  const hasAirflowDescription = Boolean(airflowDescription);

  const requiredOk =
    Boolean(key.trim())
    && Boolean(organizationId)
    && Boolean(projectId)
    && Boolean(type)
    && Boolean(labelTrimmed)
    && !labelTooLong
    && !descriptionTooLong
    && (lockedPlacement || projectsLoad.status === "ready")
    && !selectNeedsValues;

  const isDirty = useMemo(() => {
    if (!baseline) return true;
    const baselineAllowed = baseline.allowedValuesText
      ? parseAdminSelectOptionLines(baseline.allowedValuesText)
          .map((option) => `${option.value}|${option.label}`)
          .join("||")
      : "";
    return (
      labelTrimmed !== baseline.label.trim()
      || description.trim() !== baseline.description.trim()
      || type !== baseline.type
      || sensitive !== baseline.sensitive
      || (type === "select" ? allowedValuesKey !== baselineAllowed : false)
    );
  }, [baseline, labelTrimmed, description, type, sensitive, allowedValuesKey]);

  /** Compare against seeded open state so contextual create Cancel isn't always dirty. */
  const hasCreateEdits =
    mode === "create"
    && (
      key.trim() !== (prefillKey ?? "").trim()
      || organizationId !== (seedOrganizationId ?? "")
      || projectId !== (seedProjectId ?? "")
      || Boolean(label.trim())
      || Boolean(description.trim())
      || sensitive
      || Boolean(allowedValuesText.trim())
      || type !== "text"
    );

  const canSubmit =
    requiredOk
    && !saving
    && (mode === "create" || isDirty);

  function handleOrganizationChange(next: string) {
    if (lockPlacementToMapping) return;
    setOrganizationId(next);
    onOrganizationChange(next);
    if (seedOrganizationId && next === seedOrganizationId && seedProjectId) {
      setProjectId(seedProjectId);
      return;
    }
    setProjectId("");
  }

  function requestClose() {
    if (saving) return;
    if (mode === "edit" && isDirty) {
      setDiscardOpen(true);
      return;
    }
    if (mode === "create" && hasCreateEdits) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function useAirflowDescription() {
    if (!hasAirflowDescription) return;
    const next =
      airflowDescription.length > ADMIN_VARIABLE_DESCRIPTION_MAX
        ? airflowDescription.slice(0, ADMIN_VARIABLE_DESCRIPTION_MAX)
        : airflowDescription;
    setDescription(next);
  }

  async function handleSubmit() {
    setTouched(true);
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    const result = await onSubmit({
      key: key.trim(),
      label: labelTrimmed,
      description: description.trim(),
      type,
      sensitive,
      allowedValues,
      selectOptions: type === "select" ? selectOptions : undefined,
      organizationId,
      projectId,
    });
    setSaving(false);
    if (!result.ok) {
      setSubmitError(result.error ?? "Could not save variable.");
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogContent
          className="flex max-h-[min(92vh,42rem)] w-[min(100%,34rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle>
              {mode === "edit" ? "Edit variable" : "New variable"}
            </DialogTitle>
            <DialogDescription>
              Airflow values are never shown.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 luxia-scrollbar">
            {mode === "edit" ? (
              <ReadOnlyField
                id={`${formId}-key`}
                label="Key"
                value={key}
                required
                mono
                helper="Cannot change after declaration."
              />
            ) : (
              <div>
                <FieldLabel htmlFor={`${formId}-key`} required>
                  Key
                </FieldLabel>
                {keyOptions.length > 0 ? (
                  <SearchableSelect
                    id={`${formId}-key`}
                    value={key}
                    onValueChange={setKey}
                    options={keyOptions}
                    placeholder="Select Airflow variable key"
                    searchPlaceholder="Search keys…"
                    emptyText="No Airflow variable keys available"
                    noResultsText="No matching keys"
                  />
                ) : (
                  <Input
                    id={`${formId}-key`}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. finance.refresh.window_days"
                    autoComplete="off"
                  />
                )}
                {touched && !key.trim() ? <FieldError>Key is required.</FieldError> : null}
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
                    : key.trim()
                      ? "No description from Airflow"
                      : "Select a key to see its Airflow description."}
                </p>
              </div>
            </div>

            <OrganizationSelect
              id={`${formId}-org`}
              value={organizationId}
              organizations={organizations}
              onChange={handleOrganizationChange}
              locked={lockedPlacement}
              lockedHelper={orgLockedHelper}
            />
            {touched && !organizationId && !lockedPlacement ? (
              <FieldError>Organization is required.</FieldError>
            ) : null}

            <ProjectSelect
              id={`${formId}-project`}
              value={projectId}
              onChange={lockPlacementToMapping ? () => undefined : setProjectId}
              projects={projects}
              projectsLoad={
                lockedPlacement
                  ? { status: "ready", projectIds: projectId ? [projectId] : [] }
                  : projectsLoad
              }
              organizationSelected={Boolean(organizationId)}
              locked={lockedPlacement}
              lockedHelper={projectLockedHelper}
            />
            {touched
            && !lockedPlacement
            && organizationId
            && !projectId
            && projectsLoad.status === "ready" ? (
              <FieldError>Project is required.</FieldError>
            ) : null}

            <div>
              <FieldLabel htmlFor={`${formId}-label`} required>
                Label
              </FieldLabel>
              <Input
                id={`${formId}-label`}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Refresh lookback (days)"
                autoComplete="off"
                maxLength={ADMIN_VARIABLE_LABEL_MAX}
                aria-invalid={
                  (touched && labelMissing) || labelTooLong || undefined
                }
              />
              {touched && labelMissing ? (
                <FieldError>Label is required.</FieldError>
              ) : null}
              {labelTooLong ? (
                <FieldError>
                  Label must be {ADMIN_VARIABLE_LABEL_MAX} characters or fewer.
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
                maxLength={ADMIN_VARIABLE_DESCRIPTION_MAX}
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
                  Description must be {ADMIN_VARIABLE_DESCRIPTION_MAX} characters or fewer.
                </FieldError>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-type`} required>
                Type
              </FieldLabel>
              <SearchableSelect
                id={`${formId}-type`}
                value={type}
                onValueChange={(next) => setType(next as AdminVariableType)}
                options={TYPE_OPTIONS}
                placeholder="Select type"
                searchPlaceholder="Search types…"
              />
            </div>

            {type === "select" ? (
              <div>
                <FieldLabel htmlFor={`${formId}-allowed`} required>
                  Allowed values
                </FieldLabel>
                <Textarea
                  id={`${formId}-allowed`}
                  value={allowedValuesText}
                  onChange={(e) => setAllowedValuesText(e.target.value)}
                  placeholder={"One option per line\nall|All regions\nemea|EMEA"}
                  rows={4}
                />
                <FieldHelper>
                  One option per line. Optional label:{" "}
                  <span className="font-mono">value|Label</span>.
                </FieldHelper>
                {touched && selectNeedsValues ? (
                  <FieldError>Add at least one allowed value for select types.</FieldError>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4 rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] px-3 py-3">
              <div className="min-w-0">
                <p className="luxia-type-body-small font-medium text-[var(--luxia-text-primary)]">
                  Sensitive
                </p>
                <p className="mt-1 luxia-type-caption text-[var(--luxia-text-muted)]">
                  Value is never shown. Customers can only replace it.
                </p>
              </div>
              <Switch
                checked={sensitive}
                onCheckedChange={setSensitive}
                aria-label="Sensitive variable"
              />
            </div>

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
                  : "Create variable"}
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
