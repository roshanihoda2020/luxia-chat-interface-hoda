import {
  canAccessProject,
  canConfigureConstellation,
  getActiveProjectMembership,
  isDataSourceUsable,
  type DataSourceCatalogItem,
  type ProjectMembership,
} from "@/app/features/permissions";

export type DataSourceHandoffProject = {
  id: string;
  name: string;
};

export type DataSourceHandoffConstellation = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  dataSourceIds: string[];
};

export function listProjectsWhereUserCanCreateConstellation(input: {
  projects: readonly { id: string; name: string; status?: string }[];
  memberships: ProjectMembership[];
  userId: string;
}): DataSourceHandoffProject[] {
  return input.projects
    .filter((project) => {
      if (project.status === "archived") return false;
      if (!canAccessProject(project.id, input.memberships, input.userId)) return false;
      const membership = getActiveProjectMembership(
        project.id,
        input.memberships,
        input.userId,
      );
      return canConfigureConstellation(membership?.projectRole);
    })
    .map((project) => ({ id: project.id, name: project.name }));
}

export function listConstellationsUserCanConfigure(input: {
  constellations: Array<{
    id: string;
    name: string;
    projectId: string;
    dataSourceIds: string[];
  }>;
  projects: readonly { id: string; name: string }[];
  memberships: ProjectMembership[];
  userId: string;
}): DataSourceHandoffConstellation[] {
  const projectNameById = new Map(input.projects.map((project) => [project.id, project.name]));
  return input.constellations.flatMap((item) => {
    if (!canAccessProject(item.projectId, input.memberships, input.userId)) return [];
    const membership = getActiveProjectMembership(
      item.projectId,
      input.memberships,
      input.userId,
    );
    if (!canConfigureConstellation(membership?.projectRole)) return [];
    return [
      {
        id: item.id,
        name: item.name,
        projectId: item.projectId,
        projectName: projectNameById.get(item.projectId) ?? item.projectId,
        dataSourceIds: [...item.dataSourceIds],
      },
    ];
  });
}

export function listConstellationsEligibleToConnectSource(
  sourceId: string,
  configurable: readonly DataSourceHandoffConstellation[],
): DataSourceHandoffConstellation[] {
  return configurable.filter((item) => !item.dataSourceIds.includes(sourceId));
}

export function dataSourceCanJoinConstellation(
  source: Pick<DataSourceCatalogItem, "status">,
): boolean {
  return isDataSourceUsable(source.status);
}
