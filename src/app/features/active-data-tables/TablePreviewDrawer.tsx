import { Columns3, PencilLine, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { ListPagination } from "@/app/features/shared/ListPagination";
import { SearchField } from "@/app/features/shared/SearchField";
import { LX } from "./tokens";
import type { DataTableRecord } from "./types";
import { truncateValue } from "./utils";

export function TablePreviewDrawer({
    table,
    open,
    onOpenChange,
    onEditDetails,
    onConfigureColumns,
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditDetails: () => void;
    onConfigureColumns: () => void;
}) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 6;

    const filteredRows = useMemo(() => {
        if (!table) return [];
        const lowered = search.trim().toLowerCase();
        const activeColumns = table.columns.filter((column) => column.active);
        if (!lowered) return table.rows;
        return table.rows.filter((row) => activeColumns.some((column) => [column.displayName, column.originalName, row.values[column.id] ?? ""].join(" ").toLowerCase().includes(lowered)));
    }, [search, table]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
    const safePage = Math.min(page, totalPages);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pageRows = useMemo(
        () => filteredRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage),
        [filteredRows, safePage, rowsPerPage],
    );

    if (!table) return null;

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className="p-0 w-[min(96vw,1280px)] max-w-none">
                <div className="flex h-full flex-col" style={{ background: LX.surface }}>
                    <DrawerHeader className="border-b" style={{ borderColor: LX.border }}>
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <DrawerTitle className="truncate luxia-type-title-modal" style={{ color: LX.primary }}>{table.displayName}</DrawerTitle>
                                {table.description ? <DrawerDescription className="mt-1.5 max-w-[80ch] luxia-type-metadata" style={{ color: LX.textMuted }}>{table.description}</DrawerDescription> : null}
                                <p className="mt-2 luxia-type-metadata" style={{ color: LX.textMuted }}>{filteredRows.length} rows</p>
                            </div>
                            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ borderColor: LX.border, color: LX.textMuted }} onClick={() => onOpenChange(false)} aria-label="Close preview"><X size={15} /></button>
                        </div>
                    </DrawerHeader>

                    <div className="border-b px-6 py-4" style={{ borderColor: LX.border }}>
                        <div className="flex flex-wrap items-center gap-2">
                            <SearchField
                                density="dense"
                                value={search}
                                onChange={(next) => {
                                    setSearch(next);
                                    setPage(1);
                                }}
                                placeholder="Search rows..."
                                aria-label="Search table rows"
                                clearable={false}
                                style={{ background: "transparent" }}
                            />
                            <Button variant="outline" className="px-4" onClick={onEditDetails}><PencilLine size={14} />Edit table details</Button>
                            <Button variant="outline" className="px-4" onClick={onConfigureColumns}><Columns3 size={14} />Configure columns</Button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
                        {filteredRows.length === 0 ? (
                            <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed px-6 py-12 text-center" style={{ borderColor: LX.border }}>
                                <div className="max-w-[520px]">
                                    <h3 className="luxia-type-title-panel" style={{ color: LX.primary }}>{table.rows.length === 0 ? "No rows in this table" : "No rows match your search"}</h3>
                                    <p className="mt-2 luxia-type-body-dense" style={{ color: LX.textMuted }}>{table.rows.length === 0 ? "This table currently has no rows." : "Try a broader search or clear the row filter."}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[18px] border" style={{ borderColor: LX.border }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow style={{ background: LX.subtle }}>
                                            {table.columns.filter((column) => column.active).map((column) => (
                                                <TableHead key={column.id} className="sticky top-0 z-10 luxia-type-table-header-dense" style={{ minWidth: column.type === "Text" ? 220 : 150, background: LX.subtle }}>
                                                    <Tooltip><TooltipTrigger asChild><span className="block truncate font-semibold" style={{ color: LX.primary }}>{column.displayName}</span></TooltipTrigger><TooltipContent sideOffset={6}>{column.displayName}</TooltipContent></Tooltip>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageRows.map((row) => (
                                            <TableRow key={row.id}>
                                                {table.columns.filter((column) => column.active).map((column) => {
                                                    const value = row.values[column.id] ?? "—";
                                                    return <TableCell key={column.id} className="align-top"><span className="block max-w-[280px] truncate luxia-type-table-cell-dense" style={{ color: LX.primary }}>{truncateValue(value, 44)}</span></TableCell>;
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <div className="border-t px-6 py-4" style={{ borderColor: LX.border }}>
                        {filteredRows.length === 0 ? (
                            <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>0 rows shown</p>
                        ) : (
                            <ListPagination
                                page={safePage}
                                pageCount={totalPages}
                                onPageChange={setPage}
                                totalItems={filteredRows.length}
                                pageSize={rowsPerPage}
                                ariaLabel="Table preview pagination"
                            />
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
