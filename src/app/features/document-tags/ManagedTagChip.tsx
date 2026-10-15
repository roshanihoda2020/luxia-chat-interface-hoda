import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/app/components/ui/utils";
import {
  TAG_CHIP_NAME_BUTTON_CLASS,
  TAG_CHIP_REMOVE_CLASS,
  TAG_CHIP_SHELL_CLASS,
  tagChipToneStyle,
} from "./DocumentTagChip";
import { TagDefinitionForm } from "./TagDefinitionForm";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";

export function ManagedTagChip({
  tag,
  className,
  removeAriaLabel,
  onEdit,
  onActivate,
  onRemove,
}: {
  tag: DocumentTagDefinition;
  className?: string;
  removeAriaLabel: string;
  onEdit?: (input: { name: string; color: DocumentTagColorId }) => string | null;
  /** When edit is unavailable, optional filter/activate action on the name. */
  onActivate?: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn(TAG_CHIP_SHELL_CLASS, className)}
      style={tagChipToneStyle(tag)}
    >
      {onEdit ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={TAG_CHIP_NAME_BUTTON_CLASS}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={`Edit tag ${tag.name}`}
              onClick={(event) => event.stopPropagation()}
            >
              {tag.name}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            className="w-72 p-0 bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)] rounded-[var(--luxia-radius-12)] shadow-[var(--luxia-shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            <TagDefinitionForm
              title="Edit tag"
              initialName={tag.name}
              initialColor={tag.color}
              submitLabel="Save"
              onCancel={() => setOpen(false)}
              onSubmit={(name, color) => {
                const error = onEdit({ name, color });
                if (error) return error;
                setOpen(false);
                return null;
              }}
            />
          </PopoverContent>
        </Popover>
      ) : onActivate ? (
        <button
          type="button"
          className={TAG_CHIP_NAME_BUTTON_CLASS}
          aria-label={`Filter by ${tag.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onActivate();
          }}
        >
          {tag.name}
        </button>
      ) : (
        <span className={TAG_CHIP_NAME_BUTTON_CLASS}>{tag.name}</span>
      )}
      <button
        type="button"
        className={TAG_CHIP_REMOVE_CLASS}
        aria-label={removeAriaLabel}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
      >
        ×
      </button>
    </span>
  );
}
