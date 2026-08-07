import { useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import type { ProjectRole } from "@/app/features/permissions";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
  LUXIA_SETTINGS_TAB_PANEL_CLASS,
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { GALAXY_HELIOS_CAPABILITIES } from "./data";
import {
  GALAXY_SETTINGS_CONSTELLATION_LIST_CAP,
  GALAXY_SETTINGS_GUIDANCE,
  GALAXY_SETTINGS_PAGE_VARIANT,
  GALAXY_SETTINGS_SECTIONS,
  type GalaxySettingsSectionId,
} from "./ia";
import {
  draftFromGalaxySettings,
  galaxySettingsDraftEqual,
  type GalaxyAvailableConstellation,
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
  availableConstellations: GalaxyAvailableConstellation[];
  activeSection: GalaxySettingsSectionId;
  onSectionChange: (section: GalaxySettingsSectionId) => void;
  focusHeadingToken?: number;
  onSave: (draft: GalaxySettingsDraft) => void;
  onOpenGalaxy: (projectId: string) => void;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenMembers?: (projectId: string) => void;
  currentProjectRole?: ProjectRole | null;
}

export function GalaxySettingsPage({
  record,
  unavailable = false,
  unavailableReason,
  availableConstellations,
  activeSection,
  onSectionChange,
  focusHeadingToken = 0,
  onSave,
  onOpenGalaxy,
  onNavigateHome,
  onOpenProject,
  onOpenMembers: _onOpenMembers,
  currentProjectRole = null,
}: GalaxySettingsPageProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<GalaxySettingsDraft>(() =>
    draftFromGalaxySettings(record),
  );

  const baseline = useMemo(() => draftFromGalaxySettings(record), [record]);
  const dirty = !galaxySettingsDraftEqual(draft, baseline);

  const canConfigure =
    currentProjectRole === "Project Owner"
    || currentProjectRole === "Project Manager";
  const readOnly = !canConfigure;

  useEffect(() => {
    setDraft(draftFromGalaxySettings(record));
  }, [record]);

  useEffect(() => {
    if (!focusHeadingToken) return;
    headingRef.current?.querySelector("h1")?.focus();
  }, [focusHeadingToken]);

  const breadcrumbItems = useMemo(
    () =>
      buildGalaxySettingsBreadcrumbItems({
        projectId: record.projectId,
        projectName: record.projectName,
        galaxyId: record.id,
        galaxyName: draft.name || record.name,
      }),
    [record.projectId, record.projectName, record.id, record.name, draft.name],
  );

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onGalaxy: (projectId) => onOpenGalaxy(projectId),
  };

  const listedConstellations = availableConstellations.slice(
    0,
    GALAXY_SETTINGS_CONSTELLATION_LIST_CAP,
  );
  const hiddenConstellationCount = Math.max(
    0,
    availableConstellations.length - listedConstellations.length,
  );

  function handleSave() {
    if (!dirty || !canConfigure) return;
    const next: GalaxySettingsDraft = {
      name: draft.name.trim() || record.name,
      instruction: draft.instruction,
      routeMode: draft.routeMode,
    };
    onSave(next);
    setDraft(next);
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancel() {
    setDraft(draftFromGalaxySettings(record));
  }

  const showLocalFormActions =
    canConfigure && EDITABLE_SECTIONS.has(activeSection);

  if (unavailable) {
    return (
      <LuxiaPageFrame variant={GALAXY_SETTINGS_PAGE_VARIANT}>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
          <p
            className="luxia-type-overline-data"
            style={{ color: HS.sectionHeading }}
          >
            Galaxy Settings
          </p>
          <h1
            className="luxia-type-title-page"
            style={{ color: "var(--luxia-purple-70)" }}
          >
            Unavailable
          </h1>
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            {unavailableReason
              ?? "This Galaxy or Project is not available in the current workspace."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => onOpenProject(record.projectId)}
          >
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
          title={draft.name || record.name}
          titleStyle={{ color: HS.sectionHeading }}
          onRename={canConfigure ? (name) => {
            const trimmed = name.trim();
            if (!trimmed) return;
            const nextDraft = { ...draft, name: trimmed };
            setDraft(nextDraft);
            onSave(nextDraft);
            toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
          } : undefined}
          renameLabel={`Rename ${record.name}`}
          breadcrumb={
            <LuxiaBreadcrumb
              tone="page"
              items={breadcrumbItems}
              handlers={breadcrumbHandlers}
            />
          }
          context={
            <div className="space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                <p
                  className="luxia-type-caption min-w-0"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  {record.projectName}
                </p>
                <LuxiaPageEntityUpdatedMeta updatedAt={record.updatedAt} />
              </div>
              {readOnly ? (
                <div
                  className="space-y-0.5"
                  role="status"
                  aria-label={`${GALAXY_SETTINGS_GUIDANCE.readOnlyTitle}. ${GALAXY_SETTINGS_GUIDANCE.readOnlyBody}`}
                >
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {GALAXY_SETTINGS_GUIDANCE.readOnlyTitle}
                  </p>
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    {GALAXY_SETTINGS_GUIDANCE.readOnlyBody}
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
              <div className="space-y-4 max-w-xl">
                {readOnly ? (
                  <dl className="space-y-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Galaxy name
                      </dt>
                      <dd
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {draft.name || record.name}
                      </dd>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <dt
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Project
                      </dt>
                      <dd
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {record.projectName}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <>
                    <FilterField label="Galaxy name" htmlFor="gs-name">
                      <Input
                        id="gs-name"
                        value={draft.name}
                        onChange={(event) => {
                          setDraft((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }));
                        }}
                      />
                    </FilterField>
                    <FilterField label="Project" htmlFor="gs-project">
                      <Input
                        id="gs-project"
                        value={record.projectName}
                        readOnly
                        aria-readonly="true"
                      />
                    </FilterField>
                  </>
                )}
              </div>
              <LuxiaSettingsFormActions
                dirty={dirty}
                canSave={showLocalFormActions}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </TabsContent>

            <TabsContent value="instruction" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className="space-y-4 max-w-xl">
                <LuxiaPageGuide>
                  {GALAXY_SETTINGS_GUIDANCE.instruction}
                </LuxiaPageGuide>
                {readOnly ? (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Galaxy instruction
                    </p>
                    <p
                      className="luxia-type-body-dense whitespace-pre-wrap"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {draft.instruction}
                    </p>
                  </div>
                ) : (
                  <FilterField label="Galaxy instruction" htmlFor="gs-instruction">
                    <Textarea
                      id="gs-instruction"
                      value={draft.instruction}
                      onChange={(event) => {
                        setDraft((prev) => ({
                          ...prev,
                          instruction: event.target.value,
                        }));
                      }}
                      rows={6}
                    />
                  </FilterField>
                )}
              </div>
              <LuxiaSettingsFormActions
                dirty={dirty}
                canSave={showLocalFormActions}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </TabsContent>

            <TabsContent value="routing" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className="space-y-5 max-w-xl">
                {availableConstellations.length === 0 ? (
                  <div
                    className="space-y-1"
                    role="status"
                    aria-label={GALAXY_SETTINGS_GUIDANCE.routingEmptyTitle}
                  >
                    <p
                      className="luxia-type-body-default-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {GALAXY_SETTINGS_GUIDANCE.routingEmptyTitle}
                    </p>
                    <p
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {GALAXY_SETTINGS_GUIDANCE.routingEmptyBody}
                    </p>
                  </div>
                ) : null}

                {readOnly ? (
                  <div className="space-y-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Routing
                      </p>
                      <p
                        className="luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {draft.routeMode === "auto"
                          ? "Automatic routing"
                          : "Manual routing"}
                      </p>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {draft.routeMode === "auto"
                          ? GALAXY_SETTINGS_GUIDANCE.routingAuto
                          : GALAXY_SETTINGS_GUIDANCE.routingManual}
                      </p>
                    </div>
                  </div>
                ) : (
                  <fieldset className="min-w-0 border-0 p-0">
                    <legend className="mb-2 luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                      Constellation routing
                    </legend>
                    <RadioGroup
                      value={draft.routeMode}
                      onValueChange={(value) => {
                        if (value !== "auto" && value !== "manual") return;
                        setDraft((prev) => ({ ...prev, routeMode: value }));
                      }}
                      className="flex flex-col gap-3"
                      aria-label="Constellation routing"
                    >
                      <label
                        htmlFor="gs-route-auto"
                        className="flex cursor-pointer items-start gap-3 rounded-[var(--luxia-radius-8)] border p-3"
                        style={{
                          borderColor:
                            draft.routeMode === "auto"
                              ? "var(--luxia-brand-primary)"
                              : "var(--luxia-settings-row-divider)",
                        }}
                      >
                        <RadioGroupItem
                          value="auto"
                          id="gs-route-auto"
                          aria-describedby="gs-route-auto-desc"
                          className="mt-0.5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="luxia-type-body-dense-strong block">
                            Automatic routing
                          </span>
                          <span
                            id="gs-route-auto-desc"
                            className="mt-0.5 block luxia-type-caption"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            {GALAXY_SETTINGS_GUIDANCE.routingAuto}
                          </span>
                        </span>
                      </label>
                      <label
                        htmlFor="gs-route-manual"
                        className="flex cursor-pointer items-start gap-3 rounded-[var(--luxia-radius-8)] border p-3"
                        style={{
                          borderColor:
                            draft.routeMode === "manual"
                              ? "var(--luxia-brand-primary)"
                              : "var(--luxia-settings-row-divider)",
                        }}
                      >
                        <RadioGroupItem
                          value="manual"
                          id="gs-route-manual"
                          aria-describedby="gs-route-manual-desc"
                          className="mt-0.5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="luxia-type-body-dense-strong block">
                            Manual routing
                          </span>
                          <span
                            id="gs-route-manual-desc"
                            className="mt-0.5 block luxia-type-caption"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            {GALAXY_SETTINGS_GUIDANCE.routingManual}
                          </span>
                        </span>
                      </label>
                    </RadioGroup>
                  </fieldset>
                )}

                {availableConstellations.length > 0 ? (
                  <div>
                    <p
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Available Constellations ({availableConstellations.length})
                    </p>
                    <ul className="mt-2 space-y-1">
                      {listedConstellations.map((item) => (
                        <li
                          key={item.id}
                          className="luxia-type-body-dense"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                    {hiddenConstellationCount > 0 ? (
                      <p
                        className="mt-2 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        +{hiddenConstellationCount} more — manage the full list in Constellations.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <LuxiaSettingsFormActions
                dirty={dirty}
                canSave={showLocalFormActions}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </TabsContent>

            <TabsContent value="tools" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className="mb-5 max-w-xl space-y-2">
                <p
                  className="luxia-type-body-default-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Helios orchestration
                </p>
                <LuxiaPageGuide>
                  {GALAXY_SETTINGS_GUIDANCE.heliosOrchestration}
                </LuxiaPageGuide>
              </div>
              <LuxiaPageGuide className="mb-3">
                {GALAXY_SETTINGS_GUIDANCE.toolsIntro}
              </LuxiaPageGuide>
              <ul
                className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`}
                style={{ borderColor: "var(--luxia-settings-row-divider)" }}
              >
                {GALAXY_HELIOS_CAPABILITIES.map((capability) => (
                  <li
                    key={capability.id}
                    className="luxia-settings-row flex flex-col gap-1 py-4"
                  >
                    <p
                      className="luxia-type-body-default-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {capability.name}
                    </p>
                    <LuxiaPageGuide>{capability.description}</LuxiaPageGuide>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="access" className={SETTINGS_TAB_PANEL_CLASS}>
              <dl className="grid max-w-xl gap-y-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Project access
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {GALAXY_SETTINGS_GUIDANCE.accessProject}
                  </dd>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Available Constellations
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {availableConstellations.length}
                  </dd>
                </div>
                {currentProjectRole ? (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <dt
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      Your Project role
                    </dt>
                    <dd
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {currentProjectRole}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <LuxiaPageGuide className="mt-4 max-w-xl">
                Galaxy availability follows Project membership and Constellations
                you can use. Access Levels and Data Source permissions stay on
                their existing pages.
              </LuxiaPageGuide>
            </TabsContent>
          </div>
        </Tabs>
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
