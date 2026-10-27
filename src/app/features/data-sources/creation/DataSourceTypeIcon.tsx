import type { DataSourceCatalogItem } from "@/app/features/permissions/types";
import { cn } from "@/app/components/ui/utils";
import {
  getDataSourceTypeIcon,
  resolveDataSourceTypeIconId,
  type DataSourceTypeIconId,
} from "./connectors";
import type { SimpleIcon } from "simple-icons";

const DEFAULT_SIZE = 20;

function BrandMark({
  mark,
  size,
  className,
}: {
  mark: SimpleIcon;
  size: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={`#${mark.hex}`}
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={mark.path} />
      </svg>
    </span>
  );
}

export function DataSourceTypeIcon({
  id,
  source,
  size = DEFAULT_SIZE,
  selected = false,
  disabled = false,
  align = "text",
}: {
  id?: DataSourceTypeIconId;
  source?: Pick<DataSourceCatalogItem, "connector" | "type"> | null;
  size?: number;
  selected?: boolean;
  disabled?: boolean;
  /** `text` optically aligns with a wrapping label; `center` is for table rows. */
  align?: "text" | "center";
}) {
  const resolvedId = id ?? resolveDataSourceTypeIconId(source);
  const spec = getDataSourceTypeIcon(resolvedId);
  const boxClass = cn(
    "inline-flex shrink-0 items-center justify-center",
    align === "text" ? "mt-0.5" : null,
  );

  if (spec.kind === "brand") {
    return <BrandMark mark={spec.mark} size={size} className={boxClass} />;
  }

  const toneClass = disabled
    ? "text-[var(--luxia-text-muted)]"
    : selected
      ? "text-[var(--luxia-border-focus)]"
      : "text-[var(--luxia-text-muted)] group-hover:text-[var(--luxia-text-secondary)]";

  if (spec.kind === "fluent") {
    const Fluent = spec.icon;
    return (
      <span
        className={cn(boxClass, toneClass)}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Fluent fontSize={size} primaryFill="currentColor" />
      </span>
    );
  }

  const Icon = spec.icon;

  return (
    <span
      className={boxClass}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon
        size={size}
        strokeWidth={1.75}
        style={spec.color ? { color: spec.color } : undefined}
        className={spec.color ? undefined : toneClass}
      />
    </span>
  );
}

export function CsvFileGlyph({ size = 18 }: { size?: number }) {
  return <DataSourceTypeIcon id="csv" size={size} align="center" />;
}

export { getDataSourceTypeIcon, resolveDataSourceTypeIconId };
export type { DataSourceTypeIconId };
