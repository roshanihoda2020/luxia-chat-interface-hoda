import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { CrawlerForm, type CrawlerFormValues, isCrawlerFormValid } from "./CrawlerForm";

const EMPTY: CrawlerFormValues = { url: "", description: "", exactSearch: false };

function CrawlerFormDialog({ open, onOpenChange, mode, initialValues, onSubmit }: {
    open: boolean; onOpenChange: (open: boolean) => void; mode: "add" | "edit";
    initialValues?: CrawlerFormValues; onSubmit: (values: CrawlerFormValues) => void;
}) {
    const [values, setValues] = useState<CrawlerFormValues>(EMPTY);
    useEffect(() => { if (open) setValues(initialValues ?? EMPTY); }, [open, initialValues]);
    const valid = isCrawlerFormValid(values);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,480px)] rounded-[16px]">
                <DialogHeader>
                    <DialogTitle className="luxia-type-title-panel">{mode === "add" ? "Add crawler URL" : "Edit crawler URL"}</DialogTitle>
                </DialogHeader>
                <CrawlerForm values={values} onChange={setValues} />
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button type="button" variant="secondary" className="px-4" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="button" className="px-4" disabled={!valid} onClick={() => { onSubmit({ ...values, url: values.url.trim() }); onOpenChange(false); }}>{mode === "add" ? "Add" : "Update"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AddCrawlerDialog(props: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (v: CrawlerFormValues) => void }) {
    return <CrawlerFormDialog open={props.open} onOpenChange={props.onOpenChange} mode="add" onSubmit={props.onAdd} />;
}

export function EditCrawlerDialog(props: { open: boolean; onOpenChange: (o: boolean) => void; initialValues: CrawlerFormValues; onUpdate: (v: CrawlerFormValues) => void }) {
    return <CrawlerFormDialog open={props.open} onOpenChange={props.onOpenChange} mode="edit" initialValues={props.initialValues} onSubmit={props.onUpdate} />;
}
