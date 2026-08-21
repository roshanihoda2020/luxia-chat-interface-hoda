import type { ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import type { CollectorViewMode } from "./collectorViewMode";

interface CollectorViewToggleProps {
  value: CollectorViewMode;
  onChange: (mode: CollectorViewMode) => void;
  className?: string;
}

function ToggleButton({
  mode,
  active,
  label,
  icon,
  onSelect,
}: {
  mode: CollectorViewMode;
  active: boolean;
  label: string;
  icon: ReactNode;
  onSelect: (mode: CollectorViewMode) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={() => onSelect(mode)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
          style={{
            color: active ? "var(--luxia-purple-70)" : "var(--luxia-text-muted)",
            background: active ? "var(--luxia-opacity-brand-primary-08)" : "transparent",
            border: "none",
          }}
          onMouseEnter={(event) => {
            if (active) return;
            event.currentTarget.style.background = "var(--luxia-opacity-brand-primary-04)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = active
              ? "var(--luxia-opacity-brand-primary-08)"
              : "transparent";
          }}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function CollectorViewToggle({
  value,
  onChange,
  className = "",
}: CollectorViewToggleProps) {
  return (
    <div
      className={`inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[8px] p-0.5 ${className}`.trim()}
      role="group"
      aria-label="View mode"
      style={{
        background: "var(--luxia-surface-subtle)",
        border: "1px solid var(--luxia-border-default)",
      }}
    >
      <ToggleButton
        mode="grid"
        active={value === "grid"}
        label="Grid view"
        icon={<LayoutGrid size={15} strokeWidth={1.75} aria-hidden />}
        onSelect={onChange}
      />
      <ToggleButton
        mode="list"
        active={value === "list"}
        label="List view"
        icon={<List size={15} strokeWidth={1.75} aria-hidden />}
        onSelect={onChange}
      />
    </div>
  );
}
