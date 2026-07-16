import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-[var(--luxia-opacity-brand-primary-08)] animate-pulse rounded-[var(--luxia-radius-8)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
