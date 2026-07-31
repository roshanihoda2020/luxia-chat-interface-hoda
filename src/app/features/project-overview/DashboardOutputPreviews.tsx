import type { ProjectDashboardOutputType } from "./types";

const FRAME_STYLE = {
  background: "var(--luxia-surface)",
  border: "1px solid color-mix(in srgb, var(--luxia-blue-20) 50%, var(--luxia-neutral-200))",
} as const;

export function outputTypeLabel(type: ProjectDashboardOutputType): string {
  switch (type) {
    case "chart":
      return "Chart";
    case "table":
      return "Table";
    case "report":
      return "Report";
    case "metric":
      return "Metric";
    case "analysis":
      return "Analysis";
    case "insight":
      return "Insight";
    case "comparison":
      return "Comparison";
    case "mixed":
      return "Mixed";
  }
}

export function outputPreviewAriaLabel(type: ProjectDashboardOutputType): string {
  if (type === "mixed") return "Symbolic mixed output preview";
  return `Symbolic ${outputTypeLabel(type).toLowerCase()} preview`;
}

/**
 * Reusable symbolic Dashboard output thumbnail.
 * Visual format only — never represents real Project data.
 */
export function DashboardOutputPreviewGraphic({
  variant,
}: {
  variant: ProjectDashboardOutputType;
}) {
  return (
    <div
      role="img"
      aria-label={outputPreviewAriaLabel(variant)}
      className="relative h-[96px] w-full overflow-hidden rounded-[10px]"
      style={FRAME_STYLE}
    >
      <div aria-hidden="true" className="h-full w-full">
        {variant === "chart" ? <ChartMock /> : null}
        {variant === "table" ? <TableMock /> : null}
        {variant === "report" ? <ReportMock /> : null}
        {variant === "metric" ? <MetricMock /> : null}
        {variant === "analysis" ? <AnalysisMock /> : null}
        {variant === "insight" ? <InsightMock /> : null}
        {variant === "comparison" ? <ComparisonMock /> : null}
        {variant === "mixed" ? <MixedMock /> : null}
      </div>
    </div>
  );
}

function Line({
  width,
  height = "h-1.5",
  color = "var(--luxia-neutral-200)",
  className = "",
}: {
  width: string;
  height?: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`${height} rounded-full ${className}`}
      style={{ width, background: color, display: "block" }}
    />
  );
}

function ChartMock() {
  const bars = [46, 68, 52, 74, 42, 66, 58];
  return (
    <div className="flex h-full flex-col px-2 pb-1.5 pt-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Line width="2.75rem" color="var(--luxia-blue-20)" />
        <Line width="1.5rem" color="var(--luxia-neutral-100, #F1F5F9)" />
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to top, transparent 0%, transparent 24%, color-mix(in srgb, var(--luxia-neutral-200) 70%, transparent) 25%, transparent 26%, transparent 49%, color-mix(in srgb, var(--luxia-neutral-200) 70%, transparent) 50%, transparent 51%, transparent 74%, color-mix(in srgb, var(--luxia-neutral-200) 70%, transparent) 75%, transparent 76%)",
          }}
        />
        <svg
          className="absolute inset-x-1 bottom-1 top-1.5"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke="var(--luxia-purple-40)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
            points="4,28 18,18 32,24 46,10 60,20 74,12 90,16"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-0.5 px-0.5">
          {bars.map((value, index) => (
            <div
              key={index}
              className="min-w-0 flex-1 rounded-t-[3px]"
              style={{
                height: `${value}%`,
                background:
                  index % 2 === 0
                    ? "var(--luxia-blue-50, #3BA8D9)"
                    : "var(--luxia-blue-30, #7CC8E8)",
                opacity: 0.88,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableMock() {
  const rowWidths = ["72%", "58%", "80%"];
  return (
    <div className="flex h-full flex-col p-2">
      <div
        className="mb-1 grid grid-cols-4 gap-1 rounded-[4px] px-1.5 py-1"
        style={{ background: "var(--luxia-blue-10)" }}
      >
        {[0, 1, 2, 3].map((col) => (
          <span
            key={col}
            className="h-1.5 rounded-full"
            style={{
              background: "var(--luxia-blue-30, #7CC8E8)",
              width: col === 3 ? "55%" : "70%",
            }}
          />
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {rowWidths.map((width, row) => (
          <div key={row} className="grid grid-cols-4 items-center gap-1 px-1.5">
            <span
              className="h-1.5 rounded-full"
              style={{ width, background: "var(--luxia-neutral-200)" }}
            />
            <span
              className="h-1.5 w-[70%] rounded-full"
              style={{ background: "var(--luxia-neutral-100, #F1F5F9)" }}
            />
            <span
              className="h-1.5 w-5 rounded-full"
              style={{ background: "var(--luxia-neutral-100, #F1F5F9)" }}
            />
            <span
              className="h-1.5 w-1.5 justify-self-end rounded-full"
              style={{
                background:
                  row % 2 === 0 ? "var(--luxia-purple-30)" : "var(--luxia-blue-20)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportMock() {
  return (
    <div className="flex h-full flex-col gap-1 p-2">
      <Line width="50%" height="h-1.5" color="var(--luxia-purple-30)" />
      <Line width="100%" color="var(--luxia-neutral-200)" />
      <Line width="88%" color="var(--luxia-neutral-100, #F1F5F9)" />
      <Line width="72%" color="var(--luxia-neutral-100, #F1F5F9)" />
      <div
        className="mt-auto flex items-center gap-2 rounded-[6px] px-2 py-1"
        style={{ background: "var(--luxia-blue-10)" }}
      >
        <span
          className="h-3 w-6 shrink-0 rounded-[4px]"
          style={{ background: "var(--luxia-blue-30, #7CC8E8)" }}
        />
        <Line width="2.5rem" color="var(--luxia-neutral-200)" />
      </div>
    </div>
  );
}

function MetricMock() {
  const spark = [28, 36, 30, 44, 38, 52, 46];
  return (
    <div className="flex h-full flex-col justify-between px-2.5 py-2">
      <Line width="2.5rem" color="var(--luxia-neutral-200)" />
      <div className="flex items-end gap-2.5">
        <div
          className="h-7 w-[3.75rem] rounded-[7px]"
          style={{
            background:
              "linear-gradient(135deg, var(--luxia-blue-20) 0%, var(--luxia-purple-20) 100%)",
          }}
        />
        <span
          className="mb-0.5 h-2 w-2 rounded-full"
          style={{ background: "var(--luxia-purple-40)" }}
        />
      </div>
      <div className="flex h-5 items-end gap-0.5">
        {spark.map((value, index) => (
          <span
            key={index}
            className="min-w-0 flex-1 rounded-t-[2px]"
            style={{
              height: `${value}%`,
              background: "var(--luxia-blue-30, #7CC8E8)",
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AnalysisMock() {
  return (
    <div className="flex h-full flex-col gap-1 p-2">
      <Line width="42%" height="h-1.5" color="var(--luxia-blue-30, #7CC8E8)" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-[3px]"
            style={{
              background:
                row === 0
                  ? "var(--luxia-purple-40)"
                  : row === 1
                    ? "var(--luxia-blue-40, #5BB8E0)"
                    : "var(--luxia-neutral-200)",
            }}
          />
          <Line
            width={row === 0 ? "85%" : row === 1 ? "70%" : "60%"}
            color="var(--luxia-neutral-200)"
          />
        </div>
      ))}
      <div
        className="mt-auto rounded-[6px] px-2 py-1.5"
        style={{
          background: "var(--luxia-opacity-purple-08)",
          border: "1px solid color-mix(in srgb, var(--luxia-purple-20) 40%, var(--luxia-neutral-200))",
        }}
      >
        <Line width="70%" color="var(--luxia-purple-30)" />
      </div>
    </div>
  );
}

function InsightMock() {
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <div
        className="rounded-[7px] px-2 py-2"
        style={{
          background:
            "linear-gradient(0deg, var(--luxia-opacity-purple-08), var(--luxia-opacity-purple-08)), var(--luxia-blue-10)",
          border: "1px solid color-mix(in srgb, var(--luxia-purple-20) 35%, var(--luxia-blue-20))",
        }}
      >
        <Line width="36%" height="h-1" color="var(--luxia-purple-30)" className="mb-1" />
        <Line width="88%" height="h-1.5" color="var(--luxia-purple-40)" />
        <Line width="62%" color="var(--luxia-neutral-200)" className="mt-1" />
      </div>
      <Line width="74%" color="var(--luxia-neutral-200)" />
      <div className="mt-auto flex items-center gap-1.5">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--luxia-blue-40, #5BB8E0)" }}
        />
        <Line width="2.25rem" color="var(--luxia-neutral-200)" />
      </div>
    </div>
  );
}

function ComparisonMock() {
  const cols = [
    { bar: "42%", tone: "var(--luxia-neutral-200)" },
    { bar: "68%", tone: "var(--luxia-blue-30, #7CC8E8)" },
    { bar: "54%", tone: "var(--luxia-purple-30)" },
  ];
  return (
    <div className="flex h-full items-stretch gap-1 p-2">
      {cols.map((col, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-1 flex-col gap-1 rounded-[7px] px-1.5 py-1.5"
          style={{
            background:
              index === 1
                ? "color-mix(in srgb, var(--luxia-blue-10) 80%, var(--luxia-surface))"
                : "var(--luxia-neutral-50, #F8FAFC)",
            border:
              index === 1
                ? "1px solid color-mix(in srgb, var(--luxia-blue-20) 55%, var(--luxia-neutral-200))"
                : "1px solid var(--luxia-neutral-100, #F1F5F9)",
          }}
        >
          <Line width="70%" height="h-1" color="var(--luxia-neutral-200)" />
          <div
            className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--luxia-neutral-100, #F1F5F9)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: col.bar, background: col.tone }}
            />
          </div>
          <Line width="55%" color="var(--luxia-neutral-100, #F1F5F9)" className="mt-auto" />
        </div>
      ))}
    </div>
  );
}

function MixedMock() {
  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-1 p-1.5">
      <div
        className="flex items-end gap-0.5 rounded-[6px] px-1.5 pb-1 pt-1.5"
        style={{ background: "var(--luxia-blue-10)" }}
      >
        {[40, 62, 48, 70].map((h, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 rounded-t-[2px]"
            style={{
              height: `${h}%`,
              background: i % 2 === 0 ? "var(--luxia-blue-40, #5BB8E0)" : "var(--luxia-purple-30)",
            }}
          />
        ))}
      </div>
      <div
        className="flex flex-col justify-center gap-1 rounded-[6px] px-1.5"
        style={{ background: "var(--luxia-opacity-purple-08)" }}
      >
        <div
          className="h-3.5 w-8 rounded-[4px]"
          style={{ background: "var(--luxia-purple-30)" }}
        />
        <Line width="70%" height="h-1" color="var(--luxia-neutral-200)" />
      </div>
      <div
        className="col-span-2 flex flex-col gap-1 rounded-[6px] px-1.5 py-1"
        style={{ background: "var(--luxia-neutral-50, #F8FAFC)" }}
      >
        <div className="flex gap-1">
          <Line width="35%" height="h-1" color="var(--luxia-neutral-200)" />
          <Line width="20%" height="h-1" color="var(--luxia-neutral-100, #F1F5F9)" />
          <Line width="15%" height="h-1" color="var(--luxia-neutral-100, #F1F5F9)" />
        </div>
        <div className="flex gap-1">
          <Line width="28%" height="h-1" color="var(--luxia-neutral-200)" />
          <Line width="22%" height="h-1" color="var(--luxia-neutral-100, #F1F5F9)" />
          <Line width="18%" height="h-1" color="var(--luxia-neutral-100, #F1F5F9)" />
        </div>
        <Line width="50%" height="h-1" color="var(--luxia-blue-20)" className="mt-0.5" />
      </div>
    </div>
  );
}
