import { toast } from "sonner";
import { cn } from "@/app/components/ui/utils";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import { TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import type { DraftDataSourceTagsApi } from "./useDataSourceTags";

export function DraftDataSourceTagsField({
  draft,
  title = "Data Source tags",
  labeledAdd = false,
  quiet = false,
  titleClassName,
  addTriggerClassName,
  listClassName,
  chipClassName = "max-w-[min(100%,12rem)]",
}: {
  draft: DraftDataSourceTagsApi;
  title?: string;
  /** Keep the “Add tag” label after chips exist. */
  labeledAdd?: boolean;
  /** Skip add/remove toasts. The chip itself is the feedback. */
  quiet?: boolean;
  titleClassName?: string;
  addTriggerClassName?: string;
  listClassName?: string;
  chipClassName?: string;
}) {
  function handleApply(tag: DocumentTagDefinition) {
    const result = draft.applyTag(tag);
    if (!result.applied) {
      toast.message(`“${result.tag.name}” is already on this Data Source.`);
      return;
    }
    if (!quiet) toast.success("Tag added.");
  }

  function handleCreate(input: { name: string; color: DocumentTagColorId }) {
    const result = draft.createAndApplyTag(input.name, input.color);
    if (result.error) return result.error;
    if (!quiet) toast.success("Tag added.");
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
      iconOnly={!labeledAdd && draft.tags.length > 0}
      ariaLabel="Add tag to this Data Source"
      searchPlaceholder="Search organization tags..."
      excludeIds={draft.tags.map((tag) => tag.id)}
      triggerClassName={addTriggerClassName}
      onApply={handleApply}
      onCreate={handleCreate}
    />
  );

  return (
    <div className="min-w-0">
      <p
        className={titleClassName ?? "luxia-type-caption"}
        style={titleClassName ? undefined : { color: "var(--luxia-text-muted)" }}
      >
        {title}
        <span className="font-normal"> · Optional</span>
      </p>
      <div className={cn("mt-1.5 min-w-0", TAG_CHIP_LIST_CLASS, listClassName)}>
        {draft.tags.map((tag) => (
          <ManagedTagChip
            key={tag.id}
            tag={tag}
            className={chipClassName}
            removeAriaLabel={`Remove ${tag.name} from this Data Source`}
            onEdit={draft.isDraftCreated(tag.id) ? (input) => handleUpdate(tag, input) : undefined}
            onRemove={() => {
              draft.removeTag(tag.id);
              if (!quiet) toast.message(`Removed “${tag.name}”.`);
            }}
          />
        ))}
        {addTag}
      </div>
    </div>
  );
}
