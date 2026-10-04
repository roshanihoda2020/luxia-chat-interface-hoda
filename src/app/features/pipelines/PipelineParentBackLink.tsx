import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import { cn } from "@/app/components/ui/utils";

/**
 * Compact tertiary parent navigation for nested Pipeline pages.
 * Route-based (not history.back) so deep links still resolve to the real parent.
 */
export function PipelineParentBackLink({
  parentLabel,
  onNavigate,
  className,
}: {
  parentLabel: string;
  onNavigate: () => void;
  className?: string;
}) {
  const label = `Back to ${parentLabel}`;

  return (
    <Button
      type="button"
      {...LUXIA_PAGE_HEADER_ACTION.tertiary}
      className={cn(
        "-ml-1 h-auto max-w-full gap-1 px-1 py-0.5 font-normal !text-[var(--luxia-text-secondary)] hover:!bg-[var(--luxia-neutral-100)] hover:!text-[var(--luxia-text-primary)]",
        className,
      )}
      onClick={onNavigate}
      aria-label={label}
      title={label}
    >
      <ChevronLeft size={14} strokeWidth={2} aria-hidden className="shrink-0" />
      <span className="min-w-0 truncate luxia-type-caption">{label}</span>
    </Button>
  );
}
