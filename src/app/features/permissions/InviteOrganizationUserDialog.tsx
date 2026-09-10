import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatOrganizationRoleLabel } from "./currentUser";
import { INVITABLE_PROJECT_ROLES } from "./data";
import type {
  AccessLevelRecord,
  OrganizationUser,
} from "./types";

export type InviteOrganizationUserPayload = {
  email: string;
  name: string;
  orgRole: OrganizationUser["orgRole"];
  projectAssignments: {
    projectId: string;
    projectRole: (typeof INVITABLE_PROJECT_ROLES)[number];
  }[];
  accessLevelIds: string[];
};

export interface InviteOrganizationUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
  accessLevels: AccessLevelRecord[];
  existingEmails: string[];
  onInvite: (payload: InviteOrganizationUserPayload) => void;
}

type InviteStep = "details" | "projects" | "access" | "summary";

const STEPS: { id: InviteStep; label: string }[] = [
  { id: "details", label: "User details" },
  { id: "projects", label: "Projects" },
  { id: "access", label: "Access Levels" },
  { id: "summary", label: "Summary" },
];

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "Invited user";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Invited user";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function InviteOrganizationUserDialog({
  open,
  onOpenChange,
  projects,
  accessLevels,
  existingEmails,
  onInvite,
}: InviteOrganizationUserDialogProps) {
  const [step, setStep] = useState<InviteStep>("details");
  const [email, setEmail] = useState("");
  const [orgRole, setOrgRole] = useState<OrganizationUser["orgRole"]>("Member");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectRoles, setProjectRoles] = useState<
    Record<string, (typeof INVITABLE_PROJECT_ROLES)[number]>
  >({});
  const [selectedAccessLevelIds, setSelectedAccessLevelIds] = useState<string[]>(
    [],
  );
  const [emailError, setEmailError] = useState<string | null>(null);

  const activeAccessLevels = useMemo(
    () => accessLevels.filter((level) => level.status === "active"),
    [accessLevels],
  );

  function reset() {
    setStep("details");
    setEmail("");
    setOrgRole("Member");
    setSelectedProjectIds([]);
    setProjectRoles({});
    setSelectedAccessLevelIds([]);
    setEmailError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function toggleProject(projectId: string, checked: boolean) {
    setSelectedProjectIds((prev) => {
      if (checked) {
        if (prev.includes(projectId)) return prev;
        return [...prev, projectId];
      }
      return prev.filter((id) => id !== projectId);
    });
    setProjectRoles((prev) => {
      if (!checked) {
        const next = { ...prev };
        delete next[projectId];
        return next;
      }
      if (prev[projectId]) return prev;
      return { ...prev, [projectId]: "Member" };
    });
  }

  function toggleAccessLevel(accessLevelId: string, checked: boolean) {
    setSelectedAccessLevelIds((prev) => {
      if (checked) {
        if (prev.includes(accessLevelId)) return prev;
        return [...prev, accessLevelId];
      }
      return prev.filter((id) => id !== accessLevelId);
    });
  }

  function validateDetails(): boolean {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    if (existingEmails.some((entry) => entry.toLowerCase() === trimmed)) {
      setEmailError("A user with this email is already in the organization.");
      return false;
    }
    setEmailError(null);
    return true;
  }

  function goNext() {
    if (step === "details") {
      if (!validateDetails()) return;
      setStep("projects");
      return;
    }
    if (step === "projects") {
      setStep("access");
      return;
    }
    if (step === "access") {
      setStep("summary");
    }
  }

  function goBack() {
    if (step === "projects") setStep("details");
    else if (step === "access") setStep("projects");
    else if (step === "summary") setStep("access");
  }

  function handleInvite() {
    if (!validateDetails()) {
      setStep("details");
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    onInvite({
      email: trimmedEmail,
      name: deriveNameFromEmail(trimmedEmail),
      orgRole,
      projectAssignments: selectedProjectIds.map((projectId) => ({
        projectId,
        projectRole: projectRoles[projectId] ?? "Member",
      })),
      accessLevelIds: selectedAccessLevelIds,
    });
    handleOpenChange(false);
  }

  const stepIndex = STEPS.findIndex((entry) => entry.id === step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,40rem)] w-[min(100%,32rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Invite someone to the organization. Project roles and Access Levels
            are optional and assigned separately.
          </DialogDescription>
          <ol className="flex flex-wrap gap-2 pt-1" aria-label="Invite steps">
            {STEPS.map((entry, index) => {
              const active = entry.id === step;
              const done = index < stepIndex;
              return (
                <li
                  key={entry.id}
                  className="luxia-type-caption"
                  style={{
                    color: active
                      ? "var(--luxia-text-inverse)"
                      : "var(--luxia-purple-10)",
                    opacity: active ? 1 : done ? 0.85 : 0.55,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {index + 1}. {entry.label}
                </li>
              );
            })}
          </ol>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
          style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
        >
          {step === "details" ? (
            <section className="space-y-4" aria-label="User details">
              <div className="space-y-2">
                <label
                  htmlFor="invite-org-email"
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Email
                </label>
                <Input
                  id="invite-org-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="name@company.com"
                  autoComplete="off"
                />
                {emailError ? (
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-danger, #b42318)" }}
                    role="alert"
                  >
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Organization role
                </label>
                <Select
                  value={orgRole}
                  onValueChange={(value) =>
                    setOrgRole(value as OrganizationUser["orgRole"])
                  }
                >
                  <SelectTrigger aria-label="Organization role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  Organization role is global. It is not a Project role.
                </p>
              </div>
            </section>
          ) : null}

          {step === "projects" ? (
            <section className="space-y-3" aria-label="Project assignments">
              <div className="space-y-1">
                <h3
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Optional Project assignment
                </h3>
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Assign a Project role per selected Project. Project Owner is
                  not available in this invite flow.
                </p>
              </div>
              {projects.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  No Projects available.
                </p>
              ) : (
                <ul className="space-y-3">
                  {projects.map((project) => {
                    const checked = selectedProjectIds.includes(project.id);
                    return (
                      <li
                        key={project.id}
                        className="flex flex-wrap items-center gap-3 rounded-[8px] px-3 py-2.5"
                        style={{
                          background: "var(--luxia-surface-subtle, transparent)",
                          border: "1px solid var(--luxia-border-subtle)",
                        }}
                      >
                        <label className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleProject(project.id, value === true)
                            }
                            aria-label={`Assign ${project.name}`}
                          />
                          <span
                            className="min-w-0 truncate luxia-type-body-dense"
                            style={{ color: "var(--luxia-text-primary)" }}
                          >
                            {project.name}
                          </span>
                        </label>
                        {checked ? (
                          <Select
                            value={projectRoles[project.id] ?? "Member"}
                            onValueChange={(value) =>
                              setProjectRoles((prev) => ({
                                ...prev,
                                [project.id]:
                                  value as (typeof INVITABLE_PROJECT_ROLES)[number],
                              }))
                            }
                          >
                            <SelectTrigger
                              className="w-[11.5rem]"
                              aria-label={`Project role for ${project.name}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INVITABLE_PROJECT_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          {step === "access" ? (
            <section className="space-y-3" aria-label="Access Levels">
              <div className="space-y-1">
                <h3
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Data Source access
                </h3>
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Optional Access Levels. These grant Data Source permissions
                  only — not Project membership.
                </p>
              </div>
              {activeAccessLevels.length === 0 ? (
                <p
                  className="luxia-type-body-dense"
                  style={{ color: "var(--luxia-text-muted)" }}
                >
                  No active Access Levels available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {activeAccessLevels.map((level) => {
                    const checked = selectedAccessLevelIds.includes(level.id);
                    return (
                      <li key={level.id}>
                        <label
                          className="flex items-start gap-2.5 rounded-[8px] px-3 py-2.5"
                          style={{
                            border: "1px solid var(--luxia-border-subtle)",
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleAccessLevel(level.id, value === true)
                            }
                            aria-label={`Assign ${level.name}`}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 space-y-0.5">
                            <span
                              className="block luxia-type-body-dense"
                              style={{ color: "var(--luxia-text-primary)" }}
                            >
                              {level.name}
                            </span>
                            <span
                              className="block luxia-type-caption"
                              style={{ color: "var(--luxia-text-muted)" }}
                            >
                              {level.sourceGrants.length} Data Source grant
                              {level.sourceGrants.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}

          {step === "summary" ? (
            <section className="space-y-4" aria-label="Invite summary">
              <div className="space-y-1">
                <h3
                  className="luxia-type-body-dense-strong"
                  style={{ color: "var(--luxia-text-primary)" }}
                >
                  Review invitation
                </h3>
                <p
                  className="luxia-type-caption"
                  style={{ color: "var(--luxia-text-secondary)" }}
                >
                  Confirm Organization role, Project assignments, and Access
                  Levels before sending.
                </p>
              </div>

              <dl className="space-y-3">
                <div>
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Email
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {email.trim().toLowerCase()}
                  </dd>
                </div>
                <div>
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Organization role
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {formatOrganizationRoleLabel(orgRole)}
                  </dd>
                </div>
                <div>
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Projects
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {selectedProjectIds.length === 0 ? (
                      <span style={{ color: "var(--luxia-text-muted)" }}>
                        None
                      </span>
                    ) : (
                      <ul className="space-y-1">
                        {selectedProjectIds.map((projectId) => {
                          const project = projects.find(
                            (entry) => entry.id === projectId,
                          );
                          const role = projectRoles[projectId] ?? "Member";
                          return (
                            <li key={projectId}>
                              {project?.name ?? projectId} → {role}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </dd>
                </div>
                <div>
                  <dt
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Access Levels
                  </dt>
                  <dd
                    className="luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {selectedAccessLevelIds.length === 0 ? (
                      <span style={{ color: "var(--luxia-text-muted)" }}>
                        None
                      </span>
                    ) : (
                      <ul className="space-y-1">
                        {selectedAccessLevelIds.map((id) => {
                          const level = accessLevels.find(
                            (entry) => entry.id === id,
                          );
                          return <li key={id}>{level?.name ?? id}</li>;
                        })}
                      </ul>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>

        <DialogFooter
          className="gap-2 px-5 py-4 sm:justify-between"
          style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex flex-wrap gap-2">
            {step !== "details" ? (
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            ) : null}
            {step !== "summary" ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleInvite}>
                Invite user
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
