import { LayoutGrid } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import {
  LuxiaPageContext,
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";

interface HomeHeaderProps {
  onNewChat: () => void;
  onNewProject: () => void;
  onCustomize: () => void;
  /** Customize mode is on (its toolbar shows below the header). */
  customizing: boolean;
}

export function HomeHeader({ onNewChat, onNewProject, onCustomize, customizing }: HomeHeaderProps) {
  return (
    <LuxiaPageHeader
      contentGap="page"
      pageTypeLabel="HOME"
      title="Welcome back, User name"
      titleStyle={{ color: "var(--luxia-purple-70)", letterSpacing: "-0.025em" }}
      context={
        <LuxiaPageContext>
          Your most important work, ready to continue.
        </LuxiaPageContext>
      }
      secondaryAction={
        <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.secondary} onClick={onNewProject}>
          New Project
        </Button>
      }
      primaryAction={
        <Button type="button" {...LUXIA_PAGE_HEADER_ACTION.primary} onClick={onNewChat}>
          New Chat
        </Button>
      }
      actions={
        // Between sm and lg the title shares its row with three actions, so this one shows its icon only.
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
