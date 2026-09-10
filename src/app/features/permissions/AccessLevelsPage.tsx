import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  LuxiaBreadcrumb,
  type LuxiaBreadcrumbItem,
  type LuxiaBreadcrumbHandlers,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import {
  LuxiaPageBody,
  LuxiaPageFrame,
} from "@/app/components/LuxiaPageFrame";
import { LuxiaPageHeader, LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { LuxiaPageReadOnlyBadge } from "@/app/components/LuxiaPageReadOnlyBadge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
import {
  BrowserFilterSelect,
  BrowserSortSelect,
  CollectionFilterBar,
  FilteredEmptyState,
  FilterToolbar,
  FilterToolbarRow,
  ResultsCount,
} from "@/app/features/home/browserShared";
import { HS } from "@/app/features/home/homeSurfaces";
import {
  LUXIA_SETTINGS_CONTENT_SURFACE_CLASS,
} from "@/app/features/shared/luxiaSettingsUx";
import { ACCESS_LEVELS_GUIDANCE } from "./ia";
import { LuxiaAccessGuide } from "./LuxiaAccessGuide";
import type { AccessLevelPermission, AccessLevelRecord } from "./types";

const PARENT_SURFACE_CLASS = `${LUXIA_SETTINGS_CONTENT_SURFACE_CLASS} is-flush`;

type StatusFilter = "all" | AccessLevelRecord["status"];
type PermissionFilter = "all" | AccessLevelPermission;
type SortKey = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function permissionDistribution(level: AccessLevelRecord): string {
  let view = 0;
  let use = 0;
  let manage = 0;
  for (const grant of level.sourceGrants) {
    if (grant.permission === "View") view += 1;
    else if (grant.permission === "Use") use += 1;
    else manage += 1;
  }
  const parts: string[] = [];
  if (view) parts.push(`${view} View`);
  if (use) parts.push(`${use} Use`);
  if (manage) parts.push(`${manage} Manage`);
  if (parts.length === 0) return "No Data Source permissions";
  return parts.join(" · ");
}

export interface AccessLevelsPageProps {
  accessLevels: AccessLevelRecord[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onNavigateHome: () => void;
  onOpenAccessGuide?: () => void;
  canAdminister?: boolean;
}

export function AccessLevelsPage({
  accessLevels,
  onOpen,
  onCreate,
  onDelete,
  onNavigateHome,
  canAdminister = true,
}: AccessLevelsPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [permissionFilter, setPermissionFilter] =
    useState<PermissionFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated-desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const breadcrumbItems: LuxiaBreadcrumbItem[] = [
    { id: "home", label: "Home", destination: { kind: "home" } },
    {
      id: "access-levels",
      label: "Access Levels",
      destination: { kind: "current" },
    },
  ];

  const breadcrumbHandlers: LuxiaBreadcrumbHandlers = {
    onHome: onNavigateHome,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = accessLevels.filter((level) => {
      if (statusFilter !== "all" && level.status !== statusFilter) {
        return false;
      }

      const grants = level.sourceGrants.map((grant) => grant.permission);
      if (permissionFilter !== "all" && !grants.includes(permissionFilter)) {
        return false;
      }

      if (!q) return true;

      return (
        level.name.toLowerCase().includes(q)
        || level.description.toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "updated-asc":
          return a.updatedAt.localeCompare(b.updatedAt);
        case "updated-desc":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });

    return rows;
  }, [accessLevels, query, statusFilter, permissionFilter, sortKey]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setPermissionFilter("all");
    setSortKey("updated-desc");
  }

  return (
    <LuxiaPageFrame variant={ACCESS_LEVELS_GUIDANCE.listPageVariant}>
      <LuxiaPageHeader
        contentGap="page"
        pageTypeLabel="ACCESS LEVELS"
        title="Access Levels"
        titleStyle={{ color: HS.sectionHeading }}
        titleMetadata={
          !canAdminister ? (
            <LuxiaPageReadOnlyBadge
              ariaLabel="Read only. Only Organization Admins can create or edit Access Levels."
            />
          ) : undefined
        }
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={ACCESS_LEVELS_GUIDANCE.listPageDescription}
        actions={<LuxiaAccessGuide />}
        primaryAction={
          canAdminister ? (
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.primary}
              aria-label="Create Access Level"
              onClick={onCreate}
            >
              <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
              Create Access Level
            </Button>
          ) : null
        }
      />

      <LuxiaPageBody>
        <FilterToolbar>
          <label className="block w-full max-w-full">
            <span className="sr-only">Search Access Levels</span>
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
                placeholder="Search by name or description"
                aria-label="Search Access Levels"
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
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </BrowserFilterSelect>

              <BrowserFilterSelect
                label="Data Source permission"
                value={permissionFilter}
                onChange={(event) =>
                  setPermissionFilter(event.target.value as PermissionFilter)
                }
              >
                <option value="all">Any Data Source permission</option>
                <option value="View">Includes View</option>
                <option value="Use">Includes Use</option>
                <option value="Manage">Includes Manage</option>
              </BrowserFilterSelect>

              <BrowserSortSelect
                label="Sort"
                aria-label="Sort Access Levels"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
              >
                <option value="updated-desc">Updated (newest)</option>
                <option value="updated-asc">Updated (oldest)</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
              </BrowserSortSelect>
            </CollectionFilterBar>
          </FilterToolbarRow>

          <ResultsCount>
            {filtered.length} Access Level{filtered.length === 1 ? "" : "s"}
          </ResultsCount>
        </FilterToolbar>

        {accessLevels.length === 0 ? (
          <div className="flex flex-col items-start gap-4 py-10">
            <div className="space-y-1.5">
              <h2
                className="luxia-type-title-section"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {canAdminister ? "No Access Levels yet" : "No Access Levels available"}
              </h2>
              <p
                className="max-w-xl luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {canAdminister
                  ? "Create an Access Level to give members View, Use, or Manage permission on selected Data Sources."
                  : "Access Levels are managed by Organization Admins."}
              </p>
            </div>
            {canAdminister ? (
              <Button
                type="button"
                {...LUXIA_PAGE_HEADER_ACTION.primary}
                aria-label="Create Access Level"
                onClick={onCreate}
              >
                <Plus size={16} strokeWidth={2} aria-hidden className="shrink-0" />
                Create Access Level
              </Button>
            ) : null}
          </div>
        ) : filtered.length === 0 ? (
          <FilteredEmptyState
            title="No Access Levels match"
            onClear={clearFilters}
          />
        ) : (
          <div className={PARENT_SURFACE_CLASS}>
            <ul>
              {filtered.map((level) => {
                return (
                  <li
                    key={level.id}
                    className="luxia-settings-row is-interactive flex flex-wrap items-start gap-3 px-4 py-4"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] rounded-[6px]"
                      onClick={() => onOpen(level.id)}
                    >
                      <p
                        className="luxia-type-body-dense-strong"
                        style={{ color: "var(--luxia-text-primary)" }}
                      >
                        {level.name}
                      </p>
                      <p
                        className="mt-0.5 line-clamp-2 luxia-type-body-dense"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        {level.description || "No description"}
                      </p>
                      <div
                        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        <span>{level.memberUserIds.length} members</span>
                        <span>{level.sourceGrants.length} Data Sources</span>
                        <span style={{ textTransform: "capitalize" }}>{level.status}</span>
                        <span>{permissionDistribution(level)}</span>
                      </div>
                      <p
                        className="mt-1 luxia-type-caption"
                        style={{ color: "var(--luxia-text-secondary)" }}
                      >
                        Updated {formatUpdated(level.updatedAt)}
                      </p>
                    </button>

                    <LuxiaEntityOptionsMenu
                      entityLabel={level.name}
                      entityType="Access Level"
                      items={[
                        {
                          id: "open",
                          label: canAdminister ? "Open Access Level" : "View details",
                          onSelect: () => onOpen(level.id),
                        },
                        ...(canAdminister
                          ? [
                              {
                                id: "delete",
                                label: "Delete",
                                destructive: true as const,
                                separatorBefore: true,
                                onSelect: () => setPendingDeleteId(level.id),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </LuxiaPageBody>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Access Level?</AlertDialogTitle>
            <AlertDialogDescription>
              Members will lose the Data Source permissions granted by this Access Level. Data Sources and Constellations will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="luxia-button luxia-button--destructive"
              onClick={() => {
                if (pendingDeleteId) onDelete(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete Access Level
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LuxiaPageFrame>
  );
}
