import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuxiaBreadcrumb,
  buildConstellationSettingsBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import {
  LuxiaPageGuide,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Textarea } from "@/app/components/ui/textarea";
import type { CapsuleCapabilityId } from "@/app/features/constellation/capsuleCapabilities";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { LUXIA_DIRTY_STATE_COPY } from "@/app/features/shared/luxiaSettingsUx";
import {
  CONSTELLATION_SETTINGS_GUIDANCE,
  CONSTELLATION_SETTINGS_PAGE_VARIANT,
  CONSTELLATION_SETTINGS_SECTIONS,
  configurationCapabilitiesForType,
  type ConstellationSettingsSectionId,
} from "./ia";
import {
  constellationTypeLabel,
  draftFromSettings,
  type ConnectedDataSource,
  type ConstellationSettingsDraft,
  type ConstellationSettingsRecord,
  type ProjectRoleAction,
  type SourceAccessSummaryRow,
} from "./types";

const PARENT_SURFACE_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid var(--luxia-border-default)",
  borderRadius: "var(--luxia-radius-12)",
  padding: "var(--luxia-spacing-24)",
  boxSizing: "border-box" as const,
} as const;

/** Tab panels inherit surface padding — no per-tab outer p-*. */
const SETTINGS_TAB_PANEL_CLASS = "m-0 w-full p-0 outline-none";

const ROW_DIVIDER = {
  borderTop: "1px solid var(--luxia-border-subtle)",
} as const;

const READONLY_VALUE_STYLE = {
  color: "var(--luxia-text-secondary)",
  background: "var(--luxia-surface-subtle)",
} as const;

const ROLE_COLUMNS: ProjectRoleAction[] = [
  "View",
  "Use",
  "Configure",
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
  if (column === "View") {
    return actions.includes("View") || actions.includes("Restricted view");
  }
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

export interface ConstellationSettingsPageProps {
  record: ConstellationSettingsRecord;
  unavailable?: boolean;
  unavailableReason?: string;
  relatedChats?: ConstellationSettingsRelatedChat[];
  activeSection: ConstellationSettingsSectionId;
  onSectionChange: (section: ConstellationSettingsSectionId) => void;
  /** Bumps when focus should move to the Settings page heading after navigation. */
  focusHeadingToken?: number;
  onCreateChat?: (projectId: string, constellationId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onSaveGeneral: (draft: ConstellationSettingsDraft) => void;
  onManageCapability: (capabilityId: CapsuleCapabilityId) => void;
  onAddDataSource: () => void;
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
}

export function ConstellationSettingsPage({
  record,
  unavailable = false,
  unavailableReason,
  relatedChats = [],
  activeSection,
  onSectionChange,
  focusHeadingToken = 0,
  onCreateChat,
  onOpenChat,
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
}: ConstellationSettingsPageProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const [generalDraft, setGeneralDraft] = useState(() =>
    draftFromSettings(record),
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [disconnectSourceId, setDisconnectSourceId] = useState<string | null>(
    null,
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setGeneralDraft(draftFromSettings(record));
    setSaveNotice(null);
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

  const accessConflicts = useMemo(
    () => record.sourceAccessRows.filter(hasAccessConflict),
    [record.sourceAccessRows],
  );

  const disconnectTarget = record.connectedSources.find(
    (source) => source.id === disconnectSourceId,
  );
  const isLastSource = record.connectedSources.length <= 1;

  function handleSaveGeneral() {
    if (!generalDirty) return;
    onSaveGeneral({
      name: generalDraft.name.trim(),
      description: generalDraft.description.trim(),
    });
    setSaveNotice(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancelGeneral() {
    setGeneralDraft(draftFromSettings(record));
    setSaveNotice(null);
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
      <div ref={headingRef}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="Constellation Settings"
        title={generalDraft.name || record.name}
        titleStyle={{ color: HS.sectionHeading }}
        onRename={(name) => {
          setGeneralDraft((prev) => ({ ...prev, name }));
          setSaveNotice(null);
        }}
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
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              {constellationTypeLabel(record.type)}
              {" · "}
              {record.status === "active" ? "Active" : "Archived"}
              {" · "}
              {record.projectName}
            </p>
            {activeSection === "general" && generalDirty ? (
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-purple-60)" }}
              >
                {LUXIA_DIRTY_STATE_COPY.unsaved}
              </p>
            ) : saveNotice ? (
              <p
                className="luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                {saveNotice}
              </p>
            ) : null}
          </div>
        }
        secondaryAction={
          relatedChats.length === 1 && onOpenChat
            || relatedChats.length > 1
            || (activeSection === "general" && generalDirty)
            ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {relatedChats.length === 1 && onOpenChat ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.secondary}
                onClick={() => onOpenChat(relatedChats[0].id)}
              >
                Open Chat
              </Button>
            ) : null}
            {relatedChats.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary}>
                    Chats
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  {relatedChats.map((chat) => (
                    <DropdownMenuItem
                      key={chat.id}
                      onSelect={() => onOpenChat?.(chat.id)}
                    >
                      {chat.label}
                    </DropdownMenuItem>
                  ))}
                  {onCreateChat ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onCreateChat(record.projectId, record.id)}
                      >
                        Create New Chat
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {activeSection === "general" && generalDirty ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.secondary}
                onClick={handleCancelGeneral}
              >
                {LUXIA_DIRTY_STATE_COPY.cancel}
              </Button>
            ) : null}
          </div>
            ) : null
        }
        options={
          (() => {
            const optionItems = [
              ...(relatedChats.length === 1 && onCreateChat
                ? [
                    {
                      id: "create-chat",
                      label: "Create Chat",
                      onSelect: () => onCreateChat(record.projectId, record.id),
                    },
                  ]
                : []),
              ...(onOpenMembers
                ? [
                    {
                      id: "members",
                      label: "Members & roles",
                      onSelect: () => onOpenMembers(record.projectId),
                    },
                  ]
                : []),
              ...(onOpenAccessLevels
                ? [
                    {
                      id: "access-levels",
                      label: "Access Levels",
                      onSelect: onOpenAccessLevels,
                    },
                  ]
                : []),
            ];
            if (optionItems.length === 0) return undefined;
            return (
              <LuxiaEntityOptionsMenu
                entityLabel={record.name}
                entityType="Constellation"
                triggerVariant={LUXIA_PAGE_HEADER_ACTION.menuTrigger}
                items={optionItems}
              />
            );
          })()
        }
        primaryAction={
          relatedChats.length === 0 && onCreateChat && !(activeSection === "general" && generalDirty) ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={() => onCreateChat(record.projectId, record.id)}
            >
              Create Chat
            </Button>
          ) : activeSection === "general" && generalDirty ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              onClick={handleSaveGeneral}
            >
              {LUXIA_DIRTY_STATE_COPY.save}
            </Button>
          ) : null
        }
      />

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
              && value !== "danger"
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
              className="luxia-settings-tablist grid h-11 w-full min-w-[44rem] grid-cols-5 gap-1 overflow-visible rounded-[var(--luxia-radius-12)] border border-[var(--luxia-border-default)] bg-[var(--luxia-surface)] p-1 text-[var(--luxia-text-secondary)] sm:min-w-0"
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
                  className="box-border h-9 min-h-9 min-w-0 w-full shrink-0 justify-center gap-0 overflow-hidden rounded-[var(--luxia-radius-8)] border border-transparent px-2 py-1 luxia-type-body-small font-normal whitespace-nowrap shadow-none"
                >
                  <span className="block w-full truncate text-center">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="w-full min-w-0" style={PARENT_SURFACE_STYLE}>
            <TabsContent value="general" className={SETTINGS_TAB_PANEL_CLASS}>
              <div className="space-y-4 max-w-xl">
                <FilterField label="Name" htmlFor="cs-name">
                  <Input
                    id="cs-name"
                    value={generalDraft.name}
                    onChange={(event) => {
                      setGeneralDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }));
                      setSaveNotice(null);
                    }}
                  />
                </FilterField>

                <FilterField label="Description" htmlFor="cs-description">
                  <Textarea
                    id="cs-description"
                    value={generalDraft.description}
                    onChange={(event) => {
                      setGeneralDraft((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }));
                      setSaveNotice(null);
                    }}
                    rows={4}
                  />
                </FilterField>
              </div>

              <dl
                className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
                style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
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
                    style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
                  >
                    <dt
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
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
              <ul className="divide-y" style={{ borderColor: "var(--luxia-border-subtle)" }}>
                {configurationRows.map((capability) => {
                  const summary = record.capabilitySummaries[capability.id];
                  const CapabilityIcon = capability.icon;
                  return (
                    <li
                      key={capability.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
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
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            {summary.countLabel} · {summary.statusLabel}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => onManageCapability(capability.id)}
                        aria-label={capability.manageLabel}
                      >
                        {capability.manageLabel}
                      </Button>
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
                <Button
                  type="button"
                  variant="primary"
                  size="compact"
                  onClick={onAddDataSource}
                >
                  Add Data Source
                </Button>
              </div>

              {record.connectedSources.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  No Data Sources connected yet.
                </p>
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--luxia-border-subtle)" }}>
                  {record.connectedSources.map((source) => (
                    <li
                      key={source.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
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
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          {formatSourceType(source.type)} ·{" "}
                          {formatOwnership(source.ownership)} · {source.owner}
                        </p>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-muted)" }}
                        >
                          {formatSourceStatus(source.status)} · Updated{" "}
                          {source.lastUpdated}
                        </p>
                        <p
                          className="mt-1 luxia-type-caption"
                          style={{ color: "var(--luxia-text-secondary)" }}
                        >
                          {source.usageInConstellation} · {source.accessSummary}
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
                          {
                            id: "manage-access",
                            label: "Manage source access",
                            onSelect: () => onManageSourceAccess(source.id),
                          },
                          {
                            id: "disconnect",
                            label: "Disconnect from Constellation",
                            destructive: true,
                            separatorBefore: true,
                            disabled: isLastSource,
                            onSelect: () => setDisconnectSourceId(source.id),
                          },
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

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr
                      className="luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      <th className="pb-2 pr-4 font-medium">Role</th>
                      {ROLE_COLUMNS.map((column) => (
                        <th key={column} className="pb-2 px-2 text-center font-medium">
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
                          className="py-2 pr-4"
                          style={{ color: "var(--luxia-text-primary)" }}
                        >
                          {row.role}
                        </td>
                        {ROLE_COLUMNS.map((column) => (
                          <td
                            key={column}
                            className="py-2 px-2 text-center"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {roleHasAction(row.actions, column) ? "✓" : "—"}
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

              {accessConflicts.length === 0 ? (
                <p
                  className="luxia-type-body-small"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Effective access is available for all connected Data Sources.
                </p>
              ) : null}

              <ul className="mt-3 divide-y" style={{ borderColor: "var(--luxia-border-subtle)" }}>
                {record.sourceAccessRows.map((row) => (
                  <li
                    key={row.sourceId}
                    className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
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
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        {formatSourceType(row.sourceType as ConnectedDataSource["type"])} ·{" "}
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
                          Access Level: {row.accessLevelName}
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
                      {row.accessLevelName !== "—" && onOpenAccessLevels ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={onOpenAccessLevels}
                        >
                          Open Access Level
                        </Button>
                      ) : null}
                      {hasAccessConflict(row) ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          onClick={() => onManageSourceAccess(row.sourceId)}
                        >
                          Request access
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent
              value="danger"
              className={SETTINGS_TAB_PANEL_CLASS}
            >
              <p
                className="mb-4 luxia-type-body-small"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {CONSTELLATION_SETTINGS_GUIDANCE.dangerDescription}
              </p>

              <div className="divide-y" style={{ borderColor: "var(--luxia-border-subtle)" }}>
              <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0">
                <div>
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Archive Constellation
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

              <div className="flex flex-wrap items-center justify-between gap-3 py-4 last:pb-0">
                <div>
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Delete Constellation
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </LuxiaPageBody>

      <AlertDialog
        open={Boolean(disconnectSourceId)}
        onOpenChange={(open) => {
          if (!open) setDisconnectSourceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disconnect {disconnectTarget?.name ?? "Data Source"}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This Constellation will lose access to this Data Source.
                  Existing configuration may become unavailable.
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
              Disconnect
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
      </div>
    </LuxiaPageFrame>
  );
}
