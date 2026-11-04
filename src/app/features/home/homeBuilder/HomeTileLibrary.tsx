import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, LayoutList, MousePointerClick } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { SearchField } from "@/app/features/shared/SearchField";
import { HOME_TILE_SECTIONS } from "./homeTileSections";
import { canAddHomeTileType, isHomeTileTargetOnLayout } from "./layoutOps";
import {
  HOME_TILE_DEFINITIONS,
  type HomeTileCategory,
  type HomeTileDefinition,
} from "./registry";
import {
  type HomeLayout,
  type HomeProjectsView,
  type HomeTileConfig,
  type HomeTileTarget,
  type HomeTileType,
} from "./types";

/** One item the current user can already access, offered for a specific-item tile. */
export interface HomeTileTargetOption {
  target: HomeTileTarget;
  label: string;
  detail?: string;
}

/**
 * What a collection tile would show for the current user: whether Luxia can
 * show and open that category here, and how many accessible items it has
 * (for Projects, per view).
 */
export interface HomeCollectionAvailability {
  available: boolean;
  count: number;
  viewCounts?: Partial<Record<HomeProjectsView, number>>;
}

/**
 * The Library is category-first: pick what the tile is about, then either
 * "Show my …" (a collection that stays up to date) or "Choose a …" (one
 * specific item). Your focus and Tools are added or chosen directly.
 */
interface LibraryCategory {
  id: HomeTileCategory;
  label: string;
  /** Plain-language nouns used in the choices ("Show my chats", "Choose a chat"). */
  one: string;
  many: string;
  collection?: HomeTileType;
  item?: HomeTileType;
  /** Shown on the category card instead of a count. */
  blurb?: string;
  /** One line under "All my …": what the list shows and in what order. */
  allHint?: string;
}

const CATEGORIES: LibraryCategory[] = [
  { id: "projects", allHint: "All your Projects, A–Z. Switch to Pinned or Recently updated anytime.", label: "Projects", one: "project", many: "projects", collection: "projects-collection", item: "project" },
  { id: "chats", allHint: "Your recent Chats, most recently opened first.", label: "Chats", one: "chat", many: "chats", collection: "chats-collection", item: "chat" },
  { id: "galaxies", allHint: "Every Project's Galaxy, latest activity first.", label: "Galaxies", one: "Galaxy", many: "Galaxies", collection: "galaxies-collection", item: "galaxy" },
  {
    id: "constellations", allHint: "See the Constellations you can use, grouped by Project.",
    label: "Constellations",
    one: "Constellation",
    many: "Constellations",
    collection: "constellations-collection",
    item: "constellation",
  },
  {
    id: "data-sources", allHint: "See all the Data Sources you can use, A–Z.",
    label: "Data sources",
    one: "data source",
    many: "data sources",
    collection: "data-sources-collection",
    item: "data-source",
  },
  {
    id: "dashboards", allHint: "Named Dashboards from all your Projects, recently updated first.",
    label: "Dashboards",
    one: "Dashboard",
    many: "Dashboards",
    collection: "dashboards-collection",
    item: "dashboard",
  },
  {
    id: "continue",
    label: "Continue where you left off",
    one: "item",
    many: "items",
    item: "your-focus",
    blurb: "Your most recent Chat or Galaxy",
  },
  { id: "tools", label: "Tools", one: "tool", many: "tools", item: "tool", blurb: "Writing Assistant" },
];

/** Things in Luxia that can't be a Home Tile yet. */
const COMING_LATER = "Coming later: single saved outputs and Vidgets.";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

interface HomeTileLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: HomeLayout;
  /** Accessible items per specific-item tile type. */
  targetOptions: Partial<Record<HomeTileType, HomeTileTargetOption[]>>;
  /** Availability and item counts per collection tile type. */
  collections: Partial<Record<HomeTileType, HomeCollectionAvailability>>;
  onAdd: (type: HomeTileType, target?: HomeTileTarget, config?: HomeTileConfig) => void;
}

export function sameHomeTileTarget(a: HomeTileTarget | null | undefined, b: HomeTileTarget): boolean {
  return Boolean(a && a.scope === b.scope && a.entityId === b.entityId);
}

export function HomeTileLibrary({
  open,
  onOpenChange,
  layout,
  targetOptions,
  collections,
  onAdd,
}: HomeTileLibraryProps) {
  const [categoryId, setCategoryId] = useState<HomeTileCategory | null>(null);
  const [pickType, setPickType] = useState<HomeTileType | null>(null);
  const [query, setQuery] = useState("");
  // Opened from a plain button (not a DialogTrigger), so remember where focus should return.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCategoryId(null);
      setPickType(null);
      setQuery("");
    }
    onOpenChange(next);
  }

  function add(type: HomeTileType, target?: HomeTileTarget, config?: HomeTileConfig) {
    onAdd(type, target, config);
    handleOpenChange(false);
  }

  const category = categoryId ? CATEGORIES.find((entry) => entry.id === categoryId) ?? null : null;
  const pickDefinition = pickType ? HOME_TILE_DEFINITIONS[pickType] : null;
  const title = pickDefinition && category
    ? `Choose a ${category.one}`
    : category ? category.label : "Add to your Home";
  // One line per step; the cards below carry the details.
  const description = pickDefinition && category
    ? `Only ${category.many} you can open are listed.`
    : category
      ? "Show all of them, or just one?"
      : "Pick what you'd like to see. Only your Home changes — nothing else in Luxia.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onOpenAutoFocus={() => {
          // Runs before focus moves into the dialog.
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(64vh,600px)] overflow-y-auto px-6 py-5">
          {pickDefinition && pickType ? (
            <TargetPicker
              definition={pickDefinition}
              options={targetOptions[pickType] ?? []}
              entryState={(target) => {
                const onHome = isHomeTileTargetOnLayout(layout, pickType, target);
                return { status: onHome ? "On your Home" : null, selectable: !onHome };
              }}
              actionLabel="Add"
              query={query}
              onQueryChange={setQuery}
              backLabel={category?.collection ? `Back to ${category.label}` : "Back to categories"}
              searchLabel={category ? `Search ${category.many}` : undefined}
              onBack={() => {
                setPickType(null);
                setQuery("");
                if (!category?.collection) setCategoryId(null);
              }}
              onPick={(target) => add(pickType, target)}
            />
          ) : category ? (
            <CategoryChoices
              category={category}
              layout={layout}
              targetOptions={targetOptions}
              collections={collections}
              onBack={() => setCategoryId(null)}
              onAddCollection={(type, config) => add(type, undefined, config)}
              onChooseItem={(type) => setPickType(type)}
            />
          ) : (
            <CategoryGrid
              layout={layout}
              targetOptions={targetOptions}
              collections={collections}
              onOpenCategory={(entry) => {
                // Your focus has nothing to choose: add it straight away.
                if (entry.item === "your-focus" && !entry.collection) add("your-focus");
                else {
                  setCategoryId(entry.id);
                  // Tools have no "all of them" list: go straight to choosing one.
                  if (!entry.collection && entry.item) setPickType(entry.item);
                }
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** First step: one card per kind of content, with how much of it the user can access. */
function CategoryGrid({
  layout,
  targetOptions,
  collections,
  onOpenCategory,
}: {
  layout: HomeLayout;
  targetOptions: HomeTileLibraryProps["targetOptions"];
  collections: HomeTileLibraryProps["collections"];
  onOpenCategory: (category: LibraryCategory) => void;
}) {
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="What to add">
        {CATEGORIES.map((category) => {
          const icon = HOME_TILE_SECTIONS[category.collection ?? category.item ?? "tool"].icon;
          const collection = category.collection ? collections[category.collection] : undefined;
          const items = category.item ? targetOptions[category.item]?.length ?? 0 : 0;
          const count = collection?.available ? collection.count : items;
          const focusOnHome = category.item === "your-focus" && !canAddHomeTileType(layout, "your-focus");
          const nothing = !focusOnHome && !category.blurb && !collection?.available && items === 0;
          const status = focusOnHome ? "On your Home" : nothing ? "Not available" : null;
          const detail = category.blurb ?? (count === 0 ? `No ${category.many} yet` : `${plural(count, category.one, category.many)} you can access`);
          return (
            <li key={category.id}>
              <button
                type="button"
                disabled={Boolean(status)}
                data-home-library-category={category.id}
                onClick={() => onOpenCategory(category)}
                aria-label={status ? `${category.label} — ${status}` : category.label}
                className="flex h-full w-full min-w-0 items-center gap-3 rounded-[var(--luxia-radius-12)] border px-3.5 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] enabled:hover:border-[var(--luxia-opacity-brand-secondary-32)] enabled:hover:bg-[var(--luxia-opacity-brand-secondary-04)] disabled:cursor-default disabled:opacity-60"
                style={{ borderColor: "var(--luxia-border-default)", background: "var(--luxia-surface)" }}
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-5"
                  style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }}
                >
                  {icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-purple-70)" }}>
                    {category.label}
                  </span>
                  <span className="block truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                    {status ?? detail}
                  </span>
                </span>
                {!status ? <ChevronRight size={16} aria-hidden style={{ color: "var(--luxia-purple-60)" }} /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{COMING_LATER}</p>
    </div>
  );
}

/**
 * Second step: two cards — "All my …" (adds the list straight away; Projects
 * start as All, A–Z, and switch views in Edit) or "Choose a …" (opens the
 * searchable picker). Whole cards are the buttons.
 */
function CategoryChoices({
  category,
  layout,
  targetOptions,
  collections,
  onBack,
  onAddCollection,
  onChooseItem,
}: {
  category: LibraryCategory;
  layout: HomeLayout;
  targetOptions: HomeTileLibraryProps["targetOptions"];
  collections: HomeTileLibraryProps["collections"];
  onBack: () => void;
  onAddCollection: (type: HomeTileType, config?: HomeTileConfig) => void;
  onChooseItem: (type: HomeTileType) => void;
}) {
  const collection = category.collection ? collections[category.collection] : undefined;
  const itemCount = category.item ? targetOptions[category.item]?.length ?? 0 : 0;
  const itemAtLimit = category.item ? !canAddHomeTileType(layout, category.item) : false;
  const collectionCount = collection?.available ? collection.count : 0;
  return (
    <div className="space-y-4">
      <Button type="button" variant="tertiary" size="compact" onClick={onBack} className="-ml-2">
        <ChevronLeft size={14} aria-hidden />
        Back to categories
      </Button>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label={`Ways to add ${category.many}`}>
        {category.collection ? (
          <li>
            <ChoiceCard
              icon={<LayoutList size={20} strokeWidth={2} />}
              title={`All my ${category.many}`}
              text={category.allHint ?? `See your ${category.many} together.`}
              fact={collection?.available
                ? collectionCount === 0
                  ? `No ${category.many} yet — it fills in as you work`
                  : plural(collectionCount, category.one, category.many)
                : undefined}
              unavailable={collection?.available ? undefined : "Not available here yet"}
              action="Add to Home"
              data-home-library-choice="all"
              onSelect={() => onAddCollection(
                category.collection!,
                // Projects start with every Project, A–Z; Pinned and Recently updated are in Edit.
                category.collection === "projects-collection" ? { view: "name" } : undefined,
              )}
            />
          </li>
        ) : null}
        {category.item ? (
          <li>
            <ChoiceCard
              icon={<MousePointerClick size={20} strokeWidth={2} />}
              title={`Choose a ${category.one}`}
              text={`Pick one ${category.one} to keep on Home.`}
              fact={itemCount > 0 ? `${itemCount} to choose from` : undefined}
              unavailable={itemAtLimit ? "Already on your Home" : itemCount === 0 ? `No ${category.many} you can open` : undefined}
              action="Choose"
              data-home-library-choice="one"
              onSelect={() => onChooseItem(category.item!)}
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * A whole-card choice: icon, title, one line, a fact (count) and an arrow.
 * Hover lifts the border to purple; keyboard focus shows the standard ring.
 * Unavailable choices stay visible with the reason, and can't be selected.
 */
function ChoiceCard({
  icon,
  title,
  text,
  fact,
  unavailable,
  action,
  onSelect,
  ...rest
}: {
  icon: ReactNode;
  title: string;
  text: string;
  fact?: string;
  unavailable?: string;
  /** Spoken with the title (e.g. "Add to Home", "Choose"). */
  action: string;
  onSelect: () => void;
  "data-home-library-choice"?: string;
}) {
  const disabled = Boolean(unavailable);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-label={disabled ? `${title} — ${unavailable}` : `${title}. ${text}${fact ? ` ${fact}.` : ""} ${action}.`}
      className="luxia-home-choice-card group flex h-full min-h-[176px] w-full min-w-0 flex-col rounded-[var(--luxia-radius-12)] border p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] focus-visible:ring-offset-2 disabled:cursor-default"
      {...rest}
    >
      <span className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-[12px]"
          style={{ background: "var(--luxia-opacity-brand-secondary-12)", color: "var(--luxia-purple-60)" }}
        >
          {icon}
        </span>
        {!disabled ? (
          <span
            aria-hidden
            className="luxia-home-choice-arrow flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <ArrowRight size={16} strokeWidth={2.25} />
          </span>
        ) : null}
      </span>
      <span className="mt-4 block luxia-type-title-component" style={{ color: "var(--luxia-purple-70)" }}>
        {title}
      </span>
      <span className="mt-1 block luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        {text}
      </span>
      <span className="mt-auto pt-4">
        <span
          className="inline-flex rounded-full px-2.5 py-1 luxia-type-caption font-semibold"
          style={disabled
            ? { color: "var(--luxia-text-secondary)", background: "var(--luxia-opacity-brand-primary-04)" }
            : { color: "var(--luxia-purple-70)", background: "var(--luxia-opacity-brand-secondary-08)" }}
        >
          {unavailable ?? fact ?? action}
        </span>
      </span>
    </button>
  );
}

function LibraryEntry({
  label,
  description,
  status,
  actionLabel,
  onSelect,
  selected,
  detail,
}: {
  label: string;
  description: string;
  status: string | null;
  actionLabel?: string;
  onSelect?: () => void;
  /** A short fact under the description (e.g. "6 you can access"). */
  detail?: string;
  /** Configure Tile: whether this item is the one that will be saved. */
  selected?: boolean;
}) {
  const disabled = !onSelect;
  const choosing = selected !== undefined;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={choosing ? selected : undefined}
      // The description (e.g. the Project) is part of the name, so same-named items stay distinguishable.
      aria-label={`${disabled
        ? `${label} — ${status}`
        : choosing ? `${label}${status ? ` — ${status}` : ""}` : `${actionLabel} ${label}`}${description ? `, ${description}` : ""}`}
      className="flex h-full w-full min-w-0 items-start justify-between gap-3 rounded-[var(--luxia-radius-12)] border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] enabled:hover:bg-[var(--luxia-opacity-brand-primary-04)] disabled:cursor-default"
      style={{
        borderColor: selected ? "var(--luxia-purple-60)" : "var(--luxia-border-default)",
        boxShadow: selected ? "inset 0 0 0 1px var(--luxia-purple-60)" : undefined,
        background: selected
          ? "var(--luxia-opacity-brand-primary-04)"
          : disabled ? "var(--luxia-neutral-surface-subtle, var(--luxia-surface))" : "var(--luxia-surface)",
      }}
    >
      <span className="min-w-0">
        <span
          className="block luxia-type-body-dense-strong"
          style={{ color: disabled ? "var(--luxia-text-secondary)" : "var(--luxia-purple-70)" }}
        >
          {label}
        </span>
        <span className="mt-0.5 block luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
          {description}
        </span>
        {detail ? (
          <span className="mt-1 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
            {detail}
          </span>
        ) : null}
      </span>
      <span
        className="shrink-0 luxia-type-caption"
        style={{ color: disabled ? "var(--luxia-text-muted)" : "var(--luxia-purple-60)" }}
      >
        {status ?? actionLabel}
      </span>
    </button>
  );
}

/** Item list shared by Add Tile and Configure Tile. */
export function TargetPicker({
  definition,
  options,
  entryState,
  actionLabel,
  query,
  onQueryChange,
  onBack,
  backLabel = "Back",
  searchLabel,
  onPick,
}: {
  definition: HomeTileDefinition;
  options: HomeTileTargetOption[];
  /** Status text ("On your Home", "Current"), whether the item can be chosen, and (Configure) whether it is selected. */
  entryState: (target: HomeTileTarget) => { status: string | null; selectable: boolean; selected?: boolean };
  actionLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  /** Back to the previous step; omitted in Configure Tile. */
  onBack?: () => void;
  backLabel?: string;
  searchLabel?: string;
  onPick: (target: HomeTileTarget) => void;
}) {
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {onBack ? (
          <Button type="button" variant="tertiary" size="compact" onClick={onBack}>
            <ChevronLeft size={14} aria-hidden />
            {backLabel}
          </Button>
        ) : null}
        <SearchField
          value={query}
          onChange={onQueryChange}
          placeholder={searchLabel ?? `Search ${definition.label.toLowerCase()} items`}
          aria-label={searchLabel ?? `Search ${definition.label} items`}
          className="min-w-[12rem] flex-1"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          {options.length === 0 ? "There are no items you can add here yet." : "No items match your search."}
        </p>
      ) : (
        <ul className="space-y-2" aria-label={`${definition.label} items`}>
          {filtered.map((option) => {
            const state = entryState(option.target);
            return (
              <li key={`${option.target.scope}:${option.target.entityId}`}>
                <LibraryEntry
                  label={option.label}
                  description={option.detail ?? ""}
                  status={state.status}
                  actionLabel={actionLabel}
                  selected={state.selected}
                  onSelect={state.selectable ? () => onPick(option.target) : undefined}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
