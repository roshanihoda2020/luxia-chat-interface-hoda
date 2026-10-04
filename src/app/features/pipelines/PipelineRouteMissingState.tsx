import { Button } from "@/app/components/ui/button";
import { LuxiaPipelineIcon } from "@/assets/icons";

export function PipelineRouteMissingState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col items-center px-5 py-16 text-center"
      role="status"
    >
      <span
        className="mb-3 inline-flex size-10 items-center justify-center rounded-[10px]"
        style={{
          color: "var(--luxia-purple-60)",
          background: "var(--luxia-opacity-purple-08)",
        }}
        aria-hidden
      >
        <LuxiaPipelineIcon size={18} color="currentColor" />
      </span>
      <p
        className="luxia-type-body-dense-strong"
        style={{ color: "var(--luxia-text-primary)" }}
      >
        {title}
      </p>
      <p
        className="mt-1 max-w-md luxia-type-body-dense"
        style={{ color: "var(--luxia-text-muted)" }}
      >
        {description}
      </p>
      <Button type="button" variant="outline" className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
