import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  LUXIA_DIRTY_STATE_COPY,
  LUXIA_SETTINGS_FORM_ACTIONS_CLASS,
  LUXIA_SETTINGS_ROW_DIVIDER,
} from "@/app/features/shared/luxiaSettingsUx";

/**
 * Local FORM/DRAFT Save|Cancel footer inside a Settings content frame.
 * Order: Cancel (secondary) → Save (primary, rightmost).
 * Reserved geometry: always render the row when `visible`; disable Save when clean.
 */
export function LuxiaSettingsFormActions({
  dirty,
  canSave,
  onSave,
  onCancel,
  visible = true,
  saveLabel = LUXIA_DIRTY_STATE_COPY.save,
  cancelLabel = LUXIA_DIRTY_STATE_COPY.cancel,
  leading,
}: {
  dirty: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
  visible?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  leading?: ReactNode;
}) {
  if (!visible || !canSave) return null;

  return (
    <div
      className={LUXIA_SETTINGS_FORM_ACTIONS_CLASS}
      style={LUXIA_SETTINGS_ROW_DIVIDER}
      role="group"
      aria-label="Settings form actions"
    >
      <div className="flex min-w-0 flex-1 items-center">{leading}</div>
      <div className="flex flex-nowrap items-center justify-end gap-2">
        {dirty ? (
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.secondary}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          {...LUXIA_PAGE_HEADER_ACTION.primary}
          disabled={!dirty}
          onClick={onSave}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
