import {
  CreateLuxiaOptionCard,
  CREATE_LUXIA_MODAL_MUTED_TEXT,
  CREATE_LUXIA_MODAL_PRIMARY_TEXT,
  CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS,
} from "@/app/components/CreateLuxiaModal";
import { Label } from "@/app/components/ui/label";
import { RadioGroup } from "@/app/components/ui/radio-group";
import type { VidgetRoutingMode } from "./types";

export const VIDGET_ROUTING_MODE_COPY = {
  sectionLabel: "Assistant selection",
  automaticTitle: "Automatic",
  automaticDescription:
    "Helios chooses the best assistant from this Vidget’s knowledge scope.",
  visitorTitle: "Visitor chooses",
  visitorDescription:
    "The visitor picks one assistant from this Vidget’s knowledge scope before chatting.",
} as const;

/**
 * Admin control for Galaxy Vidget routing mode.
 * Place directly below Knowledge scope in Create and Settings.
 */
export function VidgetAssistantSelection({
  value,
  onChange,
  disabled = false,
  variant = "modal",
  idPrefix,
}: {
  value: VidgetRoutingMode;
  onChange: (mode: VidgetRoutingMode) => void;
  disabled?: boolean;
  variant?: "modal" | "settings";
  idPrefix: string;
}) {
  const sectionClass =
    variant === "modal"
      ? CREATE_LUXIA_MODAL_SECTION_LABEL_CLASS
      : "luxia-type-overline-data mb-2 block";
  const sectionStyle =
    variant === "modal"
      ? CREATE_LUXIA_MODAL_MUTED_TEXT
      : { color: "var(--luxia-text-secondary)" };
  const helperStyle =
    variant === "modal"
      ? CREATE_LUXIA_MODAL_MUTED_TEXT
      : { color: "var(--luxia-text-muted)" };

  if (disabled) {
    const isVisitor = value === "visitor";
    return (
      <div className="space-y-2">
        <Label className={sectionClass} style={sectionStyle}>
          {VIDGET_ROUTING_MODE_COPY.sectionLabel}
        </Label>
        <p
          className="luxia-type-body-dense-strong"
          style={
            variant === "modal"
              ? CREATE_LUXIA_MODAL_PRIMARY_TEXT
              : { color: "var(--luxia-text-primary)" }
          }
        >
          {isVisitor
            ? VIDGET_ROUTING_MODE_COPY.visitorTitle
            : VIDGET_ROUTING_MODE_COPY.automaticTitle}
        </p>
        <p className="luxia-type-metadata" style={helperStyle}>
          {isVisitor
            ? VIDGET_ROUTING_MODE_COPY.visitorDescription
            : VIDGET_ROUTING_MODE_COPY.automaticDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className={sectionClass} style={sectionStyle}>
        {VIDGET_ROUTING_MODE_COPY.sectionLabel}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          if (next === "automatic" || next === "visitor") onChange(next);
        }}
        className="grid gap-2.5"
        aria-label={VIDGET_ROUTING_MODE_COPY.sectionLabel}
      >
        <CreateLuxiaOptionCard
          id={`${idPrefix}-automatic`}
          value="automatic"
          title={VIDGET_ROUTING_MODE_COPY.automaticTitle}
          description={VIDGET_ROUTING_MODE_COPY.automaticDescription}
          selected={value === "automatic"}
        />
        <CreateLuxiaOptionCard
          id={`${idPrefix}-visitor`}
          value="visitor"
          title={VIDGET_ROUTING_MODE_COPY.visitorTitle}
          description={VIDGET_ROUTING_MODE_COPY.visitorDescription}
          selected={value === "visitor"}
        />
      </RadioGroup>
    </div>
  );
}
