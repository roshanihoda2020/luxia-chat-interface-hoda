import { DraftContentTagRow } from "./DraftContentTagRow";
import type { DraftDataSourceTagsApi } from "./useDataSourceTags";

export function DraftTableTagRow({
  tableId,
  tableLabel,
  draft,
}: {
  tableId: string;
  tableLabel: string;
  draft: DraftDataSourceTagsApi;
}) {
  const tags = draft.tagsForTable(tableId);

  return (
    <DraftContentTagRow
      tags={tags}
      catalog={draft.catalog}
      canEditDefinition={(tagId) => draft.isDraftCreated(tagId)}
      alreadyAssignedMessage={(name) => `“${name}” is already on this table.`}
      addAriaLabel={`Add tag to ${tableLabel}`}
      removeAriaLabel={(name) => `Remove ${name} from ${tableLabel}`}
      onApply={(tag) => draft.applyTagToTables([tableId], tag)}
      onCreate={(input) => draft.createAndApplyTagToTables([tableId], input.name, input.color)}
      onUpdate={(tag, input) => draft.updateTag(tag.id, input)}
      onRemove={(tagId) => draft.removeTagFromTable(tableId, tagId)}
    />
  );
}
