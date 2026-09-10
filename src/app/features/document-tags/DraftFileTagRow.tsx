import { DraftContentTagRow } from "./DraftContentTagRow";
import type { DraftDataSourceTagsApi } from "./useDataSourceTags";

export function DraftFileTagRow({
  fileName,
  draft,
}: {
  fileName: string;
  draft: DraftDataSourceTagsApi;
}) {
  const fileTags = draft.tagsForFileName(fileName);

  return (
    <DraftContentTagRow
      tags={fileTags}
      catalog={draft.catalog}
      canEditDefinition={(tagId) => draft.isDraftCreated(tagId)}
      alreadyAssignedMessage={(name) => `“${name}” is already on this file.`}
      addAriaLabel={`Add tag to ${fileName}`}
      removeAriaLabel={(name) => `Remove ${name} from ${fileName}`}
      onApply={(tag) => draft.applyTagToFiles([fileName], tag)}
      onCreate={(input) => draft.createAndApplyTagToFiles([fileName], input.name, input.color)}
      onUpdate={(tag, input) => draft.updateTag(tag.id, input)}
      onRemove={(tagId) => draft.removeTagFromFile(fileName, tagId)}
    />
  );
}
