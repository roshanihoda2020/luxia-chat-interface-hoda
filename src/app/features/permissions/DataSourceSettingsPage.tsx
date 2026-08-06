import { useMemo } from "react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
} from "@/app/components/LuxiaBreadcrumb";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { Button } from "@/app/components/ui/button";
import { CANONICAL_CONSTELLATIONS } from "@/app/features/constellation/catalog";
import { getProjectNameById } from "@/app/features/project/data";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  CURRENT_USER_ID,
  NO_ACCESS_LEVEL_ASSIGNED_LABEL,
  ORGANIZATIONAL_MANAGED_LABEL,
  formatAccessLevelNames,
  formatDataSourceType,
  getDataSourceOwnerDisplay,
  getOwnershipLabel,
  resolveUserDataSourceAccess,
} from "./index";
import {
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
} from "@/app/features/shared/luxiaSettingsUx";
import type { AccessLevelRecord, DataSourceCatalogItem } from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;
const ROW_DIVIDER = LUXIA_SETTINGS_ROW_DIVIDER;

function statusLabel(status: DataSourceCatalogItem["status"]): string {
  if (status === "active") return "Active";
  if (status === "archived") return "Archived";
  return "Inactive";
}

function formatEffectivePermission(
  source: DataSourceCatalogItem,
  accessLevels: AccessLevelRecord[],
): string {
  const resolved = resolveUserDataSourceAccess(
    CURRENT_USER_ID,
    source.id,
    accessLevels,
  );

  if (resolved.viaOwner) {
    return "Data Source permission: Manage (Private source owner)";
  }

  const levelNames = formatAccessLevelNames(resolved.accessLevelNames);
  if (resolved.permission && levelNames) {
    return `Data Source permission: ${resolved.permission} via ${levelNames}`;
  }
  if (resolved.permission) {
    return `Data Source permission: ${resolved.permission}`;
  }

  if (source.ownership === "organizational") {
    return NO_ACCESS_LEVEL_ASSIGNED_LABEL;
  }

  return "No Data Source permission";
}

export interface DataSourceSettingsPageProps {
  source: DataSourceCatalogItem | null;
  accessLevels: AccessLevelRecord[];
  projects?: readonly HomeProjectCard[];
  constellations?: Array<{ id: string; label: string; projectId: string }>;
  onNavigateHome: () => void;
  onOpenAccessLevels: () => void;
  onOpenAccessLevel: (accessLevelId: string) => void;
  onBack: () => void;
  onOpenConstellationSettings?: (projectId: string, constellationId: string) => void;
  onOpenProject?: (projectId: string) => void;
}

export function DataSourceSettingsPage({
  source,
  accessLevels,
  projects,
  constellations,
  onNavigateHome,
  onOpenAccessLevels,
  onOpenAccessLevel,
  onBack,
  onOpenConstellationSettings,
  onOpenProject,
}: DataSourceSettingsPageProps) {
  const isOrganizational = source?.ownership === "organizational";
  const ownerDisplay = source ? getDataSourceOwnerDisplay(source) : null;

  const associations = useMemo(() => {
    if (!source) return [];
    return accessLevels
      .map((level) => {
        const grant = level.sourceGrants.find(
          (item) => item.dataSourceId === source.id,
        );
        if (!grant) return null;
        return { level, permission: grant.permission };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [source, accessLevels]);

  const usage = useMemo(() => {
    if (!source) {
      return { constellations: [] as Array<{ id: string; name: string; projectId: string; projectName: string }>, projects: [] as Array<{ id: string; name: string }> };
    }
    const constellationMap = new Map<string, {
      id: string;
      name: string;
      projectId: string;
      projectName: string;
    }>();
    const projectMap = new Map<string, { id: string; name: string }>();

    for (const item of CANONICAL_CONSTELLATIONS) {
      if (!item.dataSourceIds.includes(source.id)) continue;
      const live = constellations?.find((entry) => entry.id === item.id);
      constellationMap.set(item.id, {
        id: item.id,
        name: live?.label ?? item.name,
        projectId: item.projectId,
        projectName: getProjectNameById(item.projectId, projects),
      });
      projectMap.set(item.projectId, {
        id: item.projectId,
        name: getProjectNameById(item.projectId, projects),
      });
    }

    return {
      constellations: [...constellationMap.values()],
      projects: [...projectMap.values()],
    };
  }, [constellations, projects, source]);

  const effectiveSourceLabel = source
    ? formatEffectivePermission(source, accessLevels)
    : null;

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "data-sources",
      label: "Data Sources",
      destination: { kind: "current" },
    },
    {
      id: "data-source",
      label: source?.name ?? "Data Source",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  return (
    <LuxiaPageFrame>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="Data Source Settings"
        title={source?.name ?? "Data source unavailable"}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        context={
          source ? (
            <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
              {formatDataSourceType(source.type)}
              {" · "}
              {statusLabel(source.status)}
              {" · "}
              Ownership: {getOwnershipLabel(source.ownership)}
              {!isOrganizational && ownerDisplay ? (
                <>
                  {" · "}
                  Owner: {ownerDisplay}
                </>
              ) : null}
            </p>
          ) : null
        }
        guide={
          source
            ? "Ownership, Access Level associations, Constellation usage, and your effective Data Source permission."
            : "This Data Source could not be found."
        }
        secondaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.secondary}
            onClick={onBack}
          >
            Back
          </Button>
        }
        primaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            onClick={onOpenAccessLevels}
          >
            Open Access Levels
          </Button>
        }
      />
      <LuxiaPageBody>
        {source ? (
          <section className={`overflow-hidden ${PARENT_SURFACE_CLASS}`}>
            <div className="px-5 py-4">
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                General
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-secondary)" }}>Type</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {formatDataSourceType(source.type)}
                  </dd>
                </div>
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-secondary)" }}>Status</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {statusLabel(source.status)}
                  </dd>
                </div>
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-secondary)" }}>Ownership</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {getOwnershipLabel(source.ownership)}
                  </dd>
                </div>
                {isOrganizational ? (
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-secondary)" }}>Managed by</dt>
                    <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                      {ORGANIZATIONAL_MANAGED_LABEL}
                    </dd>
                  </div>
                ) : (
                  <div>
                    <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-secondary)" }}>Owner</dt>
                    <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                      {ownerDisplay}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Your effective Data Source permission
              </h2>
              <p className="luxia-type-body-small mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                {effectiveSourceLabel}
                {source.status !== "active"
                  ? " · Source is not active, so Constellation use remains unavailable."
                  : null}
              </p>
              {isOrganizational ? (
                <p className="luxia-type-caption mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                  Access is managed through Access Levels. Organization membership alone does not grant Use.
                </p>
              ) : (
                <p className="luxia-type-caption mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                  Private source owners receive Manage for their own source without an Access Level.
                  Additional access may be granted through Access Levels.
                </p>
              )}
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Access Level associations
              </h2>
              <p className="luxia-type-metadata mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                Configured grants. Inactive Access Levels do not contribute to effective permission.
              </p>
              {associations.length === 0 ? (
                <p className="luxia-type-body-small mt-3" style={{ color: "var(--luxia-text-secondary)" }}>
                  {NO_ACCESS_LEVEL_ASSIGNED_LABEL}. Access is managed through Access Levels.
                </p>
              ) : (
                <ul className="mt-3">
                  {associations.map(({ level, permission }, index) => (
                    <li
                      key={level.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                      style={index === 0 ? undefined : ROW_DIVIDER}
                    >
                      <div className="min-w-0">
                        <p className="luxia-type-body-small-strong" style={{ color: "var(--luxia-text-primary)" }}>
                          {level.name}
                        </p>
                        <p className="luxia-type-metadata mt-0.5" style={{ color: "var(--luxia-text-secondary)" }}>
                          Data Source permission: {permission ?? "Grant unavailable"}
                          {" · "}
                          {level.status === "active" ? "Active (effective when member)" : "Inactive (configured only)"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => onOpenAccessLevel(level.id)}
                      >
                        Open Access Level
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Constellations using this source
              </h2>
              {usage.constellations.length === 0 ? (
                <p className="luxia-type-body-small mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                  No Constellations currently connect to this Data Source.
                </p>
              ) : (
                <ul className="mt-3">
                  {usage.constellations.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                      style={index === 0 ? undefined : ROW_DIVIDER}
                    >
                      <div className="min-w-0">
                        <p className="luxia-type-body-small-strong" style={{ color: "var(--luxia-text-primary)" }}>
                          {item.name}
                        </p>
                        <p className="luxia-type-metadata mt-0.5" style={{ color: "var(--luxia-text-secondary)" }}>
                          {item.projectName}
                        </p>
                      </div>
                      {onOpenConstellationSettings ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={() => onOpenConstellationSettings(item.projectId, item.id)}
                        >
                          Open Constellation
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Projects indirectly affected
              </h2>
              {usage.projects.length === 0 ? (
                <p className="luxia-type-body-small mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                  No Projects currently use this Data Source through Constellations.
                </p>
              ) : (
                <ul className="mt-3">
                  {usage.projects.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                      style={index === 0 ? undefined : ROW_DIVIDER}
                    >
                      <p className="luxia-type-body-small-strong" style={{ color: "var(--luxia-text-primary)" }}>
                        {item.name}
                      </p>
                      {onOpenProject ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="compact"
                          onClick={() => onOpenProject(item.id)}
                        >
                          Open Project
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : (
          <div className="space-y-4 py-8">
            <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
              Unavailable
            </h2>
            <p className="luxia-type-body" style={{ color: "var(--luxia-text-secondary)" }}>
              This Data Source could not be found for the current workspace.
            </p>
            <Button type="button" variant="outline" size="compact" onClick={onBack}>
              Back
            </Button>
          </div>
        )}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
