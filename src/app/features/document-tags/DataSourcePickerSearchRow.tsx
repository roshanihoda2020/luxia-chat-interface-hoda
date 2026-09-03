import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { HS } from "@/app/features/home/homeSurfaces";
import { TagMultiSelectFilter } from "./TagMultiSelectFilter";
import type { DocumentTagDefinition } from "./types";

export function DataSourcePickerSearchRow({
  query,
  onQueryChange,
  placeholder = "Search Data Sources...",
  searchAriaLabel = "Search Data Sources",
  tagOptions,
  hasUntagged,
  selectedTagIds,
  untaggedSelected,
  onToggleTag,
  onToggleUntagged,
  onClearTags,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  searchAriaLabel?: string;
  tagOptions: readonly DocumentTagDefinition[];
  hasUntagged: boolean;
  selectedTagIds: readonly string[];
  untaggedSelected: boolean;
  onToggleTag: (tagId: string) => void;
  onToggleUntagged: () => void;
  onClearTags: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-end gap-2">
      <label className="block min-w-0 flex-1">
        <span className="sr-only">{searchAriaLabel}</span>
        <div className="relative">
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--luxia-text-muted)" }}
          />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            aria-label={searchAriaLabel}
            className="h-10 w-full pl-9"
            style={{
              background: HS.searchBg,
              borderColor: HS.searchBorder,
            }}
          />
        </div>
      </label>
      <TagMultiSelectFilter
        options={tagOptions}
        hasUntagged={hasUntagged}
        selectedTagIds={selectedTagIds}
        untaggedSelected={untaggedSelected}
        onToggleTag={onToggleTag}
        onToggleUntagged={onToggleUntagged}
        onClear={onClearTags}
      />
    </div>
  );
}
