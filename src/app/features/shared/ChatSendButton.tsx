import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { Send } from "lucide-react";
import { LX } from "@/app/features/active-data-tables/tokens";
import { cn } from "@/app/components/ui/utils";

type ChatSendButtonProps = {
  /** When true, uses the active Chat send treatment (gradient + white icon). */
  canSend: boolean;
  busy?: boolean;
  busyLabel?: string;
  className?: string;
  "aria-label"?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Canonical Chat send control — circular Luxia gradient when active,
 * muted slate when idle/disabled. Shared by Chat composer and Writing Assistant.
 */
export function ChatSendButton({
  canSend,
  busy = false,
  busyLabel = "Sending",
  className,
  type = "button",
  onClick,
  onMouseDown,
  "aria-label": ariaLabel = "Send message",
}: ChatSendButtonProps) {
  const active = canSend && !busy;

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={!active}
      aria-busy={busy || undefined}
      aria-label={busy ? busyLabel : ariaLabel}
      className={cn(
        "flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-full outline-none transition-all",
        active && "hover:opacity-90",
        className,
      )}
      style={{
        background: active ? LX.gradient.button : "#E2E8F0",
        boxShadow: active ? "0 4px 12px rgba(48,33,78,0.18)" : "none",
      }}
    >
      <Send size={17} color={active ? "white" : "#94A3B8"} aria-hidden />
    </button>
  );
}
