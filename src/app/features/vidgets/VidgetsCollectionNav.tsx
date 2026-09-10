import { FilterChip, SegmentedFilterGroup } from "@/app/features/home/browserShared";
import { VIDGETS_COLLECTION_VIEWS, type VidgetsCollectionViewId } from "./ia";

export function VidgetsCollectionNav({
  active,
  showInbox,
  onChange,
}: {
  active: VidgetsCollectionViewId;
  showInbox: boolean;
  onChange: (view: VidgetsCollectionViewId) => void;
}) {
  const views = VIDGETS_COLLECTION_VIEWS.filter(
    (view) => view.id !== "inbox" || showInbox,
  );
  if (!showInbox) return null;

  return (
    <nav className="mb-5 shrink-0" aria-label="Vidgets views">
      <SegmentedFilterGroup label="Vidgets views" className="h-auto min-h-9 p-1">
        {views.map((view) => {
          const isActive = active === view.id;
          return (
            <FilterChip
              key={view.id}
              active={isActive}
              className="px-3.5"
              onClick={() => {
                if (isActive) return;
                onChange(view.id);
              }}
            >
              {view.label}
            </FilterChip>
          );
        })}
      </SegmentedFilterGroup>
    </nav>
  );
}
