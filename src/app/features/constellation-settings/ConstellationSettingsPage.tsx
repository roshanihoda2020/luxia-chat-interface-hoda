import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildConstellationSettingsBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaAiButton } from "@/app/components/LuxiaAiButton";
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
import { Button } from "@/app/components/ui/button";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
  DESTRUCTIVE_CONFIRM,
  DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
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
  canCreateConstellation as roleCanCreateConstellation,
  canDeleteConstellation as roleCanDeleteConstellation,
  canEditConstellationKnowledge as roleCanEditConstellationKnowledge,
} from "@/app/features/permissions/accessGuards";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
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
import { DuplicateConstellationDialog } from "./DuplicateConstellationDialog";
import { DataSourceLibraryDocumentTags } from "@/app/features/document-tags";
import { generateConstellationDescriptionMock } from "./generateConstellationDescriptionMock";
import { ResponseConfidenceSection } from "./responseConfidence";
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
  /** Atomically commit a local prototype duplicate; called only after mock success. */
  onDuplicateConstellation: (name: string) => {
    constellationId: string;
    projectId: string;
    name: string;
  };
  onOpenDuplicatedConstellation: (projectId: string, constellationId: string) => void;
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
  onDuplicateConstellation,
  onOpenDuplicatedConstellation,
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
  const [disconnecting, setDisconnecting] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generateDescriptionError, setGenerateDescriptionError] = useState<
    string | null
  >(null);
  const duplicateTriggerRef = useRef<HTMLButtonElement>(null);
  const generateDescriptionTokenRef = useRef(0);
  const destructiveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (destructiveTimerRef.current !== null) {
        window.clearTimeout(destructiveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    generateDescriptionTokenRef.current += 1;
    setGeneratingDescription(false);
    setGenerateDescriptionError(null);
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
  const canCreateConstellation = roleCanCreateConstellation(currentProjectRole);
  const canArchiveConstellation = roleCanArchiveConstellation(currentProjectRole);
  const canDeleteConstellation = roleCanDeleteConstellation(currentProjectRole);
  const isArchived = record.status !== "active";
  const canGenerateDescription = canConfigureConstellation && !isArchived;
  const canDuplicateConstellation = canCreateConstellation && !isArchived;
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
    if (!generalDirty || !canConfigureConstellation || generatingDescription) return;
    onSaveGeneral({
      name: generalDraft.name.trim(),
      description: generalDraft.description.trim(),
    });
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancelGeneral() {
    if (generatingDescription) return;
    setGenerateDescriptionError(null);
    setGeneralDraft(draftFromSettings(record));
  }

  async function handleGenerateDescription() {
    if (!canGenerateDescription || generatingDescription) return;
    const token = ++generateDescriptionTokenRef.current;
    setGeneratingDescription(true);
    setGenerateDescriptionError(null);
    const result = await generateConstellationDescriptionMock({
      name: generalDraft.name || record.name,
      type: record.type,
      projectName: record.projectName,
      connectedSourceNames: record.connectedSources.map((source) => source.name),
    });
    if (token !== generateDescriptionTokenRef.current) return;
    setGeneratingDescription(false);
    if (!result.ok) {
      setGenerateDescriptionError(result.message);
      return;
    }
    // Slice 1: match Dev — replace draft immediately (no confirm). Known product-safety decision.
    setGeneralDraft((prev) => ({
      ...prev,
      description: result.description,
    }));
  }

  function confirmDisconnect() {
    if (!disconnectSourceId || isLastSource || disconnecting) return;
    const sourceId = disconnectSourceId;
    setDisconnecting(true);
    destructiveTimerRef.current = window.setTimeout(() => {
      destructiveTimerRef.current = null;
      try {
        onDisconnectSource(sourceId);
        luxiaToast.success(DESTRUCTIVE_CONFIRM.dataSource.successToast);
        setDisconnectSourceId(null);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.dataSource.errorToast);
      } finally {
        setDisconnecting(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
  }

  function confirmArchive() {
    if (archiving) return;
    setArchiving(true);
    destructiveTimerRef.current = window.setTimeout(() => {
      destructiveTimerRef.current = null;
      try {
        onArchive();
        luxiaToast.success(DESTRUCTIVE_CONFIRM.constellationArchive.successToast);
        setArchiveOpen(false);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.constellationArchive.errorToast);
      } finally {
        setArchiving(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
  }

  function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    destructiveTimerRef.current = window.setTimeout(() => {
      destructiveTimerRef.current = null;
      try {
        onDelete();
        luxiaToast.success(DESTRUCTIVE_CONFIRM.constellationDelete.successToast);
        setDeleteOpen(false);
      } catch {
        luxiaToast.error(DESTRUCTIVE_CONFIRM.constellationDelete.errorToast);
      } finally {
        setDeleting(false);
      }
    }, DESTRUCTIVE_REMOVE_DELAY_MS);
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
              && value !== "response"
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
          <div className="mb-4 w-full min-w-0 overflow-x-auto luxia-scrollbar luxia-scrollbar-light">
            <TabsList
              aria-label="Constellation Settings sections"
              className={`${LUXIA_SETTINGS_TABLIST_CLASS} !flex !min-w-0 !grid-cols-none w-max max-w-none sm:w-full`}
              style={{
                display: "flex",
                boxSizing: "border-box",
              }}
            >
              {CONSTELLATION_SETTINGS_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  title={section.label}
                  className={`${LUXIA_SETTINGS_TAB_TRIGGER_CLASS} !w-auto flex-1 px-3`}
                >
                  <span className="block whitespace-nowrap text-center">{section.label}</span>
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
                    disabled={!canConfigureConstellation || generatingDescription}
                    onChange={(event) => {
                      setGenerateDescriptionError(null);
                      setGeneralDraft((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }));
                    }}
                    rows={4}
                  />
                </FilterField>

                {canGenerateDescription ? (
                  <div className="flex min-w-0 flex-col items-start gap-1.5">
                    <LuxiaAiButton
                      size="compact"
                      disabled={generatingDescription}
                      aria-busy={generatingDescription || undefined}
                      aria-label={
                        generatingDescription
                          ? "Generating description"
                          : "Generate description"
                      }
                      onClick={() => {
                        void handleGenerateDescription();
                      }}
                    >
                      {generatingDescription ? "Generating…" : "Generate description"}
                    </LuxiaAiButton>
                    {generateDescriptionError ? (
                      <p
                        className="luxia-type-caption"
                        style={{ color: "var(--luxia-error)" }}
                        role="alert"
                      >
                        {generateDescriptionError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <LuxiaSettingsFormActions
                dirty={generalDirty}
                canSave={
                  canConfigureConstellation
                  && activeSection === "general"
                  && !generatingDescription
                }
                onSave={handleSaveGeneral}
                onCancel={handleCancelGeneral}
              />

              <dl
                className="mt-6 grid gap-x-6 gap-y-4 rounded-[var(--luxia-radius-12)] border p-4 sm:grid-cols-2 lg:grid-cols-3"
                style={{ borderColor: "var(--luxia-settings-row-divider)" }}
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
                    className="flex min-w-0 flex-col gap-0.5"
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
                        // Members may open Knowledge Base in read-only mode (search / view / export).
                        const canOpenReadOnlyKb = capability.id === "kb" && !canManageThis;
                        if (canManageThis || canOpenReadOnlyKb) {
                          const visibleLabel = canOpenReadOnlyKb ? "View" : "Manage";
                          const accessibleLabel = canOpenReadOnlyKb
                            ? `View ${capability.label}`
                            : capability.manageLabel;
                          return (
                            <Button
                              type="button"
                              variant="outline"
                              size="compact"
                              className="shrink-0"
                              onClick={() => onManageCapability(capability.id)}
                              aria-label={accessibleLabel}
                              title={accessibleLabel}
                            >
                              {visibleLabel}
                            </Button>
                          );
                        }
                        return (
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
              value="response"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              <ResponseConfidenceSection
                constellationId={record.id}
                canEdit={canConfigureConstellation}
                roleHint={showConfigureRoleHint ? configureRoleHint : null}
              />
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
                <ListEmptyState title="No Data Sources connected yet." />
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
                        <DataSourceLibraryDocumentTags
                          dataSourceId={source.id}
                          className="mt-2 block"
                        />
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
                <ListEmptyState title="This Constellation does not have connected Data Sources yet." />
              ) : accessConflicts.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
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
                    className="luxia-settings-row flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
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
                    <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        className="justify-center sm:justify-end"
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
                          className="justify-center sm:justify-end"
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
                          className="justify-center sm:justify-end"
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
                className="mb-4 luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {CONSTELLATION_SETTINGS_GUIDANCE.lifecycleDescription}
              </p>

              <div className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
              {canDuplicateConstellation ? (
              <div className="luxia-settings-row flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Duplicate this Constellation
                  </p>
                  <p
                    className="mt-1 luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Copy its Knowledge Base, Metrics, Instructions and Extra Context into a new
                    Constellation.
                  </p>
                </div>
                <Button
                  ref={duplicateTriggerRef}
                  type="button"
                  variant="secondary"
                  size="compact"
                  onClick={() => setDuplicateOpen(true)}
                >
                  Duplicate
                </Button>
              </div>
              ) : null}

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
                    className="mt-1 luxia-type-body-dense"
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
                    className="mt-1 luxia-type-body-dense"
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

              {!canDuplicateConstellation && !canArchiveConstellation && !canDeleteConstellation ? (
                <div className="py-4">
                  <p
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {isArchived
                      ? "This Constellation is archived and read only. Restore it to make changes."
                      : (lifecycleRoleHint
                        ?? "Your Project role cannot change Constellation lifecycle.")}
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

      <DuplicateConstellationDialog
        open={duplicateOpen}
        constellationName={generalDraft.name || record.name}
        onCommitDuplicate={onDuplicateConstellation}
        onOpenCopy={onOpenDuplicatedConstellation}
        onOpenChange={(open) => {
          setDuplicateOpen(open);
          if (!open) {
            window.requestAnimationFrame(() => {
              duplicateTriggerRef.current?.focus();
            });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(disconnectSourceId)}
        onOpenChange={(open) => {
          if (!open && !disconnecting) setDisconnectSourceId(null);
        }}
        tone="destructive"
        title={DESTRUCTIVE_CONFIRM.dataSource.title}
        description={DESTRUCTIVE_CONFIRM.dataSource.description}
        impact={
          <>
            {disconnectTarget ? (
              <ul className="list-disc space-y-1 pl-5">
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
          </>
        }
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.dataSource.confirmLabel}
        busy={disconnecting}
        busyLabel={DESTRUCTIVE_CONFIRM.dataSource.busyLabel}
        onConfirm={() => {
          if (isLastSource) return;
          confirmDisconnect();
        }}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={(open) => {
          if (!open && !archiving) setArchiveOpen(false);
        }}
        tone="neutral"
        title={DESTRUCTIVE_CONFIRM.constellationArchive.title}
        description={DESTRUCTIVE_CONFIRM.constellationArchive.description}
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.constellationArchive.confirmLabel}
        busy={archiving}
        busyLabel={DESTRUCTIVE_CONFIRM.constellationArchive.busyLabel}
        onConfirm={confirmArchive}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteOpen(false);
        }}
        tone="destructive"
        title={DESTRUCTIVE_CONFIRM.constellationDelete.title}
        description={DESTRUCTIVE_CONFIRM.constellationDelete.description}
        cancelLabel="Cancel"
        confirmLabel={DESTRUCTIVE_CONFIRM.constellationDelete.confirmLabel}
        busy={deleting}
        busyLabel={DESTRUCTIVE_CONFIRM.constellationDelete.busyLabel}
        onConfirm={confirmDelete}
      />
    </LuxiaPageFrame>
  );
}
