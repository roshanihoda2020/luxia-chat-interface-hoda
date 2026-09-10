import { ProjectNavigatorIcon } from "./ProjectNavigatorIcon";

export function ProjectAssistantLauncher({
  onOpen,
  expanded = true,
}: {
  onOpen: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ask Navigator"
      className="fixed z-[45] inline-flex items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
      style={{
        right: "1.25rem",
        bottom: "1.25rem",
        padding: expanded ? "0.625rem 1rem" : "0.75rem",
        background: "var(--luxia-brand-primary)",
        color: "var(--luxia-text-inverse, #fff)",
        boxShadow: "var(--luxia-shadow-md, 0 8px 24px rgba(28, 19, 54, 0.18))",
      }}
    >
      <ProjectNavigatorIcon size={18} />
      {expanded ? (
        <span className="luxia-type-body-dense-strong whitespace-nowrap">Ask Navigator</span>
      ) : null}
    </button>
  );
}
