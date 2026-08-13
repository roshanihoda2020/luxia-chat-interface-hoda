import { ProjectDomainMarker } from "@/app/features/project-overview/ProjectDomainMarker";
import {
  ProjectOutlineButton,
  PROJECT_OVERVIEW_MODULE_SHADOW,
} from "@/app/features/project-overview/ProjectModuleShared";
import { ProjectNavigatorIcon } from "./ProjectNavigatorIcon";

const NAVIGATOR_TITLE_COLOR = "var(--luxia-purple-70)";
const NAVIGATOR_DESCRIPTION_COLOR =
  "color-mix(in srgb, var(--luxia-neutral-600, #475569) 74%, var(--luxia-purple-60))";
const NAVIGATOR_BORDER_COLOR =
  "color-mix(in srgb, var(--luxia-purple-10) 28%, var(--luxia-neutral-200))";
const NAVIGATOR_FOOTER_BORDER_COLOR =
  "color-mix(in srgb, var(--luxia-purple-10) 18%, var(--luxia-neutral-200))";

export function ProjectAssistantOverviewEntry({
  onAskProject,
}: {
  onAskProject: () => void;
}) {
  return (
    <section
      className="relative flex min-w-0 flex-col overflow-hidden rounded-[var(--luxia-radius-16)] border p-4"
      style={{
        background:
          "linear-gradient(0deg, var(--luxia-opacity-brand-primary-04), var(--luxia-opacity-brand-primary-04)), var(--luxia-neutral-50, #F8FAFC)",
        borderColor: NAVIGATOR_BORDER_COLOR,
        boxShadow: PROJECT_OVERVIEW_MODULE_SHADOW,
      }}
      aria-labelledby="project-navigator-overview-heading"
    >
      <ProjectDomainMarker
        tone="navigator"
        icon={<ProjectNavigatorIcon size={20} />}
      />

      <header className="mb-1.5 min-w-0 shrink-0 pr-11">
        <h2
          id="project-navigator-overview-heading"
          className="luxia-type-heading-h4 min-w-0 truncate"
          style={{ color: NAVIGATOR_TITLE_COLOR }}
        >
          Project Navigator
        </h2>
      </header>

      <p
        className="shrink-0 luxia-type-body-dense pr-11"
        style={{ color: NAVIGATOR_DESCRIPTION_COLOR }}
      >
        Explore Project knowledge, find answers, and get oriented quickly.
      </p>

      <footer
        className="mt-3 flex shrink-0 flex-nowrap items-center justify-end gap-3 pt-2.5"
        style={{
          borderTop: `1px solid ${NAVIGATOR_FOOTER_BORDER_COLOR}`,
        }}
      >
        <ProjectOutlineButton
          label="Open Navigator"
          onClick={onAskProject}
          ariaLabel="Open Navigator"
        />
      </footer>
    </section>
  );
}
