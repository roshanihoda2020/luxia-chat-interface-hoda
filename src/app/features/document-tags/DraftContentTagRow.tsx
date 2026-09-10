import { toast } from "sonner";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import { TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";

export function DraftContentTagRow({
  tags,
  catalog,
  canEditDefinition,
  alreadyAssignedMessage,
  addAriaLabel,
  removeAriaLabel,
  onApply,
  onCreate,
  onUpdate,
  onRemove,
}: {
  tags: readonly DocumentTagDefinition[];
  catalog: readonly DocumentTagDefinition[];
  canEditDefinition: (tagId: string) => boolean;
  alreadyAssignedMessage: (tagName: string) => string;
  addAriaLabel: string;
  removeAriaLabel: (tagName: string) => string;
  onApply: (tag: DocumentTagDefinition) => { tag: DocumentTagDefinition; appliedCount: number };
  onCreate: (input: { name: string; color: DocumentTagColorId }) => {
    error: string | null;
    tag: DocumentTagDefinition | null;
    appliedCount: number;
  };
  onUpdate: (tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) => string | null;
  onRemove: (tagId: string) => void;
}) {
  function handleApply(tag: DocumentTagDefinition) {
    const result = onApply(tag);
    if (result.appliedCount === 0) {
      toast.message(alreadyAssignedMessage(result.tag.name));
      return;
    }
    toast.success("Tag added.");
  }

  function handleCreate(input: { name: string; color: DocumentTagColorId }) {
    const result = onCreate(input);
    if (result.error) return result.error;
    toast.success("Tag added.");
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = onUpdate(tag, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  return (
    <div className={`mt-1.5 min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
      {tags.map((tag) => (
        <ManagedTagChip
          key={tag.id}
          tag={tag}
          className="max-w-[min(100%,12rem)]"
          removeAriaLabel={removeAriaLabel(tag.name)}
          onEdit={canEditDefinition(tag.id) ? (input) => handleUpdate(tag, input) : undefined}
          onRemove={() => {
            onRemove(tag.id);
            toast.message(`Removed “${tag.name}”.`);
          }}
        />
      ))}
      <DocumentTagPicker
        catalog={catalog}
        variant="secondary"
        iconOnly={tags.length > 0}
        ariaLabel={addAriaLabel}
        searchPlaceholder="Search organization tags..."
        excludeIds={tags.map((tag) => tag.id)}
        onApply={handleApply}
        onCreate={handleCreate}
      />
    </div>
  );
}
