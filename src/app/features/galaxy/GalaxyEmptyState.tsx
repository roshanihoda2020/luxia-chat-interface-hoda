import { LuxiaStarLogo } from "@/app/components/LuxiaStarLogo";
import { LX } from "@/app/features/active-data-tables/tokens";
import { GALAXY_EMPTY_PROMPTS } from "./constants";

export function GalaxyEmptyState({
  projectName,
  onPrompt,
}: {
  projectName: string;
  onPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 pb-8">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-[18px]"
        style={{
          background: LX.primary,
          boxShadow: "0 8px 22px rgba(48,33,78,0.22)",
        }}
        aria-hidden="true"
      >
        <LuxiaStarLogo size={30} />
      </div>
      <h2 className="mb-2 text-center luxia-type-heading-h4" style={{ color: LX.primary }}>
        Ask across your project
      </h2>
      <p className="mb-8 max-w-[440px] text-center luxia-type-body-small" style={{ color: LX.muted }}>
        Galaxy searches {projectName} and finds the most relevant constellation for each question.
      </p>
      <div className="grid w-full max-w-[520px] grid-cols-1 gap-2.5">
        {GALAXY_EMPTY_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="rounded-[14px] px-4 py-3 text-left luxia-type-body-dense outline-none transition-all"
            style={{
              color: LX.primary,
              fontWeight: 600,
              background: "rgba(255,255,255,0.92)",
              border: `1px solid rgba(142,99,235,0.18)`,
              boxShadow: "0 2px 10px rgba(48,33,78,0.06)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = LX.secondary;
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(142,99,235,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(142,99,235,0.18)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(48,33,78,0.06)";
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
