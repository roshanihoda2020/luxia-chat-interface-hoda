import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbHandlers,
  type LuxiaBreadcrumbItem,
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
import { Input } from "@/app/components/ui/input";
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  FilterToolbar,
  FilterToolbarRow,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import type { AccessLevelRecord, DataSourceCatalogItem } from "@/app/features/permissions";
import { formatConnectedConstellationCount } from "@/app/features/permissions/dataSourceVisibility";
import { LUXIA_SETTINGS_CONTENT_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { buildDataSourceLibraryRows } from "./buildLibraryRows";
import { DATA_SOURCES_GUIDANCE, DATA_SOURCES_PAGE_VARIANT } from "./ia";
import { LuxiaDataSourcesGuide } from "./LuxiaDataSourcesGuide";
import type {
  DataSourceLibraryAccessFilter,
  DataSourceLibraryOwnershipFilter,
  DataSourceLibraryStatusFilter,
  DataSourceLibraryTypeFilter,
} from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

export type DataSourceLibraryOpenOptions = {
  focus?: "usage";
};

export interface DataSourcesPageProps {
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  constellationConnections?: Array<{ id: string; dataSourceIds: string[] }>;
  onOpenSource: (dataSourceId: string, options?: DataSourceLibraryOpenOptions) => void;
  onNavigateHome: () => void;
  onNewDataSource?: () => void;
}

export function DataSourcesPage({
  dataSources,
  accessLevels,
  currentUserId,
  constellationConnections,
  onOpenSource,
  onNavigateHome,
  onNewDataSource,
}: DataSourcesPageProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DataSourceLibraryTypeFilter>("all");
  const [ownershipFilter, setOwnershipFilter] =
    useState<DataSourceLibraryOwnershipFilter>("all");
  const [accessFilter, setAccessFilter] =
    useState<DataSourceLibraryAccessFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<DataSourceLibraryStatusFilter>("all");

  useEffect(() => {
    setQuery("");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setAccessFilter("all");
    setStatusFilter("all");
  }, [currentUserId]);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "data-sources",
      label: "Data Sources",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  const rows = useMemo(
    () =>
      buildDataSourceLibraryRows(
        accessLevels,
        dataSources,
        currentUserId,
        constellationConnections,
      ),
    [accessLevels, dataSources, currentUserId, constellationConnections],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.typeCategory !== typeFilter) return false;
      if (ownershipFilter !== "all" && row.ownership !== ownershipFilter) return false;
      if (accessFilter !== "all" && row.myAccess !== accessFilter) return false;
      if (statusFilter !== "all" && row.statusKey !== statusFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q)
        || row.typeLabel.toLowerCase().includes(q)
        || row.ownerLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, query, typeFilter, ownershipFilter, accessFilter, statusFilter]);

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setAccessFilter("all");
    setStatusFilter("all");
  }

  const hasActiveFilters =
    Boolean(query.trim())
    || typeFilter !== "all"
    || ownershipFilter !== "all"
    || accessFilter !== "all"
    || statusFilter !== "all";

  return (
    <LuxiaPageFrame variant={DATA_SOURCES_PAGE_VARIANT}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel={DATA_SOURCES_GUIDANCE.pageTypeLabel}
        title={DATA_SOURCES_GUIDANCE.title}
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={DATA_SOURCES_GUIDANCE.description}
        actions={<LuxiaDataSourcesGuide />}
        primaryAction={
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.primary}
            disabled={!onNewDataSource}
            onClick={onNewDataSource}
          >
            <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
            New Data Source
          </Button>
        }
      />

      <LuxiaPageBody>
        <FilterToolbar>
          <label className="block w-full max-w-full">
            <span className="sr-only">Search Data Sources</span>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Data Sources"
                aria-label="Search Data Sources"
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
          </label>

          <FilterToolbarRow>
            <CollectionFilterBar>
              <BrowserFilterSelect
                label="Type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as DataSourceLibraryTypeFilter)
                }
              >
                <option value="all">All types</option>
                <option value="database">Database</option>
                <option value="csv">CSV</option>
                <option value="file">File</option>
              </BrowserFilterSelect>

              <BrowserFilterSelect
                label="Ownership"
                value={ownershipFilter}
                onChange={(event) =>
                  setOwnershipFilter(
                    event.target.value as DataSourceLibraryOwnershipFilter,
                  )
                }
              >
                <option value="all">All ownership</option>
                <option value="organizational">Organizational</option>
                <option value="private">Private</option>
              </BrowserFilterSelect>

              <BrowserFilterSelect
                label="My access"
                value={accessFilter}
                onChange={(event) =>
                  setAccessFilter(event.target.value as DataSourceLibraryAccessFilter)
                }
              >
                <option value="all">Any access</option>
                <option value="Owner">Owner</option>
                <option value="Manage">Manage</option>
                <option value="Use">Use</option>
                <option value="View">View</option>
              </BrowserFilterSelect>

              <BrowserFilterSelect
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as DataSourceLibraryStatusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="connected">Connected</option>
                <option value="needs-attention">Needs attention</option>
                <option value="ready">Ready</option>
                <option value="failed">Failed</option>
                <option value="archived">Archived</option>
              </BrowserFilterSelect>
            </CollectionFilterBar>
          </FilterToolbarRow>

          <ResultsCount>
            {filtered.length} Data Source{filtered.length === 1 ? "" : "s"}
          </ResultsCount>
        </FilterToolbar>

        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-10" role="status">
            <div className="space-y-1.5">
              <h2
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {DATA_SOURCES_GUIDANCE.emptyTitle}
              </h2>
              <p
                className="max-w-xl luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {DATA_SOURCES_GUIDANCE.emptyBody}
              </p>
            </div>
            {onNewDataSource ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.primary}
                onClick={onNewDataSource}
              >
                <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
                New Data Source
              </Button>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
          <FilteredEmptyState
            title={DATA_SOURCES_GUIDANCE.filteredEmptyTitle}
            onClear={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className={`overflow-x-auto ${PARENT_SURFACE_CLASS}`}>
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <caption className="sr-only">Accessible Data Sources</caption>
              <thead>
                <tr
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  <th scope="col" className="px-4 py-3 luxia-type-caption">Name</th>
                  <th scope="col" className="px-4 py-3 luxia-type-caption">Type</th>
                  <th scope="col" className="px-4 py-3 luxia-type-caption">Ownership</th>
                  <th scope="col" className="px-4 py-3 luxia-type-caption">My access</th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 luxia-type-caption md:table-cell"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 luxia-type-caption lg:table-cell"
                  >
                    Connected Constellations
                  </th>
                  <th
                    scope="col"
                    className="hidden px-4 py-3 luxia-type-caption xl:table-cell"
                  >
                    Owner
                  </th>
                  <th scope="col" className="w-12 px-4 py-3 luxia-type-caption text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="luxia-settings-row border-t"
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    <td className="max-w-[14rem] px-4 py-4 align-middle">
                      <button
                        type="button"
                        className="luxia-type-body-dense-strong min-w-0 truncate text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[4px]"
                        style={{ color: "var(--luxia-text-primary)" }}
                        onClick={() => onOpenSource(row.id)}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td
                      className="px-4 py-4 align-middle luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.typeLabel}
                    </td>
                    <td
                      className="px-4 py-4 align-middle luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.ownershipLabel}
                    </td>
                    <td
                      className="px-4 py-4 align-middle luxia-type-caption"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.myAccess}
                    </td>
                    <td
                      className="hidden px-4 py-4 align-middle luxia-type-caption md:table-cell"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.statusLabel}
                    </td>
                    <td
                      className="hidden px-4 py-4 align-middle luxia-type-caption lg:table-cell"
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.connectedConstellationCount > 0 ? (
                        <button
                          type="button"
                          className="outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[4px]"
                          aria-label={`${row.connectedConstellationCount} connected Constellations. Open usage in Data Source Settings.`}
                          onClick={() => onOpenSource(row.id, { focus: "usage" })}
                        >
                          {formatConnectedConstellationCount(
                            row.connectedConstellationCount,
                          )}
                        </button>
                      ) : (
                        formatConnectedConstellationCount(0)
                      )}
                    </td>
                    <td
                      className="hidden px-4 py-4 align-middle luxia-type-caption xl:table-cell"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      {row.ownerLabel}
                    </td>
                    <td className="px-4 py-4 align-middle text-right">
                      <LuxiaEntityOptionsMenu
                        entityLabel={row.name}
                        entityType="Data Source"
                        triggerVariant={LUXIA_PAGE_HEADER_ACTION.menuTrigger}
                        items={[
                          {
                            id: "open",
                            label: row.canManage ? "Manage" : "Open",
                            onSelect: () => onOpenSource(row.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
