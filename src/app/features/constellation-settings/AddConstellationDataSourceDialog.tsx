import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  getLibraryMyAccessLabel,
  getLibraryTypeLabel,
  getOwnershipLabel,
  listAccessibleDataSources,
  permissionRank,
  resolveUserDataSourceAccess,
  type AccessLevelRecord,
  type DataSourceCatalogItem,
} from "@/app/features/permissions";

export interface AddConstellationDataSourceDialogProps {
  open: boolean;
  connectedSourceIds: string[];
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sourceId: string) => void;
}

/** Eligible: accessible + Use/Manage + not already connected + active/usable. */
function listEligibleSources(input: {
  dataSources: DataSourceCatalogItem[];
  accessLevels: AccessLevelRecord[];
  currentUserId: string;
  connectedSourceIds: Set<string>;
}): DataSourceCatalogItem[] {
  const accessible = listAccessibleDataSources(
    input.accessLevels,
    input.dataSources,
    input.currentUserId,
  );
  return accessible.filter((source) => {
    if (input.connectedSourceIds.has(source.id)) return false;
    if (source.status !== "active") return false;
    const resolved = resolveUserDataSourceAccess(
      input.currentUserId,
      source.id,
      input.accessLevels,
      input.dataSources,
    );
    if (!resolved.permission) return false;
    return permissionRank(resolved.permission) >= permissionRank("Use");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((source) => {
      const typeLabel = getLibraryTypeLabel(source).toLowerCase();
      const ownership = getOwnershipLabel(source.ownership).toLowerCase();
      return (
        source.name.toLowerCase().includes(q)
        || typeLabel.includes(q)
        || ownership.includes(q)
      );
    });
  }, [eligible, query]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setSelectedId(null);
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
        <DialogHeader
          className="shrink-0 space-y-1.5 border-b px-6 py-5 text-left"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <DialogTitle>Add Data Source</DialogTitle>
          <DialogDescription>
            Choose an accessible Data Source with Use or Manage permission. Access
            Levels stay on Data Sources.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {eligible.length > 0 ? (
            <label className="block w-full">
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
                  placeholder="Search by name or type"
                  aria-label="Search eligible Data Sources"
                  className="h-10 w-full pl-9"
                />
              </div>
            </label>
          ) : null}

          {eligible.length === 0 ? (
            <div className="space-y-1.5 py-6" role="status">
              <p className="luxia-type-body-dense-strong text-[var(--luxia-text-primary)]">
                No additional Data Sources available
              </p>
              <p className="luxia-type-caption text-[var(--luxia-text-secondary)]">
                Eligible sources need Use or Manage access and must not already be
                connected to this Constellation. Inaccessible Private sources are not
                listed.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 luxia-type-body-dense text-[var(--luxia-text-secondary)]" role="status">
              No matching Data Sources.
            </p>
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
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter
          className="shrink-0 border-t px-6 py-4"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
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
