import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { LX } from "./tokens";

export interface MetricFormValues {
    name: string;
    description: string;
    sqlExpression: string;
}

function FieldLabel({ children }: { children: string }) {
    return <p className="mb-1.5 luxia-type-caption" style={{ color: LX.textMuted }}>{children}</p>;
}

export function MetricForm({
    values,
    onChange,
}: {
    values: MetricFormValues;
    onChange: (next: MetricFormValues) => void;
}) {
    function update(patch: Partial<MetricFormValues>) {
        onChange({ ...values, ...patch });
    }

    return (
        <div className="space-y-3">
            <div>
                <FieldLabel>Metric Name</FieldLabel>
                <Input
                    value={values.name}
                    onChange={(event) => update({ name: event.target.value })}
                    placeholder="Enter metric name"
                    className="rounded-[12px]"
                    aria-label="Metric name"
                />
            </div>
            <div>
                <FieldLabel>Metric Description</FieldLabel>
                <Input
                    value={values.description}
                    onChange={(event) => update({ description: event.target.value })}
                    placeholder="Enter metric description"
                    className="rounded-[12px]"
                    aria-label="Metric description"
                />
            </div>
            <div>
                <FieldLabel>SQL Expression</FieldLabel>
                <Textarea
                    value={values.sqlExpression}
                    onChange={(event) => update({ sqlExpression: event.target.value })}
                    placeholder="Enter SQL expression"
                    rows={6}
                    className="min-h-[140px] resize-y rounded-[12px] font-mono luxia-type-metadata leading-relaxed"
                    aria-label="SQL expression"
                />
            </div>
        </div>
    );
}
