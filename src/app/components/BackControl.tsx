import { ArrowLeft } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  canLuxiaGoBack,
  getLuxiaHistoryVersion,
  goLuxiaBack,
  subscribeLuxiaHistory,
} from "@/app/features/navigation/navigationHistory";

/** Re-renders on every in-app history change (push, replace, Back/Forward, settle). */
export function useLuxiaHistoryVersion(): number {
  return useSyncExternalStore(subscribeLuxiaHistory, getLuxiaHistoryVersion, () => 0);
}

/** Whether a verified previous in-app entry exists for the current entry (Global Back). */
export function useLuxiaCanGoBack(): boolean {
  useLuxiaHistoryVersion();
  return canLuxiaGoBack();
}

/**
 * Global Back: icon-only ghost button at the start of the page header's overline row.
 *
 * Returns to the ACTUAL previous in-app page with native `history.back()` — never a push, never a
 * parent fallback — so the existing routing, access checks and unsaved-change guards apply exactly
 * as for the browser's Back. Rendered only when a verified previous in-app entry exists.
 *
 * Visible 28×28. From 1024px (and on mobile) it is shifted 6px left so the arrow lines up with the
 * page title's left edge; at 768–1023px the gutter beside the sidebar toggle is too narrow, so it
 * keeps its box edge on the title edge. Hit area 32×32 on desktop; 44×44 on touch / below 768px.
 * Label and tooltip are exactly "Back".
 */
export function BackControl() {
  const label = "Back";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={goLuxiaBack}
          aria-label={label}
          data-luxia-back=""
          className={[
            "luxia-back-control relative -my-1.5 -ml-1.5 md:max-lg:ml-0 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
            "text-[var(--luxia-text-secondary)] outline-none transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-[color-mix(in_srgb,var(--luxia-purple-70)_7%,transparent)] hover:text-[var(--luxia-purple-70)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]",
            // Hit area: 32×32 desktop; 44×44 on touch / mobile, growing right and down (toward the
            // label and title text) — never left into the sidebar toggle or up into the mobile nav.
            "before:absolute before:-inset-0.5 before:content-['']",
            "pointer-coarse:before:-right-3.5 pointer-coarse:before:-bottom-3.5",
            "max-md:before:-right-3.5 max-md:before:-bottom-3.5",
          ].join(" ")}
        >
          <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
