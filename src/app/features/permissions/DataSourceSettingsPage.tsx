import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  LuxiaBreadcrumb,
  buildDataSourceSettingsBreadcrumbItems,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import {
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
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
import { Input } from "@/app/components/ui/input";
import { CANONICAL_CONSTELLATIONS } from "@/app/features/constellation/catalog";
import { FilterField } from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import { getProjectNameById } from "@/app/features/project/data";
import type { HomeProjectCard } from "@/app/features/project/types";
import { LuxiaSettingsFormActions } from "@/app/features/shared/LuxiaSettingsFormActions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_LIST_SURFACE_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
} from "@/app/features/shared/luxiaSettingsUx";
import {
  canAccessProject,
  canAdministerProjectConfiguration,
  evaluateConstellationUseAccess,
  getActiveProjectMembership,
} from "./accessGuards";
import {
  CURRENT_USER_ID,
  NO_ACCESS_LEVEL_ASSIGNED_LABEL,
  ORGANIZATIONAL_MANAGED_LABEL,
  formatAccessLevelNames,
  getDataSourceOwnerDisplay,
  getLibraryMyAccessLabel,
  getLibraryStatusLabel,
  getLibraryTypeLabel,
  getOwnershipLabel,
  permissionRank,
  resolveUserDataSourceAccess,
} from "./index";
import type {
  AccessLevelRecord,
  DataSourceCatalogItem,
  DataSourceContentSummary,
  ProjectMembership,
} from "./types";

const PARENT_SURFACE_CLASS = LUXIA_SETTINGS_CONTENT_SURFACE_CLASS;
const LIST_SURFACE_CLASS = LUXIA_SETTINGS_LIST_SURFACE_CLASS;
const ROW_DIVIDER = LUXIA_SETTINGS_ROW_DIVIDER;

export type DataSourceSettingsFocusSection = "usage" | "access" | "content";

export type DataSourceUsageConstellation = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  dataSourceIds: string[];
};

function SectionHeading({
  title,
  helper,
}: {
  title: string;
  helper?: string;
}) {
  return (
    <div className="mb-4 space-y-1">
      <h2
        className="luxia-type-title-section"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </h2>
      {helper ? (
        <p
          className="max-w-2xl luxia-type-caption"
          style={{ color: "var(--luxia-text-secondary)" }}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function MetaCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 pt-3" style={ROW_DIVIDER}>
      <dt
        className="luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        {label}
      </dt>
      <dd
        className="luxia-type-body-dense"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function formatEffectivePermission(
  source: DataSourceCatalogItem,
  accessLevels: AccessLevelRecord[],
  userId: string,
  dataSources: DataSourceCatalogItem[],
): string {
  const resolved = resolveUserDataSourceAccess(
    userId,
    source.id,
    accessLevels,
    dataSources,
  );

  if (resolved.viaOwner) {
    return "Manage (Private source owner)";
  }

  const levelNames = formatAccessLevelNames(resolved.accessLevelNames);
  if (resolved.permission && levelNames) {
    return `${resolved.permission} via ${levelNames}`;
  }
  if (resolved.permission) {
    return resolved.permission;
  }

  if (source.ownership === "organizational") {
    return NO_ACCESS_LEVEL_ASSIGNED_LABEL;
  }

  return "No Data Source permission";
}

function ContentSummaryPanel({
  summary,
  typeLabel,
  statusLabel,
}: {
  summary: DataSourceContentSummary;
  typeLabel: string;
  statusLabel: string;
}) {
  if (summary.kind === "database") {
    const rows: Array<{ label: string; value: string }> = [
      { label: "Connector", value: typeLabel },
      { label: "Status", value: statusLabel },
    ];
    if (summary.host) rows.push({ label: "Host", value: summary.host });
    if (summary.port) rows.push({ label: "Port", value: summary.port });
    if (summary.account) rows.push({ label: "Account", value: summary.account });
    if (summary.projectId) rows.push({ label: "Project ID", value: summary.projectId });
    if (summary.dataset) rows.push({ label: "Dataset", value: summary.dataset });
    if (summary.database) rows.push({ label: "Database", value: summary.database });
    if (summary.warehouse) rows.push({ label: "Warehouse", value: summary.warehouse });
    if (summary.role) rows.push({ label: "Role", value: summary.role });
    if (summary.username) rows.push({ label: "Username", value: summary.username });
    if (typeof summary.ssl === "boolean") {
      rows.push({ label: "SSL", value: summary.ssl ? "Required" : "Not required" });
    }

    return (
      <>
        <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => (
            <MetaCell key={item.label} label={item.label} value={item.value} />
          ))}
        </dl>
        <p
          className="mt-4 luxia-type-caption"
          style={{ color: "var(--luxia-text-muted)" }}
        >
          Password and secrets are not shown. Replace credentials is not available in this prototype.
        </p>
      </>
    );
  }

  if (summary.kind === "csv") {
    return (
      <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
        <MetaCell label="File" value={summary.fileName ?? "—"} />
        <MetaCell label="Table name" value={summary.tableName ?? "—"} />
        <MetaCell label="Import status" value={statusLabel} />
        <MetaCell
          label="Imported rows"
          value={
            typeof summary.importedRows === "number"
              ? summary.importedRows.toLocaleString()
              : "—"
          }
        />
        <MetaCell
          label="Skipped rows"
          value={
            typeof summary.skippedRows === "number"
              ? summary.skippedRows.toLocaleString()
              : "—"
          }
        />
        {summary.delimiter ? (
          <MetaCell label="Delimiter" value={summary.delimiter} />
        ) : null}
        {summary.tableDescription ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <MetaCell label="Table summary" value={summary.tableDescription} />
          </div>
        ) : null}
      </dl>
    );
  }

  const files = summary.fileNames ?? [];
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
        <MetaCell label="Files" value={String(files.length)} />
        <MetaCell label="Processing state" value={statusLabel} />
      </dl>
      {files.length > 0 ? (
        <ul className={`${LIST_SURFACE_CLASS} divide-y px-4`} style={{ borderColor: "var(--luxia-settings-row-divider)" }}>
          {files.map((fileName) => (
            <li
              key={fileName}
              className="luxia-settings-row py-3 luxia-type-body-dense"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              {fileName}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        Catalog-level File Data Source content. Constellation PDF Files, Extra Context Files, and Knowledge Base remain Constellation capabilities.
      </p>
    </div>
  );
}

export interface DataSourceSettingsPageProps {
  source: DataSourceCatalogItem | null;
  accessLevels: AccessLevelRecord[];
  dataSources?: DataSourceCatalogItem[];
  projects?: readonly HomeProjectCard[];
  constellations?: Array<{ id: string; label: string; projectId: string }>;
  constellationConnections?: Array<{
    id: string;
    label: string;
    projectId: string;
    dataSourceIds: string[];
  }>;
  memberships?: ProjectMembership[];
  currentUserId?: string;
  focusSection?: DataSourceSettingsFocusSection | null;
  onNavigateHome: () => void;
  onOpenDataSources: () => void;
  onOpenAccessLevels: () => void;
  onOpenAccessLevel: (accessLevelId: string) => void;
  onBack: () => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  onOpenProject?: (projectId: string) => void;
  onSaveSource?: (source: DataSourceCatalogItem) => void;
  canAccess?: boolean;
}

export function DataSourceSettingsPage({
  source,
  accessLevels,
  dataSources,
  projects,
  constellations,
  constellationConnections,
  memberships = [],
  currentUserId = CURRENT_USER_ID,
  focusSection = null,
  onNavigateHome,
  onOpenDataSources,
  onOpenAccessLevels,
  onOpenAccessLevel,
  onBack: _onBack,
  onOpenConstellationSettings,
  onOpenProject,
  onSaveSource,
  canAccess = true,
}: DataSourceSettingsPageProps) {
  const usageSectionRef = useRef<HTMLDivElement>(null);
  const accessSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const catalog = dataSources ?? (source ? [source] : []);
  const isOrganizational = source?.ownership === "organizational";
  const ownerDisplay = source ? getDataSourceOwnerDisplay(source) : null;

  const resolvedAccess = source && canAccess
    ? resolveUserDataSourceAccess(currentUserId, source.id, accessLevels, catalog)
    : null;
  const canManage = Boolean(
    resolvedAccess?.permission
    && permissionRank(resolvedAccess.permission) >= permissionRank("Manage"),
  );
  const myAccessLabel = source && canAccess
    ? getLibraryMyAccessLabel(source.id, accessLevels, catalog, currentUserId)
    : null;

  const [nameDraft, setNameDraft] = useState(source?.name ?? "");
  const [archiveOpen, setArchiveOpen] = useState(false);
  useEffect(() => {
    setNameDraft(source?.name ?? "");
  }, [source?.id, source?.name]);

  const nameDirty = Boolean(
    source && canAccess && canManage && nameDraft.trim() !== source.name.trim(),
  );

  const associations = useMemo(() => {
    if (!source || !canAccess) return [];
    return accessLevels
      .map((level) => {
        const grant = level.sourceGrants.find(
          (item) => item.dataSourceId === source.id,
        );
        if (!grant) return null;
        return { level, permission: grant.permission };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [source, accessLevels, canAccess]);

  const usageAll = useMemo(() => {
    if (!source || !canAccess) {
      return [] as DataSourceUsageConstellation[];
    }
    const map = new Map<string, DataSourceUsageConstellation>();

    for (const item of CANONICAL_CONSTELLATIONS) {
      if (!item.dataSourceIds.includes(source.id)) continue;
      const live = constellations?.find((entry) => entry.id === item.id);
      map.set(item.id, {
        id: item.id,
        name: live?.label ?? item.name,
        projectId: item.projectId,
        projectName: getProjectNameById(item.projectId, projects),
        dataSourceIds: [...item.dataSourceIds],
      });
    }

    for (const item of constellationConnections ?? []) {
      if (!item.dataSourceIds.includes(source.id)) continue;
      const existing = map.get(item.id);
      map.set(item.id, {
        id: item.id,
        name: item.label || existing?.name || item.id,
        projectId: item.projectId,
        projectName: getProjectNameById(item.projectId, projects),
        dataSourceIds: [...item.dataSourceIds],
      });
    }

    return [...map.values()];
  }, [source, canAccess, constellations, constellationConnections, projects]);

  const usageVisible = useMemo(() => {
    return usageAll.filter((item) => {
      if (!canAccessProject(item.projectId, memberships, currentUserId)) {
        return false;
      }
      const membership = getActiveProjectMembership(
        item.projectId,
        memberships,
        currentUserId,
      );
      if (canAdministerProjectConfiguration(currentUserId, membership?.projectRole)) {
        return true;
      }
      if (!membership || membership.status !== "active") return false;
      return evaluateConstellationUseAccess({
        userId: currentUserId,
        projectRole: membership.projectRole,
        membershipStatus: membership.status,
        connectedSourceIds: item.dataSourceIds,
        accessLevels,
        dataSources: catalog,
      }).available;
    });
  }, [usageAll, memberships, currentUserId, accessLevels, catalog]);

  const hiddenUsageCount = Math.max(0, usageAll.length - usageVisible.length);

  const secondaryProjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const item of usageVisible) {
      map.set(item.projectId, {
        id: item.projectId,
        name: item.projectName,
      });
    }
    return [...map.values()];
  }, [usageVisible]);

  useEffect(() => {
    if (!canAccess || !focusSection) return;
    const target =
      focusSection === "usage"
        ? usageSectionRef.current
        : focusSection === "access"
          ? accessSectionRef.current
          : contentSectionRef.current;
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [canAccess, focusSection, source?.id]);

  const effectiveSourceLabel = source && canAccess
    ? formatEffectivePermission(source, accessLevels, currentUserId, catalog)
    : null;

  const breadcrumbItems = buildDataSourceSettingsBreadcrumbItems({
    dataSourceId: source?.id ?? "unavailable",
    dataSourceName: canAccess && source ? source.name : "Data Source",
  });

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
    onDataSources: onOpenDataSources,
  };

  const unavailable = !source || !canAccess;
  const statusDisplay = source ? getLibraryStatusLabel(source) : null;
  const typeDisplay = source ? getLibraryTypeLabel(source) : null;
  const showContent = Boolean(source?.contentSummary);

  function handleSaveName() {
    if (!source || !onSaveSource || !canManage) return;
    const nextName = nameDraft.trim();
    if (!nextName) {
      toast.error("Data Source name is required.");
      return;
    }
    onSaveSource({ ...source, name: nextName });
    toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
  }

  function handleCancelName() {
    if (!source) return;
    setNameDraft(source.name);
  }

  return (
    <LuxiaPageFrame>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="DATA SOURCE"
        title={
          unavailable
            ? "Data source unavailable"
            : (source?.name ?? "Data source unavailable")
        }
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        context={
          source && canAccess ? (
            <p
              className="luxia-type-caption"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              {typeDisplay}
              <span aria-hidden style={{ color: "var(--luxia-text-muted)" }}> · </span>
              {statusDisplay}
              <span aria-hidden style={{ color: "var(--luxia-text-muted)" }}> · </span>
              {getOwnershipLabel(source.ownership)}
              {!isOrganizational && ownerDisplay ? (
                <>
                  <span aria-hidden style={{ color: "var(--luxia-text-muted)" }}> · </span>
                  {ownerDisplay}
                </>
              ) : null}
            </p>
          ) : null
        }
        guide={
          source && canAccess
            ? "Review configuration, access, and usage."
            : "This Data Source is not available in your accessible library."
        }
        secondaryAction={
          source && canAccess ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.secondary}
              onClick={onOpenAccessLevels}
            >
              Open Access Levels
            </Button>
          ) : null
        }
        primaryAction={null}
      />
      <LuxiaPageBody>
        {source && canAccess ? (
          <section className={`w-full min-w-0 space-y-8 ${PARENT_SURFACE_CLASS}`}>
            <div>
              <SectionHeading
                title="General"
                helper="Identity and ownership."
              />

              {canManage ? (
                <div className="max-w-xl space-y-4">
                  <FilterField label="Data Source name" htmlFor="ds-settings-name">
                    <Input
                      id="ds-settings-name"
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      autoComplete="off"
                    />
                  </FilterField>
                </div>
              ) : (
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Data Source name
                  </p>
                  <p
                    className="luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {source.name}
                  </p>
                </div>
              )}

              <dl className="mt-5 grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
                <MetaCell label="Type" value={typeDisplay ?? "—"} />
                <MetaCell label="Status" value={statusDisplay ?? "—"} />
                <MetaCell label="Ownership" value={getOwnershipLabel(source.ownership)} />
                {isOrganizational ? (
                  <MetaCell label="Managed by" value={ORGANIZATIONAL_MANAGED_LABEL} />
                ) : (
                  <MetaCell label="Owner" value={ownerDisplay ?? "—"} />
                )}
                <MetaCell label="My access" value={myAccessLabel ?? "—"} />
              </dl>

              <p
                className="mt-4 luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Ownership cannot be converted in this prototype after creation.
              </p>

              <LuxiaSettingsFormActions
                dirty={nameDirty}
                canSave={canManage && Boolean(onSaveSource)}
                onSave={handleSaveName}
                onCancel={handleCancelName}
              />
            </div>

            {showContent && source.contentSummary ? (
              <div
                ref={contentSectionRef}
                id="ds-settings-content"
                className="scroll-mt-4 pt-2"
                style={ROW_DIVIDER}
              >
                <div className="pt-6">
                  <SectionHeading
                    title={
                      source.contentSummary.kind === "database"
                        ? "Connection"
                        : "Content"
                    }
                    helper={
                      source.contentSummary.kind === "database"
                        ? "Connection details. Do not expose secrets."
                        : "Ingestion metadata captured when this Data Source was created."
                    }
                  />
                  <ContentSummaryPanel
                    summary={source.contentSummary}
                    typeLabel={typeDisplay ?? "—"}
                    statusLabel={statusDisplay ?? "—"}
                  />
                  {canManage && source.contentSummary.kind === "database" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() =>
                          toast.success("Connection test succeeded (prototype).")
                        }
                      >
                        Test connection
                      </Button>
                      <Button
                        type="button"
                        variant="tertiary"
                        size="compact"
                        disabled
                        title="Credential replacement is not available in this prototype."
                      >
                        Replace credentials
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              ref={accessSectionRef}
              id="ds-settings-access"
              className="scroll-mt-4 pt-2"
              style={ROW_DIVIDER}
            >
              <div className="pt-6">
                <SectionHeading
                  title="Access"
                  helper="Ownership and Access Level grants."
                />

                <dl className="grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
                  <MetaCell label="Ownership" value={getOwnershipLabel(source.ownership)} />
                  <MetaCell label="My access" value={myAccessLabel ?? "—"} />
                  {!isOrganizational ? (
                    <MetaCell label="Owner" value={ownerDisplay ?? "—"} />
                  ) : null}
                  <MetaCell
                    label="Effective permission"
                    value={effectiveSourceLabel ?? "—"}
                  />
                </dl>

                {source.status !== "active" ? (
                  <p
                    className="mt-3 luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Source is not active, so Constellation use remains unavailable.
                  </p>
                ) : null}

                <p
                  className="mt-3 max-w-2xl luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  {isOrganizational
                    ? "Access is managed through Access Levels. Organization membership alone does not grant Use."
                    : "Private source owners receive Manage without an Access Level. Organization Admin does not automatically access Private sources."}
                </p>

                <div className="mt-6">
                  <h3
                    className="luxia-type-body-dense-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    Access Level associations
                  </h3>
                  <p
                    className="mt-1 luxia-type-caption"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    Configured grants. Inactive Access Levels do not contribute to effective permission.
                  </p>

                  {associations.length === 0 ? (
                    <p
                      className="mt-3 luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {NO_ACCESS_LEVEL_ASSIGNED_LABEL}. Detailed grants are managed in Access Levels.
                    </p>
                  ) : (
                    <ul
                      className={`mt-3 ${LIST_SURFACE_CLASS} divide-y px-4`}
                      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                    >
                      {associations.map(({ level, permission }) => (
                        <li
                          key={level.id}
                          className="luxia-settings-row flex flex-wrap items-start justify-between gap-3 py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className="luxia-type-body-default-strong"
                              style={{ color: "var(--luxia-text-primary)" }}
                            >
                              {level.name}
                            </p>
                            <p
                              className="mt-1 luxia-type-caption"
                              style={{ color: "var(--luxia-text-secondary)" }}
                            >
                              {permission ?? "Grant unavailable"}
                              {" · "}
                              {level.status === "active"
                                ? "Active (effective when member)"
                                : "Inactive (configured only)"}
                            </p>
                          </div>
                          <LuxiaEntityOptionsMenu
                            entityLabel={level.name}
                            entityType="Access Level"
                            items={[
                              {
                                id: "open",
                                label: "Open Access Level",
                                onSelect: () => onOpenAccessLevel(level.id),
                              },
                            ]}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div
              ref={usageSectionRef}
              id="ds-settings-usage"
              className="scroll-mt-4 pt-2"
              style={ROW_DIVIDER}
            >
              <div className="pt-6">
                <SectionHeading
                  title="Usage"
                  helper="Constellations that connect this Data Source."
                />

                {usageVisible.length === 0 ? (
                  <p
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-secondary)" }}
                  >
                    {usageAll.length === 0
                      ? "No Constellations currently connect to this Data Source."
                      : "No accessible Constellations currently connect to this Data Source."}
                  </p>
                ) : (
                  <ul
                    className={`${LIST_SURFACE_CLASS} divide-y px-4`}
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    {usageVisible.map((item) => (
                      <li
                        key={item.id}
                        className="luxia-settings-row flex flex-wrap items-start justify-between gap-3 py-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="luxia-type-body-default-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {item.name}
                          </p>
                          <p
                            className="mt-1 luxia-type-caption"
                            style={{ color: "var(--luxia-text-secondary)" }}
                          >
                            {item.projectName}
                          </p>
                        </div>
                        {onOpenConstellationSettings ? (
                          <LuxiaEntityOptionsMenu
                            entityLabel={item.name}
                            entityType="Constellation"
                            items={[
                              {
                                id: "open",
                                label: "Open Constellation",
                                onSelect: () =>
                                  onOpenConstellationSettings(item.projectId, item.id),
                              },
                            ]}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {hiddenUsageCount > 0 ? (
                  <p
                    className="mt-3 luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    {hiddenUsageCount} additional Constellation
                    {hiddenUsageCount === 1 ? "" : "s"} may use this source in Projects you cannot access.
                  </p>
                ) : null}

                {secondaryProjects.length > 0 ? (
                  <div className="mt-6">
                    <h3
                      className="luxia-type-body-dense-strong"
                      style={{ color: "var(--luxia-text-primary)" }}
                    >
                      Related Projects
                    </h3>
                    <p
                      className="mt-1 luxia-type-caption"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      Indirect context through accessible Constellations. This Data Source does not belong to a Project.
                    </p>
                    <ul
                      className={`mt-3 ${LIST_SURFACE_CLASS} divide-y px-4`}
                      style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                    >
                      {secondaryProjects.map((item) => (
                        <li
                          key={item.id}
                          className="luxia-settings-row flex flex-wrap items-center justify-between gap-3 py-3.5"
                        >
                          <p
                            className="luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {item.name}
                          </p>
                          {onOpenProject ? (
                            <LuxiaEntityOptionsMenu
                              entityLabel={item.name}
                              entityType="Project"
                              items={[
                                {
                                  id: "open",
                                  label: "Open Project",
                                  onSelect: () => onOpenProject(item.id),
                                },
                              ]}
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {canManage && onSaveSource ? (
              <div
                className="scroll-mt-4 pt-2"
                style={ROW_DIVIDER}
              >
                <div className="pt-6">
                  <SectionHeading
                    title="Lifecycle"
                    helper="Archive removes this Data Source from active Constellation use in this prototype."
                  />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <p
                      className="max-w-xl luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {source.status === "archived"
                        ? "This Data Source is archived."
                        : "Archiving keeps the catalog entry for reference and marks status as Archived."}
                    </p>
                    {source.status === "archived" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() => {
                          onSaveSource({ ...source, status: "active" });
                          toast.success("Data Source restored to Active.");
                        }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="compact"
                        onClick={() => setArchiveOpen(true)}
                      >
                        Archive Data Source
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <div className="space-y-4 py-8">
            <h2
              className="luxia-type-title-section"
              style={{ color: "var(--luxia-text-primary)" }}
            >
              Unavailable
            </h2>
            <p
              className="luxia-type-body"
              style={{ color: "var(--luxia-text-secondary)" }}
            >
              {!source
                ? "This Data Source could not be found for the current workspace."
                : "You do not have access to this Data Source."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={onOpenDataSources}
            >
              Back to Data Sources
            </Button>
          </div>
        )}
      </LuxiaPageBody>

      {source && canManage && onSaveSource ? (
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive {source.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This Data Source will be removed from active use and can be restored
                later. Connected Projects and Constellations are not deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="text-white hover:opacity-90"
                style={{ background: "var(--luxia-error)" }}
                onClick={() => {
                  onSaveSource({ ...source, status: "archived" });
                  toast.success("Data Source archived.");
                  setArchiveOpen(false);
                }}
              >
                Archive Data Source
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </LuxiaPageFrame>
  );
}
