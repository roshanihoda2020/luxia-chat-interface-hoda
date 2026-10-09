import { useId, type Ref } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { FieldError, fieldDescribedBy } from "@/app/features/shared/FieldValidation";
import { LX } from "./tokens";
import { isValidCrawlerUrl } from "./utils";

export interface CrawlerFormValues {
    url: string;
    description: string;
    exactSearch: boolean;
}

export function CrawlerForm({
    values,
    onChange,
    urlInputRef,
}: {
    values: CrawlerFormValues;
    onChange: (next: CrawlerFormValues) => void;
    /** Focus target when Add/Update is attempted while the URL is invalid. */
    urlInputRef?: Ref<HTMLInputElement>;
}) {
    const urlId = useId();
    const displayNameId = useId();
    const urlErrorId = useId();
    const urlInvalid = values.url.trim().length > 0 && !isValidCrawlerUrl(values.url);

    function update(patch: Partial<CrawlerFormValues>) {
        onChange({ ...values, ...patch });
    }

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor={urlId} className="text-[var(--luxia-text-secondary)]">
                    Crawler URL
                </Label>
                <Input
                    ref={urlInputRef}
                    id={urlId}
                    value={values.url}
                    onChange={(e) => update({ url: e.target.value })}
                    placeholder="https://example.com"
                    className="rounded-[12px]"
                    autoComplete="url"
                    inputMode="url"
                    aria-invalid={urlInvalid ? true : undefined}
                    aria-describedby={fieldDescribedBy(urlInvalid && urlErrorId)}
                />
                <FieldError id={urlErrorId}>
                    {urlInvalid ? "Enter a valid http:// or https:// URL." : null}
                </FieldError>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor={displayNameId} className="text-[var(--luxia-text-secondary)]">
                    Display name
                </Label>
                <Textarea
                    id={displayNameId}
                    value={values.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                    className="resize-y rounded-[12px] luxia-type-body-dense"
                />
            </div>
            <div className="flex items-center justify-between rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Exact Search</span>
                <Switch checked={values.exactSearch} onCheckedChange={(exactSearch) => update({ exactSearch })} aria-label="Exact search" />
            </div>
        </div>
    );
}

export function isCrawlerFormValid(values: CrawlerFormValues): boolean {
    return isValidCrawlerUrl(values.url);
}
