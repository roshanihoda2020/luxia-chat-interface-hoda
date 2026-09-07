import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { LuxiaResponseCard } from "@/app/features/chat/LuxiaResponseCard";
import { ResponseActionsFooter } from "@/app/features/chat/ResponseActionsFooter";
import { FilterField } from "@/app/features/home/browserShared";
import { LuxiaPageGuide } from "@/app/components/LuxiaPageHeader";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import { LUXIA_DIRTY_STATE_COPY } from "@/app/features/shared/luxiaSettingsUx";
import { CONSTELLATION_SETTINGS_GUIDANCE } from "../ia";
import {
  cloneResponseConfidencePolicy,
  RESPONSE_CONFIDENCE_PLACEHOLDER_COPY,
  responseConfidencePolicySignature,
} from "./defaults";
import { loadResponseConfidencePolicy, saveResponseConfidencePolicy } from "./persistence";
import { getLiveChatPreviewModel } from "./previewModel";
import {
  formatResponseConfidenceRangeSummary,
  responseConfidenceActionLabel,
} from "./ranges";
import type {
  ResponseConfidenceAction,
  ResponseConfidencePolicy,
  ResponseConfidencePreviewState,
} from "./types";
import {
  formatConfidenceValue,
  policyFromDraftInputs,
  RESPONSE_CONFIDENCE_ACTIONS,
  validateResponseConfidencePolicy,
} from "./validation";

const PREVIEW_STATES: ResponseConfidencePreviewState[] = [
  "normal",
  "warning",
  "error",
  "block",
];

const PREVIEW_SOURCES = [
  { id: "preview-source-a", label: "Source A" },
  { id: "preview-source-b", label: "Source B" },
] as const;

const PREVIEW_TIMESTAMP = "10:14 AM";

function previewStateLabel(state: ResponseConfidencePreviewState): string {
  if (state === "normal") return "Normal";
  return responseConfidenceActionLabel(state);
}

function policyUsesAction(
  policy: ResponseConfidencePolicy,
  action: ResponseConfidenceAction,
): boolean {
  return policy.upper.action === action || policy.lower.action === action;
}

export function ResponseConfidenceSection({
  constellationId,
  canEdit,
  roleHint,
}: {
  constellationId: string;
  canEdit: boolean;
  roleHint?: string | null;
}) {
  const [saved, setSaved] = useState<ResponseConfidencePolicy>(() =>
    loadResponseConfidencePolicy(constellationId),
  );
  const [draft, setDraft] = useState<ResponseConfidencePolicy>(() =>
    cloneResponseConfidencePolicy(saved),
  );
  const [upperRaw, setUpperRaw] = useState(() => formatConfidenceValue(saved.upper.value));
  const [lowerRaw, setLowerRaw] = useState(() => formatConfidenceValue(saved.lower.value));
  const [previewState, setPreviewState] = useState<ResponseConfidencePreviewState>("warning");

  useEffect(() => {
    const next = loadResponseConfidencePolicy(constellationId);
    setSaved(next);
    setDraft(cloneResponseConfidencePolicy(next));
    setUpperRaw(formatConfidenceValue(next.upper.value));
    setLowerRaw(formatConfidenceValue(next.lower.value));
    setPreviewState("warning");
  }, [constellationId]);

  const validation = useMemo(
    () => validateResponseConfidencePolicy({ upperRaw, lowerRaw }),
    [upperRaw, lowerRaw],
  );

  const parsedDraft = useMemo(
    () => policyFromDraftInputs(draft, upperRaw, lowerRaw),
    [draft, upperRaw, lowerRaw],
  );

  const dirty =
    responseConfidencePolicySignature(draft) !== responseConfidencePolicySignature(saved)
    || upperRaw.trim() !== formatConfidenceValue(saved.upper.value)
    || lowerRaw.trim() !== formatConfidenceValue(saved.lower.value);

  const previewUsesWarning = policyUsesAction(draft, "warning");
  const previewUsesError = policyUsesAction(draft, "error");
  const previewUsesBlock = policyUsesAction(draft, "block");
  const livePreview = getLiveChatPreviewModel(
    draft,
    previewState,
    RESPONSE_CONFIDENCE_PLACEHOLDER_COPY.sampleGeneratedAnswer,
  );

  function patchDraft(patch: Partial<ResponseConfidencePolicy>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function handleSave() {
    if (!canEdit || !validation.valid || !parsedDraft) return;
    saveResponseConfidencePolicy(constellationId, parsedDraft);
    setSaved(cloneResponseConfidencePolicy(parsedDraft));
    setDraft(cloneResponseConfidencePolicy(parsedDraft));
    setUpperRaw(formatConfidenceValue(parsedDraft.upper.value));
    setLowerRaw(formatConfidenceValue(parsedDraft.lower.value));
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancel() {
    setDraft(cloneResponseConfidencePolicy(saved));
    setUpperRaw(formatConfidenceValue(saved.upper.value));
    setLowerRaw(formatConfidenceValue(saved.lower.value));
  }

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,36rem)]">
      <div className="min-w-0">
        {roleHint ? (
          <p
            className="mb-4 luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
            role="status"
          >
            {roleHint}
          </p>
        ) : null}

        <section>
          <p className="luxia-type-overline-data" style={{ color: "var(--luxia-text-secondary)" }}>
            Response confidence
          </p>
          <LuxiaPageGuide className="mt-2">
            {CONSTELLATION_SETTINGS_GUIDANCE.responseDescription}
          </LuxiaPageGuide>

          <p
            className="mt-4 luxia-type-body-dense-strong"
            style={{ color: "var(--luxia-text-primary)" }}
          >
            Confidence rules
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <ThresholdFields
              idPrefix="rc-upper"
              title="Higher threshold"
              value={upperRaw}
              action={draft.upper.action}
              error={validation.upper}
              disabled={!canEdit}
              onValueChange={setUpperRaw}
              onActionChange={(action) =>
                setDraft((current) => ({ ...current, upper: { ...current.upper, action } }))
              }
            />
            <ThresholdFields
              idPrefix="rc-lower"
              title="Lower threshold"
              value={lowerRaw}
              action={draft.lower.action}
              error={validation.lower}
              disabled={!canEdit}
              onValueChange={setLowerRaw}
              onActionChange={(action) =>
                setDraft((current) => ({ ...current, lower: { ...current.lower, action } }))
              }
            />
          </div>
          {validation.comparison ? (
            <p className="mt-2 luxia-type-caption" role="alert" style={{ color: "var(--luxia-error)" }}>
              {validation.comparison}
            </p>
          ) : parsedDraft ? (
            <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              {formatResponseConfidenceRangeSummary(parsedDraft)}
            </p>
          ) : (
            <p className="mt-2 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
              Fix threshold values to see the resulting ranges.
            </p>
          )}
        </section>

        {previewUsesWarning ? (
          <ActionFields title="Warning message">
            <FilterField label="Warning message" htmlFor="rc-warning-message">
              <Textarea
                id="rc-warning-message"
                rows={2}
                value={draft.warningMessage}
                disabled={!canEdit}
                onChange={(event) => patchDraft({ warningMessage: event.target.value })}
              />
            </FilterField>
            <AppendToggle
              id="rc-warning-append"
              checked={draft.warningAppend}
              disabled={!canEdit}
              onCheckedChange={(warningAppend) => patchDraft({ warningAppend })}
            />
          </ActionFields>
        ) : null}

        {previewUsesError ? (
          <ActionFields title="Error message">
            <FilterField label="Error message" htmlFor="rc-error-message">
              <Textarea
                id="rc-error-message"
                rows={2}
                value={draft.errorMessage}
                disabled={!canEdit}
                onChange={(event) => patchDraft({ errorMessage: event.target.value })}
              />
            </FilterField>
            <AppendToggle
              id="rc-error-append"
              checked={draft.errorAppend}
              disabled={!canEdit}
              onCheckedChange={(errorAppend) => patchDraft({ errorAppend })}
            />
          </ActionFields>
        ) : null}

        {previewUsesBlock ? (
          <ActionFields title="Block default answer">
            <FilterField label="Block default answer" htmlFor="rc-block-answer">
              <Textarea
                id="rc-block-answer"
                rows={3}
                value={draft.blockDefaultAnswer}
                disabled={!canEdit}
                onChange={(event) => patchDraft({ blockDefaultAnswer: event.target.value })}
              />
            </FilterField>
          </ActionFields>
        ) : null}

        <LuxiaSettingsFormActions
          dirty={dirty}
          canSave={canEdit}
          saveDisabled={!validation.valid}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      <aside className="min-w-0 lg:sticky lg:top-4" aria-label="Chat preview">
        <div className="flex items-center gap-1.5">
          <p className="luxia-type-overline-data" style={{ color: "var(--luxia-text-secondary)" }}>
            Chat preview
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 rounded-[var(--luxia-radius-8)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{ color: "var(--luxia-text-muted)" }}
                aria-label="Preview only. This does not change the saved policy."
              >
                <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              Preview only. This does not change the saved policy.
            </TooltipContent>
          </Tooltip>
        </div>
        <div
          className="mt-3 inline-flex flex-wrap gap-1 rounded-[var(--luxia-radius-12)] p-1"
          style={{
            border: "1px solid var(--luxia-settings-tablist-border)",
            background: "var(--luxia-settings-tablist-bg)",
          }}
          role="group"
          aria-label="Preview state"
        >
          {PREVIEW_STATES.map((state) => {
            const selected = previewState === state;
            return (
              <button
                key={state}
                type="button"
                aria-pressed={selected}
                className="rounded-[var(--luxia-radius-8)] px-3 py-1.5 luxia-type-body-small outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{
                  background: selected ? "var(--luxia-surface)" : "transparent",
                  color: selected ? "var(--luxia-text-primary)" : "var(--luxia-text-secondary)",
                  border: selected ? "1px solid var(--luxia-border-subtle)" : "1px solid transparent",
                }}
                onClick={() => setPreviewState(state)}
              >
                {previewStateLabel(state)}
              </button>
            );
          })}
        </div>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <LuxiaResponseCard
            content={livePreview.content}
            timestamp={PREVIEW_TIMESTAMP}
            presentation={livePreview.presentation}
            notice={livePreview.notice}
            sources={livePreview.showSources ? [...PREVIEW_SOURCES] : undefined}
            footer={
              <ResponseActionsFooter
                key={previewState}
                content={livePreview.content}
                variant={livePreview.footerVariant}
              />
            }
          />
        </div>
      </aside>
    </div>
  );
}

function ThresholdFields({
  idPrefix,
  title,
  value,
  action,
  error,
  disabled,
  onValueChange,
  onActionChange,
}: {
  idPrefix: string;
  title: string;
  value: string;
  action: ResponseConfidenceAction;
  error?: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onActionChange: (action: ResponseConfidenceAction) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <FilterField label="Threshold" htmlFor={`${idPrefix}-value`}>
          <Input
            id={`${idPrefix}-value`}
            inputMode="decimal"
            value={value}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error ? (
            <p className="mt-1 luxia-type-caption" role="alert" style={{ color: "var(--luxia-error)" }}>
              {error}
            </p>
          ) : null}
        </FilterField>
        <FilterField label="Action" htmlFor={`${idPrefix}-action`}>
          <Select
            value={action}
            disabled={disabled}
            onValueChange={(next) => onActionChange(next as ResponseConfidenceAction)}
          >
            <SelectTrigger id={`${idPrefix}-action`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESPONSE_CONFIDENCE_ACTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {responseConfidenceActionLabel(item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>
    </div>
  );
}

function ActionFields({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-5 min-w-0" aria-label={title}>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function AppendToggle({
  id,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--luxia-radius-8)] border px-3 py-2.5" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
      <label htmlFor={id} className="min-w-0 luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
        Append a message to the answer
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label="Append a message to the answer"
      />
    </div>
  );
}
