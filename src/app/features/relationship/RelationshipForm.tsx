import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { RELATIONSHIP_TYPES, TABLE_OPTIONS } from "./data";
import { LX } from "./tokens";
import type { RelationshipType } from "./types";
import { loadTableColumns } from "./utils";

export interface RelationshipFormValues {
    type: RelationshipType | "";
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    active: boolean;
}

const SELECT_CONTENT_CLASS = "z-[9999] max-h-[min(280px,50vh)]";

function MappingSide({
    label,
    table,
    column,
    columns,
    loading,
    error,
    onTableChange,
    onColumnChange,
}: {
    label: "From" | "To";
    table: string;
    column: string;
    columns: string[];
    loading: boolean;
    error: boolean;
    onTableChange: (table: string) => void;
    onColumnChange: (column: string) => void;
}) {
    const tableLabel = label === "From" ? "From table" : "To table";
    const columnLabel = label === "From" ? "From column" : "To column";

    return (
        <div className="min-w-0 space-y-2">
            <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{label}</p>
            <Select value={table || undefined} onValueChange={onTableChange}>
                <SelectTrigger className="w-full rounded-[12px]" aria-label={tableLabel}>
                    <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS} position="popper" sideOffset={6}>
                    {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={column || undefined}
                onValueChange={onColumnChange}
                disabled={!table || loading || error}
            >
                <SelectTrigger className="w-full rounded-[12px]" aria-label={columnLabel}>
                    <SelectValue placeholder={loading ? "Loading columns…" : "Select column"} />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS} position="popper" sideOffset={6}>
                    {columns.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {loading ? <p className="luxia-type-caption" style={{ color: LX.textMuted }}>Loading columns…</p> : null}
            {error ? <p className="luxia-type-caption" style={{ color: LX.error }} role="alert">Could not load columns. Try again.</p> : null}
        </div>
    );
}

export function RelationshipForm({
    values,
    onChange,
}: {
    values: RelationshipFormValues;
    onChange: (next: RelationshipFormValues) => void;
}) {
    const [fromColumns, setFromColumns] = useState<string[]>([]);
    const [toColumns, setToColumns] = useState<string[]>([]);
    const [fromLoading, setFromLoading] = useState(false);
    const [toLoading, setToLoading] = useState(false);
    const [fromError, setFromError] = useState(false);
    const [toError, setToError] = useState(false);

    useEffect(() => {
        if (!values.fromTable) {
            setFromColumns([]);
            setFromLoading(false);
            setFromError(false);
            return;
        }

        let cancelled = false;
        setFromLoading(true);
        setFromError(false);
        loadTableColumns(values.fromTable)
            .then((nextColumns) => {
                if (cancelled) return;
                setFromColumns(nextColumns);
                setFromLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setFromColumns([]);
                setFromLoading(false);
                setFromError(true);
            });

        return () => { cancelled = true; };
    }, [values.fromTable]);

    useEffect(() => {
        if (!values.toTable) {
            setToColumns([]);
            setToLoading(false);
            setToError(false);
            return;
        }

        let cancelled = false;
        setToLoading(true);
        setToError(false);
        loadTableColumns(values.toTable)
            .then((nextColumns) => {
                if (cancelled) return;
                setToColumns(nextColumns);
                setToLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setToColumns([]);
                setToLoading(false);
                setToError(true);
            });

        return () => { cancelled = true; };
    }, [values.toTable]);

    function update(patch: Partial<RelationshipFormValues>) {
        onChange({ ...values, ...patch });
    }

    return (
        <div className="space-y-3">
            <Select value={values.type || undefined} onValueChange={(value) => update({ type: value as RelationshipType })}>
                <SelectTrigger className="w-full rounded-[12px]" aria-label="Relationship type">
                    <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASS} position="popper" sideOffset={6}>
                    {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
                <MappingSide
                    label="From"
                    table={values.fromTable}
                    column={values.fromColumn}
                    columns={fromColumns}
                    loading={fromLoading}
                    error={fromError}
                    onTableChange={(fromTable) => update({ fromTable, fromColumn: "" })}
                    onColumnChange={(fromColumn) => update({ fromColumn })}
                />

                <div className="flex items-center justify-center py-1 md:pt-7">
                    <ArrowDown size={16} className="md:hidden" style={{ color: LX.textMuted }} aria-hidden />
                    <ArrowRight size={16} className="hidden md:block" style={{ color: LX.textMuted }} aria-hidden />
                </div>

                <MappingSide
                    label="To"
                    table={values.toTable}
                    column={values.toColumn}
                    columns={toColumns}
                    loading={toLoading}
                    error={toError}
                    onTableChange={(toTable) => update({ toTable, toColumn: "" })}
                    onColumnChange={(toColumn) => update({ toColumn })}
                />
            </div>

            <div className="flex items-center justify-between rounded-[12px] border px-3 py-2.5" style={{ borderColor: LX.border, background: LX.subtle }}>
                <span className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>Active</span>
                <Switch
                    checked={values.active}
                    onCheckedChange={(active) => update({ active })}
                    aria-label="Relationship active"
                />
            </div>
        </div>
    );
}
