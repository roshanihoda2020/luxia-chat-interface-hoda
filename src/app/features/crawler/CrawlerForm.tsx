import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
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
}: {
    values: CrawlerFormValues;
    onChange: (next: CrawlerFormValues) => void;
}) {
    const urlInvalid = values.url.trim().length > 0 && !isValidCrawlerUrl(values.url);

    function update(patch: Partial<CrawlerFormValues>) {
        onChange({ ...values, ...patch });
    }

    return (
        <div className="space-y-3">
            <div>
                <Input value={values.url} onChange={(e) => update({ url: e.target.value })} placeholder="https://example.com" className="rounded-[12px]" aria-label="URL" aria-invalid={urlInvalid} />
                {urlInvalid ? <p className="mt-1 text-[11px]" role="alert" style={{ color: LX.error }}>Enter a valid http:// or https:// URL.</p> : null}
            </div>
            <Textarea value={values.description} onChange={(e) => update({ description: e.target.value })} placeholder="Description" rows={3} className="resize-y rounded-[12px] text-[13px]" aria-label="Description" />
            <div className="flex items-center justify-between rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                <span className="text-[13px] font-semibold" style={{ color: LX.primary }}>Exact Search</span>
                <Switch checked={values.exactSearch} onCheckedChange={(exactSearch) => update({ exactSearch })} aria-label="Exact search" className="data-[state=checked]:bg-[#30214E]" />
            </div>
        </div>
    );
}

export function isCrawlerFormValid(values: CrawlerFormValues): boolean {
    return isValidCrawlerUrl(values.url);
}
