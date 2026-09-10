import { Badge } from "@/app/components/ui/badge";

export function LuxiaPageReadOnlyBadge({
  label = "Read only",
  ariaLabel,
}: {
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <Badge
      variant="outline"
      className="min-h-0 h-auto px-2 py-0.5 luxia-type-caption font-normal"
      style={{
        color: "var(--luxia-text-secondary)",
        borderColor: "var(--luxia-border-subtle)",
        background: "var(--luxia-neutral-surface-subtle, transparent)",
      }}
      role="status"
      aria-label={ariaLabel ?? label}
    >
      {label}
    </Badge>
  );
}
