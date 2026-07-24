import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { MetricForm, type MetricFormValues } from "./MetricForm";
import { isMetricValid } from "./utils";

const EMPTY_VALUES: MetricFormValues = {
    name: "",
    description: "",
    sqlExpression: "",
};

function MetricFormDialog({
    open,
    onOpenChange,
    mode,
    initialValues,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "add" | "edit";
    initialValues?: MetricFormValues;
    onSubmit: (values: MetricFormValues) => void;
}) {
    const [values, setValues] = useState<MetricFormValues>(EMPTY_VALUES);

    useEffect(() => {
        if (!open) return;
        setValues(initialValues ?? EMPTY_VALUES);
    }, [open, initialValues]);

    const valid = isMetricValid(values);

    function handleSubmit() {
        if (!valid) return;
        onSubmit(values);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,560px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">
                        {mode === "add" ? "Add metric" : "Edit metric"}
                    </DialogTitle>
                </DialogHeader>
                <MetricForm values={values} onChange={setValues} />
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="rounded-full px-4" disabled={!valid} onClick={handleSubmit}>
                        {mode === "add" ? "Add" : "Update"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AddMetricDialog({
    open,
    onOpenChange,
    onAdd,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (values: MetricFormValues) => void;
}) {
    return <MetricFormDialog open={open} onOpenChange={onOpenChange} mode="add" onSubmit={onAdd} />;
}

export function EditMetricDialog({
    open,
    onOpenChange,
    initialValues,
    onUpdate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: MetricFormValues;
    onUpdate: (values: MetricFormValues) => void;
}) {
    return (
        <MetricFormDialog
            open={open}
            onOpenChange={onOpenChange}
            mode="edit"
            initialValues={initialValues}
            onSubmit={onUpdate}
        />
    );
}
