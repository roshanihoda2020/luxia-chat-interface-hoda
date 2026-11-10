import { LayoutGrid } from "lucide-react";
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
}

/** Home header. Starting a Chat lives in the Start panel below it, so the header keeps New Project and Customize Home. */
export function HomeHeader({ userName, onNewProject, onCustomize, customizing, firstVisit = false }: HomeHeaderProps) {
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
          <LuxiaPageContext>Ask questions about your organisation's documents and data.</LuxiaPageContext>
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
        // Between sm and lg the title shares its row with the actions, so this one shows its icon only.
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
              <span className="sm:max-lg:sr-only">Customize Home</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden sm:max-lg:block">Customize Home</TooltipContent>
        </Tooltip>
      }
    />
  );
}
