import type { ProjectRole } from "@/app/features/permissions/types";

export const DASHBOARD_CREATE_DENIED_MESSAGE =
  "You do not have permission to create Dashboard outputs for this Project.";

export const DASHBOARD_EDIT_DENIED_MESSAGE =
  "You do not have permission to modify this Dashboard output.";

export const DASHBOARD_DELETE_DENIED_MESSAGE =
  "You do not have permission to delete this Dashboard output.";

/** Owner, Manager, and Analyst may create Dashboard outputs. Member may not. */
export function canCreateDashboard(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return (
    projectRole === "Project Owner"
    || projectRole === "Project Manager"
    || projectRole === "Analyst"
  );
}

export function canViewProjectDashboard(
  projectRole: ProjectRole | null | undefined,
): boolean {
  return Boolean(projectRole);
}

export function canEditDashboard(input: {
  projectRole: ProjectRole | null | undefined;
  dashboardOwnerId: string;
  currentUserId: string;
}): boolean {
  const { projectRole, dashboardOwnerId, currentUserId } = input;
  if (projectRole === "Project Owner" || projectRole === "Project Manager") {
    return true;
  }
  if (projectRole === "Analyst") {
    return dashboardOwnerId === currentUserId;
  }
  return false;
}

export function canDeleteDashboard(input: {
  projectRole: ProjectRole | null | undefined;
  dashboardOwnerId: string;
  currentUserId: string;
}): boolean {
  return canEditDashboard(input);
}

export function canRenameDashboard(input: {
  projectRole: ProjectRole | null | undefined;
  dashboardOwnerId: string;
  currentUserId: string;
}): boolean {
  return canEditDashboard(input);
}
