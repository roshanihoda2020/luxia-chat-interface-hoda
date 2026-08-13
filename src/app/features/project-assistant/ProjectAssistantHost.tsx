import { useEffect, useState } from "react";
import { ProjectAssistantLauncher } from "./ProjectAssistantLauncher";
import { ProjectAssistantPanel } from "./ProjectAssistantPanel";
import type {
  ProjectAssistantConstellationRef,
  ProjectAssistantMessage,
} from "./types";

export function ProjectAssistantHost({
  projectId,
  projectName,
  constellations,
  visible,
  open,
  onOpenChange,
  messages,
  onMessagesChange,
}: {
  projectId: string | null;
  projectName: string;
  constellations: ProjectAssistantConstellationRef[];
  visible: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ProjectAssistantMessage[];
  onMessagesChange: (messages: ProjectAssistantMessage[]) => void;
}) {
  const [launcherExpanded, setLauncherExpanded] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setLauncherExpanded(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!visible || !projectId) return null;

  return (
    <>
      {!open ? (
        <ProjectAssistantLauncher
          expanded={launcherExpanded}
          onOpen={() => onOpenChange(true)}
        />
      ) : null}
      <ProjectAssistantPanel
        open={open}
        onOpenChange={onOpenChange}
        projectId={projectId}
        projectName={projectName}
        constellations={constellations}
        messages={messages}
        onMessagesChange={onMessagesChange}
      />
    </>
  );
}
