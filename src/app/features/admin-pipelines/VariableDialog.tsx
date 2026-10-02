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
import { ADMIN_VARIABLE_TYPE_LABELS } from "./format";
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
  /** Prefill key when launched from Airflow Variables → Declare for project. */
  prefillKey?: string | null;
  /** Prefill org/project when launched from Manage variables empty CTA. */
  seedOrganizationId?: string | null;
  seedProjectId?: string | null;
  organizations: AdminOrganization[];
  projects: AdminProject[];
  projectsLoad: AdminProjectsLoadState;
  airflowVariables?: AdminAirflowVariable[];
  onOrganizationChange: (organizationId: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    input: AdminVariableInput,
  ) => Promise<{ ok: boolean; error?: string }>;
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
  organizations,
  projects,
  projectsLoad,
  airflowVariables = [],
  onOrganizationChange,
  onOpenChange,
  onSubmit,
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

  const lockedPlacement = mode === "edit";

  const baseline = useMemo(() => {
    if (mode !== "edit" || !variable) return null;
    return {
      label: variable.label === variable.key ? "" : variable.label,
      description: variable.description,
      type: variable.type,
      sensitive: variable.sensitive,
      allowedValuesText: (variable.allowedValues ?? []).join("\n"),
      key: variable.key,
    };
  }, [mode, variable]);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && variable) {
      setKey(variable.key);
      setOrganizationId(variable.organizationId);
      setProjectId(variable.projectId);
      setLabel(variable.label === variable.key ? "" : variable.label);
      setDescription(variable.description);
      setType(variable.type);
      setSensitive(variable.sensitive);
      setAllowedValuesText((variable.allowedValues ?? []).join("\n"));
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

  const keyOptions = useMemo(
    () =>
      airflowVariables.map((row) => ({
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
      })),
    [airflowVariables],
  );

  const selectedAirflowKey = useMemo(
    () => airflowVariables.find((row) => row.key === key) ?? null,
    [airflowVariables, key],
  );

  const allowedValues = allowedValuesText
    .split(/\n|,/)
    .map((v) => v.trim())
    .filter(Boolean);
  const allowedValuesKey = allowedValues.join("|");

  const selectNeedsValues = type === "select" && allowedValues.length === 0;
  const requiredOk =
    Boolean(key.trim())
    && Boolean(organizationId)
    && Boolean(projectId)
    && Boolean(type)
    && (lockedPlacement || projectsLoad.status === "ready")
    && !selectNeedsValues;

  const effectiveLabel = label.trim() || key.trim();
  const isDirty = useMemo(() => {
    if (!baseline) return true;
    const baselineAllowed = baseline.allowedValuesText
      .split(/\n|,/)
      .map((v) => v.trim())
      .filter(Boolean)
      .join("|");
    return (
      effectiveLabel !== (baseline.label.trim() || baseline.key)
      || description.trim() !== baseline.description.trim()
      || type !== baseline.type
      || sensitive !== baseline.sensitive
      || (type === "select" ? allowedValuesKey !== baselineAllowed : false)
    );
  }, [baseline, effectiveLabel, description, type, sensitive, allowedValuesKey]);

  const hasCreateEdits = Boolean(
    key.trim()
    || organizationId
    || projectId
    || label.trim()
    || description.trim()
    || sensitive
    || allowedValuesText.trim()
    || type !== "text",
  );

  const canSubmit =
    requiredOk
    && !saving
    && (mode === "create" || isDirty);

  function handleOrganizationChange(next: string) {
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

  async function handleSubmit() {
    setTouched(true);
    if (!canSubmit) return;
    setSaving(true);
    setSubmitError(null);
    const result = await onSubmit({
      key: key.trim(),
      label: label.trim(),
      description: description.trim(),
      type,
      sensitive,
      allowedValues,
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
        <DialogContent className="flex max-h-[min(92vh,42rem)] w-[min(100%,34rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle>
              {mode === "edit" ? "Edit variable" : "New variable"}
            </DialogTitle>
            <DialogDescription>
              Declare metadata customers may read or change. Airflow values are never shown
              here.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 luxia-scrollbar">
            {lockedPlacement ? (
              <ReadOnlyField
                id={`${formId}-key`}
                label="Key"
                value={key}
                required
                secondary={selectedAirflowKey?.description ?? undefined}
                helper="Key is immutable after declaration."
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
                {prefillKey ? (
                  <FieldHelper>
                    Prefilled from Airflow inventory. Values are never displayed.
                  </FieldHelper>
                ) : (
                  <FieldHelper>
                    Matches the Airflow variable key. Values are never displayed.
                  </FieldHelper>
                )}
                {touched && !key.trim() ? <FieldError>Key is required.</FieldError> : null}
              </div>
            )}

            <OrganizationSelect
              id={`${formId}-org`}
              value={organizationId}
              organizations={organizations}
              onChange={handleOrganizationChange}
              locked={lockedPlacement}
            />
            {touched && !organizationId && !lockedPlacement ? (
              <FieldError>Organization is required.</FieldError>
            ) : null}

            <ProjectSelect
              id={`${formId}-project`}
              value={projectId}
              onChange={setProjectId}
              projects={projects}
              projectsLoad={
                lockedPlacement
                  ? { status: "ready", projectIds: [projectId] }
                  : projectsLoad
              }
              organizationSelected={Boolean(organizationId)}
              locked={lockedPlacement}
            />
            {touched
            && !lockedPlacement
            && organizationId
            && !projectId
            && projectsLoad.status === "ready" ? (
              <FieldError>Project is required.</FieldError>
            ) : null}

            <div>
              <FieldLabel htmlFor={`${formId}-label`}>Label</FieldLabel>
              <Input
                id={`${formId}-label`}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={key.trim() || "Customer-facing label"}
                autoComplete="off"
              />
              <FieldHelper>
                Optional. If blank, customers see the variable key as the label.
              </FieldHelper>
            </div>

            <div>
              <FieldLabel htmlFor={`${formId}-desc`}>Description</FieldLabel>
              <Textarea
                id={`${formId}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Help text shown to customers"
                rows={3}
              />
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
                  placeholder={"One value per line\nv3.1\nv3.2"}
                  rows={4}
                />
                <FieldHelper>Enter one option per line (or comma-separated).</FieldHelper>
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
                  Sensitive values are hidden in the customer UI. Admin never displays the
                  Airflow value — customers can only replace it.
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
