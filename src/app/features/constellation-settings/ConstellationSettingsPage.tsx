import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildConstellationSettingsBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
  LuxiaPageHeadingRegion,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageReadOnlyBadge } from "@/app/components/LuxiaPageReadOnlyBadge";
import {
  LuxiaPageGuide,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
  LuxiaPageEntityUpdatedMeta,
} from "@/app/components/LuxiaPageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import type { CapsuleCapabilityId } from "@/app/features/constellation/capsuleCapabilities";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  ProjectRole,
} from "@/app/features/permissions";
import { CURRENT_USER_ID, getOrganizationUserById } from "@/app/features/permissions";
import {
  canArchiveConstellation as roleCanArchiveConstellation,
  canConfigureConstellation as roleCanConfigureConstellation,
  canDeleteConstellation as roleCanDeleteConstellation,
  canEditConstellationKnowledge as roleCanEditConstellationKnowledge,
} from "@/app/features/permissions/accessGuards";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
  LUXIA_SETTINGS_TAB_PANEL_CLASS,
  LUXIA_SETTINGS_TAB_TRIGGER_CLASS,
  LUXIA_SETTINGS_TABLIST_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { AddConstellationDataSourceDialog } from "./AddConstellationDataSourceDialog";
import {
  CONSTELLATION_SETTINGS_GUIDANCE,
  CONSTELLATION_SETTINGS_PAGE_VARIANT,
  CONSTELLATION_SETTINGS_SECTIONS,
  configurationCapabilitiesForType,
  type ConstellationSettingsSectionId,
} from "./ia";
import { buildSourceAccessRows } from "./data";
import {
  constellationTypeLabel,
  draftFromSettings,
  type ConnectedDataSource,
  type ConstellationSettingsDraft,
  type ConstellationSettingsRecord,
  type ProjectRoleAction,
  type SourceAccessSummaryRow,
} from "./types";

const PARENT_SURFACE_CLASS = LUXIA_SETTINGS_CONTENT_SURFACE_CLASS;

const SETTINGS_TAB_PANEL_CLASS = LUXIA_SETTINGS_TAB_PANEL_CLASS;

const ROW_DIVIDER = LUXIA_SETTINGS_ROW_DIVIDER;

const ROLE_COLUMNS: ProjectRoleAction[] = [
  "View",
  "Use",
  "Configure",
  "Create outputs",
  "Archive",
  "Delete",
];

function formatSourceType(type: ConnectedDataSource["type"]): string {
  if (type === "database") return "Database";
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "Extra Context";
}

function formatSourceStatus(status: ConnectedDataSource["status"]): string {
  if (status === "needs-attention") return "Needs attention";
  if (status === "connected") return "Connected";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatOwnership(ownership: ConnectedDataSource["ownership"]): string {
  return ownership === "organizational" ? "Organizational" : "Private";
}

function roleHasAction(
  actions: ProjectRoleAction[],
  column: ProjectRoleAction,
): boolean {
  return actions.includes(column);
}

function accessConflictLabel(row: SourceAccessSummaryRow): string {
  switch (row.conflictStatus) {
    case "missing-source-access":
      return "Missing source access";
    case "source-archived":
      return "Source unavailable";
    case "no-access":
      return "Project role does not allow use";
    case "owner-access":
      return "Owner access";
    default:
      return "Available";
  }
}

function hasAccessConflict(row: SourceAccessSummaryRow): boolean {
  return (
    row.conflictStatus === "missing-source-access"
    || row.conflictStatus === "source-archived"
    || row.conflictStatus === "no-access"
  );
}

export interface ConstellationSettingsRelatedChat {
  id: string;
  label: string;
}

export interface ConstellationSettingsRelatedVidget {
  id: string;
  label: string;
}

export interface ConstellationSettingsPageProps {
  record: ConstellationSettingsRecord;
  unavailable?: boolean;
  unavailableReason?: string;
  relatedChats?: ConstellationSettingsRelatedChat[];
  relatedVidgets?: ConstellationSettingsRelatedVidget[];
  activeSection: ConstellationSettingsSectionId;
  onSectionChange: (section: ConstellationSettingsSectionId) => void;
  focusHeadingToken?: number;
  onCreateChat?: (projectId: string, constellationId: string) => void;
  onCreateVidget?: (projectId: string, constellationId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onOpenVidget?: (projectId: string, vidgetId: string) => void;
  onSaveGeneral: (draft: ConstellationSettingsDraft) => void;
  onManageCapability: (capabilityId: CapsuleCapabilityId) => void;
  onAddDataSource: (sourceId: string) => void;
  onOpenDataSourceSettings: (sourceId: string) => void;
  onManageSourceAccess: (sourceId: string) => void;
  onDisconnectSource: (sourceId: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  onNavigateHome: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenConstellations: (projectId: string) => void;
  onOpenConstellation: (projectId: string, constellationId: string) => void;
  onOpenMembers?: (projectId: string) => void;
  onOpenAccessLevels?: () => void;
  accessLevels?: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  currentUserId?: string;
  currentProjectRole?: ProjectRole | null;
}

export function ConstellationSettingsPage({
  record,
  unavailable = false,
  unavailableReason,
  relatedChats = [],
  relatedVidgets = [],
  activeSection,
  onSectionChange,
  focusHeadingToken = 0,
  onCreateChat,
  onCreateVidget,
  onOpenChat,
  onOpenVidget,
  onSaveGeneral,
  onManageCapability,
  onAddDataSource,
  onOpenDataSourceSettings,
  onManageSourceAccess,
  onDisconnectSource,
  onArchive,
  onDelete,
  onNavigateHome,
  onOpenProject,
  onOpenConstellations,
  onOpenConstellation,
  onOpenMembers,
  onOpenAccessLevels,
  accessLevels = [],
  dataSources = [],
  currentUserId = CURRENT_USER_ID,
  currentProjectRole = null,
}: ConstellationSettingsPageProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const [generalDraft, setGeneralDraft] = useState(() =>
    draftFromSettings(record),
  );
  const [disconnectSourceId, setDisconnectSourceId] = useState<string | null>(
    null,
  );
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setGeneralDraft(draftFromSettings(record));
  }, [record]);

  useEffect(() => {
    if (!focusHeadingToken) return;
    const frame = window.requestAnimationFrame(() => {
      const heading = headingRef.current?.querySelector("h1");
      if (heading instanceof HTMLElement) {
        if (!heading.hasAttribute("tabindex")) {
          heading.tabIndex = -1;
        }
        heading.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusHeadingToken]);

  const generalDirty =
    generalDraft.name !== record.name
    || generalDraft.description !== record.description;

  const breadcrumbItems = buildConstellationSettingsBreadcrumbItems({
    projectId: record.projectId,
    projectName: record.projectName,
    constellationId: record.id,
    constellationName: generalDraft.name || record.name,
  });

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onProject: onOpenProject,
    onConstellations: onOpenConstellations,
    onConstellation: onOpenConstellation,
  };

  const configurationRows = configurationCapabilitiesForType(record.type);

  const sourceAccessRows = useMemo(
    () =>
      accessLevels.length > 0
        ? buildSourceAccessRows(
            record.connectedSources,
            accessLevels,
            currentUserId,
            dataSources,
          )
        : record.sourceAccessRows,
    [
      accessLevels,
      record.connectedSources,
      record.sourceAccessRows,
      currentUserId,
      dataSources,
    ],
  );

  const accessConflicts = useMemo(
    () => sourceAccessRows.filter(hasAccessConflict),
    [sourceAccessRows],
  );

  const canConfigureConstellation = roleCanConfigureConstellation(currentProjectRole);
  const canEditKnowledge = roleCanEditConstellationKnowledge(currentProjectRole);
  const isPageReadOnly = !canConfigureConstellation && !canEditKnowledge;
  const canArchiveConstellation = roleCanArchiveConstellation(currentProjectRole);
  const canDeleteConstellation = roleCanDeleteConstellation(currentProjectRole);
  const lifecycleRoleHint = !currentProjectRole
    ? "Your Project role is unavailable for this action."
    : currentProjectRole === "Member"
      || currentProjectRole === "Analyst"
      ? `Your Project role (${currentProjectRole}) cannot change Constellation lifecycle.`
      : null;
  const configureRoleHint = !canConfigureConstellation
    ? (!currentProjectRole
      ? "Your Project role is unavailable for configuration."
      : canEditKnowledge
        ? `Your Project role (${currentProjectRole}) can edit Knowledge Base, Instructions, and Crawler only.`
        : `Your Project role (${currentProjectRole}) cannot configure this Constellation.`)
    : null;
  const showConfigureRoleHint = Boolean(configureRoleHint) && !isPageReadOnly;

  const disconnectTarget = record.connectedSources.find(
    (source) => source.id === disconnectSourceId,
  );
  const isLastSource = record.connectedSources.length <= 1;

  function handleSaveGeneral() {
    if (!generalDirty || !canConfigureConstellation) return;
    onSaveGeneral({
      name: generalDraft.name.trim(),
      description: generalDraft.description.trim(),
    });
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancelGeneral() {
    setGeneralDraft(draftFromSettings(record));
  }

  function confirmDisconnect() {
    if (!disconnectSourceId || isLastSource) return;
    onDisconnectSource(disconnectSourceId);
    setDisconnectSourceId(null);
  }

  if (unavailable) {
    return (
      <LuxiaPageFrame variant={CONSTELLATION_SETTINGS_PAGE_VARIANT}>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
          <p
            className="luxia-type-overline-data"
            style={{ color: HS.sectionHeading }}
          >
            Constellation Settings
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
              ?? "This Constellation or Project is not available in the current workspace."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => onOpenConstellations(record.projectId)}
          >
            Back to Constellations
          </Button>
        </div>
      </LuxiaPageFrame>
    );
  }

  return (
    <LuxiaPageFrame variant={CONSTELLATION_SETTINGS_PAGE_VARIANT}>
      <LuxiaPageHeadingRegion ref={headingRef}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="Constellation Settings"
        title={generalDraft.name || record.name}
        titleStyle={{ color: HS.sectionHeading }}
        onRename={canConfigureConstellation ? (name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          const nextDraft = {
            name: trimmed,
            description: generalDraft.description,
          };
          setGeneralDraft(nextDraft);
          onSaveGeneral({
            name: trimmed,
            description: generalDraft.description.trim(),
          });
          toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
        } : undefined}
        renameLabel={`Rename ${record.name}`}
        titleMetadata={
          isPageReadOnly ? (
            <LuxiaPageReadOnlyBadge ariaLabel="Read only. Constellation Settings cannot be changed for your Project role." />
          ) : undefined
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        context={
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
            <p
              className="luxia-type-caption min-w-0"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              {constellationTypeLabel(record.type)}
              {record.status !== "active" ? " · Archived" : ""}
              {" · "}
              {record.projectName}
            </p>
            <LuxiaPageEntityUpdatedMeta updatedAt={record.updatedAt} />
          </div>
        }
        secondaryAction={
          (() => {
            const chatAction =
              relatedChats.length === 1 && onOpenChat ? (
                <Button
                  type="button"
                  {...LUXIA_PAGE_HEADER_ACTION.secondary}
                  onClick={() => onOpenChat(relatedChats[0]!.id)}
                >
                  Open Chat
                </Button>
              ) : relatedChats.length > 1 && onOpenChat ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary}>
                      Open Chat
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[12rem]">
                    {relatedChats.map((chat) => (
                      <DropdownMenuItem
                        key={chat.id}
                        onSelect={() => onOpenChat(chat.id)}
                      >
                        {chat.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : relatedChats.length === 0 && onCreateChat ? (
                <Button
                  type="button"
                  {...LUXIA_PAGE_HEADER_ACTION.secondary}
                  onClick={() => onCreateChat(record.projectId, record.id)}
                >
                  Create Chat
                </Button>
              ) : null;

            const vidgetAction =
              relatedVidgets.length === 1 && onOpenVidget ? (
                <Button
                  type="button"
                  {...LUXIA_PAGE_HEADER_ACTION.secondary}
                  onClick={() => onOpenVidget(record.projectId, relatedVidgets[0]!.id)}
                >
                  Open Vidget
                </Button>
              ) : relatedVidgets.length > 1 && onOpenVidget ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary}>
                      Vidgets
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[12rem]">
                    {relatedVidgets.map((vidget) => (
                      <DropdownMenuItem
                        key={vidget.id}
                        onSelect={() => onOpenVidget(record.projectId, vidget.id)}
                      >
                        {vidget.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : relatedVidgets.length === 0 && onCreateVidget ? (
                <Button
                  type="button"
                  {...LUXIA_PAGE_HEADER_ACTION.secondary}
                  onClick={() => onCreateVidget(record.projectId, record.id)}
                >
                  Create Vidget
                </Button>
              ) : null;

            if (!chatAction && !vidgetAction) return null;

            return (
              <div className="flex flex-nowrap items-center justify-end gap-2">
                {chatAction}
                {vidgetAction}
              </div>
            );
          })()
        }
      />
      </LuxiaPageHeadingRegion>

      <LuxiaPageBody>
        <Tabs
          value={activeSection}
          className="w-full min-w-0 gap-0"
          onValueChange={(value) => {
            if (
              value !== "general"
              && value !== "configuration"
              && value !== "sources"
              && value !== "access"
              && value !== "lifecycle"
            ) {
              return;
            }
            if (value === activeSection) return;
            onSectionChange(value);
          }}
        >
          <div className="mb-4 w-full min-w-0 overflow-x-auto">
            <TabsList
              aria-label="Constellation Settings sections"
              className={LUXIA_SETTINGS_TABLIST_CLASS}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {CONSTELLATION_SETTINGS_SECTIONS.map((section) => (
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

          <div className={`w-full min-w-0 ${PARENT_SURFACE_CLASS}`}>
            <TabsContent value="general" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className="space-y-4 max-w-xl">
                {showConfigureRoleHint ? (
                  <p
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-secondary)" }}
                    role="status"
                  >
                    {configureRoleHint}
                  </p>
                ) : null}
                <FilterField label="Name" htmlFor="cs-name">
                  <Input
                    id="cs-name"
                    value={generalDraft.name}
                    disabled={!canConfigureConstellation}
                    onChange={(event) => {
                      setGeneralDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }));
                    }}
                  />
                </FilterField>

                <FilterField label="Description" htmlFor="cs-description">
                  <Textarea
                    id="cs-description"
                    value={generalDraft.description}
                    disabled={!canConfigureConstellation}
                    onChange={(event) => {
                      setGeneralDraft((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }));
                    }}
                    rows={4}
                  />
                </FilterField>
              </div>

              <LuxiaSettingsFormActions
                dirty={generalDirty}
                canSave={canConfigureConstellation && activeSection === "general"}
                onSave={handleSaveGeneral}
                onCancel={handleCancelGeneral}
              />

              <dl
                className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
                style={{ borderTop: "1px solid var(--luxia-settings-row-divider)" }}
              >
                {[
                  { label: "Type", value: constellationTypeLabel(record.type) },
                  { label: "Project", value: record.projectName },
                  {
                    label: "Status",
                    value:
                      record.status === "active" ? "Active" : "Archived",
                  },
                  { label: "Created by", value: record.createdBy },
                  { label: "Created", value: record.createdAt },
                  { label: "Updated", value: record.updatedAt },
                  {
                    label: "Connected sources",
                    value: String(record.connectedSources.length),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex min-w-0 flex-col gap-0.5 pt-3"
                    style={{ borderTop: "1px solid var(--luxia-settings-row-divider)" }}
                  >
                    <dt
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {item.label}
                    </dt>
                    <dd
                      className="luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </TabsContent>

            <TabsContent
              value="configuration"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              {showConfigureRoleHint ? (
                <p
                  className="mb-4 luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-secondary)" }}
                  role="status"
                >
                  {configureRoleHint}
                </p>
              ) : null}
              <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                {configurationRows.map((capability) => {
                  const summary = record.capabilitySummaries[capability.id];
                  const CapabilityIcon = capability.icon;
                  return (
                    <li
                      key={capability.id}
                      className="luxia-settings-row is-interactive flex flex-wrap items-start justify-between gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <CapabilityIcon
                            size={16}
                            strokeWidth={1.75}
                            aria-hidden
                            className="shrink-0"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          />
                          <p
                            className="luxia-type-body-default-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {capability.label}
                          </p>
                        </div>
                        <LuxiaPageGuide className="mt-1">
                          {capability.purpose}
                        </LuxiaPageGuide>
                        {summary ? (
                          <p
                            className="mt-2 luxia-type-caption"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {summary.countLabel} · {summary.statusLabel}
                          </p>
                        ) : null}
                      </div>
                      {(() => {
                        const isKnowledgeCapability = capability.id === "kb" || capability.id === "instr" || capability.id === "crawler";
                        const canManageThis = isKnowledgeCapability ? canEditKnowledge : canConfigureConstellation;
                        return canManageThis ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="compact"
                            onClick={() => onManageCapability(capability.id)}
                            aria-label={capability.manageLabel}
                          >
                            {capability.manageLabel}
                          </Button>
                        ) : (
                          <span
                            className="luxia-type-caption shrink-0"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            View only
                          </span>
                        );
                      })()}
                    </li>
                  );
                })}
              </ul>
            </TabsContent>

            <TabsContent
              value="sources"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <LuxiaPageGuide className="min-w-0 flex-1">
                  {CONSTELLATION_SETTINGS_GUIDANCE.sourcesDescription}
                </LuxiaPageGuide>
                {canConfigureConstellation ? (
                <Button
                  type="button"
                  variant="primary"
                  size="compact"
                  onClick={() => setAddSourceOpen(true)}
                >
                  Add Data Source
                </Button>
                ) : null}
              </div>

              {record.connectedSources.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  No Data Sources connected yet.
                </p>
              ) : (
                <ul className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                  {record.connectedSources.map((source) => (
                    <li
                      key={source.id}
                      className="luxia-settings-row flex flex-wrap items-start justify-between gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="luxia-type-body-default-strong"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {source.name}
                        </p>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {formatSourceType(source.type)} ·{" "}
                          {formatOwnership(source.ownership)} · {source.owner}
                        </p>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {formatSourceStatus(source.status)} · Updated{" "}
                          {source.lastUpdated}
                        </p>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          {source.usageInConstellation}
                          {source.accessSummary
                            ? ` · ${source.accessSummary}`
                            : ""}
                        </p>
                      </div>
                      <LuxiaEntityOptionsMenu
                        entityLabel={source.name}
                        entityType="Data Source"
                        items={[
                          {
                            id: "open-settings",
                            label: "Open Data Source Settings",
                            onSelect: () =>
                              onOpenDataSourceSettings(source.id),
                          },
                          ...(canConfigureConstellation
                            ? [
                                {
                                  id: "manage-access",
                                  label: "Manage source access",
                                  onSelect: () => onManageSourceAccess(source.id),
                                },
                                {
                                  id: "disconnect",
                                  label: "Remove from Constellation",
                                  destructive: true as const,
                                  separatorBefore: true,
                                  disabled: isLastSource,
                                  onSelect: () => setDisconnectSourceId(source.id),
                                },
                              ]
                            : []),
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent
              value="access"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              <LuxiaPageGuide className="mb-4">
                {CONSTELLATION_SETTINGS_GUIDANCE.accessDescription}
              </LuxiaPageGuide>

              <div className="mb-5 luxia-settings-summary-surface">
                <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                  Current user: {getOrganizationUserById(currentUserId)?.name ?? currentUserId}
                  {" · "}
                  Project role: {currentProjectRole ?? "Unavailable"}
                </p>
                <p className="mt-1 luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                  {record.connectedSources.length === 0
                    ? "This Constellation does not have connected Data Sources yet. Connect sources before evaluating Use permission."
                    : accessConflicts.length === 0
                      ? "Constellation available — Project role allows use and required Data Source permissions are satisfied."
                      : `Constellation unavailable — ${accessConflicts
                        .map((row) => `${row.sourceName} (${accessConflictLabel(row)})`)
                        .join("; ")}.`}
                </p>
              </div>

              <div
                className="luxia-settings-table-surface overflow-x-auto luxia-scrollbar luxia-scrollbar-light"
                role="region"
                aria-label="Project role capabilities"
                tabIndex={0}
              >
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      <th className="px-4 py-2.5 pr-4 luxia-type-caption">Role</th>
                      {ROLE_COLUMNS.map((column) => (
                        <th key={column} className="px-2 py-2.5 text-center luxia-type-caption">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {record.projectRoleCapabilities.map((row) => (
                      <tr
                        key={row.role}
                        style={ROW_DIVIDER}
                        className="luxia-type-body-dense"
                      >
                        <td
                          className="px-4 py-2.5 pr-4"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {row.role}
                        </td>
                        {ROLE_COLUMNS.map((column) => (
                          <td
                            key={column}
                            className="px-2 py-2.5 text-center"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {roleHasAction(row.actions, column) ? "Allowed" : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {onOpenMembers ? (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    onClick={() => onOpenMembers(record.projectId)}
                  >
                    Open Members & Roles
                  </Button>
                </div>
              ) : null}

              <h3
                className="mb-3 mt-6 luxia-type-body-default-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                Connected Data Source access
              </h3>

              {record.connectedSources.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  This Constellation does not have connected Data Sources yet.
                </p>
              ) : accessConflicts.length === 0 ? (
                <p
                  className="luxia-type-body-small"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Effective access is available for all connected Data Sources.
                </p>
              ) : null}

              {record.connectedSources.length > 0 ? (
              <ul className={`mt-3 ${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
                {sourceAccessRows.map((row) => (
                  <li
                    key={row.sourceId}
                    className="luxia-settings-row flex flex-wrap items-start justify-between gap-3 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="luxia-type-body-default-strong"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {row.sourceName}
                      </p>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {formatSourceType(row.sourceType as ConnectedDataSource["type"])} ·{" "}
                        Status: {formatSourceStatus(row.sourceStatus as ConnectedDataSource["status"])} ·{" "}
                        Requires {row.requiredPermission} · You have{" "}
                        {row.currentUserPermission}
                      </p>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{
                          color: hasAccessConflict(row)
                            ? "var(--luxia-error)"
                            : "var(--luxia-text-secondary)",
                        }}
                      >
                        {accessConflictLabel(row)}
                        {row.conflictNote ? ` · ${row.conflictNote}` : ""}
                      </p>
                      {row.accessLevelName !== "—" ? (
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          {row.accessLevelName === "Owner access"
                            ? "Data Source owner access"
                            : `Data Source permission via ${row.accessLevelName}`}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => onOpenDataSourceSettings(row.sourceId)}
                      >
                        Open Data Source settings
                      </Button>
                      {row.accessLevelName !== "—"
                        && row.accessLevelName !== "Owner access"
                        && onOpenAccessLevels ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={onOpenAccessLevels}
                        >
                          Open Access Levels
                        </Button>
                      ) : null}
                      {hasAccessConflict(row) && canConfigureConstellation ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          onClick={() => onManageSourceAccess(row.sourceId)}
                        >
                          Review access
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              ) : null}
            </TabsContent>

            <TabsContent
              value="lifecycle"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              <p
                className="mb-4 luxia-type-body-small"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {CONSTELLATION_SETTINGS_GUIDANCE.lifecycleDescription}
              </p>

              <div className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
              {canArchiveConstellation ? (
              <div className="luxia-settings-row flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Archive this Constellation
                  </p>
                  <p
                    className="mt-1 luxia-type-body-small"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Hide this Constellation from active use. You can restore it
                    later.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => setArchiveOpen(true)}
                >
                  Archive
                </Button>
              </div>
              ) : null}

              {canDeleteConstellation ? (
              <div className="luxia-settings-row flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Delete this Constellation
                  </p>
                  <p
                    className="mt-1 luxia-type-body-small"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Permanently remove this Constellation. Connected Data Sources
                    are not deleted.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="compact"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
              ) : null}

              {!canArchiveConstellation && !canDeleteConstellation ? (
                <div className="py-4">
                  <p
                    className="luxia-type-body-small"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {lifecycleRoleHint
                      ?? "Your Project role cannot change Constellation lifecycle."}
                  </p>
                </div>
              ) : null}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </LuxiaPageBody>

      <AddConstellationDataSourceDialog
        open={addSourceOpen}
        connectedSourceIds={record.connectedSources.map((source) => source.id)}
        dataSources={dataSources}
        accessLevels={accessLevels}
        currentUserId={currentUserId}
        onOpenChange={setAddSourceOpen}
        onConfirm={(sourceId) => {
          onAddDataSource(sourceId);
        }}
      />

      <AlertDialog
        open={Boolean(disconnectSourceId)}
        onOpenChange={(open) => {
          if (!open) setDisconnectSourceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {disconnectTarget?.name ?? "Data Source"} from this Constellation?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This removes the association from this Constellation only. The Data
                  Source itself is not deleted.
                </p>
                {disconnectTarget ? (
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Active tables and metrics tied to this source</li>
                    <li>Knowledge entries referencing this source</li>
                    <li>{disconnectTarget.usageInConstellation}</li>
                  </ul>
                ) : null}
                {isLastSource ? (
                  <p style={{ color: "var(--luxia-error)" }}>
                    At least one Data Source must remain connected.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isLastSource}
              style={{ background: "var(--luxia-error)" }}
              className="text-white hover:opacity-90"
              onClick={confirmDisconnect}
            >
              Remove from Constellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {record.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This Constellation will be hidden from Chat and Galaxy until
              restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {record.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the Constellation and its configuration.
              Connected Data Sources will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              style={{ background: "var(--luxia-error)" }}
              className="text-white hover:opacity-90"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
