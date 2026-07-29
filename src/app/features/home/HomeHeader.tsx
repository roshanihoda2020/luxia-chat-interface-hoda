import { Button } from "@/app/components/ui/button";

interface HomeHeaderProps {
  onNewChat: () => void;
  onNewProject: () => void;
}

export function HomeHeader({ onNewChat, onNewProject }: HomeHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1
          className="mb-1 luxia-type-title-page"
          style={{ color: "var(--luxia-purple-70)", letterSpacing: "-0.025em" }}
        >
          Welcome back, User name
        </h1>
        <p className="luxia-type-body-small" style={{ color: "var(--luxia-text-secondary)" }}>
          Your most important work, ready to continue.
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">
        <Button type="button" variant="primary" onClick={onNewChat}>
          New Chat
        </Button>
        <Button type="button" variant="outline" onClick={onNewProject}>
          New Project
        </Button>
      </div>
    </header>
  );
}
