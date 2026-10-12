import { Button } from "@/app/components/ui/button";
import { STRUCTURED_MODAL_DARK_CHROME_STYLE } from "@/app/features/shared/structuredModalChrome";
import type { ProjectMemberItem } from "./types";

interface ManageRolesModalProps {
  open: boolean;
  projectName: string;
  members: ProjectMemberItem[];
  onClose: () => void;
  /** Preferred: open the full Members & Roles page. */
  onOpenMembersAndRoles?: () => void;
}

/**
 * @deprecated Lightweight redirect only.
 * Project role management lives on Members & Roles — do not maintain a second editor here.
 */
export function ManageRolesModal({
  open,
  projectName,
  onClose,
  onOpenMembersAndRoles,
}: ManageRolesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(16,5,32,0.35)", backdropFilter: "blur(4px)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-roles-title"
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[var(--luxia-radius-16)] border-0 bg-[var(--luxia-surface)] p-0 shadow-[var(--luxia-shadow-lg)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-4" style={STRUCTURED_MODAL_DARK_CHROME_STYLE}>
          <h2
            id="manage-roles-title"
            className="luxia-type-title-section text-[var(--luxia-text-inverse)]"
          >
            Members & Roles
          </h2>
        </div>
        <div className="px-6 py-5">
          <p
            className="luxia-type-body-dense"
            style={{ color: "var(--luxia-text-secondary)" }}
          >
            Manage Project membership and Project roles for {projectName} on the
            dedicated Members & Roles page. This dialog no longer edits roles.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--luxia-border-default)] px-6 py-4">
          <Button type="button" variant="secondary" size="compact" onClick={onClose}>
            Close
          </Button>
          {onOpenMembersAndRoles ? (
            <Button
              type="button"
              variant="primary"
              size="compact"
              onClick={() => {
                onOpenMembersAndRoles();
                onClose();
              }}
            >
              Open Members & Roles
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
