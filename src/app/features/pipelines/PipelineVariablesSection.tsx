import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import type { PipelineSelectOption, PipelineVariableRecord } from "./types";

const SURFACE = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

const SECTION_WIDTH_CLASS = "w-full min-w-0 max-w-2xl";

const ROW_CLASS =
  "luxia-settings-row grid gap-2.5 px-4 py-2.5 sm:grid-cols-[minmax(12rem,24rem)_minmax(12rem,14rem)] sm:items-start sm:gap-x-5 sm:px-5 sm:py-3 max-sm:grid-cols-1";

const CONTROL_COLUMN_CLASS = "min-w-0 w-full max-sm:max-w-none";

export type PipelineVariablesSectionHandle = {
  saveChanged: () => boolean;
  isDirty: () => boolean;
  isValid: () => boolean;
};

export interface PipelineVariablesSectionProps {
  variables: PipelineVariableRecord[];
  canEdit: boolean;
  /**
   * Receives only variables the user actually changed.
   * Production integration should PATCH each item individually
   * (`PATCH /variables/:key` with `{ projectId, value }`).
   */
  onSave: (changed: PipelineVariableRecord[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

type DraftMap = Record<string, string | number | boolean | null>;

/**
 * Customer-facing Variables settings surface.
 * Exposure is admin-defined; customers only edit allowed values.
 * Sensitive values are replace-only and never revealed.
 */
export const PipelineVariablesSection = forwardRef<
  PipelineVariablesSectionHandle,
  PipelineVariablesSectionProps
>(function PipelineVariablesSection(
  { variables, canEdit, onSave, onDirtyChange },
  ref,
) {
  const [draft, setDraft] = useState<DraftMap>(() => toDraft(variables));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(toDraft(variables));
    setFieldErrors({});
  }, [variables]);

  const dirty = useMemo(
    () => variables.some((item) => !valuesEqual(item, draft[item.id])),
    [variables, draft],
  );

  const valid = useMemo(
    () => variables.every((item) => isValidDraft(item, draft[item.id])),
    [variables, draft],
  );

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useImperativeHandle(
    ref,
    () => ({
      isDirty: () => dirty,
      isValid: () => valid,
      saveChanged: () => {
        if (!canEdit || !dirty || !valid) return false;
        const changed = collectChangedVariables(variables, draft);
        if (changed.length === 0) return false;
        onSave(changed);
        return true;
      },
    }),
    [canEdit, dirty, valid, variables, draft, onSave],
  );

  if (variables.length === 0) {
    return (
      <div
        className="w-full max-w-2xl rounded-[var(--luxia-radius-12)] border bg-white px-5 py-6"
        style={{
          borderColor: "var(--luxia-border-default)",
          boxShadow: "var(--luxia-shadow-xs)",
        }}
        role="status"
      >
        <p
          className="luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          No variables exposed
        </p>
        <p
          className="mt-1 luxia-type-body-dense"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          No configurable variables have been made available for this pipeline.
        </p>
      </div>
    );
  }

  function updateDraft(
    id: string,
    nextValue: string | number | boolean | null,
  ) {
    setDraft((prev) => ({ ...prev, [id]: nextValue }));
    setFieldErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleCancel() {
    setDraft(toDraft(variables));
    setFieldErrors({});
  }

  function handleSave() {
    if (!canEdit || !dirty || !valid) return;
    const changed = collectChangedVariables(variables, draft);
    if (changed.length === 0) return;
    // Prototype save is synchronous — no fabricated network delay.
    // Production: disable/saving UI around awaited per-key PATCH calls;
    // keep successful keys, retain failed drafts + fieldErrors, allow retry.
    onSave(changed);
  }

  return (
    <div
      className={`${SECTION_WIDTH_CLASS} ${SURFACE}${
        canEdit ? "" : " luxia-pipeline-variables-readonly"
      }`}
      data-readonly={canEdit ? undefined : "true"}
    >
      {!canEdit ? (
        <div
          className="border-b px-4 py-2.5 sm:px-5"
          style={{
            borderColor: "var(--luxia-settings-row-divider)",
            background: "var(--luxia-settings-section-bg)",
          }}
          role="status"
        >
          <p
            className="luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            View only — you don’t have permission to change these variables.
          </p>
        </div>
      ) : null}

      <ul className="m-0 list-none p-0">
        {variables.map((item) => {
          const error = fieldErrors[item.id];
          return (
            <li
              key={item.id}
              className={ROW_CLASS}
              style={{ borderColor: "var(--luxia-settings-row-divider)" }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-0.5 truncate luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                  title={item.key}
                >
                  {item.key}
                </p>
                {item.description ? (
                  <p
                    className="mt-1 luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>
              <div className={CONTROL_COLUMN_CLASS}>
                <VariableField
                  item={item}
                  value={draft[item.id]}
                  disabled={!canEdit}
                  error={error}
                  onChange={(nextValue) => updateDraft(item.id, nextValue)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {canEdit ? (
        <LuxiaSettingsFormActions
          flush
          dirty={dirty}
          canSave
          saveDisabled={!valid}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : null}
    </div>
  );
});

function VariableField({
  item,
  value,
  disabled,
  error,
  onChange,
}: {
  item: PipelineVariableRecord;
  value: string | number | boolean | null | undefined;
  disabled: boolean;
  error?: string;
  onChange: (next: string | number | boolean | null) => void;
}) {
  const errorId = error ? `var-error-${item.id}` : undefined;

  if (item.sensitive) {
    const helperId = `var-helper-${item.id}`;
    const describedBy = [helperId, errorId].filter(Boolean).join(" ");
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`var-${item.id}`} className="sr-only">
          {item.label}
        </Label>
        <Input
          id={`var-${item.id}`}
          type="password"
          autoComplete="new-password"
          disabled={disabled}
          className="w-full"
          value={typeof value === "string" ? value : ""}
          placeholder="Enter a new value to replace"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <p
          id={helperId}
          className="luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          Current value is hidden. Leave blank to keep it unchanged.
        </p>
        {error ? (
          <p
            id={errorId}
            className="luxia-type-caption"
            style={{ color: "var(--luxia-error-70)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (item.type === "boolean") {
    const checked = Boolean(value);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <Switch
            id={`var-${item.id}`}
            checked={checked}
            disabled={disabled}
            aria-label={item.label}
            onCheckedChange={(next) => onChange(next)}
          />
          <span
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {checked ? "On" : "Off"}
          </span>
        </div>
        {error ? (
          <p
            id={errorId}
            className="luxia-type-caption"
            style={{ color: "var(--luxia-error-70)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const selectOptions = resolveSelectOptions(item);
  if (item.type === "select" && selectOptions.length > 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`var-${item.id}`} className="sr-only">
          {item.label}
        </Label>
        <Select
          value={String(value ?? "")}
          disabled={disabled}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger
            id={`var-${item.id}`}
            className="w-full"
            aria-label={item.label}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error ? (
          <p
            id={errorId}
            className="luxia-type-caption"
            style={{ color: "var(--luxia-error-70)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (item.type === "number") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`var-${item.id}`} className="sr-only">
          {item.label}
        </Label>
        <Input
          id={`var-${item.id}`}
          type="number"
          disabled={disabled}
          className="w-full"
          value={value == null ? "" : String(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onChange(null);
              return;
            }
            const parsed = Number(raw);
            onChange(Number.isFinite(parsed) ? parsed : null);
          }}
        />
        {error ? (
          <p
            id={errorId}
            className="luxia-type-caption"
            style={{ color: "var(--luxia-error-70)" }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`var-${item.id}`} className="sr-only">
        {item.label}
      </Label>
      <Input
        id={`var-${item.id}`}
        type="text"
        disabled={disabled}
        className="w-full"
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p
          id={errorId}
          className="luxia-type-caption"
          style={{ color: "var(--luxia-error-70)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Only variables the customer actually changed — ready for per-key PATCH later.
 * Sensitive blanks are omitted (leave unchanged).
 */
function collectChangedVariables(
  variables: PipelineVariableRecord[],
  draft: DraftMap,
): PipelineVariableRecord[] {
  const changed: PipelineVariableRecord[] = [];
  for (const item of variables) {
    if (valuesEqual(item, draft[item.id])) continue;
    if (item.sensitive) {
      const value = draft[item.id];
      if (value == null || value === "") continue;
      changed.push({ ...item, value });
      continue;
    }
    changed.push({ ...item, value: draft[item.id] ?? item.value });
  }
  return changed;
}

function resolveSelectOptions(
  item: PipelineVariableRecord,
): PipelineSelectOption[] {
  if (item.selectOptions && item.selectOptions.length > 0) {
    return item.selectOptions;
  }
  return (item.allowedValues ?? []).map((value) => ({ value, label: value }));
}

function toDraft(variables: PipelineVariableRecord[]): DraftMap {
  const draft: DraftMap = {};
  for (const item of variables) {
    draft[item.id] = item.sensitive ? "" : item.value;
  }
  return draft;
}

function valuesEqual(
  item: PipelineVariableRecord,
  draftValue: string | number | boolean | null | undefined,
): boolean {
  if (item.sensitive) {
    return draftValue == null || draftValue === "";
  }
  return Object.is(item.value, draftValue);
}

function isValidDraft(
  item: PipelineVariableRecord,
  draftValue: string | number | boolean | null | undefined,
): boolean {
  if (item.sensitive) return true;
  if (item.type === "number") {
    if (draftValue === null || draftValue === "") return false;
    return typeof draftValue === "number" && Number.isFinite(draftValue);
  }
  if (item.type === "select") {
    const values = resolveSelectOptions(item).map((option) => option.value);
    return typeof draftValue === "string" && values.includes(draftValue);
  }
  if (item.type === "boolean") return typeof draftValue === "boolean";
  return typeof draftValue === "string";
}
