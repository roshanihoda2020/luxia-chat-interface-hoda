import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildGalaxySettingsBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import {
  LuxiaPageGuide,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
  LuxiaPageEntityUpdatedMeta,
} from "@/app/components/LuxiaPageHeader";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { Input } from "@/app/components/ui/input";
import { RadioGroup } from "@/app/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import type { ProjectRole } from "@/app/features/permissions";
import { canEditGalaxySettings } from "@/app/features/permissions";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_TAB_PANEL_CLASS,
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { LuxiaConstellationIcon } from "@/assets/icons";
import { GALAXY_HELIOS_CAPABILITIES } from "./data";
import { detectGalaxyInstructionConflicts } from "./instructionConflicts";
import {
  GALAXY_SETTINGS_GUIDANCE,
  GALAXY_SETTINGS_PAGE_VARIANT,
  GALAXY_SETTINGS_SECTIONS,
  type GalaxySettingsSectionId,
} from "./ia";
import { filterRoutingItemsBySearch } from "./routing";
import {
  draftFromGalaxySettings,
  generalDraftDirty,
  instructionDraftDirty,
  resolveManualSelectionIds,
  routingDraftDirty,
  type GalaxyConstellationRoutingItem,
  type GalaxyInstructionConflict,
  type GalaxySettingsDraft,
  type GalaxySettingsRecord,
} from "./types";

const PARENT_SURFACE_CLASS = LUXIA_SETTINGS_CONTENT_SURFACE_CLASS;
const SETTINGS_TAB_PANEL_CLASS = LUXIA_SETTINGS_TAB_PANEL_CLASS;

const EDITABLE_SECTIONS = new Set<GalaxySettingsSectionId>([
  "general",
  "instruction",
  "routing",
]);

export interface GalaxySettingsPageProps {
  record: GalaxySettingsRecord;
  unavailable?: boolean;
  unavailableReason?: string;
  constellationItems: GalaxyConstellationRoutingItem[];
  activeSection: GalaxySettingsSectionId;
  onSectionChange: (section: GalaxySettingsSectionId) => void;
  focusHeadingToken?: number;
  onSaveGeneral: (draft: Pick<GalaxySettingsDraft, "name">) => void;
  onSaveInstruction: (draft: Pick<GalaxySettingsDraft, "instruction">) => void;
  onSaveRouting: (
    draft: Pick<GalaxySettingsDraft, "routeMode" | "manualConstellationIds">,
  ) => void;
  onOpenGalaxy: (projectId: string) => void;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenConstellations?: (projectId: string) => void;
  onOpenAccessLevels?: () => void;
  onOpenDataSources?: () => void;
  currentProjectRole?: ProjectRole | null;
}

import {
  CapabilityRow,
  ConflictSurface,
  DefinitionRow,
  GS_ACCESS_LIST_WIDTH,
  GS_FORM_FIELD_WIDTH,
  GS_FORM_TAB_WIDTH,
  GS_LIST_TAB_WIDTH,
  GS_READONLY_INPUT_CLASS,
  GS_SUBTLE_SURFACE,
  HeliosFlowSteps,
  HeliosStatusHeading,
  RelatedAccessNav,
  RouteModeOption,
  SectionBlock,
  SectionOverline,
  SettingsDivider,
  SettingsListSurface,
  SubsectionCollapsibleTrigger,
  SummaryPanel,
} from "./galaxySettingsLayout";

function ConstellationTypeBadge({
  type,
  label,
}: {
  type: GalaxyConstellationRoutingItem["type"];
  label: string;
}) {
  const variant = type === "database" ? "database" : type === "csv" ? "csv" : "pdf";
  return (
    <Badge variant={variant} className="min-h-0 h-[15px] px-1 py-0 luxia-type-badge">
      {label}
    </Badge>
  );
}

function AvailabilityLabel({
  available,
  reason,
}: {
  available: boolean;
  reason?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
      <span
        className="luxia-type-caption"
        style={{
          color: available
            ? "var(--luxia-text-secondary)"
            : "var(--luxia-text-muted)",
        }}
      >
        {available ? "Available" : "Unavailable"}
      </span>
      {!available && reason ? (
        <span
          className="luxia-type-caption max-w-[12rem]"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          {reason}
        </span>
      ) : null}
    </div>
  );
}

function ConstellationRoutingRow({
  item,
  selected,
  selectable,
  readOnly,
  onToggle,
}: {
  item: GalaxyConstellationRoutingItem;
  selected?: boolean;
  selectable?: boolean;
  readOnly?: boolean;
  onToggle?: () => void;
}) {
  const rowId = `gs-constellation-${item.id}`;

  if (readOnly) {
    return (
      <li className="luxia-settings-row flex min-w-0 items-center gap-3 py-3.5">
        <LuxiaConstellationIcon
          size={18}
          aria-hidden
          color="var(--luxia-text-secondary)"
        />
        <div className="min-w-0 flex-1">
          <p
            className="luxia-type-body-dense truncate"
            style={{ color: "var(--luxia-text-primary)" }}
          >
            {item.name}
          </p>
          <div className="mt-1">
            <ConstellationTypeBadge type={item.type} label={item.typeLabel} />
          </div>
        </div>
        {selected ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 luxia-type-caption"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            <Check size={14} aria-hidden />
            Selected
          </span>
        ) : (
          <AvailabilityLabel available={item.available} reason={item.unavailableReason} />
        )}
      </li>
    );
  }

  if (selectable) {
    return (
      <li className="luxia-settings-row py-0.5">
        <label
          htmlFor={rowId}
          className="flex min-w-0 cursor-pointer items-center gap-3 rounded-[var(--luxia-radius-8)] py-2.5 pr-1"
        >
          <Checkbox
            id={rowId}
            checked={selected}
            onCheckedChange={() => onToggle?.()}
          />
          <LuxiaConstellationIcon
            size={18}
            aria-hidden
            color="var(--luxia-text-secondary)"
          />
          <div className="min-w-0 flex-1">
            <p
              className="luxia-type-body-dense truncate"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {item.name}
            </p>
            <div className="mt-1">
              <ConstellationTypeBadge type={item.type} label={item.typeLabel} />
            </div>
          </div>
          <AvailabilityLabel available={item.available} />
        </label>
      </li>
    );
  }

  return (
      <li className="luxia-settings-row flex min-w-0 items-center gap-3 py-3.5">
      <LuxiaConstellationIcon
        size={18}
        aria-hidden
        color="var(--luxia-text-secondary)"
      />
      <div className="min-w-0 flex-1">
        <p
          className="luxia-type-body-dense truncate"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {item.name}
        </p>
        <div className="mt-1">
          <ConstellationTypeBadge type={item.type} label={item.typeLabel} />
        </div>
      </div>
      <AvailabilityLabel available={item.available} />
    </li>
  );
}

function InstructionConflictRow({ conflict }: { conflict: GalaxyInstructionConflict }) {
  return (
    <Collapsible>
      <ConflictSurface>
        <CollapsibleTrigger className="group flex w-full min-w-0 items-center justify-between gap-3 text-left">
          <div className="min-w-0 flex-1">
            <p
              className="luxia-type-body-dense truncate"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {conflict.constellationName}
            </p>
            <p
              className="mt-0.5 luxia-type-caption"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              {conflict.conflictLabel}
            </p>
          </div>
          <ChevronDown
            size={16}
            aria-hidden
            className="shrink-0 transition-transform group-data-[state=open]:rotate-180"
            style={{ color: "var(--luxia-text-muted)" }}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
          <div>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              Galaxy instruction
            </p>
            <p className="luxia-type-body-dense mt-0.5" style={{ color: "var(--luxia-text-primary)" }}>
              &ldquo;{conflict.galaxyExcerpt}&rdquo;
            </p>
          </div>
          <div>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              Constellation instruction
            </p>
            <p className="luxia-type-body-dense mt-0.5" style={{ color: "var(--luxia-text-primary)" }}>
              &ldquo;{conflict.constellationExcerpt}&rdquo;
            </p>
          </div>
          <div>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              Result
            </p>
            <p className="luxia-type-body-dense mt-0.5" style={{ color: "var(--luxia-text-primary)" }}>
              {conflict.result}
            </p>
          </div>
        </CollapsibleContent>
      </ConflictSurface>
    </Collapsible>
  );
}

export function GalaxySettingsPage({
  record,
  unavailable = false,
  unavailableReason,
  constellationItems,
  activeSection,
  onSectionChange,
  focusHeadingToken = 0,
  onSaveGeneral,
  onSaveInstruction,
  onSaveRouting,
  onOpenGalaxy,
  onNavigateHome,
  onOpenProject,
  onOpenConstellations,
  onOpenAccessLevels,
  onOpenDataSources,
  currentProjectRole = null,
}: GalaxySettingsPageProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<GalaxySettingsDraft>(() =>
    draftFromGalaxySettings(record),
  );
  const [routingSearch, setRoutingSearch] = useState("");
  const [unavailableOpen, setUnavailableOpen] = useState(false);

  const baseline = useMemo(() => draftFromGalaxySettings(record), [record]);
  const generalDirty = generalDraftDirty(draft, baseline);
  const instructionDirty = instructionDraftDirty(draft, baseline);
  const routingDirty = routingDraftDirty(draft, baseline);

  const canConfigure = canEditGalaxySettings(currentProjectRole);
  const readOnly = !canConfigure;

  const availableItems = useMemo(
    () => constellationItems.filter((item) => item.available),
    [constellationItems],
  );
  const unavailableItems = useMemo(
    () => constellationItems.filter((item) => !item.available),
    [constellationItems],
  );
  const availableIds = useMemo(
    () => availableItems.map((item) => item.id),
    [availableItems],
  );
  const resolvedSelection = useMemo(
    () => resolveManualSelectionIds(draft.manualConstellationIds, availableIds),
    [draft.manualConstellationIds, availableIds],
  );
  const filteredAvailableItems = useMemo(
    () => filterRoutingItemsBySearch(availableItems, routingSearch),
    [availableItems, routingSearch],
  );
  const instructionConflicts = useMemo(
    () =>
      detectGalaxyInstructionConflicts({
        galaxyInstruction: draft.instruction,
        constellations: constellationItems.map((item) => ({
          id: item.id,
          name: item.name,
        })),
      }),
    [draft.instruction, constellationItems],
  );

  useEffect(() => {
    setDraft(draftFromGalaxySettings(record));
  }, [record]);

  useEffect(() => {
    if (!focusHeadingToken) return;
    headingRef.current?.querySelector("h1")?.focus();
  }, [focusHeadingToken]);

  const readOnlyBannerBody = currentProjectRole
    ? `You're viewing Galaxy Settings as ${currentProjectRole.replace("Project ", "a Project ")}. ${GALAXY_SETTINGS_GUIDANCE.readOnlyBody}`
    : GALAXY_SETTINGS_GUIDANCE.readOnlyBody;

  const breadcrumbItems = useMemo(
    () =>
      buildGalaxySettingsBreadcrumbItems({
        projectId: record.projectId,
        projectName: record.projectName,
        galaxyId: record.id,
        galaxyName: record.name,
      }),
    [record.projectId, record.projectName, record.id, record.name],
  );

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onGalaxy: (projectId) => onOpenGalaxy(projectId),
  };

  function handleSaveGeneral() {
    if (!generalDirty || !canConfigure) return;
    const nextName = draft.name.trim() || record.name;
    onSaveGeneral({ name: nextName });
    setDraft((prev) => ({ ...prev, name: nextName }));
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleSaveInstruction() {
    if (!instructionDirty || !canConfigure) return;
    onSaveInstruction({ instruction: draft.instruction });
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleSaveRouting() {
    if (!routingDirty || !canConfigure) return;
    const manualConstellationIds = resolveManualSelectionIds(
      draft.manualConstellationIds,
      availableIds,
    );
    onSaveRouting({
      routeMode: draft.routeMode,
      manualConstellationIds,
    });
    setDraft((prev) => ({ ...prev, manualConstellationIds }));
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancelGeneral() {
    setDraft((prev) => ({ ...prev, name: baseline.name }));
  }

  function handleCancelInstruction() {
    setDraft((prev) => ({ ...prev, instruction: baseline.instruction }));
  }

  function handleCancelRouting() {
    setDraft((prev) => ({
      ...prev,
      routeMode: baseline.routeMode,
      manualConstellationIds: [...baseline.manualConstellationIds],
    }));
    setRoutingSearch("");
  }

  function toggleManualSelection(constellationId: string) {
    setDraft((prev) => {
      const current = resolveManualSelectionIds(
        prev.manualConstellationIds,
        availableIds,
      );
      const next = current.includes(constellationId)
        ? current.filter((id) => id !== constellationId)
        : [...current, constellationId];
      return { ...prev, manualConstellationIds: next };
    });
  }

  if (unavailable) {
    return (
      <LuxiaPageFrame variant={GALAXY_SETTINGS_PAGE_VARIANT}>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
          <p className="luxia-type-overline-data" style={{ color: HS.sectionHeading }}>
            Galaxy Settings
          </p>
          <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
            Unavailable
          </h1>
          <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            {unavailableReason
              ?? "This Galaxy or Project is not available in the current workspace."}
          </p>
          <Button type="button" variant="outline" size="compact" onClick={() => onOpenProject(record.projectId)}>
            Back to Project
          </Button>
        </div>
      </LuxiaPageFrame>
    );
  }

  return (
    <LuxiaPageFrame variant={GALAXY_SETTINGS_PAGE_VARIANT}>
      <div ref={headingRef}>
        <LuxiaPageHeader
          contentGap="page"
          pageTypeLabel="GALAXY"
          title={record.name}
          titleStyle={{ color: HS.sectionHeading }}
          breadcrumb={
            <LuxiaBreadcrumb tone="page" items={breadcrumbItems} handlers={breadcrumbHandlers} />
          }
          context={
            <div className="space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <p className="luxia-type-caption min-w-0" style={{ color: "var(--luxia-text-secondary)" }}>
                  {record.projectName}
                </p>
                <LuxiaPageEntityUpdatedMeta updatedAt={record.updatedAt} />
              </div>
              {readOnly ? (
                <div
                  className="space-y-0.5"
                  role="status"
                  aria-label={`${GALAXY_SETTINGS_GUIDANCE.readOnlyTitle}. ${readOnlyBannerBody}`}
                >
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    {GALAXY_SETTINGS_GUIDANCE.readOnlyTitle}
                  </p>
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    {readOnlyBannerBody}
                  </p>
                </div>
              ) : null}
            </div>
          }
          guide={GALAXY_SETTINGS_GUIDANCE.page}
          secondaryAction={
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.secondary}
              onClick={() => onOpenGalaxy(record.projectId)}
            >
              Open Galaxy
            </Button>
          }
          primaryAction={null}
          options={null}
        />
      </div>

      <LuxiaPageBody>
        <Tabs
          value={activeSection}
          className="w-full min-w-0 gap-0"
          onValueChange={(value) => {
            if (
              value !== "general"
              && value !== "instruction"
              && value !== "routing"
              && value !== "tools"
              && value !== "access"
            ) {
              return;
            }
            if (value === activeSection) return;
            onSectionChange(value);
          }}
        >
          <div className="mb-4 w-full min-w-0 overflow-x-auto">
            <TabsList
              aria-label="Galaxy Settings sections"
              className={LUXIA_SETTINGS_TABLIST_CLASS}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {GALAXY_SETTINGS_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  title={section.label}
                  className={LUXIA_SETTINGS_TAB_TRIGGER_CLASS}
                >
                  <span className="block w-full truncate text-center">
                    {section.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className={`w-full min-w-0 ${PARENT_SURFACE_CLASS}`}>
            <TabsContent value="general" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className={GS_FORM_TAB_WIDTH}>
                <SectionBlock title="GALAXY DETAILS">
                  <div className={`space-y-4 ${GS_FORM_FIELD_WIDTH}`}>
                    {readOnly ? (
                      <dl className="space-y-0">
                        <DefinitionRow label="Galaxy name" value={draft.name || record.name} />
                        <DefinitionRow label="Project" value={record.projectName} />
                      </dl>
                    ) : (
                      <>
                        <FilterField label="Galaxy name" htmlFor="gs-name">
                          <Input
                            id="gs-name"
                            value={draft.name}
                            onChange={(event) => {
                              setDraft((prev) => ({ ...prev, name: event.target.value }));
                            }}
                          />
                        </FilterField>
                        <FilterField label="Project" htmlFor="gs-project">
                          <Input
                            id="gs-project"
                            value={record.projectName}
                            readOnly
                            aria-readonly="true"
                            className={GS_READONLY_INPUT_CLASS}
                          />
                        </FilterField>
                      </>
                    )}
                  </div>
                </SectionBlock>

                <SettingsDivider />

                <SectionBlock title="INFORMATION">
                  <dl className="max-w-none">
                    <DefinitionRow
                      label="Available Constellations"
                      value={availableItems.length}
                    />
                    {currentProjectRole ? (
                      <DefinitionRow label="Project role" value={currentProjectRole} />
                    ) : null}
                    <DefinitionRow
                      label="Galaxy availability"
                      value={availableItems.length > 0 ? "Available" : "Unavailable"}
                    />
                  </dl>
                </SectionBlock>

                <LuxiaSettingsFormActions
                  dirty={generalDirty}
                  canSave={canConfigure && EDITABLE_SECTIONS.has("general")}
                  onSave={handleSaveGeneral}
                  onCancel={handleCancelGeneral}
                />
              </div>
            </TabsContent>

            <TabsContent value="instruction" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className={GS_FORM_TAB_WIDTH}>
                <LuxiaPageGuide>{GALAXY_SETTINGS_GUIDANCE.instruction}</LuxiaPageGuide>

                <div className={`mt-4 ${GS_FORM_FIELD_WIDTH}`}>
                  {readOnly ? (
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        Galaxy instruction
                      </p>
                      <div
                        className="rounded-[var(--luxia-radius-12)] px-4 py-3 luxia-type-body-dense whitespace-pre-wrap"
                        style={{
                          ...GS_SUBTLE_SURFACE,
                          color: "var(--luxia-text-primary)",
                        }}
                      >
                        {draft.instruction}
                      </div>
                    </div>
                  ) : (
                    <FilterField label="Galaxy instruction" htmlFor="gs-instruction">
                      <Textarea
                        id="gs-instruction"
                        value={draft.instruction}
                        onChange={(event) => {
                          setDraft((prev) => ({ ...prev, instruction: event.target.value }));
                        }}
                        rows={7}
                        className="min-h-[10rem] resize-y"
                      />
                      <p className="mt-1.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                        {GALAXY_SETTINGS_GUIDANCE.instructionFieldHelper}
                      </p>
                    </FilterField>
                  )}
                </div>

                <SettingsDivider />

                <SectionBlock title="INSTRUCTION COMPATIBILITY">
                  {instructionConflicts.length === 0 ? (
                    <p
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-muted)" }}
                      role="status"
                    >
                      ✓ No instruction conflicts detected
                    </p>
                  ) : (
                    <div className={`space-y-3 ${GS_FORM_FIELD_WIDTH}`}>
                      <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        Instruction conflicts detected
                      </p>
                      <div className="space-y-2">
                        {instructionConflicts.map((conflict) => (
                          <InstructionConflictRow key={conflict.constellationId} conflict={conflict} />
                        ))}
                      </div>
                    </div>
                  )}
                </SectionBlock>

                <LuxiaSettingsFormActions
                  dirty={instructionDirty}
                  canSave={canConfigure && EDITABLE_SECTIONS.has("instruction")}
                  onSave={handleSaveInstruction}
                  onCancel={handleCancelInstruction}
                />
              </div>
            </TabsContent>

            <TabsContent value="routing" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className={GS_LIST_TAB_WIDTH}>
                {availableItems.length === 0 ? (
                  <div className="space-y-1" role="status">
                    <p className="luxia-type-body-default-strong" style={{ color: "var(--luxia-text-primary)" }}>
                      {GALAXY_SETTINGS_GUIDANCE.routingEmptyTitle}
                    </p>
                    <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                      {GALAXY_SETTINGS_GUIDANCE.routingEmptyBody}
                    </p>
                    {onOpenConstellations ? (
                      <Button
                        type="button"
                        variant="link"
                        size="compact"
                        className="mt-1 h-auto p-0"
                        onClick={() => onOpenConstellations(record.projectId)}
                      >
                        View Constellations
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,17rem)] lg:items-start">
                    <div className="min-w-0 space-y-6">
                      <SectionBlock title="ROUTING MODE">
                        {readOnly ? (
                          <dl className="max-w-none">
                            <DefinitionRow
                              label="Mode"
                              value={draft.routeMode === "auto" ? "Automatic" : "Manual"}
                            />
                            <DefinitionRow
                              label="Description"
                              value={
                                draft.routeMode === "auto"
                                  ? GALAXY_SETTINGS_GUIDANCE.routingAuto
                                  : GALAXY_SETTINGS_GUIDANCE.routingManual
                              }
                            />
                          </dl>
                        ) : (
                          <RadioGroup
                            value={draft.routeMode}
                            onValueChange={(value) => {
                              if (value !== "auto" && value !== "manual") return;
                              setDraft((prev) => ({
                                ...prev,
                                routeMode: value,
                                manualConstellationIds:
                                  value === "manual"
                                    ? resolveManualSelectionIds(
                                      prev.manualConstellationIds,
                                      availableIds,
                                    )
                                    : prev.manualConstellationIds,
                              }));
                            }}
                            className="flex max-w-[36rem] flex-col gap-3"
                            aria-label="Routing mode"
                          >
                            <RouteModeOption
                              id="gs-route-auto"
                              value="auto"
                              selected={draft.routeMode === "auto"}
                              title="Automatic"
                              description={GALAXY_SETTINGS_GUIDANCE.routingAuto}
                            />
                            <RouteModeOption
                              id="gs-route-manual"
                              value="manual"
                              selected={draft.routeMode === "manual"}
                              title="Manual"
                              description={GALAXY_SETTINGS_GUIDANCE.routingManual}
                            />
                          </RadioGroup>
                        )}
                      </SectionBlock>

                      <div className="space-y-3">
                        <FilterField label="Search Constellations" htmlFor="gs-routing-search">
                          <Input
                            id="gs-routing-search"
                            value={routingSearch}
                            onChange={(event) => setRoutingSearch(event.target.value)}
                            placeholder={GALAXY_SETTINGS_GUIDANCE.routingSearchPlaceholder}
                          />
                        </FilterField>

                        {!readOnly && draft.routeMode === "manual" ? (
                          <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                            Selected: {resolvedSelection.length} of {availableItems.length}
                          </p>
                        ) : null}

                        <SectionBlock title="AVAILABLE CONSTELLATIONS">
                          <SettingsListSurface scrollable>
                            {filteredAvailableItems.length === 0 ? (
                              <li className="py-4 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
                                No Constellations match your search.
                              </li>
                            ) : (
                              filteredAvailableItems.map((item) => (
                                <ConstellationRoutingRow
                                  key={item.id}
                                  item={item}
                                  readOnly={readOnly}
                                  selectable={!readOnly && draft.routeMode === "manual"}
                                  selected={
                                    draft.routeMode === "manual"
                                    && resolvedSelection.includes(item.id)
                                  }
                                  onToggle={() => toggleManualSelection(item.id)}
                                />
                              ))
                            )}
                          </SettingsListSurface>
                        </SectionBlock>

                        {unavailableItems.length > 0 ? (
                          <Collapsible open={unavailableOpen} onOpenChange={setUnavailableOpen}>
                            <CollapsibleTrigger asChild>
                              <button type="button" className="group w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]">
                                <SubsectionCollapsibleTrigger
                                  title="UNAVAILABLE"
                                  count={unavailableItems.length}
                                />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-2">
                              <SettingsListSurface>
                                {unavailableItems.map((item) => (
                                  <ConstellationRoutingRow key={item.id} item={item} readOnly />
                                ))}
                              </SettingsListSurface>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : null}
                      </div>
                    </div>

                    <SummaryPanel
                      title="ROUTING SUMMARY"
                      rows={[
                        {
                          label: "Mode",
                          value: draft.routeMode === "auto" ? "Automatic" : "Manual",
                        },
                        {
                          label: "Available",
                          value: availableItems.length,
                        },
                        {
                          label: "Selected",
                          value:
                            draft.routeMode === "auto"
                              ? "Automatic"
                              : `${resolvedSelection.length} selected`,
                        },
                        {
                          label: "Unavailable",
                          value: unavailableItems.length,
                        },
                      ]}
                    />
                  </div>
                )}

                <LuxiaSettingsFormActions
                  dirty={routingDirty}
                  canSave={canConfigure && EDITABLE_SECTIONS.has("routing")}
                  onSave={handleSaveRouting}
                  onCancel={handleCancelRouting}
                />
              </div>
            </TabsContent>

            <TabsContent value="tools" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className={`grid gap-8 lg:grid-cols-2 lg:items-start ${GS_LIST_TAB_WIDTH}`}>
                <section className="min-w-0 space-y-5">
                  <SectionBlock title="HELIOS">
                    <HeliosStatusHeading
                      title={GALAXY_SETTINGS_GUIDANCE.heliosTitle}
                      status={GALAXY_SETTINGS_GUIDANCE.heliosStatus}
                    />
                    <p
                      className="mt-3 luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {GALAXY_SETTINGS_GUIDANCE.heliosDescription}
                    </p>
                  </SectionBlock>

                  <div>
                    <SectionOverline>HOW HELIOS WORKS</SectionOverline>
                    <div className="mt-3">
                      <HeliosFlowSteps steps={GALAXY_SETTINGS_GUIDANCE.heliosFlow} />
                    </div>
                  </div>
                </section>

                <section className="min-w-0">
                  <SectionBlock title="CAPABILITIES">
                    <p
                      className="mb-3 luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {GALAXY_SETTINGS_GUIDANCE.toolsIntro}
                    </p>
                    <SettingsListSurface>
                      {GALAXY_HELIOS_CAPABILITIES.map((capability) => (
                        <CapabilityRow
                          key={capability.id}
                          name={capability.name}
                          description={capability.description}
                          status={capability.status}
                        />
                      ))}
                    </SettingsListSurface>
                  </SectionBlock>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="access" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className={GS_LIST_TAB_WIDTH}>
                <SectionBlock title="GALAXY ACCESS">
                  <dl className="max-w-[42rem]">
                    <DefinitionRow
                      label="Galaxy access"
                      value={GALAXY_SETTINGS_GUIDANCE.accessGalaxy}
                    />
                    {currentProjectRole ? (
                      <DefinitionRow label="Project role" value={currentProjectRole} />
                    ) : null}
                  </dl>
                </SectionBlock>

                <SettingsDivider />

                <SectionBlock title="CONSTELLATION AVAILABILITY">
                  <dl className="mb-4 grid max-w-md grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        Available
                      </dt>
                      <dd className="luxia-type-body-dense tabular-nums" style={{ color: "var(--luxia-text-primary)" }}>
                        {availableItems.length}
                      </dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                        Unavailable
                      </dt>
                      <dd className="luxia-type-body-dense tabular-nums" style={{ color: "var(--luxia-text-primary)" }}>
                        {unavailableItems.length}
                      </dd>
                    </div>
                  </dl>

                  {constellationItems.length === 0 ? (
                    <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                      {GALAXY_SETTINGS_GUIDANCE.accessEmpty}
                    </p>
                  ) : (
                    <div className={GS_ACCESS_LIST_WIDTH}>
                      <SettingsListSurface scrollable>
                        {constellationItems.map((item) => (
                          <li key={item.id} className="luxia-settings-row flex min-w-0 items-center gap-3 py-3.5">
                            <LuxiaConstellationIcon size={18} aria-hidden color="var(--luxia-text-secondary)" />
                            <div className="min-w-0 flex-1">
                              <p className="luxia-type-body-dense truncate" style={{ color: "var(--luxia-text-primary)" }}>
                                {item.name}
                              </p>
                              <div className="mt-1">
                                <ConstellationTypeBadge type={item.type} label={item.typeLabel} />
                              </div>
                            </div>
                            <AvailabilityLabel available={item.available} reason={item.unavailableReason} />
                          </li>
                        ))}
                      </SettingsListSurface>
                    </div>
                  )}
                </SectionBlock>

                <SettingsDivider />

                <p
                  className="max-w-[42rem] luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {GALAXY_SETTINGS_GUIDANCE.accessExplanation}
                </p>

                <RelatedAccessNav
                  onOpenAccessLevels={onOpenAccessLevels}
                  onOpenDataSources={onOpenDataSources}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
