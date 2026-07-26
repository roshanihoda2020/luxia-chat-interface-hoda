import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { DatasourceFileSelector } from "./DatasourceFileSelector";
import { UploadExtraContextFilePanel } from "./UploadExtraContextFilePanel";
import { LX } from "./tokens";
import type { DatasourceCatalogFile, ExtraContextFile } from "./types";

export function AddExtraContextFilesDialog({
    open,
    onOpenChange,
    catalog,
    linkedFiles,
    onAddUpload,
    onAddDatasource,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    catalog: DatasourceCatalogFile[];
    linkedFiles: ExtraContextFile[];
    onAddUpload: (file: ExtraContextFile) => void;
    onAddDatasource: (files: DatasourceCatalogFile[]) => void;
}) {
    const [tab, setTab] = useState("upload");

    function handleUploadAdd(file: ExtraContextFile) {
        onAddUpload(file);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="overflow-hidden p-0" style={{ width: "min(92vw, 560px)", maxWidth: "min(92vw, 560px)" }}>
                <DialogHeader className="border-b px-6 py-5 text-left" style={{ borderColor: LX.border }}>
                    <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="luxia-type-title-modal" style={{ color: LX.primary }}>Add files</DialogTitle>
                            <DialogDescription className="sr-only">Upload a file or add from datasource.</DialogDescription>
                        </div>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" aria-label="Close add files" onClick={() => onOpenChange(false)}>
                            <X size={15} style={{ color: LX.textMuted }} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="px-6 py-5">
                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="mb-4 h-9 rounded-[10px] p-1" style={{ background: LX.subtle, border: `1px solid ${LX.border}` }}>
                            <TabsTrigger value="upload" className="rounded-[8px] px-4 luxia-type-metadata data-[state=active]:bg-white">Upload File</TabsTrigger>
                            <TabsTrigger value="datasource" className="rounded-[8px] px-4 luxia-type-metadata data-[state=active]:bg-white">Add From Datasource</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-0">
                            <UploadExtraContextFilePanel
                                onAdd={handleUploadAdd}
                                onCancel={() => onOpenChange(false)}
                            />
                        </TabsContent>
                        <TabsContent value="datasource" className="mt-0">
                            <DatasourceFileSelector
                                catalog={catalog}
                                linkedFiles={linkedFiles}
                                onAdd={(files) => { onAddDatasource(files); onOpenChange(false); }}
                                onCancel={() => onOpenChange(false)}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
