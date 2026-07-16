import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { RelationshipForm, type RelationshipFormValues } from "./RelationshipForm";
import { isRelationshipValid } from "./utils";

const EMPTY_VALUES: RelationshipFormValues = {
    type: "",
    fromTable: "",
    fromColumn: "",
    toTable: "",
    toColumn: "",
    active: true,
};

function RelationshipFormDialog({
    open,
    onOpenChange,
    mode,
    initialValues,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "add" | "edit";
    initialValues?: RelationshipFormValues;
    onSubmit: (values: RelationshipFormValues) => void;
}) {
    const [values, setValues] = useState<RelationshipFormValues>(EMPTY_VALUES);

    useEffect(() => {
        if (!open) return;
        setValues(initialValues ?? EMPTY_VALUES);
    }, [open, initialValues]);

    const valid = isRelationshipValid(values);

    function handleSubmit() {
        if (!valid) return;
        onSubmit(values);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,560px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="text-[16px] font-extrabold">
                        {mode === "add" ? "Add relationship" : "Edit relationship"}
                    </DialogTitle>
                </DialogHeader>
                <RelationshipForm values={values} onChange={setValues} />
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button type="button" variant="secondary" className="rounded-full px-4" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" className="rounded-full px-4" disabled={!valid} onClick={handleSubmit}>
                        {mode === "add" ? "Add" : "Update"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AddRelationshipDialog({
    open,
    onOpenChange,
    onAdd,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (values: RelationshipFormValues) => void;
}) {
    return (
        <RelationshipFormDialog
            open={open}
            onOpenChange={onOpenChange}
            mode="add"
            onSubmit={onAdd}
        />
    );
}

export function EditRelationshipDialog({
    open,
    onOpenChange,
    initialValues,
    onUpdate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues: RelationshipFormValues;
    onUpdate: (values: RelationshipFormValues) => void;
}) {
    return (
        <RelationshipFormDialog
            open={open}
            onOpenChange={onOpenChange}
            mode="edit"
            initialValues={initialValues}
            onSubmit={onUpdate}
        />
    );
}
