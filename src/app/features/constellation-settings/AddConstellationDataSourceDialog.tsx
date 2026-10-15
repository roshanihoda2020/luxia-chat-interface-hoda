import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  DataSourceLibraryDocumentTags,
  DataSourcePickerSearchRow,
  useAccessibleDataSourceTagFilter,
} from "@/app/features/document-tags";
import {
  getLibraryMyAccessLabel,
  getLibraryTypeLabel,
  getOwnershipLabel,
  listConstellationConnectableDataSources,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";
import { ListEmptyState } from "@/app/features/shared/ListEmptyState";
import { ListNoResultsState } from "@/app/features/shared/ListNoResultsState";

export interface AddConstellationDataSourceDialogProps {
  open: boolean;
  connectedSourceIds: string[];
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sourceId: string) => void;
}

/** Eligible: Use/Manage + not already connected + active. */
function listEligibleSources(input: {
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  connectedSourceIds: Set<string>;
}): DataSourceCatalogItem[] {
  return listConstellationConnectableDataSources(
    input.accessLevels,
    input.dataSources,
    input.currentUserId,
  ).filter((source) => {
    if (input.connectedSourceIds.has(source.id)) return false;
    if (source.status !== "active") return false;
    return true;
  });
}

export function AddConstellationDataSourceDialog({
  open,
  connectedSourceIds,
  dataSources,
  accessLevels,
  currentUserId,
  onOpenChange,
  onConfirm,
}: AddConstellationDataSourceDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const connectedSet = useMemo(
    () => new Set(connectedSourceIds),
    [connectedSourceIds],
  );

  const eligible = useMemo(
    () =>
      listEligibleSources({
        dataSources,
        accessLevels,
        currentUserId,
        connectedSourceIds: connectedSet,
      }),
    [dataSources, accessLevels, currentUserId, connectedSet],
  );

  const eligibleIds = useMemo(() => eligible.map((source) => source.id), [eligible]);
  const tagFilter = useAccessibleDataSourceTagFilter(eligibleIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eligible.filter((source) => {
      if (!tagFilter.matches(source.id)) return false;
      if (!q) return true;
      const typeLabel = getLibraryTypeLabel(source).toLowerCase();
      const ownership = getOwnershipLabel(source.ownership).toLowerCase();
      return (
        source.name.toLowerCase().includes(q)
        || typeLabel.includes(q)
        || ownership.includes(q)
      );
    });
  }, [eligible, query, tagFilter.matches, tagFilter.selectedTagIds, tagFilter.untaggedSelected]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setSelectedId(null);
      tagFilter.clear();
    }
    onOpenChange(next);
  }

  function handleConfirm() {
    if (!selectedId) return;
    onConfirm(selectedId);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Add Data Source</DialogTitle>
          <DialogDescription>
            Choose an accessible Data Source with Use or Manage permission. Access
            Levels stay on Data Sources.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {eligible.length > 0 ? (
            <DataSourcePickerSearchRow
              query={query}
              onQueryChange={setQuery}
              placeholder="Search Data Sources..."
              searchAriaLabel="Search eligible Data Sources"
              tagOptions={tagFilter.tagOptions}
              hasUntagged={tagFilter.hasUntagged}
              selectedTagIds={tagFilter.selectedTagIds}
              untaggedSelected={tagFilter.untaggedSelected}
              onToggleTag={tagFilter.toggleTag}
              onToggleUntagged={tagFilter.toggleUntagged}
              onClearTags={tagFilter.clear}
            />
          ) : null}

          {eligible.length === 0 ? (
            <ListEmptyState
              title="No additional Data Sources available"
              description="Eligible sources need Use or Manage access and must not already be connected to this Constellation. Inaccessible Private sources are not listed."
              className="border-0 bg-transparent px-0 py-6"
            />
          ) : filtered.length === 0 ? (
            <ListNoResultsState
              title="No matching Data Sources."
              className="border-0 bg-transparent px-0 py-6"
              onClear={
                tagFilter.hasActiveTagFilters
                  ? () => tagFilter.clear()
                  : undefined
              }
              clearLabel="Clear filters"
            />
          ) : (
            <ul
              role="listbox"
              aria-label="Eligible Data Sources"
              className="space-y-2"
            >
              {filtered.map((source) => {
                const selected = selectedId === source.id;
                const myAccess = getLibraryMyAccessLabel(
                  source.id,
                  accessLevels,
                  dataSources,
                  currentUserId,
                );
                return (
                  <li key={source.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setSelectedId(source.id)}
                      className={`flex w-full items-start gap-3 rounded-[var(--luxia-radius-control)] border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] ${
                        selected
                          ? "border-[var(--luxia-border-focus)] bg-[var(--luxia-surface-selected,var(--luxia-surface-muted))]"
                          : "border-[var(--luxia-border-subtle)] bg-[var(--luxia-surface-elevated)] hover:border-[var(--luxia-border-strong)]"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                          {source.name}
                        </span>
                        <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-secondary)]">
                          {getLibraryTypeLabel(source)} ·{" "}
                          {getOwnershipLabel(source.ownership)}
                        </span>
                        {myAccess ? (
                          <span className="mt-0.5 block luxia-type-caption text-[var(--luxia-text-muted)]">
                            My access: {myAccess}
                          </span>
                        ) : null}
                        <DataSourceLibraryDocumentTags
                          dataSourceId={source.id}
                          className="mt-1.5 block"
                          onTagClick={(tag) => tagFilter.selectTag(tag.id)}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Add Data Source
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
