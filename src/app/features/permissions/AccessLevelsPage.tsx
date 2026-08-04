import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
import { highestPermission } from "./data";
import { ACCESS_LEVELS_GUIDANCE } from "./ia";
import { LuxiaAccessGuide } from "./LuxiaAccessGuide";
import type { AccessLevelPermission, AccessLevelRecord } from "./types";

const PARENT_SURFACE_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid var(--luxia-border-default)",
  borderRadius: "var(--luxia-radius-12)",
} as const;

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

function levelHighestPermission(
  level: AccessLevelRecord,
): AccessLevelPermission | null {
  return highestPermission(level.sourceGrants.map((grant) => grant.permission));
}

export interface AccessLevelsPageProps {
  accessLevels: AccessLevelRecord[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onNavigateHome: () => void;
  onOpenAccessGuide?: () => void;
}

export function AccessLevelsPage({
  accessLevels,
  onOpen,
  onCreate,
  onDelete,
  onNavigateHome,
}: AccessLevelsPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [permissionFilter, setPermissionFilter] =
    useState<PermissionFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated-desc");

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

      const peak = levelHighestPermission(level);
      if (permissionFilter !== "all" && peak !== permissionFilter) {
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
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={breadcrumbItems}
            handlers={breadcrumbHandlers}
          />
        }
        guide={
          <div className="space-y-1">
            <p>{ACCESS_LEVELS_GUIDANCE.listPageDescription}</p>
            <p className="luxia-type-caption" style={{ color: "var(--luxia-blue-60)" }}>
              {ACCESS_LEVELS_GUIDANCE.listPageRule}
            </p>
          </div>
        }
        secondaryAction={<LuxiaAccessGuide />}
        primaryAction={
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onCreate}>
            Create Access Level
          </Button>
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
                label="Highest permission"
                value={permissionFilter}
                onChange={(event) =>
                  setPermissionFilter(event.target.value as PermissionFilter)
                }
              >
                <option value="all">Any permission</option>
                <option value="View">View</option>
                <option value="Use">Use</option>
                <option value="Manage">Manage</option>
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

        {filtered.length === 0 ? (
          <FilteredEmptyState
            title="No Access Levels match"
            onClear={clearFilters}
          />
        ) : (
          <div style={PARENT_SURFACE_STYLE}>
            <ul>
              {filtered.map((level, index) => {
                const peak = levelHighestPermission(level);
                return (
                  <li
                    key={level.id}
                    className="flex flex-wrap items-start gap-3 px-4 py-4"
                    style={
                      index > 0
                        ? { borderTop: "1px solid var(--luxia-border-subtle)" }
                        : undefined
                    }
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
                        <span>{level.sourceGrants.length} sources</span>
                        <span style={{ textTransform: "capitalize" }}>
                          {level.status}
                        </span>
                        <span>
                          Highest: {peak ?? "—"}
                        </span>
                        <span>Updated {formatUpdated(level.updatedAt)}</span>
                      </div>
                    </button>

                    <LuxiaEntityOptionsMenu
                      entityLabel={level.name}
                      entityType="Access Level"
                      items={[
                        {
                          id: "open",
                          label: "Open",
                          onSelect: () => onOpen(level.id),
                        },
                        {
                          id: "edit",
                          label: "Edit",
                          onSelect: () => onOpen(level.id),
                        },
                        {
                          id: "delete",
                          label: "Delete",
                          destructive: true,
                          separatorBefore: true,
                          onSelect: () => onDelete(level.id),
                        },
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </LuxiaPageBody>
    </LuxiaPageFrame>
  );
}
