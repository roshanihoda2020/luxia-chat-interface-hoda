import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import {
  CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS,
  CREATE_LUXIA_MODAL_MUTED_TEXT,
  CREATE_LUXIA_MODAL_PRIMARY_TEXT,
} from "@/app/components/CreateLuxiaModal";

export type KnowledgeScopeConstellation = {
  id: string;
  name: string;
  type?: string;
  /** When false, show as unavailable but keep visible if previously selected. */
  available?: boolean;
};

export function KnowledgeScopeSelector({
  constellations,
  selectedIds,
  onChange,
  disabled = false,
  idPrefix,
  variant = "modal",
}: {
  constellations: KnowledgeScopeConstellation[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  idPrefix: string;
  variant?: "modal" | "settings";
}) {
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    if (disabled) return;
    if (selected.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  function selectAll() {
    if (disabled) return;
    onChange(constellations.filter((item) => item.available !== false).map((item) => item.id));
  }

  function clearAll() {
    if (disabled) return;
    onChange([]);
  }

  const labelClass =
    variant === "modal" ? CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS : "luxia-type-label-form mb-2 block";
  const titleStyle =
    variant === "modal" ? CREATE_LUXIA_MODAL_PRIMARY_TEXT : { color: "var(--luxia-text-primary)" };
  const mutedStyle =
    variant === "modal" ? CREATE_LUXIA_MODAL_MUTED_TEXT : { color: "var(--luxia-text-muted)" };

  if (constellations.length === 0) {
    return (
      <p className="luxia-type-metadata" style={mutedStyle}>
        No Constellations in this Project.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className={labelClass} style={titleStyle}>
          Knowledge scope
        </Label>
        <p className="luxia-type-metadata" style={mutedStyle}>
          Select the Constellations this Vidget can use.
        </p>
      </div>

      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="luxia-type-caption rounded-[8px] px-2.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              color: "var(--luxia-text-secondary)",
              border: "1px solid var(--luxia-settings-row-divider)",
              background: "var(--luxia-surface-subtle)",
            }}
            onClick={selectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="luxia-type-caption rounded-[8px] px-2.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
            style={{
              color: "var(--luxia-text-secondary)",
              border: "1px solid var(--luxia-settings-row-divider)",
              background: "var(--luxia-surface-subtle)",
            }}
            onClick={clearAll}
          >
            Clear
          </button>
        </div>
      ) : null}

      <ul className="grid gap-2.5" role="list">
        {constellations.map((item) => {
          const checked = selected.has(item.id);
          const unavailable = item.available === false;
          const fieldId = `${idPrefix}-${item.id}`;
          return (
            <li key={item.id}>
              <label
                htmlFor={fieldId}
                className="flex cursor-pointer items-start gap-3 rounded-[12px] border px-3.5 py-3 transition-[border-color,background-color,box-shadow] outline-none"
                style={{
                  borderColor: checked
                    ? "var(--luxia-purple-40, #9b8afb)"
                    : "var(--luxia-settings-row-divider)",
                  background: checked
                    ? "var(--luxia-surface-subtle)"
                    : "var(--luxia-surface-default, #fff)",
                  boxShadow: checked ? "0 0 0 3px rgba(91, 63, 166, 0.08)" : "none",
                  opacity: unavailable && !checked ? 0.72 : 1,
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                <Checkbox
                  id={fieldId}
                  checked={checked}
                  disabled={disabled || (unavailable && !checked)}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-0.5"
                  aria-label={item.name}
                />
                <span className="min-w-0">
                  <span
                    className="block luxia-type-body-dense-strong leading-5"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {item.name}
                    {unavailable ? (
                      <span
                        className="ml-2 luxia-type-caption"
                        style={{ color: "var(--luxia-text-muted)" }}
                      >
                        — unavailable
                      </span>
                    ) : null}
                  </span>
                  {item.type ? (
                    <span
                      className="mt-0.5 block luxia-type-caption leading-4"
                      style={{ color: "var(--luxia-text-muted)" }}
                    >
                      {item.type}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
