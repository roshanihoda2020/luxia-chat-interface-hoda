import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import {
  absoluteSharedReviewUrl,
  createVidgetInboxReviewShare,
  describeShareScope,
  formatShareExpiryLabel,
  listRecentVidgetInboxReviewShares,
  revokeVidgetInboxReviewShare,
  sessionIdsForShareScope,
  shareDialogCopy,
  shareStatusLabel,
} from "./share";
import type {
  VidgetInboxReviewShare,
  VidgetInboxReviewShareScope,
  VidgetInboxShareExpiryDays,
} from "./types";

type ExpiryOption = "7" | "30" | "none";

function expiryDaysFromOption(value: ExpiryOption): VidgetInboxShareExpiryDays {
  if (value === "7") return 7;
  if (value === "30") return 30;
  return null;
}

export function InboxShareDialog({
  open,
  onOpenChange,
  projectId,
  scope,
  vidgetNames,
  vidgetName,
  onOpenPreview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  scope: VidgetInboxReviewShareScope | null;
  vidgetNames: string[];
  vidgetName?: string | null;
  onOpenPreview?: (shareId: string) => void;
}) {
  const [anonymous, setAnonymous] = useState(true);
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>("7");
  const [createdShare, setCreatedShare] = useState<VidgetInboxReviewShare | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentTick, setRecentTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    setAnonymous(true);
    setExpiryOption("7");
    setCreatedShare(null);
    setCopied(false);
    setRecentTick((value) => value + 1);
  }, [open, scope]);

  const sessionCount = scope ? sessionIdsForShareScope(scope).length : 0;
  const copy = scope
    ? shareDialogCopy(scope, vidgetName)
    : { title: "Share", helper: "", doneTitle: "Link created" };
  const summary = describeShareScope({ sessionCount, vidgetNames });
  const done = Boolean(createdShare);
  const shareUrl = createdShare ? absoluteSharedReviewUrl(createdShare.id) : "";

  const recentShares = useMemo(() => {
    void recentTick;
    return listRecentVidgetInboxReviewShares(projectId, 4);
  }, [projectId, recentTick, createdShare]);

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy link");
    }
  }

  function handleCreateLink() {
    if (!scope) return;
    const share = createVidgetInboxReviewShare({
      projectId,
      scope,
      anonymous,
      expiresInDays: expiryDaysFromOption(expiryOption),
      vidgetId: scope.type === "vidget" ? scope.vidgetId : null,
    });
    if (!share) {
      toast.error("Could not create link");
      return;
    }
    setCreatedShare(share);
    setRecentTick((value) => value + 1);
  }

  function handleRevoke(shareId: string) {
    const updated = revokeVidgetInboxReviewShare(shareId);
    if (!updated) return;
    toast.success("Link revoked");
    if (createdShare?.id === shareId) setCreatedShare(updated);
    setRecentTick((value) => value + 1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,480px)] rounded-[16px]">
        <DialogHeader>
          <DialogTitle>{done ? copy.doneTitle : copy.title}</DialogTitle>
          {!done ? (
            <DialogDescription className="text-[var(--luxia-text-secondary)]">
              {copy.helper}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {done && createdShare ? (
            <>
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                {summary} included.
              </p>

              <div
                className="space-y-2 rounded-[10px] border p-3"
                style={{
                  borderColor: "var(--luxia-border-subtle)",
                  background: "var(--luxia-neutral-surface-subtle, #F8F7FA)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 luxia-type-caption"
                    style={{
                      color: createdShare.revokedAt
                        ? "var(--luxia-error)"
                        : "var(--luxia-brand-primary)",
                      background: "var(--luxia-opacity-brand-primary-08)",
                    }}
                  >
                    {shareStatusLabel(createdShare)}
                  </span>
                  <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    {formatShareExpiryLabel(createdShare.expiresAt)}
                  </span>
                  <span className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    {createdShare.anonymous ? "Identifying details hidden" : "Identifying details shown"}
                  </span>
                </div>

                <label className="block">
                  <span className="mb-1.5 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Review link
                  </span>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={shareUrl}
                      aria-label="Shared review link"
                      className="min-w-0 flex-1 font-mono text-[12px]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 gap-1.5"
                      onClick={() => void handleCopy(shareUrl)}
                    >
                      {copied ? <Check size={14} strokeWidth={1.8} aria-hidden /> : <Copy size={14} strokeWidth={1.8} aria-hidden />}
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                </label>

                <div className="flex flex-wrap gap-2 pt-1">
                  {onOpenPreview && !createdShare.revokedAt ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-1.5"
                      onClick={() => onOpenPreview(createdShare.id)}
                    >
                      <ExternalLink size={14} strokeWidth={1.8} aria-hidden />
                      Open preview
                    </Button>
                  ) : null}
                  {!createdShare.revokedAt ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[var(--luxia-error)]"
                      onClick={() => handleRevoke(createdShare.id)}
                    >
                      Revoke link
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="luxia-type-body-dense" style={{ color: "var(--luxia-text-secondary)" }}>
                {summary} will be included.
              </p>

              <div
                className="flex items-start gap-3 rounded-[10px] border px-3 py-2.5"
                style={{ borderColor: "var(--luxia-border-subtle)" }}
              >
                <Link2
                  size={16}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--luxia-brand-primary)" }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                    Anyone with the link
                  </p>
                  <p className="mt-0.5 luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Anyone with this link can view this review.
                  </p>
                </div>
              </div>

              <label className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="block luxia-type-body-dense-strong" style={{ color: "var(--luxia-text-primary)" }}>
                    Hide identifying details
                  </span>
                  <span className="mt-1 block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Removes identifying and internal context from the shared view where possible.
                  </span>
                </span>
                <Switch
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  aria-label="Hide identifying details"
                />
              </label>

              <div className="space-y-1.5">
                <span className="block luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                  Link expiry
                </span>
                <Select
                  value={expiryOption}
                  onValueChange={(value) => setExpiryOption(value as ExpiryOption)}
                >
                  <SelectTrigger aria-label="Link expiry" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="none">No expiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recentShares.length > 0 ? (
                <div className="space-y-2">
                  <p className="luxia-type-caption" style={{ color: "var(--luxia-text-muted)" }}>
                    Recent links
                  </p>
                  <ul className="space-y-1.5">
                    {recentShares.map((share) => (
                      <li
                        key={share.id}
                        className="flex items-center justify-between gap-2 rounded-[8px] border px-2.5 py-2"
                        style={{ borderColor: "var(--luxia-border-subtle)" }}
                      >
                        <span className="min-w-0 truncate luxia-type-caption" style={{ color: "var(--luxia-text-secondary)" }}>
                          {shareStatusLabel(share)}
                          {" · "}
                          {formatShareExpiryLabel(share.expiresAt)}
                          {share.anonymous ? " · Hidden details" : ""}
                        </span>
                        {!share.revokedAt
                          && !(share.expiresAt && Date.parse(share.expiresAt) <= Date.now())
                          ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 px-2 text-[var(--luxia-error)]"
                              onClick={() => handleRevoke(share.id)}
                            >
                              Revoke
                            </Button>
                          ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {done ? (
            <Button type="button" variant="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={sessionCount === 0}
                onClick={handleCreateLink}
              >
                Create link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
