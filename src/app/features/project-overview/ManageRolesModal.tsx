import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { ProjectMemberItem } from "./types";

const ROLE_OPTIONS = ["Administrator", "Editor", "Viewer", "Contributor"] as const;

interface ManageRolesModalProps {
  open: boolean;
  projectName: string;
  members: ProjectMemberItem[];
  onClose: () => void;
}

export function ManageRolesModal({
  open,
  projectName,
  members: initialMembers,
  onClose,
}: ManageRolesModalProps) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLE_OPTIONS)[number]>("Viewer");

  useEffect(() => {
    if (!open) return;
    setMembers(initialMembers);
    setQuery("");
    setInviteOpen(false);
    setInviteName("");
    setInviteRole("Viewer");
  }, [open, initialMembers]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q)
        || m.role.toLowerCase().includes(q)
        || m.email.toLowerCase().includes(q),
    );
  }, [members, query]);

  if (!open) return null;

  function handleInvite() {
    const name = inviteName.trim();
    if (!name) return;
    setMembers((prev) => [
      ...prev,
      {
        id: `invite-${Date.now()}`,
        projectId: initialMembers[0]?.projectId ?? "project",
        name,
        role: inviteRole,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@luxia.example`,
      },
    ]);
    setInviteName("");
    setInviteOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }}
      />
      <div
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-[20px] bg-white"
        style={{ maxHeight: "min(88vh, 720px)", boxShadow: "var(--luxia-shadow-dialog)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-roles-title"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <h2
              id="manage-roles-title"
              className="luxia-type-title-modal"
              style={{ color: "var(--luxia-purple-70)" }}
            >
              Manage roles
            </h2>
            <p className="mt-1 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
              Members and roles for {projectName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manage roles"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full outline-none"
            style={{ border: "1px solid var(--luxia-border-default)" }}
          >
            <X size={13} aria-hidden style={{ color: "var(--luxia-text-muted)" }} />
          </button>
        </div>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--luxia-text-muted)" }}
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              aria-label="Search members"
              className="pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 pb-4">
          <ul className="divide-y" style={{ borderColor: "var(--luxia-border-subtle)" }}>
            {filtered.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-3 py-3"
                style={{ borderColor: "var(--luxia-border-subtle)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                    {member.name}
                  </p>
                  <p className="truncate luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    {member.email}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`role-${member.id}`}>
                  Role for {member.name}
                </label>
                <select
                  id={`role-${member.id}`}
                  value={member.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setMembers((prev) =>
                      prev.map((m) => (m.id === member.id ? { ...m, role } : m)),
                    );
                  }}
                  className="rounded-[8px] px-2 py-1.5 luxia-type-caption outline-none"
                  style={{
                    border: "1px solid var(--luxia-border-default)",
                    color: "var(--luxia-text-secondary)",
                    background: "var(--luxia-surface)",
                  }}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="luxia-type-caption outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                  style={{ color: "var(--luxia-text-muted)" }}
                  onClick={() => setMembers((prev) => prev.filter((m) => m.id !== member.id))}
                >
                  Remove
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="py-8 text-center luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
                No members match this search.
              </li>
            ) : null}
          </ul>

          {inviteOpen ? (
            <div
              className="mt-4 space-y-3 rounded-[12px] p-3"
              style={{ background: "var(--luxia-opacity-brand-primary-04)" }}
            >
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Member name"
                aria-label="Invite member name"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
                aria-label="Invite member role"
                className="w-full rounded-[8px] px-2 py-2 luxia-type-body-dense"
                style={{ border: "1px solid var(--luxia-border-default)" }}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button type="button" variant="primary" size="compact" onClick={handleInvite}>
                  Send invite
                </Button>
                <Button type="button" variant="outline" size="compact" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-2 px-6 py-4"
          style={{ borderTop: "1px solid var(--luxia-border-subtle)" }}
        >
          <Button
            type="button"
            variant="outline"
            size="compact"
            onClick={() => setInviteOpen(true)}
            disabled={inviteOpen}
          >
            Invite member
          </Button>
          <Button type="button" variant="primary" size="compact" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
