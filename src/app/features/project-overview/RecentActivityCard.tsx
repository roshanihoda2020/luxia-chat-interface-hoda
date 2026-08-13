import {
  LuxiaChatIcon,
  LuxiaConstellationIcon,
  LuxiaDashboardIcon,
  LuxiaDatasourceIcon,
  LuxiaGalaxyIcon,
  LuxiaVirtualAssistantIcon,
  LuxiaArrowRightIcon,
} from "@/assets/icons";
import { Users } from "lucide-react";
import type { ProjectActivityItem, ProjectActivityType } from "./types";
import type { ActivityNavigationContext } from "./activityNavigation";
import { activityHasDestination } from "./activityNavigation";
import {
  ProjectModuleEmptyState,
  ProjectViewAllLink,
  PROJECT_OVERVIEW_MODULE_SHADOW,
} from "./ProjectModuleShared";

function activityIcon(type: ProjectActivityType) {
  switch (type) {
    case "chat":
      return <LuxiaChatIcon size={17} aria-hidden color="var(--luxia-purple-50)" />;
    case "constellation":
      return <LuxiaConstellationIcon size={17} aria-hidden color="var(--luxia-purple-50)" />;
    case "source":
      return <LuxiaDatasourceIcon size={17} aria-hidden color="var(--luxia-blue-60)" />;
    case "dashboard":
    case "output":
      return <LuxiaDashboardIcon size={17} aria-hidden color="var(--luxia-blue-70)" />;
    case "virtual-assistant":
    case "widget":
      return <LuxiaVirtualAssistantIcon size={17} aria-hidden color="var(--luxia-blue-70)" />;
    case "instruction":
      return <LuxiaGalaxyIcon size={17} aria-hidden color="var(--luxia-purple-50)" />;
    case "member":
      return <Users size={17} strokeWidth={1.75} aria-hidden color="var(--luxia-neutral-500, #64748B)" />;
    default:
      return <LuxiaGalaxyIcon size={17} aria-hidden color="var(--luxia-purple-50)" />;
  }
}

function activityIconShell(type: ProjectActivityType) {
  const bg =
    type === "source" || type === "dashboard" || type === "output" || type === "widget" || type === "virtual-assistant"
      ? "var(--luxia-blue-10)"
      : type === "member"
        ? "var(--luxia-neutral-100, #F1F5F9)"
        : "var(--luxia-opacity-brand-primary-08)";

  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
      style={{ background: bg }}
      aria-hidden
    >
      {activityIcon(type)}
    </span>
  );
}

interface RecentActivityCardProps {
  items: ProjectActivityItem[];
  navigationContext: ActivityNavigationContext;
  onViewAll?: () => void;
  onOpenActivity: (item: ProjectActivityItem) => void;
}

function ActivityRow({
  item,
  canNavigate,
  onOpenActivity,
  showChevron = true,
}: {
  item: ProjectActivityItem;
  canNavigate: boolean;
  onOpenActivity: (item: ProjectActivityItem) => void;
  showChevron?: boolean;
}) {
  const content = (
    <>
      {activityIconShell(item.type)}
      <span className="min-w-0 flex-1">
        <span
          className="block luxia-type-body-dense-strong"
          style={{ color: "var(--luxia-text-primary)" }}
        >
          {item.primary}
        </span>
        {item.secondary ? (
          <span
            className="mt-0.5 block luxia-type-caption"
            style={{ color: "var(--luxia-neutral-600, #475569)" }}
          >
            {item.secondary}
          </span>
        ) : null}
      </span>
      <span
        className={
          showChevron && canNavigate
            ? "flex w-[6.75rem] shrink-0 items-center justify-end gap-1.5 self-center"
            : "w-[5.5rem] shrink-0 text-right"
        }
      >
        <span
          className="luxia-type-caption tabular-nums"
          style={{ color: "var(--luxia-neutral-500, #64748B)" }}
        >
          {item.timestamp}
        </span>
        {showChevron && canNavigate ? (
          <LuxiaArrowRightIcon
            size={14}
            aria-hidden
            color="var(--luxia-neutral-500, #64748B)"
            className="opacity-70 transition-opacity group-hover:opacity-100"
          />
        ) : null}
      </span>
    </>
  );

  if (!canNavigate) {
    return (
      <div className="flex w-full min-w-0 items-center gap-2.5 px-0.5 py-2">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenActivity(item)}
      aria-label={`Open ${item.primary}`}
      className="group flex w-full min-w-0 items-center gap-2.5 px-0.5 py-2 text-left outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
    >
      {content}
    </button>
  );
}

export function RecentActivityCard({
  items,
  navigationContext,
  onViewAll,
  onOpenActivity,
}: RecentActivityCardProps) {
  const preview = items.slice(0, 5);

  return (
    <section
      className="flex min-w-0 flex-col rounded-[var(--luxia-radius-16)] border px-4 py-3.5"
      style={{
        borderColor: "var(--luxia-border-subtle)",
        boxShadow: PROJECT_OVERVIEW_MODULE_SHADOW,
        background:
          "linear-gradient(0deg, var(--luxia-opacity-blue-04), var(--luxia-opacity-blue-04)), var(--luxia-neutral-50, #F8FAFC)",
      }}
    >
      <header className="mb-2 flex items-center justify-between gap-3">
        <h2
          className="luxia-type-title-panel"
          style={{ color: "var(--luxia-neutral-700, #334155)" }}
        >
          Recent activity
        </h2>
        <ProjectViewAllLink label="View all activity" onClick={onViewAll} />
      </header>

      {preview.length === 0 ? (
        <ProjectModuleEmptyState
          title="No recent activity yet."
          description="Updates from this Project will appear here."
        />
      ) : (
        <ul
          className="min-w-0 divide-y rounded-[10px] border bg-white px-2"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          {preview.map((item) => {
            const canNavigate = activityHasDestination(item, navigationContext);
            return (
              <li key={item.id} style={{ borderColor: "var(--luxia-border-subtle)" }}>
                <ActivityRow
                  item={item}
                  canNavigate={canNavigate}
                  onOpenActivity={onOpenActivity}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export { ActivityRow };
