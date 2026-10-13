import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { FileInUseDialog } from "@/app/features/data-sources/FileInUseDialog";
import {
  getFileInUseDependencies,
  type FileInUseDependency,
} from "@/app/features/data-sources/fileInUse";
import { HS } from "@/app/features/home/homeSurfaces";
import { canManageOrganizationTagDefinitions } from "@/app/features/permissions";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { LUXIA_SETTINGS_LIST_SURFACE_CLASS } from "@/app/features/shared/luxiaSettingsUx";
import { DocumentTagChip, TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import { TagMultiSelectFilter } from "./TagMultiSelectFilter";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import { useDataSourceTags } from "./useDataSourceTags";

const TABLE_HEADER_CELL =
  "px-4 py-2.5 align-middle whitespace-nowrap luxia-type-label-small";
const TABLE_BODY_CELL = "px-4 py-3 align-middle luxia-type-body-dense";

function formatFromFileName(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return ext ? ext.toUpperCase() : "FILE";
}

export function FileDataSourceDocumentsPanel({
  dataSourceId,
  fileNames,
  canEdit,
  currentUserId,
  onDeleteDocument,
  onOpenConstellation,
}: {
  dataSourceId: string;
  fileNames: readonly string[];
  canEdit: boolean;
  currentUserId?: string;
  /**
   * Persist removal from the canonical Data Source document list.
   * Only called after ConfirmDialog when the file is unused.
   */
  onDeleteDocument?: (fileName: string) => void;
  onOpenConstellation?: (projectId: string, constellationId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [untaggedSelected, setUntaggedSelected] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [inUse, setInUse] = useState<{
    fileName: string;
    dependencies: FileInUseDependency[];
  } | null>(null);

  const {
    catalog,
    tagsForFileName,
    applyTagToFiles,
    createAndApplyTagToFiles,
    removeTagFromFile,
    clearFileAssignments,
    updateTag,
  } = useDataSourceTags(dataSourceId);
  const canManageDefinitions = canManageOrganizationTagDefinitions(currentUserId);
  const canDelete = Boolean(canEdit && onDeleteDocument);

  const fileTagOptions = useMemo(() => {
    const seen = new Set<string>();
    const tags: DocumentTagDefinition[] = [];
    for (const name of fileNames) {
      for (const tag of tagsForFileName(name)) {
        if (seen.has(tag.id)) continue;
        seen.add(tag.id);
        tags.push(tag);
      }
    }
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  }, [fileNames, tagsForFileName]);

  const hasUntaggedDocuments = useMemo(
    () => fileNames.some((name) => tagsForFileName(name).length === 0),
    [fileNames, tagsForFileName],
  );

  useEffect(() => {
    const valid = new Set(fileTagOptions.map((tag) => tag.id));
    setSelectedTagIds((current) => {
      const next = current.filter((id) => valid.has(id));
      return next.length === current.length ? current : next;
    });
  }, [fileTagOptions]);

  useEffect(() => {
    if (!hasUntaggedDocuments) setUntaggedSelected(false);
  }, [hasUntaggedDocuments]);

  useEffect(() => {
    const valid = new Set(fileNames);
    setSelected((current) => {
      const next = current.filter((name) => valid.has(name));
      return next.length === current.length ? current : next;
    });
  }, [fileNames]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedIdSet = new Set(selectedTagIds);
    const tagFiltersActive = selectedIdSet.size > 0 || untaggedSelected;
    return fileNames.filter((name) => {
      const fileTags = tagsForFileName(name);
      if (tagFiltersActive) {
        const matchesTag = fileTags.some((tag) => selectedIdSet.has(tag.id));
        const matchesUntagged = untaggedSelected && fileTags.length === 0;
        if (!matchesTag && !matchesUntagged) return false;
      }
      if (q && !name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fileNames, query, selectedTagIds, tagsForFileName, untaggedSelected]);

  const filteredEmpty = fileNames.length > 0 && visible.length === 0;
  const visibleSelected = selected.filter((name) => visible.includes(name));
  const allVisibleSelected = visible.length > 0 && visibleSelected.length === visible.length;
  const someVisibleSelected = visibleSelected.length > 0 && !allVisibleSelected;
  const hasActiveTagFilters = selectedTagIds.length > 0 || untaggedSelected;

  function clearTagFilters() {
    setSelectedTagIds([]);
    setUntaggedSelected(false);
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  function toggleFile(name: string, checked: boolean) {
    setSelected((current) => {
      if (checked) return current.includes(name) ? current : [...current, name];
      return current.filter((item) => item !== name);
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelected((current) => {
      if (checked) {
        const next = new Set(current);
        visible.forEach((name) => next.add(name));
        return [...next];
      }
      const hidden = new Set(visible);
      return current.filter((name) => !hidden.has(name));
    });
  }

  function handleApplyToFiles(fileTargets: readonly string[], tag: DocumentTagDefinition) {
    const result = applyTagToFiles(fileTargets, tag);
    if (result.appliedCount === 0) {
      toast.message(`“${result.tag.name}” is already on the selected document${fileTargets.length === 1 ? "" : "s"}.`);
      return;
    }
    toast.success(
      fileTargets.length === 1
        ? "Tag added."
        : `Tag added to ${result.appliedCount} document${result.appliedCount === 1 ? "" : "s"}.`,
    );
  }

  function handleCreateForFiles(
    fileTargets: readonly string[],
    input: { name: string; color: DocumentTagColorId },
  ) {
    const result = createAndApplyTagToFiles(fileTargets, input.name, input.color);
    if (result.error) return result.error;
    toast.success(
      fileTargets.length === 1
        ? "Tag added."
        : `Tag added to ${result.appliedCount} document${result.appliedCount === 1 ? "" : "s"}.`,
    );
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = updateTag(tag.id, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  function handleConfirmDelete() {
    if (!deleteTarget || !onDeleteDocument) return;
    const fileName = deleteTarget;
    // Re-resolve on every attempt — never cache a stale in-use decision.
    const dependencies = getFileInUseDependencies(dataSourceId, fileName);
    setDeleteTarget(null);

    if (dependencies.length > 0) {
      // Hard block: no file, tag, or selection mutation.
      setInUse({ fileName, dependencies });
      return;
    }

    clearFileAssignments(fileName);
    onDeleteDocument(fileName);
    setSelected((current) => current.filter((name) => name !== fileName));
    luxiaToast.success({
      title: "File deleted",
      description: fileName,
    });
  }

  const bulkBar = canEdit && visibleSelected.length > 0 ? (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        {visibleSelected.length} file{visibleSelected.length === 1 ? "" : "s"} selected
      </p>
      <DocumentTagPicker
        catalog={catalog}
        variant="secondary"
        ariaLabel="Add tag to selected files"
        onApply={(tag) => handleApplyToFiles(visibleSelected, tag)}
        onCreate={(input) => handleCreateForFiles(visibleSelected, input)}
      />
      <Button type="button" variant="tertiary" size="compact" onClick={() => setSelected([])}>
        Clear selection
      </Button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
        {fileNames.length.toLocaleString()} document{fileNames.length === 1 ? "" : "s"}
      </p>

      {fileNames.length === 0 ? (
        <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
          This Data Source has no documents yet. Documents appear here after they are added to the Data Source.
        </p>
      ) : (
        <>
          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <div className="relative min-w-0 flex-1">
              <Label htmlFor="file-ds-document-search" className="sr-only">
                Search documents
              </Label>
              <Search
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                style={{ color: "var(--luxia-text-muted)" }}
              />
              <Input
                id="file-ds-document-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search documents"
                className="h-10 w-full pl-9"
                style={{
                  background: HS.searchBg,
                  borderColor: HS.searchBorder,
                }}
              />
            </div>
            <TagMultiSelectFilter
              options={fileTagOptions}
              hasUntagged={hasUntaggedDocuments}
              selectedTagIds={selectedTagIds}
              untaggedSelected={untaggedSelected}
              onToggleTag={toggleTagFilter}
              onToggleUntagged={() => setUntaggedSelected((current) => !current)}
              onClear={clearTagFilters}
            />
          </div>

          {bulkBar}

          {filteredEmpty ? (
            <div className="space-y-2">
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                No documents match these filters.
              </p>
              {hasActiveTagFilters ? (
                <Button type="button" variant="tertiary" size="compact" onClick={clearTagFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className={`${LUXIA_SETTINGS_LIST_SURFACE_CLASS} overflow-x-auto`}>
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <caption className="sr-only">Documents in this Data Source</caption>
                <thead>
                  <tr style={{ color: "var(--luxia-text-secondary)" }}>
                    {canEdit ? (
                      <th scope="col" className={`${TABLE_HEADER_CELL} w-10`}>
                        <Checkbox
                          checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                          onCheckedChange={(value) => toggleAllVisible(value === true)}
                          aria-label="Select all visible documents"
                        />
                      </th>
                    ) : null}
                    <th scope="col" className={TABLE_HEADER_CELL}>Document</th>
                    <th scope="col" className={TABLE_HEADER_CELL}>Format</th>
                    <th scope="col" className={TABLE_HEADER_CELL}>Tags</th>
                    {canDelete ? (
                      <th scope="col" className={`${TABLE_HEADER_CELL} w-12`}>
                        <span className="sr-only">Actions</span>
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((name) => {
                    const fileTags = tagsForFileName(name);
                    return (
                      <tr key={name} className="luxia-settings-row hover:bg-[var(--luxia-surface-hover)]">
                        {canEdit ? (
                          <td className={`${TABLE_BODY_CELL} w-10`}>
                            <Checkbox
                              checked={selected.includes(name)}
                              onCheckedChange={(value) => toggleFile(name, value === true)}
                              aria-label={`Select ${name}`}
                            />
                          </td>
                        ) : null}
                        <td className={`${TABLE_BODY_CELL} min-w-0`}>
                          <span
                            className="block break-words luxia-type-body-dense-strong"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {name}
                          </span>
                        </td>
                        <td className={TABLE_BODY_CELL} style={{ color: "var(--luxia-text-secondary)" }}>
                          {formatFromFileName(name)}
                        </td>
                        <td className={TABLE_BODY_CELL}>
                          <div className={`min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
                            {fileTags.map((tag) =>
                              canEdit ? (
                                <ManagedTagChip
                                  key={tag.id}
                                  tag={tag}
                                  className="max-w-[min(100%,12rem)]"
                                  removeAriaLabel={`Remove ${tag.name} from ${name}`}
                                  onEdit={canManageDefinitions ? (input) => handleUpdate(tag, input) : undefined}
                                  onRemove={() => {
                                    removeTagFromFile(name, tag.id);
                                    toast.message(`Removed “${tag.name}”.`);
                                  }}
                                />
                              ) : (
                                <DocumentTagChip key={tag.id} tag={tag} className="max-w-[min(100%,12rem)]" />
                              ),
                            )}
                            {canEdit ? (
                              <DocumentTagPicker
                                catalog={catalog}
                                variant="secondary"
                                iconOnly={fileTags.length > 0}
                                ariaLabel={`Add tag to ${name}`}
                                excludeIds={fileTags.map((tag) => tag.id)}
                                onApply={(tag) => handleApplyToFiles([name], tag)}
                                onCreate={(input) => handleCreateForFiles([name], input)}
                              />
                            ) : null}
                          </div>
                        </td>
                        {canDelete ? (
                          <td className={`${TABLE_BODY_CELL} w-12`}>
                            <LuxiaEntityOptionsMenu
                              entityLabel={name}
                              entityType="document"
                              ariaLabel={`Options for ${name}`}
                              items={[
                                {
                                  id: "delete",
                                  label: "Delete",
                                  ariaLabel: `Delete ${name}`,
                                  destructive: true,
                                  onSelect: () => setDeleteTarget(name),
                                },
                              ]}
                            />
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget ?? "file"}?`}
        description="The file will be removed from this Data Source and from search. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="destructive"
        onConfirm={handleConfirmDelete}
      />

      <FileInUseDialog
        open={Boolean(inUse)}
        fileName={inUse?.fileName ?? ""}
        dependencies={inUse?.dependencies ?? []}
        onClose={() => setInUse(null)}
        onOpenConstellation={onOpenConstellation}
      />
    </div>
  );
}
