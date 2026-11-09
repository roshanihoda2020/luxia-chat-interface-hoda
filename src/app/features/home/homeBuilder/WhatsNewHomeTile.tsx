import { Megaphone } from "lucide-react";
import { ConceptLabel, KindChip, NewChip } from "@/app/features/explore/ExploreBadges";
import { formatExploreDate } from "@/app/features/explore/exploreFeed";
import { useExploreFeed } from "@/app/features/explore/useExploreFeed";
import { useFittingCount, type HomeCollectionDensity } from "./CollectionHomeTile";
import { HOME_TILE_CORNER_CLEARANCE, HT, HomeTileSurface } from "./HomeTileSurface";
import { HOME_TILE_ROW, OpenCue, TileSummaryRow } from "./homeTileVisuals";

const whatsNewIcon = (size: number) => <Megaphone size={size} strokeWidth={2} aria-hidden />;
const CORNER = { icon: whatsNewIcon };

/** Updates offered per size, before the summary line. */
const OFFER: Record<Exclude<HomeCollectionDensity, "wide">, number> = { small: 1, medium: 3, large: 4 };

/**
 * Optional What's New tile (added from Add Tile › Updates; never part of the
 * default Home). Newest updates first, the unread ones marked New; each goes
 * to its page in Explore Luxia. With nothing new it says so and keeps the latest.
 */
export function WhatsNewHomeTile({
  userId,
  density,
  onOpenAll,
  onOpenUpdate,
}: {
  userId: string;
  density: Exclude<HomeCollectionDensity, "wide">;
  onOpenAll: () => void;
  /** Goes to the update's page in Explore Luxia. */
  onOpenUpdate: (updateId: string) => void;
}) {
  const feed = useExploreFeed(userId);
  // Home never shows Concept Demo content, even in an internal demo build.
  const updates = feed.updates.filter((update) => update.publication === "published");
  const unread = feed.unread.filter((update) => update.publication === "published");
  const label = "What's New";
  const unreadIds = new Set(unread.map((update) => update.id));
  const { areaRef, listRef, count } = useFittingCount(
    Math.min(updates.length, OFFER[density]),
    `whats-new|${density}|${updates.map((update) => update.id).join(",")}`,
  );
  const shown = updates.slice(0, density === "small" ? 1 : count);
  const summary = unread.length > 0
    ? `${unread.length} new · ${updates.length} ${updates.length === 1 ? "update" : "updates"}`
    : updates.length > 0 ? "You're up to date" : "No updates yet";

  if (density === "small") {
    const latest = updates[0];
    return (
      <HomeTileSurface density="small" label={label} corner={CORNER}>
        <p className={`truncate luxia-type-body-dense-strong ${HOME_TILE_CORNER_CLEARANCE.small}`} style={{ color: HT.text }}>{summary}</p>
        {latest ? (
          <button
            type="button"
            className={`${HOME_TILE_ROW} -mx-1.5 mt-1.5 w-[calc(100%+12px)]`}
            onClick={() => onOpenUpdate(latest.id)}
            aria-label={`Read ${latest.title}`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                {unreadIds.has(latest.id) ? <NewChip /> : null}
                <ConceptLabel entry={latest} />
              </span>
              <span className="mt-0.5 block truncate luxia-type-body-dense-strong" style={{ color: HT.title }}>{latest.title}</span>
            </span>
          </button>
        ) : null}
        <div className="mt-auto flex justify-end">
          <OpenCue label="See all" ariaLabel="See all updates in Explore Luxia" onClick={onOpenAll} />
        </div>
      </HomeTileSurface>
    );
  }

  return (
    <HomeTileSurface density={density} label={label} corner={CORNER}>
      <TileSummaryRow
        summary={summary}
        clearance={HOME_TILE_CORNER_CLEARANCE[density]}
        action={{ label: "See all", ariaLabel: "See all updates in Explore Luxia", onClick: onOpenAll }}
      />
      {shown.length === 0 ? (
        <p className="mt-3 luxia-type-body-dense" style={{ color: HT.secondary }}>Product updates and Luxia news will appear here.</p>
      ) : (
        <div ref={areaRef} className="mt-2 min-h-0 min-w-0 flex-1 overflow-hidden">
        <ul ref={listRef} className="-mx-1.5 min-w-0" aria-label="Latest updates" data-home-whats-new="">
          {shown.map((update) => (
            <li key={update.id} className="min-w-0">
              <button
                type="button"
                className={`${HOME_TILE_ROW} items-start`}
                onClick={() => onOpenUpdate(update.id)}
                aria-label={`Read ${update.title}${unreadIds.has(update.id) ? ", new" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {unreadIds.has(update.id) ? <NewChip /> : null}
                    <KindChip kind={update.kind} />
                    <ConceptLabel entry={update} />
                  </span>
                  <span className="mt-1 block truncate luxia-type-body-dense-strong" style={{ color: HT.title }}>{update.title}</span>
                  {density === "large" ? (
                    <span className="block truncate luxia-type-caption" style={{ color: HT.secondary }}>{update.summary}</span>
                  ) : null}
                  <span className="block luxia-type-caption" style={{ color: HT.muted }}>{formatExploreDate(update.date)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        </div>
      )}
    </HomeTileSurface>
  );
}
