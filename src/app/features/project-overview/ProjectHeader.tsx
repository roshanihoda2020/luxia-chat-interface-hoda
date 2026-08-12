import { Button } from "@/app/components/ui/button";
import { ProjectCardMeta } from "@/app/features/project/ProjectCardMeta";
import { HS } from "@/app/features/home/homeSurfaces";
import type { HomeProjectCard } from "@/app/features/project/types";
import {
  LuxiaBreadcrumb,
  buildProjectOverviewBreadcrumbItems,
} from "@/app/components/LuxiaBreadcrumb";
import { LuxiaPageHeader } from "@/app/components/LuxiaPageHeader";
import { LuxiaEntityOptionsMenu } from "@/app/components/LuxiaEntityOptionsMenu";

interface ProjectHeaderProps {
  project: HomeProjectCard;
  onNavigateHome: () => void;
  onRenameProject?: (name: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectHeader({
  project,
  onNavigateHome,
  onRenameProject,
  onArchiveProject,
  onDeleteProject,
}: ProjectHeaderProps) {
  const description = project.description?.trim();
  const crumbItems = buildProjectOverviewBreadcrumbItems({
    projectId: project.id,
    projectName: project.name,
  });
  const canRename = Boolean(onRenameProject);
  const canArchive = Boolean(onArchiveProject) && project.status !== "archived";
  const canDelete = Boolean(onDeleteProject);

  const optionItems = [
    ...(canArchive
      ? [{
        id: "archive",
        label: "Archive Project",
        ariaLabel: `Archive ${project.name}`,
        onSelect: () => onArchiveProject!(project.id),
      }]
      : []),
    ...(canDelete
      ? [{
        id: "delete",
        label: "Delete Project",
        ariaLabel: `Delete ${project.name}`,
        onSelect: () => onDeleteProject!(project.id),
        destructive: true as const,
        separatorBefore: true,
      }]
      : []),
  ];

  return (
    <LuxiaPageHeader
      contentGap="none"
      className="mb-4"
      pageTypeLabel="PROJECT"
      titleStyle={{ color: "var(--luxia-purple-70)" }}
      title={project.name}
      onRename={canRename ? onRenameProject : undefined}
      renameLabel={`Rename ${project.name}`}
      breadcrumb={
        <LuxiaBreadcrumb
          tone="page"
          items={crumbItems}
          handlers={{ onHome: onNavigateHome }}
        />
      }
      context={
        <>
          <ProjectCardMeta
            project={project}
            density="featured"
            className="relative z-[1] min-w-0"
          />
          {description ? (
            <p
              className="mt-2 min-w-0 luxia-type-body-small"
              style={{
                color: "var(--luxia-text-secondary)",
                maxWidth: "780px",
              }}
            >
              {description}
            </p>
          ) : null}
        </>
      }
      options={
        optionItems.length > 0 ? (
          <LuxiaEntityOptionsMenu
            entityType="Project"
            entityLabel={project.name}
            ariaLabel="Project options"
            triggerVariant="icon"
            items={optionItems}
          />
        ) : undefined
      }
    />
  );
}

export function ProjectNotFoundState({
  onBackHome,
  onViewProjects,
}: {
  onBackHome: () => void;
  onViewProjects: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 py-16">
      <p className="luxia-type-overline-data" style={{ color: HS.sectionHeading }}>
        PROJECT
      </p>
      <h1 className="luxia-type-title-page" style={{ color: "var(--luxia-purple-70)" }}>
        Project not found
      </h1>
      <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
        This Project ID is not available in the current workspace. Return to Home or browse Projects.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="compact" onClick={onBackHome}>
          Back to Home
        </Button>
        <Button type="button" variant="outline" size="compact" onClick={onViewProjects}>
          View Projects
        </Button>
      </div>
    </div>
  );
}
