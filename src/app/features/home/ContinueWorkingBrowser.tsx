import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { getProjectNameById } from "@/app/features/project/data";
import {
  LuxiaBreadcrumb,
  buildHomeArchiveBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { ChangePrimaryDialog } from "./ChangePrimaryDialog";
import {
  BROWSER_CONTENT_MAX,
  BROWSER_PAGE_SIZE,
  BrowserPagination,
  BrowserShell,
  FilterChip,
  FilterGroup,
} from "./browserShared";
import {
  areAllWorkItemsHidden,
  filterContinueWorkItems,
  formatWorkLastOpened,
  listContinueWorkingCollection,
  sortContinueWorkItems,
  type ContinueEntityFilter,
  type ContinueSortMode,
  type ContinueSourceFilter,
  type ContinueVisibilityFilter,
} from "./browserUtils";
import { EntityIdentityRow } from "./entityIdentity";
import {
  buildContinueFocusMenuItems,
  HomeContinueMenu,
} from "./HomeContinueMenu";
import { getSourceAccentColor, HS } from "./homeSurfaces";
import type { HomeEntityKey } from "./homeEntityKeys";
import { workItemEntityKey } from "./homeEntityKeys";
import { PinButton } from "./PinButton";
import type { HomeProjectCard, HomeRecentWorkItem } from "./types";

interface ContinueWorkingBrowserProps {
  items: HomeRecentWorkItem[];
  dismissedKeys: HomeEntityKey[];
  heroEntityKey: HomeEntityKey | null;
  pinnedEntityOrder: HomeEntityKey[];
  projects: HomeProjectCard[];
  onBack: () => void;
  onContinue: (item: HomeRecentWorkItem) => void;
  onTogglePin: (itemId: string) => void;
  onRestore: (entityKey: HomeEntityKey) => void;
  onDismiss: (entityKey: HomeEntityKey) => void;
  onSetPrimary: (entityKey: HomeEntityKey) => void;
  onShowAllOnHome: () => void;
  onNewChat: () => void;
  onOpenGalaxy: (projectId: string) => void;
  onNewProject: () => void;
}

function SourceTag({ source }: { source: "database" | "csv" | "pdf" }) {
  const isDb = source === "database";
  const label = source === "database" ? "DB" : source === "csv" ? "CSV" : "PDF";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
      style={{
        color: getSourceAccentColor(source, "soft"),
        background: isDb
          ? "var(--luxia-opacity-brand-secondary-16)"
          : "var(--luxia-opacity-blue-16)",
      }}
    >
      {label}
    </span>
  );
}

function WorkItemRow({
  item,
  isHidden,
  isHomeFocus,
  onContinue,
  onTogglePin,
  onRestore,
  onDismiss,
  onOpenChangeFocus,
  onSetAsFocus,
}: {
  item: HomeRecentWorkItem;
  isHidden: boolean;
  isHomeFocus: boolean;
  onContinue: () => void;
  onTogglePin: () => void;
  onRestore: () => void;
  onDismiss: () => void;
  onOpenChangeFocus: () => void;
  onSetAsFocus: () => void;
}) {
  const entityType = item.kind === "galaxySession" ? "galaxy-conversation" : "chat";
  const entityColor = item.kind === "galaxySession"
    ? HS.accentGalaxy
    : (getSourceAccentColor(item.constellationSource, "soft") ?? HS.accentChat);
  const projectName = getProjectNameById(item.projectId);

  const menuItems = buildContinueFocusMenuItems({
    title: item.title,
    focusAction: isHomeFocus ? "change" : "set",
    visibilityAction: isHidden ? "show" : "hide",
    onChangePrimary: onOpenChangeFocus,
    onSetAsFocus: isHomeFocus ? undefined : onSetAsFocus,
    onShow: isHidden ? onRestore : undefined,
    onHide: !isHidden ? onDismiss : undefined,
  });

  return (
    <article
      className="rounded-[12px] border px-5 py-[18px] transition-colors hover:border-[var(--luxia-opacity-brand-primary-16)]"
      style={{
        borderColor: "var(--luxia-border-default)",
        background: "var(--luxia-surface)",
        minHeight: 128,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <EntityIdentityRow
            entityType={entityType}
            iconColor={entityColor}
            size="row"
          />

          <h2
            className="mt-1.5 line-clamp-1 luxia-type-body-default-strong"
            style={{ color: "var(--luxia-text-primary)" }}
            title={item.title}
          >
            {item.title}
          </h2>

          <div className="mt-1.5 space-y-0.5">
            <p
              className="truncate luxia-type-body-dense"
              style={{ color: "var(--luxia-text-secondary)" }}
              aria-label={`Project: ${projectName}`}
            >
              {projectName}
            </p>
            {item.constellationName ? (
              <p
                className="flex min-w-0 items-center gap-1.5 truncate luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
                aria-label={`Constellation: ${item.constellationName}${
                  item.constellationSource
                    ? `, Source: ${
                        item.constellationSource === "database"
                          ? "DB"
                          : item.constellationSource === "csv"
                            ? "CSV"
                            : "PDF"
                      }`
                    : ""
                }`}
              >
                <span className="truncate">{item.constellationName}</span>
                {item.constellationSource ? (
                  <SourceTag source={item.constellationSource} />
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-muted)" }}>
              {formatWorkLastOpened(item)}
            </p>
            {isHomeFocus ? (
              <span
                className="inline-flex rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
                style={{
                  color: HS.accentGalaxy,
                  background: "var(--luxia-opacity-brand-primary-08)",
                  letterSpacing: "0.04em",
                }}
              >
                HOME FOCUS
              </span>
            ) : null}
            {isHidden ? (
              <span
                className="inline-flex rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
                style={{
                  color: "var(--luxia-text-muted)",
                  background: "var(--luxia-surface-subtle)",
                  letterSpacing: "0.04em",
                }}
              >
                HIDDEN FROM HOME
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
          <PinButton
            pinned={Boolean(item.isPinned)}
            label={item.title}
            controlSize="hero"
            onToggle={onTogglePin}
          />
          {menuItems.length > 0 ? (
            <HomeContinueMenu
              label={item.title}
              controlSize="hero"
              items={menuItems}
            />
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="compact"
            className="ml-1"
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </article>
  );
}

function PageHeaderStack({
  onBack,
  children,
}: {
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-w-0 w-full" style={{ maxWidth: BROWSER_CONTENT_MAX }}>
      <LuxiaPageHeader
        contentGap="page"
        title="Your work"
        titleStyle={{ color: HS.sectionHeading }}
        breadcrumb={
          <LuxiaBreadcrumb
            tone="page"
            items={buildHomeArchiveBreadcrumbItems({
              archiveId: "your-work",
              archiveLabel: "Your work",
            })}
            handlers={{ onHome: onBack }}
          />
        }
        description={
          <p className="luxia-type-body-small" style={{ color: "var(--luxia-neutral-600, #475569)" }}>
            Search, organize, and continue your Chats and Galaxies.
          </p>
        }
      />
      {children}
    </div>
  );
}

export function ContinueWorkingBrowser({
  items,
  dismissedKeys,
  heroEntityKey,
  pinnedEntityOrder,
  projects,
  onBack,
  onContinue,
  onTogglePin,
  onRestore,
  onDismiss,
  onSetPrimary,
  onShowAllOnHome,
  onNewChat,
  onOpenGalaxy,
  onNewProject,
}: ContinueWorkingBrowserProps) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<ContinueEntityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<ContinueSourceFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<ContinueVisibilityFilter>("all");
  const [sortMode, setSortMode] = useState<ContinueSortMode>("opened");
  const [page, setPage] = useState(1);
  const [changePrimaryOpen, setChangePrimaryOpen] = useState(false);

  const collection = useMemo(() => listContinueWorkingCollection(items), [items]);
  const dismissedSet = useMemo(() => new Set(dismissedKeys), [dismissedKeys]);
  const allHidden = areAllWorkItemsHidden(items, dismissedKeys);
  const genuinelyEmpty = collection.length === 0;

  const effectiveSort = entityFilter === "pinned" ? "pinned" : sortMode;

  const filteredItems = useMemo(
    () => sortContinueWorkItems(
      filterContinueWorkItems(items, {
        query,
        entityFilter,
        sourceFilter,
        visibilityFilter,
        dismissedKeys: dismissedSet,
      }),
      effectiveSort,
      pinnedEntityOrder,
    ),
    [
      items,
      query,
      entityFilter,
      sourceFilter,
      visibilityFilter,
      dismissedSet,
      effectiveSort,
      pinnedEntityOrder,
    ],
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / BROWSER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice(
    (currentPage - 1) * BROWSER_PAGE_SIZE,
    currentPage * BROWSER_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [query, entityFilter, sourceFilter, visibilityFilter, sortMode]);

  const galaxyProject = projects.find((project) => !project.isEmpty) ?? projects[0];

  if (genuinelyEmpty) {
    return (
      <PageHeaderStack onBack={onBack}>
        <div
          className="rounded-[12px] border px-5 py-6"
          style={{
            borderColor: "var(--luxia-border-default)",
            background: "var(--luxia-surface)",
          }}
        >
          <h2 className="luxia-type-title-component" style={{ color: HS.sectionHeading }}>
            No Chats or Galaxies yet
          </h2>
          <p className="mt-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
            Start a Chat or open a Project Galaxy to see your work here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={onNewChat}>
              New Chat
            </Button>
            {galaxyProject ? (
              <Button type="button" variant="outline" onClick={() => onOpenGalaxy(galaxyProject.id)}>
                Open Galaxy
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onNewProject}>
                New Project
              </Button>
            )}
          </div>
        </div>
      </PageHeaderStack>
    );
  }

  const allHiddenBanner = allHidden ? (
    <div
      className="mb-4 flex flex-col gap-3 rounded-[10px] border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: "var(--luxia-opacity-brand-primary-16)",
        background: "var(--luxia-opacity-brand-primary-04)",
      }}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Info
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="mt-0.5 shrink-0"
          style={{ color: HS.sectionHeading }}
        />
        <div className="min-w-0">
          <p className="luxia-type-body-dense-strong" style={{ color: HS.sectionHeading }}>
            Nothing is currently shown on Home
          </p>
          <p className="mt-0.5 luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
            Your Chats and Galaxies are still available here.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:pl-2">
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={() => setChangePrimaryOpen(true)}
        >
          Choose Home focus
        </Button>
        <Button
          type="button"
          variant="primary"
          size="compact"
          onClick={onShowAllOnHome}
          aria-label="Show all Chats and Galaxies on Home"
        >
          Show all on Home
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <BrowserShell
        title="Your work"
        archiveId="your-work"
        description="Search, organize, and continue your Chats and Galaxies."
        onBack={onBack}
        searchLabel="Search Chats and Galaxies"
        searchPlaceholder="Search Chats and Galaxies"
        searchValue={query}
        onSearchChange={setQuery}
        banner={allHiddenBanner}
        filters={(
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <FilterGroup label="Type">
              <FilterChip active={entityFilter === "all"} onClick={() => setEntityFilter("all")}>All</FilterChip>
              <FilterChip active={entityFilter === "chat"} onClick={() => setEntityFilter("chat")}>Chat</FilterChip>
              <FilterChip active={entityFilter === "galaxy"} onClick={() => setEntityFilter("galaxy")}>Galaxy</FilterChip>
              <FilterChip active={entityFilter === "pinned"} onClick={() => setEntityFilter("pinned")}>Pinned</FilterChip>
            </FilterGroup>
            <span
              className="hidden h-4 w-px shrink-0 sm:block"
              style={{ background: "var(--luxia-border-default)" }}
              aria-hidden
            />
            <FilterGroup label="Source">
              <FilterChip active={sourceFilter === "all"} onClick={() => setSourceFilter("all")}>All sources</FilterChip>
              <FilterChip active={sourceFilter === "database"} onClick={() => setSourceFilter("database")}>Database</FilterChip>
              <FilterChip active={sourceFilter === "pdf"} onClick={() => setSourceFilter("pdf")}>PDF</FilterChip>
            </FilterGroup>
            <span
              className="hidden h-4 w-px shrink-0 sm:block"
              style={{ background: "var(--luxia-border-default)" }}
              aria-hidden
            />
            <FilterGroup label="Visibility">
              <FilterChip active={visibilityFilter === "all"} onClick={() => setVisibilityFilter("all")}>All visibility</FilterChip>
              <FilterChip active={visibilityFilter === "visible"} onClick={() => setVisibilityFilter("visible")}>Visible on Home</FilterChip>
              <FilterChip active={visibilityFilter === "hidden"} onClick={() => setVisibilityFilter("hidden")}>Hidden from Home</FilterChip>
            </FilterGroup>
          </div>
        )}
        sortControls={(
          <label className="flex items-center gap-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
            <span>Sort</span>
            <select
              value={effectiveSort}
              onChange={(event) => setSortMode(event.target.value as ContinueSortMode)}
              className="h-8 rounded-[8px] border px-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
              style={{
                borderColor: "var(--luxia-border-default)",
                background: "var(--luxia-surface)",
                color: "var(--luxia-text-primary)",
              }}
              aria-label="Sort your work"
            >
              <option value="opened">Recently opened</option>
              <option value="pinned">Recently pinned</option>
              <option value="name">Name</option>
            </select>
          </label>
        )}
        resultSummary={(
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-muted)" }}
            aria-live="polite"
          >
            {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
          </p>
        )}
        footer={(
          <BrowserPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      >
        {pageItems.length === 0 ? (
          <div
            className="rounded-[12px] border px-4 py-5 text-center"
            style={{
              borderColor: "var(--luxia-border-default)",
              background: "var(--luxia-surface-subtle)",
            }}
          >
            <p className="luxia-type-body-default" style={{ color: "var(--luxia-text-secondary)" }}>
              No matching Chats or Galaxies.
            </p>
            <Button
              type="button"
              variant="outline"
              size="compact"
              className="mt-3"
              onClick={() => {
                setQuery("");
                setEntityFilter("all");
                setSourceFilter("all");
                setVisibilityFilter("all");
              }}
            >
              Clear search and filters
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pageItems.map((item) => {
              const entityKey = workItemEntityKey(item);
              const isHidden = dismissedSet.has(entityKey);
              const isHomeFocus = heroEntityKey === entityKey && !isHidden;

              return (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  isHidden={isHidden}
                  isHomeFocus={isHomeFocus}
                  onContinue={() => onContinue(item)}
                  onTogglePin={() => onTogglePin(item.id)}
                  onRestore={() => onRestore(entityKey)}
                  onDismiss={() => onDismiss(entityKey)}
                  onOpenChangeFocus={() => setChangePrimaryOpen(true)}
                  onSetAsFocus={() => onSetPrimary(entityKey)}
                />
              );
            })}
          </div>
        )}
      </BrowserShell>

      <ChangePrimaryDialog
        open={changePrimaryOpen}
        items={collection}
        currentKey={heroEntityKey}
        onClose={() => setChangePrimaryOpen(false)}
        onSelect={(entityKey) => onSetPrimary(entityKey)}
      />
    </>
  );
}
