import { toast } from "sonner";
import { reviewReportFileName, reviewReportMarkdown } from "../reviewText";
import type { VerifaiReview } from "../types";

export function formatClock(ms?: number) {
  return ms ? new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
}

export function copyText(text: string, label: string) {
  if (!navigator.clipboard) {
    toast.error("Couldn't copy to the clipboard. Select the text to copy it.");
    return;
  }
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Couldn't copy to the clipboard. Select the text to copy it."),
  );
}

/**
 * Export the review report (same file from Chat and from the Tool). `avoidHeader`: the Tool's Export
 * sits in the page header, so its confirmation appears at the bottom instead of over the header actions.
 */
export function downloadReport(review: VerifaiReview, options: { avoidHeader?: boolean } = {}) {
  const blob = new Blob([reviewReportMarkdown(review)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = reviewReportFileName(review);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("Report exported", {
    description: reviewReportFileName(review),
    ...(options.avoidHeader ? { position: "bottom-right" as const } : {}),
  });
}
