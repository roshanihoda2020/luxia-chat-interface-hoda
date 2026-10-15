import { useEffect, useId, useMemo, useState } from "react";
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
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Textarea } from "@/app/components/ui/textarea";
import { FieldError, FieldHint, fieldDescribedBy } from "@/app/features/shared/FieldValidation";
import type { ShareAttachmentFormat } from "./documentIo";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export type ShareEmailPayload = {
  recipients: string[];
  subject: string;
  message: string;
  attachmentFormat: ShareAttachmentFormat;
};

type DocumentShareEmailDialogProps = {
  open: boolean;
  documentTitle: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (payload: ShareEmailPayload) => void | Promise<void>;
};

export function parseEmailRecipients(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function validateEmailRecipients(raw: string): string | null {
  const recipients = parseEmailRecipients(raw);
  if (recipients.length === 0) return "Enter at least one recipient email.";
  const seen = new Set<string>();
  for (const email of recipients) {
    if (!EMAIL_PATTERN.test(email)) {
      return `“${email}” is not a valid email address.`;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) return "Remove duplicate recipient emails.";
    seen.add(key);
  }
  return null;
}

export function DocumentShareEmailDialog({
  open,
  documentTitle,
  busy = false,
  onOpenChange,
  onContinue,
}: DocumentShareEmailDialogProps) {
  const toId = useId();
  const subjectId = useId();
  const messageId = useId();
  const toErrorId = useId();
  const toHintId = useId();
  const attachmentHintId = useId();

  const defaultSubject = useMemo(
    () => `Sharing: ${documentTitle.trim() || "Untitled document"}`,
    [documentTitle],
  );

  const [toValue, setToValue] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("I'm sharing this document with you.");
  const [attachmentFormat, setAttachmentFormat] = useState<ShareAttachmentFormat>("pdf");
  const [toError, setToError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToValue("");
    setSubject(`Sharing: ${documentTitle.trim() || "Untitled document"}`);
    setMessage("I'm sharing this document with you.");
    setAttachmentFormat("pdf");
    setToError(null);
    setSubmitAttempted(false);
  }, [open, documentTitle]);

  function validateTo(next = toValue): string | null {
    const error = validateEmailRecipients(next);
    setToError(error);
    return error;
  }

  async function handleContinue() {
    setSubmitAttempted(true);
    const error = validateTo();
    if (error) return;
    await onContinue({
      recipients: parseEmailRecipients(toValue),
      subject: subject.trim() || defaultSubject,
      message: message.trim(),
      attachmentFormat,
    });
  }

  const canContinue = !busy && !validateEmailRecipients(toValue);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[26rem] gap-0 p-0 sm:max-w-[26rem]">
        <DialogHeader className="border-b px-5 py-4" style={{ borderColor: "var(--luxia-border-subtle)" }}>
          <DialogTitle>Share via email</DialogTitle>
          <DialogDescription className="mt-1.5">
            Your email app will open with the message prepared.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5 px-5 py-4">
          <div className="min-w-0">
            <Label htmlFor={toId} className="luxia-type-caption mb-1.5 block font-semibold">
              To
            </Label>
            <Input
              id={toId}
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="name@company.com, other@company.com"
              value={toValue}
              disabled={busy}
              aria-invalid={Boolean(toError) || undefined}
              aria-describedby={fieldDescribedBy(toError ? toErrorId : null, toHintId)}
              onChange={(event) => {
                setToValue(event.target.value);
                if (submitAttempted) validateTo(event.target.value);
              }}
              onBlur={() => validateTo()}
            />
            <FieldHint id={toHintId}>Separate multiple addresses with commas.</FieldHint>
            <FieldError id={toErrorId}>{toError}</FieldError>
          </div>

          <div className="min-w-0">
            <Label htmlFor={subjectId} className="luxia-type-caption mb-1.5 block font-semibold">
              Subject
            </Label>
            <Input
              id={subjectId}
              value={subject}
              disabled={busy}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor={messageId} className="luxia-type-caption mb-1.5 block font-semibold">
              Message
            </Label>
            <Textarea
              id={messageId}
              value={message}
              disabled={busy}
              rows={3}
              className="min-h-[4.5rem] resize-y"
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <fieldset className="min-w-0" aria-describedby={attachmentHintId}>
            <legend className="luxia-type-caption mb-1.5 font-semibold" style={{ color: "var(--luxia-text-primary)" }}>
              Attachment
            </legend>
            <RadioGroup
              value={attachmentFormat}
              onValueChange={(value) => setAttachmentFormat(value as ShareAttachmentFormat)}
              className="flex flex-wrap gap-3"
              aria-label="Attachment format"
              disabled={busy}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id={`${toId}-pdf`} />
                <Label htmlFor={`${toId}-pdf`} className="font-normal">
                  PDF
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="docx" id={`${toId}-docx`} />
                <Label htmlFor={`${toId}-docx`} className="font-normal">
                  DOCX
                </Label>
              </div>
            </RadioGroup>
            <FieldHint id={attachmentHintId}>The file will be downloaded separately.</FieldHint>
          </fieldset>
        </div>

        <DialogFooter
          className="gap-2 border-t px-5 py-3.5 sm:gap-2"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canContinue}
            onClick={() => {
              void handleContinue();
            }}
          >
            {busy ? "Preparing…" : "Open email app"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
