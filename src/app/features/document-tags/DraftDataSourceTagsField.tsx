import { toast } from "sonner";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import { TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import type { DraftDataSourceTagsApi } from "./useDataSourceTags";

export function DraftDataSourceTagsField({
  draft,
  title = "Data Source tags",
}: {
  draft: DraftDataSourceTagsApi;
  title?: string;
}) {
  function handleApply(tag: DocumentTagDefinition) {
    const result = draft.applyTag(tag);
    if (!result.applied) {
      toast.message(`“${result.tag.name}” is already on this Data Source.`);
      return;
    }
    toast.success("Tag added.");
  }

  function handleCreate(input: { name: string; color: DocumentTagColorId }) {
    const result = draft.createAndApplyTag(input.name, input.color);
    if (result.error) return result.error;
    toast.success("Tag added.");
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = draft.updateTag(tag.id, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  const addTag = (
    <DocumentTagPicker
      catalog={draft.catalog}
      variant="secondary"
      iconOnly={draft.tags.length > 0}
      ariaLabel="Add tag to this Data Source"
      searchPlaceholder="Search organization tags..."
      excludeIds={draft.tags.map((tag) => tag.id)}
      onApply={handleApply}
      onCreate={handleCreate}
    />
  );

  return (
    <div className="min-w-0">
      <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
        {title}
        <span className="font-normal"> · Optional</span>
      </p>
      <div className={`mt-1.5 min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
        {draft.tags.map((tag) => (
          <ManagedTagChip
            key={tag.id}
            tag={tag}
            className="max-w-[min(100%,12rem)]"
            removeAriaLabel={`Remove ${tag.name} from this Data Source`}
            onEdit={draft.isDraftCreated(tag.id) ? (input) => handleUpdate(tag, input) : undefined}
            onRemove={() => {
              draft.removeTag(tag.id);
              toast.message(`Removed “${tag.name}”.`);
            }}
          />
        ))}
        {addTag}
      </div>
    </div>
  );
}
