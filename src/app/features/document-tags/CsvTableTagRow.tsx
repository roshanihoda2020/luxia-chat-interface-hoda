import { toast } from "sonner";
import { canManageOrganizationTagDefinitions } from "@/app/features/permissions";
import { DocumentTagChip, TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import { useDataSourceTags } from "./useDataSourceTags";

export function CsvTableTagRow({
  dataSourceId,
  tableId,
  tableLabel,
  canEdit,
  currentUserId,
}: {
  dataSourceId: string;
  tableId: string;
  tableLabel: string;
  canEdit: boolean;
  currentUserId?: string;
}) {
  const {
    catalog,
    tagsForTable,
    applyTagToTables,
    createAndApplyTagToTables,
    removeTagFromTable,
    updateTag,
  } = useDataSourceTags(dataSourceId);
  const canManageDefinitions = canManageOrganizationTagDefinitions(currentUserId);
  const tags = tagsForTable(tableId);

  function handleApply(tag: DocumentTagDefinition) {
    const result = applyTagToTables([tableId], tag);
    if (result.appliedCount === 0) {
      toast.message(`“${result.tag.name}” is already on this table.`);
      return;
    }
    toast.success("Tag added.");
  }

  function handleCreate(input: { name: string; color: DocumentTagColorId }) {
    const result = createAndApplyTagToTables([tableId], input.name, input.color);
    if (result.error) return result.error;
    toast.success("Tag added.");
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = updateTag(tag.id, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  if (!canEdit && tags.length === 0) return null;

  return (
    <div className={`mt-1.5 min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
      {tags.map((tag) =>
        canEdit ? (
          <ManagedTagChip
            key={tag.id}
            tag={tag}
            className="max-w-[min(100%,12rem)]"
            removeAriaLabel={`Remove ${tag.name} from ${tableLabel}`}
            onEdit={canManageDefinitions ? (input) => handleUpdate(tag, input) : undefined}
            onRemove={() => {
              removeTagFromTable(tableId, tag.id);
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
          iconOnly={tags.length > 0}
          ariaLabel={`Add tag to ${tableLabel}`}
          searchPlaceholder="Search organization tags..."
          excludeIds={tags.map((tag) => tag.id)}
          onApply={handleApply}
          onCreate={handleCreate}
        />
      ) : null}
    </div>
  );
}
