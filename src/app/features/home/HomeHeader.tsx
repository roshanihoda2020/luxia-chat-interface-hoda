import { Button } from "@/app/components/ui/button";
import {
  LuxiaPageHeader,
  LUXIA_PAGE_HEADER_ACTION,
} from "@/app/components/LuxiaPageHeader";

interface HomeHeaderProps {
  onNewChat: () => void;
  onNewProject: () => void;
}

export function HomeHeader({ onNewChat, onNewProject }: HomeHeaderProps) {
  return (
    <LuxiaPageHeader
      contentGap="page"
      pageTypeLabel="HOME"
      title="Welcome back, User name"
      titleStyle={{ color: "var(--luxia-purple-70)", letterSpacing: "-0.025em" }}
      guide="Your most important work, ready to continue."
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
    />
  );
}
