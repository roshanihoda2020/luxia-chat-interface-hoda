import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Luxia toast feedback — single stack via Sonner (already mounted in App).
 *
 * Rules:
 * - SUCCESS — something completed
 * - ERROR — what failed + next step when possible
 * - WARNING — consequence; user may continue
 * - INFO — neutral process/state
 *
 * Keep copy compact. Prefer actionable product language over stack traces.
 * Do not introduce a second toast library.
 */

export type LuxiaToastTone = "success" | "warning" | "error" | "info";

type LuxiaToastOptions = {
  title: string;
  description?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  id?: string | number;
};

const ICONS: Record<LuxiaToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-[var(--luxia-success-70)]" aria-hidden />,
  warning: <AlertTriangle className="size-4 text-[var(--luxia-warning-90)]" aria-hidden />,
  error: <XCircle className="size-4 text-[var(--luxia-error-70)]" aria-hidden />,
  info: <Info className="size-4 text-[var(--luxia-blue-70)]" aria-hidden />,
};

function show(tone: LuxiaToastTone, options: LuxiaToastOptions) {
  const { title, description, action, duration, id } = options;

  const method =
    tone === "info"
      ? toast.info.bind(toast)
      : tone === "success"
        ? toast.success.bind(toast)
        : tone === "warning"
          ? toast.warning.bind(toast)
          : toast.error.bind(toast);

  return method(title, {
    id,
    description,
    duration,
    icon: ICONS[tone],
    action: action
      ? {
          label: action.label,
          onClick: action.onClick,
        }
      : undefined,
  });
}

export const luxiaToast = {
  success: (options: LuxiaToastOptions | string) =>
    show("success", typeof options === "string" ? { title: options } : options),
  warning: (options: LuxiaToastOptions | string) =>
    show("warning", typeof options === "string" ? { title: options } : options),
  error: (options: LuxiaToastOptions | string) =>
    show("error", typeof options === "string" ? { title: options } : options),
  info: (options: LuxiaToastOptions | string) =>
    show("info", typeof options === "string" ? { title: options } : options),
  dismiss: toast.dismiss,
  /** Escape hatch — prefer typed helpers above for new call sites. */
  raw: toast,
};
