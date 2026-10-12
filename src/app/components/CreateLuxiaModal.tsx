import { useEffect, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { LX } from "@/app/features/active-data-tables/luxiaTokens";
import { RadioGroupItem } from "@/app/components/ui/radio-group";
import {
  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
  STRUCTURED_MODAL_DARK_CHROME_STYLE,
} from "@/app/features/shared/structuredModalChrome";
import { cn } from "@/app/components/ui/utils";

export function CreateLuxiaModalShell({
  open,
  onClose,
  titleId,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector("[data-searchable-select-open='true']")) return;
      onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(16,5,32,0.35)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        className="relative flex w-full max-w-[500px] flex-col overflow-hidden rounded-[20px]"
        style={{
          maxHeight: "min(88vh, 760px)",
          background: "white",
          boxShadow: LX.shadow.dialog,
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className="flex flex-shrink-0 items-start justify-between px-7 pt-5 pb-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <div className="min-w-0 pr-4">
            <h2
              id={titleId}
              className="luxia-type-title-modal mb-1 text-[var(--luxia-text-inverse)]"
            >
              {title}
            </h2>
            <div className="luxia-type-body-dense text-[var(--luxia-purple-10)]">
              {description}
            </div>
          </div>
          <CreateLuxiaModalCloseButton
            onClose={onClose}
            ariaLabel="Close create vidget dialog"
          />
        </div>

        <div className="luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical min-h-0 flex-1 space-y-5 overflow-y-auto px-7 pb-5">
          {children}
        </div>

        {footer}
      </div>
    </div>,
    document.body,
  );
}

export function CreateLuxiaModalCloseButton({
  onClose,
  ariaLabel,
}: {
  onClose: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-opacity outline-none",
        LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
      )}
      aria-label={ariaLabel}
    >
      <X size={13} />
    </button>
  );
}

export function CreateLuxiaModalFooter({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-end gap-2.5 px-7 py-4"
      style={{ borderTop: `1px solid ${LX.border}` }}
    >
      {children}
    </div>
  );
}

export function CreateLuxiaOptionCard({
  id,
  value,
  title,
  description,
  selected,
}: {
  id: string;
  value: string;
  title: string;
  description: string;
  selected: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[12px] border px-3.5 py-3 transition-[border-color,background-color,box-shadow] outline-none"
      style={{
        borderColor: selected ? LX.secondary : LX.border,
        background: selected ? LX.state.secondary08 : LX.surface,
        boxShadow: selected ? `0 0 0 3px ${LX.state.secondary04}` : "none",
      }}
    >
      <RadioGroupItem id={id} value={value} className="mt-0.5" aria-label={title} />
      <span className="min-w-0">
        <span
          className="block luxia-type-body-dense-strong leading-5"
          style={{ color: LX.primary }}
        >
          {title}
        </span>
        <span
          className="mt-0.5 block luxia-type-caption leading-4"
          style={{ color: LX.textMuted }}
        >
          {description}
        </span>
      </span>
    </label>
  );
}

export const CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS =
  "mb-2 block luxia-type-overline-form";

export const CREATE_LUXIA_MODAL_FIELD_LABEL_CLASS =
  "mb-2 block luxia-type-label-form";

export const CREATE_LUXIA_MODAL_MUTED_TEXT = { color: LX.textMuted } as const;

export const CREATE_LUXIA_MODAL_PRIMARY_TEXT = { color: LX.primary } as const;
