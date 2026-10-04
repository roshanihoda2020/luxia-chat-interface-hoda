import { useEffect, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { cn } from "@/app/components/ui/utils";
import type { AdminOrganization, AdminProject, AdminProjectsLoadState } from "./types";

const FIELD_LABEL =
  "mb-1.5 block luxia-type-caption font-medium text-[var(--luxia-text-secondary)]";
const HELPER =
  "mt-1.5 luxia-type-caption text-[var(--luxia-text-muted)]";
const ERROR =
  "mt-1.5 luxia-type-caption text-[var(--luxia-error)]";
const READONLY_VALUE =
  "flex h-10 min-h-10 w-full items-center gap-2 rounded-[var(--luxia-radius-8)] border border-[var(--luxia-border-subtle)] bg-[var(--luxia-settings-section-bg)] px-3.5 luxia-type-body-small font-medium text-[var(--luxia-text-primary)]";

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {children}
      {required ? (
        <span className="text-[var(--luxia-error)]" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
    </label>
  );
}

export function FieldHelper({ children }: { children: ReactNode }) {
  return <p className={HELPER}>{children}</p>;
}

export function FieldError({ children }: { children: ReactNode }) {
  return <p className={ERROR}>{children}</p>;
}

export function ReadOnlyField({
  id,
  label,
  value,
  required,
  helper,
  secondary,
  mono,
}: {
  id?: string;
  label: string;
  value: string;
  required?: boolean;
  helper?: ReactNode;
  secondary?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <div
        id={id}
        role="text"
        aria-readonly="true"
        className={READONLY_VALUE}
      >
        <Lock
          className="size-3.5 shrink-0 text-[var(--luxia-text-muted)] opacity-80"
          strokeWidth={2}
          aria-hidden
        />
        <span
          className={cn(
            "min-w-0 truncate",
            mono && "font-mono text-[0.95em]",
          )}
        >
          {value}
        </span>
      </div>
      {secondary ? (
        <p className="mt-1 truncate luxia-type-caption text-[var(--luxia-text-muted)]">
          {secondary}
        </p>
      ) : null}
      {helper ? <FieldHelper>{helper}</FieldHelper> : null}
    </div>
  );
}

export function OrganizationSelect({
  id,
  value,
  onChange,
  organizations,
  disabled,
  locked,
  lockedHelper,
}: {
  id?: string;
  value: string;
  onChange: (organizationId: string) => void;
  organizations: AdminOrganization[];
  disabled?: boolean;
  /** Immutable / contextual — communicate clearly, not as accidental disable. */
  locked?: boolean;
  lockedHelper?: string;
}) {
  if (locked) {
    const name = organizations.find((org) => org.id === value)?.name ?? value;
    return (
      <ReadOnlyField
        id={id}
        label="Organization"
        value={name || "—"}
        required
        helper={
          lockedHelper
          ?? "Fixed after declaration."
        }
      />
    );
  }

  return (
    <div>
      <FieldLabel htmlFor={id} required>
        Organization
      </FieldLabel>
      <SearchableSelect
        id={id}
        value={value}
        onValueChange={onChange}
        options={organizations.map((org) => ({
          value: org.id,
          label: org.name,
        }))}
        placeholder="Select organization"
        searchPlaceholder="Search organizations…"
        emptyText="No organizations"
        noResultsText="No matching organizations"
        disabled={disabled}
      />
    </div>
  );
}

export function ProjectSelect({
  id,
  value,
  onChange,
  projects,
  projectsLoad,
  organizationSelected,
  disabled,
  locked,
  lockedHelper,
}: {
  id?: string;
  value: string;
  onChange: (projectId: string) => void;
  projects: AdminProject[];
  projectsLoad: AdminProjectsLoadState;
  organizationSelected: boolean;
  disabled?: boolean;
  locked?: boolean;
  lockedHelper?: string;
}) {
  if (locked) {
    const name = projects.find((project) => project.id === value)?.name ?? value;
    return (
      <ReadOnlyField
        id={id}
        label="Project"
        value={name || "—"}
        required
        helper={
          lockedHelper
          ?? "Fixed after declaration."
        }
      />
    );
  }

  const readyIds =
    projectsLoad.status === "ready" ? new Set(projectsLoad.projectIds) : null;
  const options =
    readyIds == null
      ? []
      : projects
          .filter((p) => readyIds.has(p.id))
          .map((p) => ({ value: p.id, label: p.name }));

  const selectDisabled =
    disabled
    || !organizationSelected
    || projectsLoad.status === "loading"
    || projectsLoad.status === "error"
    || projectsLoad.status === "empty"
    || projectsLoad.status === "idle";

  let placeholder = "Select project";
  if (!organizationSelected) placeholder = "Select an organization first";
  else if (projectsLoad.status === "loading") placeholder = "Loading projects…";
  else if (projectsLoad.status === "empty") placeholder = "No active projects";
  else if (projectsLoad.status === "error") placeholder = "Projects unavailable";

  return (
    <div>
      <FieldLabel htmlFor={id} required>
        Project
      </FieldLabel>
      <SearchableSelect
        id={id}
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
        searchPlaceholder="Search projects…"
        emptyText={
          projectsLoad.status === "empty"
            ? "This organization has no active projects"
            : "No projects"
        }
        noResultsText="No matching projects"
        disabled={selectDisabled}
      />
      {projectsLoad.status === "loading" ? (
        <FieldHelper>Loading projects for this organization…</FieldHelper>
      ) : null}
      {projectsLoad.status === "empty" ? (
        <FieldHelper>This organization has no active projects.</FieldHelper>
      ) : null}
      {projectsLoad.status === "error" ? (
        <FieldError>{projectsLoad.message}</FieldError>
      ) : null}
    </div>
  );
}

export function FilterOrganizationSelect({
  value,
  onChange,
  organizations,
}: {
  value: string;
  onChange: (value: string) => void;
  organizations: AdminOrganization[];
}) {
  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={[
        { value: "all", label: "All organizations" },
        ...organizations.map((org) => ({ value: org.id, label: org.name })),
      ]}
      placeholder="All organizations"
      searchPlaceholder="Search organizations…"
      emptyText="No organizations"
      className="min-w-[12rem] max-w-[18rem]"
      clearValue="all"
      clearAriaLabel="Clear selection"
    />
  );
}

export function FilterProjectSelect({
  value,
  onChange,
  projects,
  organizationId,
}: {
  value: string;
  onChange: (value: string) => void;
  projects: AdminProject[];
  organizationId: string;
}) {
  const filtered =
    organizationId === "all"
      ? projects.filter((p) => p.active)
      : projects.filter((p) => p.active && p.organizationId === organizationId);

  useEffect(() => {
    if (value === "all") return;
    if (!filtered.some((project) => project.id === value)) {
      onChange("all");
    }
    // Reset only when org filter or project list membership changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtered ids derived from org + projects
  }, [organizationId, projects, value, onChange]);

  return (
    <SearchableSelect
      value={value}
      onValueChange={onChange}
      options={[
        { value: "all", label: "All projects" },
        ...filtered.map((p) => ({ value: p.id, label: p.name })),
      ]}
      placeholder="All projects"
      searchPlaceholder="Search projects…"
      emptyText="No projects"
      disabled={organizationId !== "all" && filtered.length === 0}
      className="min-w-[12rem] max-w-[16rem]"
      clearValue="all"
      clearAriaLabel="Clear selection"
    />
  );
}
