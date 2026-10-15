import { useEffect, useMemo, useState } from "react";
import { Minus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { documentTagTone } from "./tagTone";
import type { DocumentTagDefinition } from "./types";

/** Bulk remove: pick a tag currently assigned to at least one selected file. */
export function BulkRemoveTagButton({
  tags,
  onRemove,
}: {
  tags: readonly DocumentTagDefinition[];
  onRemove: (tag: DocumentTagDefinition) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (tags.length === 0) setOpen(false);
  }, [tags.length]);

  const sorted = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
    [tags],
  );

  if (sorted.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="compact"
          className="shrink-0"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Remove tag from selected files"
          onClick={(event) => event.stopPropagation()}
        >
          <Minus size={14} strokeWidth={2} aria-hidden className="shrink-0" />
          Remove tag
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-72 overflow-hidden p-0 bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)] rounded-[var(--luxia-radius-12)] shadow-[var(--luxia-shadow-md)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false} className="bg-transparent">
          <CommandList className="max-h-56 overflow-y-auto p-1">
            <p
              className="px-2 pb-1 pt-0.5 luxia-type-caption font-normal"
              style={{ color: "var(--luxia-text-muted)" }}
            >
              On selected files
            </p>
            {sorted.map((tag) => {
              const tone = documentTagTone(tag.color);
              return (
                <CommandItem
                  key={tag.id}
                  value={tag.id}
                  onSelect={() => {
                    onRemove(tag);
                    setOpen(false);
                  }}
                  className="rounded-[var(--luxia-radius-8)] luxia-type-body-dense"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: tone.swatch }}
                    aria-hidden
                  />
                  <span className="min-w-0 truncate">{tag.name}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
