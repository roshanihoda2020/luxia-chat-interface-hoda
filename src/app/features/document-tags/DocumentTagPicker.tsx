import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { TagDefinitionForm } from "./TagDefinitionForm";
import { normalizeTag, tagsEqual } from "./model";
import { countTagUsage, formatTagUsageSummary } from "./persistence";
import { documentTagTone, suggestTagColor } from "./tagTone";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import { useDataSourceTagStore } from "./useDataSourceTags";

function pickerEmptyCopy(input: {
  query: string;
  allCount: number;
  availableCount: number;
  filteredCount: number;
}): string | null {
  if (input.filteredCount > 0) return null;
  if (input.query.trim()) return "No matching tags.";
  if (input.allCount === 0) return "No tags created yet.";
  if (input.availableCount === 0) return "All available tags are already added.";
  return "No matching tags.";
}

const CREATE_ITEM_CLASS =
  "rounded-[var(--luxia-radius-8)] luxia-type-body-dense bg-transparent text-[var(--luxia-purple-50)] data-[selected=true]:bg-[var(--luxia-opacity-brand-primary-08)] data-[selected=true]:text-[var(--luxia-purple-50)]";

export function DocumentTagPicker({
  catalog,
  align = "start",
  variant = "secondary",
  ariaLabel = "Add tag",
  searchPlaceholder = "Search tags…",
  excludeIds,
  iconOnly = false,
  onApply,
  onCreate,
}: {
  catalog: readonly DocumentTagDefinition[];
  align?: "start" | "end";
  variant?: "secondary" | "tertiary";
  ariaLabel?: string;
  searchPlaceholder?: string;
  excludeIds?: readonly string[];
  iconOnly?: boolean;
  onApply: (tag: DocumentTagDefinition) => void;
  onCreate: (input: { name: string; color: DocumentTagColorId }) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const store = useDataSourceTagStore();
  void store;

  useEffect(() => {
    if (!open) {
      setQuery("");
      setCreating(false);
    }
  }, [open]);

  const allTagDefinitions = catalog;
  const usageByTagId = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of allTagDefinitions) {
      const summary = formatTagUsageSummary(countTagUsage(tag.id));
      if (summary) map.set(tag.id, summary);
    }
    return map;
  }, [allTagDefinitions, store]);
  const assignedTagIds = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const availableTagDefinitions = useMemo(
    () => allTagDefinitions.filter((tag) => !assignedTagIds.has(tag.id)),
    [allTagDefinitions, assignedTagIds],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableTagDefinitions;
    return availableTagDefinitions.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [availableTagDefinitions, query]);

  const normalized = normalizeTag(query);
  const canCreateNamed = Boolean(
    normalized && !allTagDefinitions.some((tag) => tagsEqual(tag.name, normalized)),
  );
  const draftColor = suggestTagColor(normalized ?? query);
  const emptyCopy = pickerEmptyCopy({
    query,
    allCount: allTagDefinitions.length,
    availableCount: availableTagDefinitions.length,
    filteredCount: filtered.length,
  });
  const createLabel = canCreateNamed ? `Create “${normalized}”` : "Create new tag";

  function apply(tag: DocumentTagDefinition) {
    onApply(tag);
    setOpen(false);
  }

  function returnToPicker() {
    setCreating(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={iconOnly ? "iconCompact" : "compact"}
          className="shrink-0"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
        >
          <Plus size={14} strokeWidth={2} aria-hidden className="shrink-0" />
          {iconOnly ? null : "Add tag"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={4}
        className="w-80 overflow-hidden p-0 bg-[var(--luxia-surface-floating)] text-[var(--luxia-text-primary)] border-[var(--luxia-border-default)] rounded-[var(--luxia-radius-12)] shadow-[var(--luxia-shadow-md)]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const root = event.currentTarget as HTMLElement;
          window.requestAnimationFrame(() => {
            root.querySelector<HTMLInputElement>("[data-slot=command-input], input")?.focus();
          });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && creating) {
            event.preventDefault();
            event.stopPropagation();
            returnToPicker();
          }
        }}
      >
        {creating ? (
          <TagDefinitionForm
            title="Create tag"
            initialName={normalized ?? ""}
            initialColor={draftColor}
            submitLabel="Create"
            namePlaceholder="Tag name"
            actionsSpread
            onCancel={returnToPicker}
            onSubmit={(name, color) => {
              const error = onCreate({ name, color });
              if (error) return error;
              setOpen(false);
              return null;
            }}
          />
        ) : (
          <Command shouldFilter={false} className="flex max-h-[min(24rem,70vh)] flex-col overflow-hidden bg-transparent">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              aria-label="Search tags"
            />
            <CommandList className="max-h-none shrink-0 overflow-visible">
              <div
                className="border-b p-1"
                style={{ borderColor: "var(--luxia-border-subtle)" }}
              >
                <CommandItem
                  value="create-new-tag"
                  onSelect={() => setCreating(true)}
                  className={CREATE_ITEM_CLASS}
                >
                  <Plus size={14} strokeWidth={2} aria-hidden className="shrink-0" />
                  {createLabel}
                </CommandItem>
              </div>
            </CommandList>
            <CommandList className="min-h-0 max-h-56 flex-1 overflow-y-auto">
              {emptyCopy ? (
                <p className="px-3 py-2.5 luxia-type-caption text-[var(--luxia-text-muted)]">
                  {emptyCopy}
                </p>
              ) : (
                <div className="p-1">
                  <p
                    className="px-2 pb-1 pt-0.5 luxia-type-caption font-normal"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Available tags
                  </p>
                  {filtered.map((tag) => {
                    const tone = documentTagTone(tag.color);
                    const usage = usageByTagId.get(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.id}
                        onSelect={() => apply(tag)}
                        className="rounded-[var(--luxia-radius-8)] luxia-type-body-dense"
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: tone.swatch }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate">{tag.name}</span>
                        {usage ? (
                          <span
                            className="ml-2 shrink-0 luxia-type-caption"
                            style={{ color: "var(--luxia-text-muted)" }}
                          >
                            {usage}
                          </span>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </div>
              )}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
