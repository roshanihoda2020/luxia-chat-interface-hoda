import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageBody, LuxiaPageFrame, LuxiaPageHeadingRegion } from "@/app/components/LuxiaPageFrame";
import { LuxiaPageReadOnlyBadge } from "@/app/components/LuxiaPageReadOnlyBadge";
import {
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import type { ProjectRole } from "@/app/features/permissions";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
  LUXIA_SETTINGS_TAB_PANEL_CLASS,
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaConstellationIcon, LuxiaGalaxyIcon } from "@/assets/icons";
import { canManageVidgets, VIDGET_MANAGE_DENIED_MESSAGE } from "./access";
import {
  cloneVidget,
  formatVidgetUpdatedAt,
  galaxyConstellationIdsEqual,
  normalizeGalaxyConstellationIds,
  withLockedVidgetSource,
  applyVidgetChannelChange,
  applyVidgetWebPublish,
  isVidgetChannelDeploymentReady,
  isVidgetDeploymentActive,
} from "./data";
import { KnowledgeScopeSelector } from "./KnowledgeScopeSelector";
import {
  VIDGET_SETTINGS_SECTIONS,
  VIDGETS_GUIDANCE,
  type VidgetSettingsSectionId,
} from "./ia";
import { VidgetLivePreview } from "./VidgetLivePreview";
import {
  VIDGET_AVATARS,
  VIDGET_CHANNEL_LABELS,
  VIDGET_EXPERIENCE_MODE_LABELS,
  VIDGET_LANGUAGES,
  VIDGET_STATUS_LABELS,
  VIDGET_THEMES,
  VIDGET_WEB_PRESENTATION_LABELS,
  type VidgetBubbleSize,
  type VidgetChannel,
  type VidgetExperienceMode,
  type VidgetPreviewDevice,
  type VidgetRecord,
  type VidgetStatus,
  type VidgetWebPresentation,
} from "./types";

const SURFACE = LUXIA_SETTINGS_CONTENT_SURFACE_CLASS;
const TAB_PANEL = LUXIA_SETTINGS_TAB_PANEL_CLASS;
const READONLY_INPUT =
  "cursor-default border-[var(--luxia-settings-row-divider)] bg-[var(--luxia-surface-subtle)] text-[var(--luxia-text-secondary)] hover:border-[var(--luxia-settings-row-divider)] focus-visible:border-[var(--luxia-settings-row-divider)] focus-visible:shadow-none";
const EDITABLE = new Set<VidgetSettingsSectionId>([
  "general",
  "knowledge",
  "interface",
]);

export interface VidgetSettingsPageProps {
  record: VidgetRecord;
  projectId: string;
  projectName: string;
  galaxyName: string;
  constellationName: string | null;
  constellationOptions: { id: string; name: string }[];
  sourceAvailable?: boolean;
  sourceDisplayLabel?: string;
  activeSection: VidgetSettingsSectionId;
  onSectionChange: (section: VidgetSettingsSectionId) => void;
  onSave: (record: VidgetRecord) => void;
  onPublish: (record: VidgetRecord) => boolean;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenVidgets: (projectId: string) => void;
  currentProjectRole?: ProjectRole | null;
  focusPreviewOnMount?: boolean;
  onPreviewFocusHandled?: () => void;
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
      {children}
    </p>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="luxia-type-overline-data" style={{ color: "var(--luxia-text-secondary)" }}>
        {title}
      </p>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function Divider() {
  return (
    <div
      className="my-6 h-px w-full"
      style={{ background: "var(--luxia-settings-row-divider)" }}
      aria-hidden
    />
  );
}

function SoftPanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[var(--luxia-radius-12)] px-4 py-3"
      style={{
        background: "var(--luxia-surface-subtle)",
        border: "1px solid var(--luxia-settings-row-divider)",
      }}
    >
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-baseline sm:gap-6"
      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
    >
      <dt
        className="shrink-0 luxia-type-caption sm:w-[11rem]"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </dt>
      <dd className="luxia-type-body-dense" style={{ color: "var(--luxia-text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

function isDirty(draft: VidgetRecord, baseline: VidgetRecord) {
  return (
    draft.name !== baseline.name
    || draft.assistantName !== baseline.assistantName
    || draft.language !== baseline.language
    || draft.welcomeMessage !== baseline.welcomeMessage
    || draft.status !== baseline.status
    || draft.vidgetInstruction !== baseline.vidgetInstruction
    || draft.themeId !== baseline.themeId
    || draft.avatarId !== baseline.avatarId
    || draft.tooltipText !== baseline.tooltipText
    || draft.bubbleSize !== baseline.bubbleSize
    || draft.companyLogoName !== baseline.companyLogoName
    || draft.backgroundImageName !== baseline.backgroundImageName
    || draft.chatBubbleLogoName !== baseline.chatBubbleLogoName
    || draft.privacyPolicyFileName !== baseline.privacyPolicyFileName
    || draft.privacyPolicyUrl !== baseline.privacyPolicyUrl
    || draft.experienceMode !== baseline.experienceMode
    || draft.microphoneEnabled !== baseline.microphoneEnabled
    || draft.chatHistoryEnabled !== baseline.chatHistoryEnabled
    || draft.qrEnabled !== baseline.qrEnabled
    || draft.webPresentation !== baseline.webPresentation
    || draft.channel !== baseline.channel
    || !galaxyConstellationIdsEqual(
      draft.galaxyConstellationIds,
      baseline.galaxyConstellationIds,
    )
  );
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
}

/** General save must not publish; only the Publish action may set published. */
function resolveSaveStatus(
  draftStatus: VidgetStatus,
  baselineStatus: VidgetStatus,
): VidgetStatus {
  if (baselineStatus === "draft") {
    return "draft";
  }
  if (draftStatus === "published" && baselineStatus !== "published") {
    return baselineStatus;
  }
  if (baselineStatus === "published" || baselineStatus === "paused") {
    if (draftStatus === "published" || draftStatus === "paused") {
      return draftStatus;
    }
    return baselineStatus;
  }
  return draftStatus;
}

function AssetRow({
  label,
  fileName,
  disabled,
  onUpload,
  onClear,
}: {
  label: string;
  fileName: string | null;
  disabled?: boolean;
  onUpload: (name: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-2.5"
      style={LUXIA_SETTINGS_ROW_DIVIDER}
    >
      <div className="min-w-0">
        <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
          {label}
        </p>
        <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          {fileName ?? "No file uploaded"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {fileName ? (
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.tertiary}
            disabled={disabled}
            onClick={onClear}
          >
            Remove
          </Button>
        ) : null}
        <Button
          type="button"
          {...LUXIA_PAGE_HEADER_ACTION.secondary}
          disabled={disabled}
          onClick={() =>
            onUpload(
              `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}.png`,
            )
          }
        >
          {fileName ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 px-1 py-2"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        className="mt-0.5"
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="min-w-0">
        <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
          {label}
        </span>
        {description ? <Note>{description}</Note> : null}
      </span>
    </label>
  );
}

function SourceChip({
  kind,
  name,
  unavailable = false,
}: {
  kind: "galaxy" | "constellation";
  name: string;
  unavailable?: boolean;
}) {
  const Icon = kind === "galaxy" ? LuxiaGalaxyIcon : LuxiaConstellationIcon;
  if (unavailable) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <Icon size={14} aria-hidden color="currentColor" />
        <span className="truncate">Source unavailable</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon size={14} aria-hidden color="currentColor" />
      <span className="truncate">
        {kind === "galaxy" ? "Galaxy" : "Constellation"} · {name}
      </span>
    </span>
  );
}

export function VidgetSettingsPage({
  record,
  projectId,
  projectName,
  galaxyName,
  constellationName,
  constellationOptions,
  sourceAvailable = true,
  sourceDisplayLabel,
  activeSection,
  onSectionChange,
  onSave,
  onPublish,
  onNavigateHome,
  onOpenProject,
  onOpenVidgets,
  currentProjectRole = null,
  focusPreviewOnMount = false,
  onPreviewFocusHandled,
}: VidgetSettingsPageProps) {
  const previewRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState(() => cloneVidget(record));
  const [baseline, setBaseline] = useState(() => cloneVidget(record));
  const [previewDevice, setPreviewDevice] = useState<VidgetPreviewDevice>("desktop");
  const [previewResetKey, setPreviewResetKey] = useState(0);

  const canManage = canManageVidgets(currentProjectRole);
  const readOnly = !canManage;
  const dirty = isDirty(draft, baseline);
  const sourceName =
    sourceDisplayLabel
    ?? (draft.sourceType === "galaxy" ? galaxyName : constellationName ?? "Source unavailable");
  const publishBlocked =
    !sourceAvailable || !isVidgetChannelDeploymentReady(draft);
  const publishBlockedReason = !sourceAvailable
    ? "Cannot publish while the Vidget source is unavailable"
    : !isVidgetChannelDeploymentReady(draft)
      ? "Configure this channel before publishing"
      : undefined;
  const publishLabel =
    !publishBlocked && (draft.status === "published" || draft.status === "paused")
      ? "Republish"
      : "Publish";
  const publishTabStatusLabel =
    !isVidgetChannelDeploymentReady(draft) && draft.status !== "draft"
      ? VIDGET_STATUS_LABELS.draft
      : VIDGET_STATUS_LABELS[draft.status];
  const deploymentActive = isVidgetDeploymentActive(draft);

  const galaxyScopeItems = useMemo(() => {
    if (draft.sourceType !== "galaxy") return [];
    const selected = normalizeGalaxyConstellationIds(draft.galaxyConstellationIds);
    const optionMap = new Map(constellationOptions.map((item) => [item.id, item.name]));
    return selected.map((id) => ({
      id,
      name: optionMap.get(id) ?? id,
      available: optionMap.has(id),
    }));
  }, [draft.sourceType, draft.galaxyConstellationIds, constellationOptions]);

  const galaxyScopeSummary =
    draft.sourceType === "galaxy" && galaxyScopeItems.length > 0
      ? galaxyScopeItems.length === 1
        ? "1 Constellation"
        : `${galaxyScopeItems.length} Constellations`
      : null;

  const previewTestContext = useMemo(
    () => ({
      sourceAvailable,
      constellationOptions,
      galaxyName,
      constellationName,
    }),
    [sourceAvailable, constellationOptions, galaxyName, constellationName],
  );

  const knowledgeScopeOptions = useMemo(() => {
    const selected = new Set(normalizeGalaxyConstellationIds(draft.galaxyConstellationIds));
    const items = constellationOptions.map((item) => ({
      id: item.id,
      name: item.name,
      available: true,
    }));
    for (const id of selected) {
      if (!items.some((item) => item.id === id)) {
        items.push({ id, name: id, available: false });
      }
    }
    return items;
  }, [constellationOptions, draft.galaxyConstellationIds]);

  useEffect(() => {
    const next = cloneVidget(record);
    setDraft(next);
    setBaseline(next);
  }, [record.id]);

  useEffect(() => {
    if (!focusPreviewOnMount) return;
    const frame = window.requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previewRef.current?.focus({ preventScroll: true });
      onPreviewFocusHandled?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusPreviewOnMount, record.id, onPreviewFocusHandled]);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = useMemo(
    () => [
      { id: "home", label: "Home", destination: { kind: "home" } },
      { id: "project", label: projectName, destination: { kind: "project", projectId } },
      {
        id: "vidgets",
        label: "Vidgets",
        destination: { kind: "vidgets", projectId },
      },
      { id: "vidget", label: draft.name || record.name, destination: { kind: "current" } },
    ],
    [projectId, projectName, draft.name, record.name],
  );

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onVidgets: onOpenVidgets,
  };

  function patch(partial: Partial<VidgetRecord>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function commitLocal(next: VidgetRecord) {
    setDraft(next);
    setBaseline(cloneVidget(next));
  }

  function handleSave() {
    if (!canManage || !dirty) return;
    const next: VidgetRecord = withLockedVidgetSource(
      {
        ...cloneVidget(draft),
        name: draft.name.trim() || record.name,
        assistantName: draft.assistantName.trim() || record.assistantName,
        status: resolveSaveStatus(draft.status, baseline.status),
        galaxyConstellationIds:
          draft.sourceType === "galaxy"
            ? normalizeGalaxyConstellationIds(draft.galaxyConstellationIds)
            : [],
        updatedAt: new Date().toISOString(),
      },
      record,
    );
    onSave(next);
    commitLocal(next);
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handlePublish() {
    if (!canManage || publishBlocked) {
      if (publishBlocked) {
        toast.error(
          !sourceAvailable
            ? "Cannot publish: the Vidget source is unavailable."
            : "Configure this channel before publishing.",
        );
      }
      return;
    }
    const wasPublished = deploymentActive;
    const merged = withLockedVidgetSource(
      {
        ...cloneVidget(draft),
        name: draft.name.trim() || record.name,
        assistantName: draft.assistantName.trim() || record.assistantName,
        galaxyConstellationIds:
          draft.sourceType === "galaxy"
            ? normalizeGalaxyConstellationIds(draft.galaxyConstellationIds)
            : [],
      },
      record,
    );
    const published = applyVidgetWebPublish(merged);
    if (!onPublish(published)) {
      return;
    }
    commitLocal(published);
    onSectionChange("publish");
    toast.success(wasPublished ? "Vidget republished" : "Vidget published");
  }

  function patchChannel(nextChannel: VidgetChannel) {
    if (nextChannel === draft.channel) return;
    setDraft((prev) => applyVidgetChannelChange(prev, nextChannel));
  }

  const avatarSelectionActive = draft.experienceMode === "avatar";
  const isWebChannel = draft.channel === "web";

  function focusPreview() {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    previewRef.current?.focus({ preventScroll: true });
  }

  function formActions() {
    return (
      <LuxiaSettingsFormActions
        dirty={dirty}
        canSave={canManage && EDITABLE.has(activeSection)}
        onSave={handleSave}
        onCancel={() => {
          setDraft(cloneVidget(baseline));
          setPreviewResetKey((value) => value + 1);
        }}
      />
    );
  }

  const deviceOptions: VidgetPreviewDevice[] = isWebChannel
    ? ["desktop", "mobile", "totem"]
    : [];

  return (
    <LuxiaPageFrame variant={VIDGETS_GUIDANCE.pageVariant}>
      <LuxiaPageHeadingRegion>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="VIDGET"
        title={draft.name || record.name}
        titleStyle={{ color: HS.sectionHeading }}
        titleMetadata={
          readOnly ? (
            <LuxiaPageReadOnlyBadge ariaLabel={VIDGET_MANAGE_DENIED_MESSAGE} />
          ) : undefined
        }
        breadcrumb={
          <LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={breadcrumbHandlers} />
        }
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{VIDGET_CHANNEL_LABELS[draft.channel]}</Badge>
            <Badge
              variant={
                draft.status === "published"
                  ? "success"
                  : draft.status === "paused"
                    ? "warning"
                    : "outline"
              }
            >
              {VIDGET_STATUS_LABELS[draft.status]}
            </Badge>
          </div>
        }
        context={
          <div className="space-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="inline-flex min-w-0 items-center luxia-type-caption"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                <SourceChip
                  kind={draft.sourceType}
                  name={sourceName}
                  unavailable={!sourceAvailable}
                />
              </span>
              <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                {formatVidgetUpdatedAt(draft.updatedAt)}
              </span>
            </div>
            {!sourceAvailable ? (
              <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }} role="status">
                The source connected to this Vidget is no longer available.
              </p>
            ) : null}
          </div>
        }
        guide={VIDGETS_GUIDANCE.settingsPageDescription}
        secondaryAction={
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={focusPreview}>
            Preview
          </Button>
        }
        primaryAction={
          canManage ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={handlePublish}
              disabled={publishBlocked}
              title={publishBlockedReason}
            >
              {publishLabel}
            </Button>
          ) : null
        }
      />
      </LuxiaPageHeadingRegion>

      <LuxiaPageBody>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <Tabs
              value={activeSection}
              className="w-full min-w-0 gap-0"
              onValueChange={(value) => {
                const next = VIDGET_SETTINGS_SECTIONS.find((s) => s.id === value)?.id;
                if (!next || next === activeSection) return;
                onSectionChange(next);
              }}
            >
              <div className="mb-4 w-full min-w-0 overflow-x-auto">
                <TabsList
                  aria-label="Vidget Settings sections"
                  className={LUXIA_SETTINGS_TABLIST_CLASS}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {VIDGET_SETTINGS_SECTIONS.map((section) => (
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

              <div className={`w-full min-w-0 ${SURFACE}`}>
                <TabsContent value="general" className={TAB_PANEL}>
                  <Section title="GENERAL">
                    <FilterField label="Vidget name" htmlFor="vs-name">
                      <Input
                        id="vs-name"
                        value={draft.name}
                        disabled={readOnly}
                        onChange={(e) => patch({ name: e.target.value })}
                      />
                    </FilterField>
                    <FilterField label="Channel" htmlFor="vs-channel">
                      <Select
                        value={draft.channel}
                        disabled={readOnly}
                        onValueChange={(value) => patchChannel(value as VidgetChannel)}
                      >
                        <SelectTrigger id="vs-channel" aria-label="Channel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(VIDGET_CHANNEL_LABELS) as VidgetChannel[]).map(
                            (channel) => (
                              <SelectItem key={channel} value={channel}>
                                {VIDGET_CHANNEL_LABELS[channel]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Note>
                        Changing channel does not change the Vidget intelligence source.
                        Published deployment is reset when the channel changes.
                      </Note>
                    </FilterField>
                    <FilterField label="Assistant name" htmlFor="vs-assistant">
                      <Input
                        id="vs-assistant"
                        value={draft.assistantName}
                        disabled={readOnly}
                        onChange={(e) => patch({ assistantName: e.target.value })}
                      />
                    </FilterField>
                    <FilterField label="Language" htmlFor="vs-language">
                      <Select
                        value={draft.language}
                        disabled={readOnly}
                        onValueChange={(value) => patch({ language: value })}
                      >
                        <SelectTrigger id="vs-language" aria-label="Language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDGET_LANGUAGES.map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>
                    <FilterField label="Welcome message" htmlFor="vs-welcome">
                      <Textarea
                        id="vs-welcome"
                        rows={3}
                        value={draft.welcomeMessage}
                        disabled={readOnly}
                        onChange={(e) => patch({ welcomeMessage: e.target.value })}
                      />
                    </FilterField>
                  </Section>
                  <Divider />
                  <Section title="SOURCE">
                    <SoftPanel>
                      <SourceChip
                        kind={draft.sourceType}
                        name={sourceName}
                        unavailable={!sourceAvailable}
                      />
                      {draft.sourceType === "galaxy" && galaxyScopeSummary ? (
                        <p
                          className="mt-2 luxia-type-body-dense"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          Scope · {galaxyScopeSummary}
                        </p>
                      ) : null}
                      <Note>
                        {sourceAvailable
                          ? "Source is locked after creation. Create a new Vidget to bind a different Galaxy or Constellation."
                          : "The source connected to this Vidget is no longer available. Publishing is blocked until the source is restored or a new Vidget is created."}
                      </Note>
                    </SoftPanel>
                  </Section>
                  {formActions()}
                </TabsContent>

                <TabsContent value="knowledge" className={TAB_PANEL}>
                  <Section title="KNOWLEDGE SOURCE">
                    {draft.sourceType === "galaxy" ? (
                      <>
                        <SoftPanel>
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            Galaxy ·{" "}
                            <SourceChip
                              kind="galaxy"
                              name={sourceName}
                              unavailable={!sourceAvailable}
                            />
                          </p>
                          <Note>Galaxy is locked after creation.</Note>
                        </SoftPanel>
                        <div className="mt-4">
                          <p
                            className="mb-2 luxia-type-overline-data"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            Knowledge scope
                          </p>
                          {readOnly ? (
                            galaxyScopeItems.length === 0 ? (
                              <Note>No Constellations selected.</Note>
                            ) : (
                              <ul className="space-y-2" role="list">
                                {galaxyScopeItems.map((item) => (
                                  <li
                                    key={item.id}
                                    className="rounded-[var(--luxia-radius-12)] px-3.5 py-2.5 luxia-type-body-dense"
                                    style={{
                                      border: "1px solid var(--luxia-settings-row-divider)",
                                      background: "var(--luxia-surface-subtle)",
                                      color: "var(--luxia-text-primary)",
                                    }}
                                  >
                                    {item.name}
                                    {!item.available ? (
                                      <span
                                        className="ml-2 luxia-type-caption"
                                        style={{ color: "var(--luxia-text-muted)" }}
                                      >
                                        — unavailable
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )
                          ) : (
                            <KnowledgeScopeSelector
                              idPrefix="vs-knowledge-scope"
                              constellations={knowledgeScopeOptions}
                              selectedIds={normalizeGalaxyConstellationIds(
                                draft.galaxyConstellationIds,
                              )}
                              onChange={(ids) =>
                                patch({ galaxyConstellationIds: ids })
                              }
                              variant="settings"
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      <SoftPanel>
                        <p
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          Constellation ·{" "}
                          <SourceChip
                            kind="constellation"
                            name={sourceName}
                            unavailable={!sourceAvailable}
                          />
                        </p>
                        <Note>Source is locked after creation.</Note>
                      </SoftPanel>
                    )}
                  </Section>
                  <Divider />
                  <Section title="VIDGET INSTRUCTION">
                    <FilterField label="Optional presentation instruction" htmlFor="vs-instruction">
                      <Textarea
                        id="vs-instruction"
                        rows={4}
                        value={draft.vidgetInstruction}
                        disabled={readOnly}
                        placeholder="Optional guidance for how this Vidget should present answers…"
                        onChange={(e) => patch({ vidgetInstruction: e.target.value })}
                      />
                    </FilterField>
                    <Note>
                      This does not overwrite Galaxy or Constellation instructions. It only shapes
                      this external experience.
                    </Note>
                  </Section>
                  {draft.sourceType === "galaxy" ? (
                    <>
                      <Divider />
                      <SoftPanel>
                        <Note>
                          Galaxy orchestration (Helios) coordinates answers across the selected
                          Constellations in this Project.
                        </Note>
                      </SoftPanel>
                    </>
                  ) : null}
                  {formActions()}
                </TabsContent>

                <TabsContent value="interface" className={TAB_PANEL}>
                  <Section title="BRANDING">
                    <div className="space-y-0">
                      <AssetRow
                        label="Company logo"
                        fileName={draft.companyLogoName}
                        disabled={readOnly}
                        onUpload={(name) => patch({ companyLogoName: name })}
                        onClear={() => patch({ companyLogoName: null })}
                      />
                      <AssetRow
                        label="Background image"
                        fileName={draft.backgroundImageName}
                        disabled={readOnly}
                        onUpload={(name) => patch({ backgroundImageName: name })}
                        onClear={() => patch({ backgroundImageName: null })}
                      />
                      <AssetRow
                        label="Chat bubble logo"
                        fileName={draft.chatBubbleLogoName}
                        disabled={readOnly}
                        onUpload={(name) => patch({ chatBubbleLogoName: name })}
                        onClear={() => patch({ chatBubbleLogoName: null })}
                      />
                    </div>
                  </Section>
                  <Divider />
                  <Section title="ASSISTANT">
                    <FilterField label="Experience mode" htmlFor="vs-experience-mode">
                      <Select
                        value={draft.experienceMode}
                        disabled={readOnly}
                        onValueChange={(value) =>
                          patch({ experienceMode: value as VidgetExperienceMode })
                        }
                      >
                        <SelectTrigger id="vs-experience-mode" aria-label="Experience mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(VIDGET_EXPERIENCE_MODE_LABELS) as VidgetExperienceMode[]).map(
                            (mode) => (
                              <SelectItem key={mode} value={mode}>
                                {VIDGET_EXPERIENCE_MODE_LABELS[mode]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </FilterField>
                    <div>
                      <p
                        className="mb-2 luxia-type-caption"
                        style={{
                          color: avatarSelectionActive
                            ? "var(--luxia-text-secondary)"
                            : "var(--luxia-text-muted)",
                        }}
                      >
                        Avatar
                        {!avatarSelectionActive ? (
                          <span className="ml-1.5">(not used in current mode)</span>
                        ) : null}
                      </p>
                      <div
                        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
                        role="listbox"
                        aria-label="Avatar"
                        aria-disabled={!avatarSelectionActive}
                        style={{ opacity: avatarSelectionActive ? 1 : 0.45 }}
                      >
                        {VIDGET_AVATARS.map((avatar) => {
                          const selected = draft.avatarId === avatar.id;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              disabled={readOnly || !avatarSelectionActive}
                              title={avatar.name}
                              className="flex flex-col items-center gap-1.5 rounded-[var(--luxia-radius-12)] px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                border: selected
                                  ? "1px solid var(--luxia-brand-primary)"
                                  : "1px solid var(--luxia-settings-row-divider)",
                                background: selected
                                  ? "var(--luxia-opacity-brand-primary-08)"
                                  : "transparent",
                              }}
                              onClick={() => patch({ avatarId: avatar.id })}
                            >
                              <span
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white luxia-type-caption"
                                style={{ background: avatar.color }}
                                aria-hidden
                              >
                                {avatar.name.replace("Avatar ", "A")}
                              </span>
                              <span
                                className="luxia-type-caption"
                                style={{ color: "var(--luxia-text-secondary)" }}
                              >
                                {avatar.name.replace("Avatar ", "")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <ToggleRow
                      id="vs-mic"
                      label="Microphone"
                      description="Allow voice input in the experience."
                      checked={draft.microphoneEnabled}
                      disabled={readOnly}
                      onCheckedChange={(next) => patch({ microphoneEnabled: next })}
                    />
                  </Section>
                  <Divider />
                  <Section title="CHAT INTERFACE">
                    <FilterField label="Theme" htmlFor="vs-theme">
                      <Select
                        value={draft.themeId}
                        disabled={readOnly}
                        onValueChange={(value) => patch({ themeId: value })}
                      >
                        <SelectTrigger id="vs-theme" aria-label="Theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDGET_THEMES.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterField>
                    {isWebChannel ? (
                      <>
                        <FilterField label="Bubble size" htmlFor="vs-bubble">
                          <Select
                            value={draft.bubbleSize}
                            disabled={readOnly}
                            onValueChange={(value) =>
                              patch({ bubbleSize: value as VidgetBubbleSize })
                            }
                          >
                            <SelectTrigger id="vs-bubble" aria-label="Bubble size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </FilterField>
                        <FilterField label="Tooltip" htmlFor="vs-tooltip">
                          <Input
                            id="vs-tooltip"
                            value={draft.tooltipText}
                            disabled={readOnly}
                            onChange={(e) => patch({ tooltipText: e.target.value })}
                          />
                        </FilterField>
                      </>
                    ) : null}
                    <ToggleRow
                      id="vs-history"
                      label="Chat history"
                      description="Keep prior turns visible in the conversation."
                      checked={draft.chatHistoryEnabled}
                      disabled={readOnly}
                      onCheckedChange={(next) => patch({ chatHistoryEnabled: next })}
                    />
                    {isWebChannel ? (
                      <>
                        <ToggleRow
                          id="vs-qr"
                          label="QR code"
                          description="Show a QR affordance on the hosted experience."
                          checked={draft.qrEnabled}
                          disabled={readOnly}
                          onCheckedChange={(next) => patch({ qrEnabled: next })}
                        />
                        <FilterField label="Web presentation" htmlFor="vs-web-presentation">
                          <Select
                            value={draft.webPresentation}
                            disabled={readOnly}
                            onValueChange={(value) =>
                              patch({ webPresentation: value as VidgetWebPresentation })
                            }
                          >
                            <SelectTrigger id="vs-web-presentation" aria-label="Web presentation">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.keys(
                                  VIDGET_WEB_PRESENTATION_LABELS,
                                ) as VidgetWebPresentation[]
                              ).map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                  {VIDGET_WEB_PRESENTATION_LABELS[mode]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FilterField>
                      </>
                    ) : null}
                  </Section>
                  <Divider />
                  <Section title="PRIVACY">
                    <AssetRow
                      label="Privacy policy file"
                      fileName={draft.privacyPolicyFileName}
                      disabled={readOnly}
                      onUpload={(name) =>
                        patch({ privacyPolicyFileName: name.replace(/\.png$/, ".pdf") })
                      }
                      onClear={() => patch({ privacyPolicyFileName: null })}
                    />
                    <FilterField label="Privacy policy URL (optional)" htmlFor="vs-privacy-url">
                      <Input
                        id="vs-privacy-url"
                        value={draft.privacyPolicyUrl ?? ""}
                        disabled={readOnly}
                        placeholder="https://"
                        onChange={(e) =>
                          patch({
                            privacyPolicyUrl: e.target.value.trim() ? e.target.value : null,
                          })
                        }
                      />
                    </FilterField>
                  </Section>
                  <Divider />
                  <Section title="PREVIEW DEVICE">
                    {isWebChannel ? (
                      <>
                        <Note>
                          Device toggle only affects the live preview panel. It is not saved with
                          the Vidget.
                        </Note>
                        <div
                          className="inline-flex flex-wrap gap-1 rounded-[var(--luxia-radius-12)] p-1"
                          style={{
                            border: "1px solid var(--luxia-settings-tablist-border)",
                            background: "var(--luxia-settings-tablist-bg)",
                          }}
                          role="group"
                          aria-label="Preview device"
                        >
                          {deviceOptions.map((device) => {
                            const selected = previewDevice === device;
                            return (
                              <button
                                key={device}
                                type="button"
                                aria-pressed={selected}
                                className="rounded-[var(--luxia-radius-8)] px-3 py-1.5 luxia-type-body-small outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                                style={{
                                  background: selected
                                    ? "var(--luxia-surface)"
                                    : "transparent",
                                  color: selected
                                    ? "var(--luxia-text-primary)"
                                    : "var(--luxia-text-secondary)",
                                  border: selected
                                    ? "1px solid var(--luxia-border-subtle)"
                                    : "1px solid transparent",
                                }}
                                onClick={() => setPreviewDevice(device)}
                              >
                                {device === "totem"
                                  ? "Totem"
                                  : device === "mobile"
                                    ? "Mobile"
                                    : "Desktop"}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <Note>
                        Preview is not available until this channel is configured.
                      </Note>
                    )}
                  </Section>
                  {formActions()}
                </TabsContent>

                <TabsContent value="publish" className={TAB_PANEL}>
                  <Section title="PUBLISH STATUS">
                    <dl>
                      <MetaRow label="Status" value={publishTabStatusLabel} />
                      <MetaRow label="Channel" value={VIDGET_CHANNEL_LABELS[draft.channel]} />
                      <MetaRow
                        label="Last published"
                        value={
                          deploymentActive && draft.lastPublishedAt
                            ? formatVidgetUpdatedAt(draft.lastPublishedAt).replace(/^Updated /, "")
                            : "Not published yet"
                        }
                      />
                    </dl>
                    {!isVidgetChannelDeploymentReady(draft) ? (
                      <div className="mt-3">
                        <Note>
                          Configure this channel before publishing.
                        </Note>
                      </div>
                    ) : null}
                    {isWebChannel && !deploymentActive && sourceAvailable ? (
                      <div className="mt-3">
                        <Note>
                          Publish this Vidget to generate its deployment outputs.
                        </Note>
                      </div>
                    ) : null}
                    {!sourceAvailable ? (
                      <div className="mt-3">
                        <Note>
                          Publish is unavailable while the source is missing or invalid.
                        </Note>
                      </div>
                    ) : null}
                  </Section>
                  <Divider />
                  <Section title="DEPLOYMENT">
                    {draft.channel === "web" ? (
                      deploymentActive ? (
                      <div className="space-y-4">
                        <FilterField label="Hosted URL" htmlFor="vs-hosted-url">
                          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                            <Input
                              id="vs-hosted-url"
                              value={draft.hostedUrl ?? ""}
                              readOnly
                              className={READONLY_INPUT}
                            />
                            <Button
                              type="button"
                              {...LUXIA_PAGE_HEADER_ACTION.secondary}
                              onClick={() => {
                                if (draft.hostedUrl) void copyText("Hosted URL", draft.hostedUrl);
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </FilterField>
                        <FilterField label="Embed code" htmlFor="vs-embed">
                          <div className="space-y-2">
                            <Textarea
                              id="vs-embed"
                              value={draft.embedSnippet ?? ""}
                              readOnly
                              rows={3}
                              className={READONLY_INPUT}
                            />
                            <Button
                              type="button"
                              {...LUXIA_PAGE_HEADER_ACTION.secondary}
                              onClick={() => {
                                if (draft.embedSnippet) {
                                  void copyText("Embed code", draft.embedSnippet);
                                }
                              }}
                            >
                              Copy embed code
                            </Button>
                          </div>
                        </FilterField>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            {...LUXIA_PAGE_HEADER_ACTION.secondary}
                            onClick={focusPreview}
                          >
                            Open preview
                          </Button>
                          <Button
                            type="button"
                            {...LUXIA_PAGE_HEADER_ACTION.tertiary}
                            onClick={() =>
                              window.open(draft.hostedUrl!, "_blank", "noopener,noreferrer")
                            }
                          >
                            Open hosted page
                          </Button>
                        </div>
                        {draft.qrEnabled ? (
                          <SoftPanel>
                            <div className="flex items-center gap-3">
                              <span
                                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] luxia-type-caption"
                                style={{
                                  background: "#fff",
                                  border: "1px solid var(--luxia-border-subtle)",
                                  color: "var(--luxia-text-muted)",
                                }}
                                aria-hidden
                              >
                                QR
                              </span>
                              <div className="min-w-0">
                                <p
                                  className="luxia-type-body-dense-strong"
                                  style={{ color: "var(--luxia-text-primary)" }}
                                >
                                  QR code
                                </p>
                                <Note>
                                  QR placeholder for mobile handoff (prototype).
                                </Note>
                              </div>
                            </div>
                          </SoftPanel>
                        ) : null}
                        <div className="space-y-2">
                          <FilterField label="Totem / fullscreen URL" htmlFor="vs-totem-url">
                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                              <Input
                                id="vs-totem-url"
                                value={`${draft.hostedUrl}?mode=totem`}
                                readOnly
                                className={READONLY_INPUT}
                              />
                              <Button
                                type="button"
                                {...LUXIA_PAGE_HEADER_ACTION.secondary}
                                onClick={() =>
                                  void copyText("Totem URL", `${draft.hostedUrl}?mode=totem`)
                                }
                              >
                                Copy
                              </Button>
                            </div>
                          </FilterField>
                          <Button
                            type="button"
                            {...LUXIA_PAGE_HEADER_ACTION.secondary}
                            onClick={() =>
                              window.open(
                                `${draft.hostedUrl}?mode=totem`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            Open fullscreen
                          </Button>
                        </div>
                      </div>
                      ) : (
                        <SoftPanel>
                          <p
                            className="luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            Not published yet
                          </p>
                          <Note>
                            {sourceAvailable
                              ? "Publish this Vidget to generate its deployment outputs."
                              : "Deployment outputs will appear here after the source is restored and the Vidget is published."}
                          </Note>
                        </SoftPanel>
                      )
                    ) : (
                      <SoftPanel>
                        <p
                          className="luxia-type-body-dense-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {draft.channel === "whatsapp" ? "Connection" : "Voice channel"}
                        </p>
                        <Note>Not configured</Note>
                        <Note>Configure this channel before publishing.</Note>
                      </SoftPanel>
                    )}
                  </Section>
                  {publishBlocked && canManage ? (
                    <p
                      className="mt-6 luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                      role="status"
                    >
                      {!sourceAvailable
                        ? "Publish is unavailable while the source is missing or invalid."
                        : "Publish is unavailable until this channel is configured."}
                    </p>
                  ) : null}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <aside
            ref={previewRef}
            tabIndex={-1}
            className="min-w-0 outline-none lg:sticky lg:top-4"
            aria-label="Vidget live preview"
          >
            <div className={`${SURFACE} p-4 sm:p-5`}>
              <VidgetLivePreview
                record={draft}
                device={previewDevice}
                onDeviceChange={isWebChannel ? setPreviewDevice : undefined}
                previewResetKey={previewResetKey}
                galaxyName={galaxyName}
                constellationName={constellationName}
                galaxyScopeSummary={galaxyScopeSummary}
                sourceUnavailable={!sourceAvailable}
                testContext={previewTestContext}
              />
            </div>
          </aside>
        </div>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
