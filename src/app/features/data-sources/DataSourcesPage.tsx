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
import {
  BrowserFilterSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  FilterToolbar,
  FilterToolbarRow,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { DataSourceLibraryDocumentTags, TagMultiSelectFilter, useAccessibleDataSourceTagFilter, useDataSourceTagStore } from "@/app/features/document-tags";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  formatConnectedConstellationCount,
  parseDataSourceNameInput,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
  type DataSourceSettingsFocusSection,
} from "@/app/features/permissions";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { toast } from "sonner";
import { buildDataSourceLibraryRows } from "./buildLibraryRows";
import type { LuxiaEntityOptionsItem } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  dataSourceCanJoinConstellation,
  listConstellationsEligibleToConnectSource,
  type DataSourceHandoffConstellation,
  type DataSourceHandoffProject,
} from "./constellationHandoff";
import { DataSourceRenameDialog } from "./DataSourceRenameDialog";
import { DataSourceTypeIcon } from "./creation/DataSourceTypeIcon";
import { DATA_SOURCES_GUIDANCE, DATA_SOURCES_PAGE_VARIANT } from "./ia";
import { LuxiaDataSourcesGuide } from "./LuxiaDataSourcesGuide";
import type {
  DataSourceLibraryAccessFilter,
  DataSourceLibraryOwnershipFilter,
  DataSourceLibraryRow,
  DataSourceLibraryStatusFilter,
  DataSourceLibraryTypeFilter,
} from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

const TABLE_HEADER_CELL =
  "px-2.5 py-2.5 first:pl-4 last:px-2 align-middle luxia-type-label-small";
const TABLE_BODY_CELL =
  "px-2.5 py-3.5 first:pl-4 last:px-2 align-middle luxia-type-body-dense";

/** Proportional widths so leftover space is shared, not dumped into Name. */
const COL_NAME = "w-[19%] min-w-[10.75rem]";
const COL_TYPE = "w-[14%] min-w-[10.5rem]";
const COL_TAGS = "w-[18%] min-w-[12.25rem]";
const COL_OWNERSHIP = "w-[11%] min-w-[6.75rem]";
const COL_STATUS = "w-[10%] min-w-[6.25rem]";
const COL_ACCESS = "w-[7%] min-w-[3.75rem]";
const COL_CONNECTED = "w-[7%] min-w-[4.5rem]";
const COL_OWNER = "w-[10%] min-w-[6.25rem]";
const COL_ACTIONS = "w-11 max-w-11";

function sourceById(
  dataSources: DataSourceCatalogItem[],
  id: string,
): DataSourceCatalogItem | undefined {
  return dataSources.find((item) => item.id === id);
}

function buildLibraryMenuItems(input: {
  row: DataSourceLibraryRow;
  source: DataSourceCatalogItem | undefined;
  handoff?: DataSourcesPageProps["constellationHandoff"];
  canSave: boolean;
  onOpenSource: DataSourcesPageProps["onOpenSource"];
  onRename: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onCreateConstellation: () => void;
  onAddToExisting: () => void;
}): LuxiaEntityOptionsItem[] {
  const { row, source, handoff, canSave } = input;
  const items: LuxiaEntityOptionsItem[] = [
    {
      id: "open",
      label: row.canManage ? "Manage" : "Open",
      onSelect: () => input.onOpenSource(row.id),
    },
  ];

  if (row.canManage && canSave) {
    items.push({
      id: "rename",
      label: "Rename",
      onSelect: input.onRename,
    });
  }

  if (row.canManage) {
    items.push({
      id: "access",
      label: "Access",
      onSelect: () => input.onOpenSource(row.id, { focus: "access" }),
    });
  }

  items.push({
    id: "usage",
    label: "Usage",
    onSelect: () => input.onOpenSource(row.id, { focus: "usage" }),
  });

  if (row.canManage) {
    items.push({
      id: "manage-tags",
      label: "Manage tags",
      separatorBefore: true,
      onSelect: () => input.onOpenSource(row.id, { focus: "general" }),
    });
  }

  const canJoin = Boolean(
    row.canManage
    && source
    && dataSourceCanJoinConstellation(source),
  );
  const showCreate = Boolean(canJoin && handoff && handoff.projects.length > 0);
  const showConnect = Boolean(
    canJoin
    && handoff
    && listConstellationsEligibleToConnectSource(row.id, handoff.constellations).length > 0,
  );

  if (showCreate) {
    items.push({
      id: "create-constellation",
      label: "Create new Constellation",
      separatorBefore: true,
      onSelect: input.onCreateConstellation,
    });
  }
  if (showConnect) {
    items.push({
      id: "add-to-constellation",
      label: "Add to existing Constellation",
      separatorBefore: !showCreate,
      onSelect: input.onAddToExisting,
    });
  }

  if (row.canManage && canSave && source) {
    if (source.status === "archived") {
      items.push({
        id: "restore",
        label: "Restore",
        separatorBefore: true,
        onSelect: input.onRestore,
      });
    } else {
      items.push({
        id: "archive",
        label: "Archive",
        separatorBefore: true,
        destructive: true,
        onSelect: input.onArchive,
      });
    }
  }

  return items;
}

function libraryStatusTone(statusKey: DataSourceLibraryStatusFilter): {
  color: string;
  dot: string;
} {
  if (statusKey === "connected" || statusKey === "ready") {
    return { color: "var(--luxia-success-70)", dot: "var(--luxia-success)" };
  }
  if (statusKey === "failed") {
    return { color: "var(--luxia-error-70)", dot: "var(--luxia-error)" };
  }
  if (statusKey === "needs-attention") {
    return { color: "var(--luxia-warning-90)", dot: "var(--luxia-warning-50)" };
  }
  return { color: "var(--luxia-text-muted)", dot: "var(--luxia-text-muted)" };
}

function LibraryStatusLabel({
  statusKey,
  statusLabel,
}: {
  statusKey: DataSourceLibraryStatusFilter;
  statusLabel: string;
}) {
  const tone = libraryStatusTone(statusKey);
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: tone.color }}>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: tone.dot }}
        aria-hidden
      />
      {statusLabel}
    </span>
  );
}

export type DataSourceLibraryOpenOptions = {
  focus?: DataSourceSettingsFocusSection;
};

export interface DataSourcesPageProps {
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  constellationConnections?: Array<{ id: string; dataSourceIds: string[] }>;
  constellationHandoff?: {
    projects: DataSourceHandoffProject[];
    constellations: DataSourceHandoffConstellation[];
  };
  onOpenSource: (dataSourceId: string, options?: DataSourceLibraryOpenOptions) => void;
  onSaveSource?: (source: DataSourceCatalogItem) => void;
  onCreateConstellationFromSource?: (dataSourceId: string) => void;
  onAddToExistingConstellation?: (dataSourceId: string) => void;
  onNavigateHome: () => void;
  onNewDataSource?: () => void;
}

export function DataSourcesPage({
  dataSources,
  accessLevels,
  currentUserId,
  constellationConnections,
  constellationHandoff,
  onOpenSource,
  onSaveSource,
  onCreateConstellationFromSource,
  onAddToExistingConstellation,
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
  const [renameSourceId, setRenameSourceId] = useState<string | null>(null);
  const [archiveSourceId, setArchiveSourceId] = useState<string | null>(null);

  useEffect(() => {
    setQuery("");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setAccessFilter("all");
    setStatusFilter("all");
  }, [currentUserId]);

  function patchSource(id: string, patch: Partial<DataSourceCatalogItem>) {
    const source = sourceById(dataSources, id);
    if (!source || !onSaveSource) return;
    onSaveSource({ ...source, ...patch });
  }

  const renameSource = renameSourceId ? sourceById(dataSources, renameSourceId) : undefined;
  const archiveSource = archiveSourceId ? sourceById(dataSources, archiveSourceId) : undefined;

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

  const tagStore = useDataSourceTagStore();

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

  const accessibleSourceIds = useMemo(() => rows.map((row) => row.id), [rows]);
  const tagFilter = useAccessibleDataSourceTagFilter(accessibleSourceIds);

  useEffect(() => {
    tagFilter.clear();
    // Reset Tag filters with the rest of the library filters when the user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.typeCategory !== typeFilter) return false;
      if (ownershipFilter !== "all" && row.ownership !== ownershipFilter) return false;
      if (accessFilter !== "all" && row.myAccess !== accessFilter) return false;
      if (statusFilter !== "all" && row.statusKey !== statusFilter) return false;
      if (!tagFilter.matches(row.id)) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q)
        || row.typeLabel.toLowerCase().includes(q)
        || row.ownerLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, query, typeFilter, ownershipFilter, accessFilter, statusFilter, tagFilter, tagStore]);

  function clearStructuredFilters() {
    setTypeFilter("all");
    setOwnershipFilter("all");
    setAccessFilter("all");
    setStatusFilter("all");
    tagFilter.clear();
  }

  const hasActiveStructuredFilters =
    typeFilter !== "all"
    || ownershipFilter !== "all"
    || accessFilter !== "all"
    || statusFilter !== "all"
    || tagFilter.hasActiveTagFilters;

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

      <LuxiaPageBody className="flex flex-col gap-4">
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

              <TagMultiSelectFilter
                options={tagFilter.tagOptions}
                hasUntagged={tagFilter.hasUntagged}
                selectedTagIds={tagFilter.selectedTagIds}
                untaggedSelected={tagFilter.untaggedSelected}
                onToggleTag={tagFilter.toggleTag}
                onToggleUntagged={tagFilter.toggleUntagged}
                onClear={tagFilter.clear}
              />
            </CollectionFilterBar>
          </FilterToolbarRow>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <ResultsCount>
              {filtered.length} Data Source{filtered.length === 1 ? "" : "s"}
            </ResultsCount>
            {hasActiveStructuredFilters ? (
              <Button type="button" variant="tertiary" size="compact" onClick={clearStructuredFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
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
            description="Try adjusting your filters or clear them."
            onClear={hasActiveStructuredFilters ? clearStructuredFilters : undefined}
          />
        ) : (
          <div className={`overflow-x-auto overflow-hidden ${PARENT_SURFACE_CLASS}`}>
            <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
              <caption className="sr-only">Accessible Data Sources</caption>
              <thead>
                <tr
                  style={{
                    background: "var(--luxia-settings-section-bg)",
                    color: "var(--luxia-text-primary)",
                    borderBottom: "1px solid var(--luxia-settings-row-divider)",
                  }}
                >
                  <th scope="col" className={`${TABLE_HEADER_CELL} ${COL_NAME}`}>
                    Name
                  </th>
                  <th
                    scope="col"
                    className={`${TABLE_HEADER_CELL} ${COL_TYPE} whitespace-nowrap`}
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className={`${TABLE_HEADER_CELL} ${COL_TAGS} whitespace-nowrap`}
                  >
                    Tags
                  </th>
                  <th
                    scope="col"
                    className={`${TABLE_HEADER_CELL} ${COL_OWNERSHIP} whitespace-nowrap`}
                  >
                    Ownership
                  </th>
                  <th
                    scope="col"
                    className={`hidden md:table-cell ${TABLE_HEADER_CELL} ${COL_STATUS} whitespace-nowrap`}
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className={`${TABLE_HEADER_CELL} ${COL_ACCESS} whitespace-nowrap`}
                  >
                    Access
                  </th>
                  <th
                    scope="col"
                    className={`hidden lg:table-cell ${TABLE_HEADER_CELL} ${COL_CONNECTED} whitespace-nowrap text-right`}
                    title="Connected Constellations"
                  >
                    Connected
                  </th>
                  <th
                    scope="col"
                    className={`hidden lg:table-cell ${TABLE_HEADER_CELL} ${COL_OWNER} whitespace-nowrap`}
                  >
                    Owner
                  </th>
                  <th
                    scope="col"
                    className={`${TABLE_HEADER_CELL} ${COL_ACTIONS} text-right`}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const source = sourceById(dataSources, row.id);
                  return (
                  <tr
                    key={row.id}
                    className="luxia-settings-row is-interactive"
                    style={{ borderColor: "var(--luxia-settings-row-divider)" }}
                  >
                    <td className={`${TABLE_BODY_CELL} ${COL_NAME}`}>
                      <button
                        type="button"
                        className="luxia-type-body-dense-strong block min-w-0 max-w-full cursor-pointer truncate whitespace-nowrap text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[4px]"
                        style={{ color: "var(--luxia-text-primary)" }}
                        title={row.name}
                        onClick={() => onOpenSource(row.id)}
                      >
                        {row.name}
                      </button>
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL} ${COL_TYPE}`}
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                        <DataSourceTypeIcon
                          source={source}
                          size={16}
                          align="center"
                        />
                        <span className="min-w-0 truncate whitespace-nowrap" title={row.typeLabel}>
                          {row.typeLabel}
                        </span>
                      </span>
                    </td>
                    <td className={`${TABLE_BODY_CELL} ${COL_TAGS}`}>
                      <div className="flex min-w-0 items-center">
                        <DataSourceLibraryDocumentTags dataSourceId={row.id} />
                      </div>
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL} ${COL_OWNERSHIP} truncate whitespace-nowrap`}
                      style={{ color: "var(--luxia-text-secondary)" }}
                      title={row.ownershipLabel}
                    >
                      {row.ownershipLabel}
                    </td>
                    <td className={`hidden md:table-cell ${TABLE_BODY_CELL} ${COL_STATUS} whitespace-nowrap`}>
                      <LibraryStatusLabel
                        statusKey={row.statusKey}
                        statusLabel={row.statusLabel}
                      />
                    </td>
                    <td
                      className={`${TABLE_BODY_CELL} ${COL_ACCESS} whitespace-nowrap`}
                      style={{ color: "var(--luxia-text-secondary)" }}
                    >
                      {row.myAccess}
                    </td>
                    <td
                      className={`hidden lg:table-cell ${TABLE_BODY_CELL} ${COL_CONNECTED} whitespace-nowrap text-right tabular-nums`}
                      style={{ color: "var(--luxia-text-secondary)" }}
                      title="Connected Constellations"
                    >
                      {row.connectedConstellationCount > 0 ? (
                        <button
                          type="button"
                          className="tabular-nums cursor-pointer rounded-[4px] px-1 -mx-1 outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                          style={{ color: "var(--luxia-brand-primary)" }}
                          aria-label={`${row.connectedConstellationCount} connected Constellations. Open usage in Data Source Settings.`}
                          title="Connected Constellations"
                          onClick={() => onOpenSource(row.id, { focus: "usage" })}
                        >
                          {formatConnectedConstellationCount(
                            row.connectedConstellationCount,
                          )}
                        </button>
                      ) : (
                        <span className="tabular-nums">
                          {formatConnectedConstellationCount(0)}
                        </span>
                      )}
                    </td>
                    <td
                      className={`hidden lg:table-cell ${TABLE_BODY_CELL} ${COL_OWNER} truncate whitespace-nowrap`}
                      style={{ color: "var(--luxia-text-secondary)" }}
                      title={row.ownerLabel}
                    >
                      {row.ownerLabel}
                    </td>
                    <td className={`${TABLE_BODY_CELL} ${COL_ACTIONS} text-right`}>
                      <LuxiaEntityOptionsMenu
                        entityLabel={row.name}
                        entityType="Data Source"
                        triggerVariant={LUXIA_PAGE_HEADER_ACTION.menuTrigger}
                        className="cursor-pointer"
                        items={buildLibraryMenuItems({
                          row,
                          source,
                          handoff: constellationHandoff,
                          canSave: Boolean(onSaveSource),
                          onOpenSource,
                          onRename: () => setRenameSourceId(row.id),
                          onArchive: () => setArchiveSourceId(row.id),
                          onRestore: () => {
                            patchSource(row.id, { status: "active" });
                            toast.success("Data Source restored to Active.");
                          },
                          onCreateConstellation: () =>
                            onCreateConstellationFromSource?.(row.id),
                          onAddToExisting: () =>
                            onAddToExistingConstellation?.(row.id),
                        })}
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LuxiaPageBody>

      <DataSourceRenameDialog
        open={Boolean(renameSource)}
        currentName={renameSource?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setRenameSourceId(null);
        }}
        onSave={(name) => {
          if (!renameSource) return;
          const nextName = parseDataSourceNameInput(name);
          if (!nextName) return;
          onSaveSource?.({ ...renameSource, name: nextName });
          toast.success(LUXIA_DIRTY_STATE_COPY.saveSuccess);
        }}
      />

      <AlertDialog
        open={Boolean(archiveSource)}
        onOpenChange={(open) => {
          if (!open) setArchiveSourceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archiveSource?.name ?? "Data Source"}?</AlertDialogTitle>
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
                if (!archiveSource) return;
                onSaveSource?.({ ...archiveSource, status: "archived" });
                toast.success("Data Source archived.");
                setArchiveSourceId(null);
              }}
            >
              Archive Data Source
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
