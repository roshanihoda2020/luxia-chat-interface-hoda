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
import type { AccessLevelRecord, DataSourceCatalogItem } from "./types";

const PARENT_SURFACE_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid var(--luxia-border-default)",
  borderRadius: "var(--luxia-radius-12)",
} as const;

const ROW_DIVIDER = {
  borderTop: "1px solid var(--luxia-border-subtle)",
} as const;

export interface DataSourceSettingsPageProps {
  source: DataSourceCatalogItem | null;
  accessLevels: AccessLevelRecord[];
  onNavigateHome: () => void;
  onOpenAccessLevels: () => void;
  onOpenAccessLevel: (accessLevelId: string) => void;
  onBack: () => void;
}

export function DataSourceSettingsPage({
  source,
  accessLevels,
  onNavigateHome,
  onOpenAccessLevels,
  onOpenAccessLevel,
  onBack,
}: DataSourceSettingsPageProps) {
  const associations = source
    ? accessLevels.filter((level) =>
      level.sourceGrants.some((grant) => grant.dataSourceId === source.id),
    )
    : [];

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
              {source.type}
              {" · "}
              {source.status === "active" ? "Active" : "Inactive"}
              {" · "}
              {source.ownerName}
            </p>
          ) : null
        }
        guide={
          source
            ? "Source ownership, Access Level associations, and usage. Project roles are managed separately."
            : "This Data Source could not be found."
        }
        secondaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.secondary}
            onClick={onOpenAccessLevels}
          >
            Open Access Levels
          </Button>
        }
      />
      <LuxiaPageBody>
        {source ? (
          <section className="overflow-hidden" style={PARENT_SURFACE_STYLE}>
            <div className="px-5 py-4">
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                General
              </h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Type</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>{source.type}</dd>
                </div>
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Ownership</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {source.ownership === "organizational" ? "Organizational" : "Private"}
                  </dd>
                </div>
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Owner</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {source.ownerName}
                    <span className="luxia-type-metadata ml-2" style={{ color: "var(--luxia-text-muted)" }}>
                      ({source.ownerUserId})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="luxia-type-metadata" style={{ color: "var(--luxia-text-muted)" }}>Status</dt>
                  <dd className="luxia-type-body-small mt-1" style={{ color: "var(--luxia-text-secondary)" }}>
                    {source.status === "active" ? "Active" : "Inactive"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Access Level associations
              </h2>
              <p className="luxia-type-metadata mt-1" style={{ color: "var(--luxia-text-muted)" }}>
                View, Use, and Manage are granted through Access Levels—not Project roles or Constellations.
              </p>
              {associations.length === 0 ? (
                <p className="luxia-type-body-small mt-3" style={{ color: "var(--luxia-text-secondary)" }}>
                  No Access Levels currently include this Data Source.
                </p>
              ) : (
                <ul className="mt-3">
                  {associations.map((level, index) => {
                    const grant = level.sourceGrants.find((item) => item.dataSourceId === source.id);
                    return (
                      <li
                        key={level.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                        style={index === 0 ? undefined : ROW_DIVIDER}
                      >
                        <div className="min-w-0">
                          <p className="luxia-type-body-small-strong" style={{ color: "var(--luxia-text-primary)" }}>
                            {level.name}
                          </p>
                          <p className="luxia-type-metadata mt-0.5" style={{ color: "var(--luxia-text-muted)" }}>
                            {grant?.permission ?? "View"}
                            {" · "}
                            {level.status === "active" ? "Active" : "Inactive"}
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
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-5 py-4" style={ROW_DIVIDER}>
              <h2 className="luxia-type-title-section" style={{ color: "var(--luxia-text-primary)" }}>
                Owner access
              </h2>
              <p className="luxia-type-body-small mt-2" style={{ color: "var(--luxia-text-secondary)" }}>
                The source owner ({source.ownerName}) retains owner access independently of Access Levels,
                keyed by ownerUserId.
              </p>
            </div>
          </section>
        ) : (
          <p className="luxia-type-body" style={{ color: "var(--luxia-text-secondary)" }}>
            This data source could not be found.
          </p>
        )}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
