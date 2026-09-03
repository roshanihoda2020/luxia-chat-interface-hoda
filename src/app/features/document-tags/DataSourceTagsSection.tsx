import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { canManageOrganizationTagDefinitions } from "@/app/features/permissions";
import { LUXIA_SETTINGS_ROW_DIVIDER } from "@/app/features/shared/luxiaSettingsUx";
import { DocumentTagChip, TAG_CHIP_LIST_CLASS } from "./DocumentTagChip";
import { DocumentTagPicker } from "./DocumentTagPicker";
import { ManagedTagChip } from "./ManagedTagChip";
import type { DocumentTagColorId, DocumentTagDefinition } from "./types";
import { useDataSourceTags } from "./useDataSourceTags";

const CONTENT_ONLY_HINT = "Used by content in this Data Source";

export function DataSourceTagsSection({
  dataSourceId,
  canEdit,
  currentUserId,
}: {
  dataSourceId: string;
  canEdit: boolean;
  currentUserId?: string;
}) {
  const { footprint, catalog, applyTag, createAndApplyTag, updateTag, removeTag } = useDataSourceTags(
    dataSourceId,
  );
  const canManageDefinitions = canManageOrganizationTagDefinitions(currentUserId);
  const effectiveIds = footprint.map((item) => item.tag.id);

  function handleApply(tag: DocumentTagDefinition) {
    const result = applyTag(tag);
    if (!result.applied) {
      toast.message(`“${result.tag.name}” is already on this Data Source.`);
      return;
    }
    toast.success("Tag added.");
  }

  function handleCreate(input: { name: string; color: DocumentTagColorId }) {
    const result = createAndApplyTag(input.name, input.color);
    if (result.error) return result.error;
    toast.success("Tag added.");
    return null;
  }

  function handleUpdate(tag: DocumentTagDefinition, input: { name: string; color: DocumentTagColorId }) {
    const error = updateTag(tag.id, input);
    if (error) return error;
    toast.success("Tag updated.");
    return null;
  }

  const addSourceTag = canEdit ? (
    <DocumentTagPicker
      catalog={catalog}
      variant="secondary"
      ariaLabel="Add tag to this Data Source"
      excludeIds={effectiveIds}
      onApply={handleApply}
      onCreate={handleCreate}
    />
  ) : null;

  return (
    <section
      className="mt-4 min-w-0 border-t pt-4"
      style={LUXIA_SETTINGS_ROW_DIVIDER}
      aria-labelledby="data-source-tags-heading"
    >
      <h3
        id="data-source-tags-heading"
        className="luxia-type-title-panel"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        Tags
      </h3>
      <p
        className="mt-1 max-w-2xl luxia-type-caption"
        style={{ color: "var(--luxia-text-secondary)" }}
      >
        Organize and find this Data Source with tags.
      </p>

      {footprint.length === 0 && !canEdit ? (
        <p className="mt-3 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
          No tags assigned.
        </p>
      ) : (
        <div className={`mt-3 min-w-0 ${TAG_CHIP_LIST_CLASS}`}>
          {footprint.map((item) => {
            const { tag, direct, fromContent } = item;
            const showRemove = canEdit && direct;
            if (showRemove) {
              return (
                <ManagedTagChip
                  key={tag.id}
                  tag={tag}
                  className="max-w-[min(100%,16rem)]"
                  removeAriaLabel={`Remove ${tag.name} from this Data Source`}
                  onEdit={canManageDefinitions ? (input) => handleUpdate(tag, input) : undefined}
                  onRemove={() => {
                    removeTag(tag.id);
                    toast.message(`Removed “${tag.name}”.`);
                  }}
                />
              );
            }
            const chip = (
              <DocumentTagChip key={tag.id} tag={tag} className="max-w-[min(100%,16rem)]" />
            );
            if (!fromContent || direct) return chip;
            return (
              <Tooltip key={tag.id}>
                <TooltipTrigger asChild>
                  <span className="inline-flex min-w-0 max-w-[min(100%,16rem)]">
                    <DocumentTagChip tag={tag} className="max-w-full" />
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>{CONTENT_ONLY_HINT}</TooltipContent>
              </Tooltip>
            );
          })}
          {addSourceTag}
        </div>
      )}
    </section>
  );
}
