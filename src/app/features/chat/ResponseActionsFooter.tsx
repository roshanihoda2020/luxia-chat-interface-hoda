import { Fragment, useLayoutEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Copy,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

const ICON_SIZE = 14;
const ICON_STROKE = 1.8;
const GAP_PX = 12;
const LABEL_BREAKPOINT = 540;
const DASHBOARD_LABEL_BREAKPOINT = 600;
const VERIFY_BREAKPOINT = 320;
const DASHBOARD_BREAKPOINT = 400;

type Feedback = "none" | "liked" | "disliked";

function isDashboardCompatibleOutput(content: string): boolean {
  const text = content.trim();
  if (!text) return false;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const markdownTable = lines.some((line, index) => {
    if (!line.startsWith("|") || !line.endsWith("|")) return false;
    const next = lines[index + 1];
    return Boolean(next && /^\|?\s*:?-{3,}/.test(next));
  });
  if (markdownTable) return true;

  if (/```(?:chart|vega|vegalite|plotly)/i.test(text)) return true;

  const fenced = text.match(/```[\s\S]*?```/g) ?? [];
  return fenced.some((block) => {
    const body = block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "");
    const bodyLines = body.split("\n").map((line) => line.trim()).filter(Boolean);
    return bodyLines.length >= 2 && bodyLines.every((line) => line.includes("\t") || /,\s*\S+/.test(line));
  });
}

type MenuAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect?: () => void;
  separatorBefore?: boolean;
};

function ResponseActionButton({
  icon: Icon,
  label,
  showLabel,
  active = false,
  pressed,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  showLabel: boolean;
  active?: boolean;
  pressed?: boolean;
  onClick?: () => void;
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      className="inline-flex h-7 shrink-0 items-center rounded-[var(--luxia-radius-8)] luxia-type-caption outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{
        gap: 6,
        paddingInline: showLabel ? 8 : 6,
        color: active ? "var(--luxia-brand-primary)" : "var(--luxia-text-muted)",
        background: "transparent",
        border: "none",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = "var(--luxia-opacity-brand-primary-08)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = "transparent";
      }}
      onClick={onClick}
    >
      <Icon
        size={ICON_SIZE}
        strokeWidth={ICON_STROKE}
        aria-hidden
        fill={active ? "currentColor" : "none"}
      />
      {showLabel ? <span className="whitespace-nowrap">{label}</span> : null}
    </button>
  );

  if (showLabel) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ResponseActionsFooter({
  content,
  variant = "full",
}: {
  content: string;
  variant?: "full" | "copy-only";
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState(680);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [verified, setVerified] = useState(false);
  const [addedToDashboard, setAddedToDashboard] = useState(false);
  const dashboardCompatible = isDashboardCompatibleOutput(content);

  useLayoutEffect(() => {
    const node = barRef.current;
    if (!node) return;

    const update = () => setBarWidth(node.getBoundingClientRect().width);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const showLabels = barWidth >= (dashboardCompatible ? DASHBOARD_LABEL_BREAKPOINT : LABEL_BREAKPOINT);
  const showVerify = barWidth >= VERIFY_BREAKPOINT;
  const showDashboard = dashboardCompatible && barWidth >= DASHBOARD_BREAKPOINT;

  const copyAction = { id: "copy", label: "Copy", icon: Copy, onSelect: undefined as (() => void) | undefined };
  const likeAction = {
    id: "like",
    label: "Like",
    icon: ThumbsUp,
    active: feedback === "liked",
    onSelect: () => setFeedback((current) => (current === "liked" ? "none" : "liked")),
  };
  const dislikeAction = {
    id: "dislike",
    label: "Dislike",
    icon: ThumbsDown,
    active: feedback === "disliked",
    onSelect: () => setFeedback((current) => (current === "disliked" ? "none" : "disliked")),
  };
  const verifyAction = {
    id: "verify",
    label: verified ? "Verified" : "Verify",
    icon: BadgeCheck,
    active: verified,
    onSelect: () => setVerified((current) => !current),
  };
  const dashboardAction = {
    id: "add-to-dashboard",
    label: addedToDashboard ? "Added to dashboard" : "Add to dashboard",
    icon: LayoutDashboard,
    active: addedToDashboard,
    onSelect: () => setAddedToDashboard((current) => !current),
  };
  const saveAction = {
    id: "save",
    label: "Save",
    icon: Bookmark,
    onSelect: undefined as (() => void) | undefined,
  };

  const overflowActions: MenuAction[] = [];
  if (!showVerify) overflowActions.push(verifyAction);
  if (dashboardCompatible && !showDashboard) overflowActions.push(dashboardAction);

  const secondaryActions: MenuAction[] = [
    { id: "regenerate", label: "Regenerate", icon: RefreshCw },
    { id: "share", label: "Share", icon: Share2 },
    { id: "shared-with", label: "Shared with", icon: Users },
    { id: "edit", label: "Edit", icon: Pencil },
    saveAction,
  ];

  const menuActions: MenuAction[] = [
    ...overflowActions,
    ...secondaryActions.map((action, index) => (
      overflowActions.length > 0 && index === 0
        ? { ...action, separatorBefore: true }
        : action
    )),
  ];

  return (
    <div
      ref={barRef}
      className="flex min-w-0 flex-nowrap items-center"
      style={{
        gap: GAP_PX,
        paddingTop: 10,
        paddingBottom: 10,
        paddingInline: 20,
        borderTop: "1px solid var(--luxia-border-default)",
        background: "transparent",
      }}
    >
      <div className="flex min-w-0 flex-1 flex-nowrap items-center overflow-hidden" style={{ gap: GAP_PX }}>
        <ResponseActionButton
          icon={copyAction.icon}
          label={copyAction.label}
          showLabel={showLabels}
          onClick={copyAction.onSelect}
        />
        {variant === "full" ? (
          <>
        <ResponseActionButton
          icon={likeAction.icon}
          label={likeAction.label}
          showLabel={showLabels}
          active={likeAction.active}
          pressed={likeAction.active}
          onClick={likeAction.onSelect}
        />
        <ResponseActionButton
          icon={dislikeAction.icon}
          label={dislikeAction.label}
          showLabel={showLabels}
          active={dislikeAction.active}
          pressed={dislikeAction.active}
          onClick={dislikeAction.onSelect}
        />
        {showVerify ? (
          <ResponseActionButton
            icon={verifyAction.icon}
            label={verifyAction.label}
            showLabel={showLabels}
            active={verifyAction.active}
            pressed={verified}
            onClick={verifyAction.onSelect}
          />
        ) : null}
        {showDashboard ? (
          <ResponseActionButton
            icon={dashboardAction.icon}
            label={dashboardAction.label}
            showLabel={showLabels}
            active={dashboardAction.active}
            pressed={addedToDashboard}
          onClick={dashboardAction.onSelect}
        />
        ) : null}
          </>
        ) : null}
      </div>

      {variant === "full" ? (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More response actions"
            aria-haspopup="menu"
            title="More"
            className="inline-flex h-7 shrink-0 items-center justify-center rounded-[var(--luxia-radius-8)] outline-none transition-colors appearance-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] data-[state=open]:bg-[var(--luxia-opacity-black-04)] data-[state=open]:text-[var(--luxia-text-secondary)]"
            style={{
              paddingInline: 6,
              color: "var(--luxia-text-muted)",
              background: "transparent",
              border: "none",
              boxShadow: "none",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "var(--luxia-opacity-black-08)";
              event.currentTarget.style.color = "var(--luxia-text-secondary)";
            }}
            onMouseLeave={(event) => {
              const el = event.currentTarget;
              const expanded = el.getAttribute("data-state") === "open"
                || el.getAttribute("aria-expanded") === "true";
              el.style.background = expanded
                ? "var(--luxia-opacity-black-04)"
                : "transparent";
              el.style.color = expanded
                ? "var(--luxia-text-secondary)"
                : "var(--luxia-text-muted)";
            }}
          >
            <MoreHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className="w-[220px] min-w-[220px] max-w-[240px]"
        >
          {menuActions.map((action) => (
            <Fragment key={action.id}>
              {action.separatorBefore ? <DropdownMenuSeparator className="my-1" /> : null}
              <DropdownMenuItem
                onSelect={() => action.onSelect?.()}
              >
                <action.icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
                {action.label}
              </DropdownMenuItem>
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      ) : null}
    </div>
  );
}
