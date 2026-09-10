import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { FilterField } from "@/app/features/home/browserShared";
import { documentTagTone } from "./tagTone";
import type { DocumentTagDefinition } from "./types";

function tagFilterValueLabel(
  selectedTagIds: readonly string[],
  untaggedSelected: boolean,
  options: readonly DocumentTagDefinition[],
): string {
  const count = selectedTagIds.length + (untaggedSelected ? 1 : 0);
  if (count === 0) return "All tags";
  if (count === 1 && untaggedSelected) return "Untagged";
  if (count === 1) {
    return options.find((tag) => tag.id === selectedTagIds[0])?.name ?? "1 selected";
  }
  return `${count} selected`;
}

export function TagMultiSelectFilter({
  options,
  hasUntagged,
  selectedTagIds,
  untaggedSelected,
  label = "Tags",
  labelVisible = true,
  ariaLabelPrefix = "Filter by tags",
  onToggleTag,
  onToggleUntagged,
  onClear,
}: {
  options: readonly DocumentTagDefinition[];
  hasUntagged: boolean;
  selectedTagIds: readonly string[];
  untaggedSelected: boolean;
  label?: string;
  labelVisible?: boolean;
  ariaLabelPrefix?: string;
  onToggleTag: (tagId: string) => void;
  onToggleUntagged: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const selectedIdSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);
  const hasActiveTagFilters = selectedTagIds.length > 0 || untaggedSelected;
  const valueLabel = tagFilterValueLabel(selectedTagIds, untaggedSelected, options);

  useEffect(() => {
    if (!open) setTagQuery("");
  }, [open]);

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [options, tagQuery]);

  const emptyCopy = options.length === 0
    ? "No tags available."
    : filteredTags.length === 0
      ? "No matching tags."
      : null;

  const control = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-full min-w-[9.5rem] max-w-[11rem] shrink-0 items-center justify-between gap-1 rounded-[8px] border px-2 outline-none hover:border-[var(--luxia-border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{
            borderColor: "var(--luxia-border-default)",
            background: "var(--luxia-surface)",
            color: "var(--luxia-text-primary)",
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${ariaLabelPrefix}: ${valueLabel}`}
        >
          <span className="min-w-0 truncate text-left luxia-type-body-dense">
            {valueLabel}
          </span>
          <ChevronDown size={14} strokeWidth={2} aria-hidden className="shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-80 overflow-hidden p-0 bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)] rounded-[var(--luxia-radius-12)] shadow-[var(--luxia-shadow-md)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const root = event.currentTarget as HTMLElement;
          window.requestAnimationFrame(() => {
            root.querySelector<HTMLInputElement>("[data-slot=command-input], input")?.focus();
          });
        }}
      >
        <Command shouldFilter={false} className="flex max-h-[min(24rem,70vh)] flex-col overflow-hidden bg-transparent">
          <CommandInput
            value={tagQuery}
            onValueChange={setTagQuery}
            placeholder="Search tags…"
            aria-label="Search tags"
          />
          <CommandList className="min-h-0 max-h-56 flex-1 overflow-y-auto">
            {emptyCopy ? (
              <p className="px-3 py-3 luxia-type-caption text-[var(--luxia-text-muted)]">
                {emptyCopy}
              </p>
            ) : (
              <CommandGroup>
                {filteredTags.map((tag) => {
                  const checked = selectedIdSet.has(tag.id);
                  const tone = documentTagTone(tag.color);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={`tag:${tag.id}`}
                      onSelect={() => onToggleTag(tag.id)}
                      onPointerDown={(event) => event.preventDefault()}
                      aria-checked={checked}
                      className="rounded-[var(--luxia-radius-8)] luxia-type-body-dense"
                    >
                      <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: tone.swatch }}
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">{tag.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            {hasUntagged ? (
              <CommandGroup className="border-t" style={{ borderColor: "var(--luxia-border-subtle)" }}>
                <CommandItem
                  value="untagged"
                  onSelect={onToggleUntagged}
                  onPointerDown={(event) => event.preventDefault()}
                  aria-checked={untaggedSelected}
                  className="rounded-[var(--luxia-radius-8)] luxia-type-body-dense"
                >
                  <Checkbox checked={untaggedSelected} tabIndex={-1} aria-hidden className="pointer-events-none" />
                  <span className="min-w-0 truncate">Untagged</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
          {hasActiveTagFilters ? (
            <div className="shrink-0 border-t" style={{ borderColor: "var(--luxia-border-subtle)" }}>
              <button
                type="button"
                className="flex w-full px-3 py-2 text-left luxia-type-body-dense outline-none hover:bg-[var(--luxia-opacity-brand-primary-08)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
                style={{ color: "var(--luxia-purple-50)", background: "transparent" }}
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Clear tag filter
              </button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (!labelVisible) return control;

  return (
    <FilterField label={label}>
      {control}
    </FilterField>
  );
}
