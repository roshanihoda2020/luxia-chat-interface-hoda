import { DraftContentTagRow } from "./DraftContentTagRow";
import type { DraftDataSourceTagsApi } from "./useDataSourceTags";

export function DraftFileTagRow({
  fileName,
  assignmentKey = fileName,
  draft,
}: {
  fileName: string;
  /** Draft assignment key. A localDocumentId when the draft commits document assignments. */
  assignmentKey?: string;
  draft: DraftDataSourceTagsApi;
}) {
  const fileTags = draft.tagsForFileName(assignmentKey);

  return (
    <DraftContentTagRow
      tags={fileTags}
      catalog={draft.catalog}
      canEditDefinition={(tagId) => draft.isDraftCreated(tagId)}
      alreadyAssignedMessage={(name) => `“${name}” is already on this file.`}
      addAriaLabel={`Add tag to ${fileName}`}
      removeAriaLabel={(name) => `Remove ${name} from ${fileName}`}
      onApply={(tag) => draft.applyTagToFiles([assignmentKey], tag)}
      onCreate={(input) => draft.createAndApplyTagToFiles([assignmentKey], input.name, input.color)}
      onUpdate={(tag, input) => draft.updateTag(tag.id, input)}
      onRemove={(tagId) => draft.removeTagFromFile(assignmentKey, tagId)}
    />
  );
}
