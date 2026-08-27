import { getDataSourceTypeIcon, type DataSourceTypeIconId } from "./connectors";
import type { SimpleIcon } from "simple-icons";

const ICON_BOX = "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center";
const ICON_PX = 20;

function BrandMark({ mark }: { mark: SimpleIcon }) {
  return (
    <span className={ICON_BOX} aria-hidden>
      <svg
        viewBox="0 0 24 24"
        width={ICON_PX}
        height={ICON_PX}
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
  selected = false,
  disabled = false,
}: {
  id: DataSourceTypeIconId;
  selected?: boolean;
  disabled?: boolean;
}) {
  const spec = getDataSourceTypeIcon(id);

  if (spec.kind === "brand") {
    return <BrandMark mark={spec.mark} />;
  }

  const Icon = spec.icon;
  return (
    <span className={ICON_BOX} aria-hidden>
      <Icon
        size={ICON_PX}
        strokeWidth={1.75}
        className={
          disabled
            ? "text-[var(--luxia-text-muted)]"
            : selected
              ? "text-[var(--luxia-border-focus)]"
              : "text-[var(--luxia-text-muted)] group-hover:text-[var(--luxia-text-secondary)]"
        }
      />
    </span>
  );
}
