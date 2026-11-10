import { LayoutGrid, ListChecks } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  LuxiaPageContext,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";

interface HomeHeaderProps {
  /** The signed-in user's display name, from application data. */
  userName?: string;
  /** Omitted when the user may not create Projects. */
  onNewProject?: () => void;
  onCustomize: () => void;
  /** Customize mode is on (its toolbar shows below the header). */
  customizing: boolean;
  /** First time this user opens Home: welcome them and say what Luxia is for. */
  firstVisit?: boolean;
  /** While setup is unfinished: jumps to the Get started checklist. */
  getStarted?: { done: number; total: number; onClick: () => void };
}

/** Home header. Starting a Chat lives in the Start panel below it, so the header keeps New Project and Customize Home. */
export function HomeHeader({ userName, onNewProject, onCustomize, customizing, firstVisit = false, getStarted }: HomeHeaderProps) {
  const greeting = firstVisit ? "Welcome to Luxia" : "Welcome back";
  return (
    <LuxiaPageHeader
      contentGap="page"
      className="luxia-home-header"
      pageTypeLabel="HOME"
      title={userName ? `${greeting}, ${userName}` : greeting}
      titleStyle={{ color: "var(--luxia-purple-70)", letterSpacing: "-0.025em" }}
      context={
        firstVisit ? (
          <LuxiaPageContext>Ask Luxia AI for guidance, discover what Luxia can do and start building your workspace.</LuxiaPageContext>
        ) : undefined
      }
      secondaryAction={
        onNewProject ? (
          <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={onNewProject}>
            New Project
          </Button>
        ) : undefined
      }
      actions={
        <>
        {getStarted ? (
          <Button
            type="button"
            {...LUXIA_PAGE_HEADER_ACTION.secondary}
            onClick={getStarted.onClick}
            aria-label={`Get started: ${getStarted.done} of ${getStarted.total} steps done. Go to the checklist`}
            data-home-get-started-entry=""
            className="luxia-home-touch-target"
          >
            <ListChecks size={16} strokeWidth={2} aria-hidden />
            Get started
            <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>{`${getStarted.done}/${getStarted.total}`}</span>
          </Button>
        ) : null}
        {/* Where the actions share a narrow row, this one shows its icon and a tooltip. */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              {...LUXIA_PAGE_HEADER_ACTION.tertiary}
              onClick={onCustomize}
              aria-pressed={customizing}
              aria-label="Customize Home"
              data-home-customize-entry=""
              className="luxia-home-customize-entry luxia-home-touch-target"
            >
              <LayoutGrid size={16} strokeWidth={2} aria-hidden />
              <span className={getStarted ? "max-lg:sr-only" : "sm:max-lg:sr-only"}>Customize Home</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className={getStarted ? "lg:hidden" : "hidden sm:max-lg:block"}>Customize Home</TooltipContent>
        </Tooltip>
        </>
      }
    />
  );
}
