import { Columns3, Maximize2, PencilLine, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { ListPagination } from "@/app/features/shared/ListPagination";
import { SearchField } from "@/app/features/shared/SearchField";
import { LX } from "./tokens";
import type { DataTableColumn, DataTableRecord, DataTableRow } from "./types";
import { truncateValue } from "./utils";

const ROWS_PER_PAGE = 6;

const HEADER_ICON_BUTTON_CLASS =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const EXPANDED_DIALOG_CLASS =
    "z-[60] flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] w-[min(1440px,calc(100vw-64px))] max-w-[min(1440px,calc(100vw-64px))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1440px,calc(100vw-64px))]";

function PreviewToolbar({
    search,
    onSearchChange,
    searchRowsLabel,
    hideMutatingActions,
    editDetailsLabel,
    onEditDetails,
    onConfigureColumns,
}: {
    search: string;
    onSearchChange: (next: string) => void;
    searchRowsLabel: string;
    hideMutatingActions: boolean;
    editDetailsLabel: string;
    onEditDetails: () => void;
    onConfigureColumns: () => void;
}) {
    return (
        <div className="border-b px-6 py-4" style={{ borderColor: LX.border }}>
            <div className="flex flex-wrap items-center gap-2">
                <SearchField
                    density="dense"
                    value={search}
                    onChange={onSearchChange}
                    placeholder="Search rows..."
                    aria-label={searchRowsLabel}
                    clearable={false}
                    style={{ background: "transparent" }}
                />
                {!hideMutatingActions ? (
                    <>
                        <Button variant="outline" className="px-4" onClick={onEditDetails}>
                            <PencilLine size={14} />
                            {editDetailsLabel}
                        </Button>
                        <Button variant="outline" className="px-4" onClick={onConfigureColumns}>
                            <Columns3 size={14} />
                            Configure columns
                        </Button>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function PreviewTableRegion({
    table,
    filteredRows,
    pageRows,
    activeColumns,
    shareAvailableWidth,
    emptyTitle,
    emptyBody,
}: {
    table: DataTableRecord;
    filteredRows: DataTableRow[];
    pageRows: DataTableRow[];
    activeColumns: DataTableColumn[];
    shareAvailableWidth: boolean;
    emptyTitle: string;
    emptyBody: string;
}) {
    return (
        <div className="min-h-0 flex-1 overflow-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-6 py-5">
            {filteredRows.length === 0 ? (
                <div
                    className="flex h-full items-center justify-center rounded-[18px] border border-dashed px-6 py-12 text-center"
                    style={{ borderColor: LX.border }}
                >
                    <div className="max-w-[520px]">
                        <h3 className="luxia-type-title-panel" style={{ color: LX.primary }}>
                            {table.rows.length === 0 ? emptyTitle : "No rows match your search"}
                        </h3>
                        <p className="mt-2 luxia-type-body-dense" style={{ color: LX.textMuted }}>
                            {table.rows.length === 0
                                ? emptyBody
                                : "Try a broader search or clear the row filter."}
                        </p>
                    </div>
                </div>
            ) : (
                <div
                    className="w-full overflow-hidden rounded-[18px] border"
                    style={{ borderColor: LX.border }}
                >
                    <div className="w-full overflow-x-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-horizontal">
                        <table
                            className={
                                shareAvailableWidth
                                    ? "w-full min-w-full table-fixed caption-bottom luxia-type-table-cell"
                                    : "w-full min-w-full caption-bottom luxia-type-table-cell"
                            }
                        >
                            <TableHeader>
                                <TableRow style={{ background: LX.subtle }}>
                                    {activeColumns.map((column) => (
                                        <TableHead
                                            key={column.id}
                                            className="sticky top-0 z-10 luxia-type-table-header-dense"
                                            style={{
                                                width: shareAvailableWidth
                                                    ? `${100 / activeColumns.length}%`
                                                    : undefined,
                                                minWidth: shareAvailableWidth
                                                    ? undefined
                                                    : column.type === "Text"
                                                      ? 160
                                                      : 120,
                                                background: LX.subtle,
                                            }}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        className="block truncate font-semibold"
                                                        style={{ color: LX.primary }}
                                                    >
                                                        {column.displayName}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent sideOffset={6}>
                                                    {column.displayName}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageRows.map((row) => (
                                    <TableRow key={row.id}>
                                        {activeColumns.map((column) => {
                                            const value = row.values[column.id] ?? "—";
                                            return (
                                                <TableCell key={column.id} className="align-top">
                                                    <span
                                                        className="block truncate luxia-type-table-cell-dense"
                                                        style={{ color: LX.primary }}
                                                    >
                                                        {truncateValue(
                                                            value,
                                                            shareAvailableWidth ? 48 : 44,
                                                        )}
                                                    </span>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function PreviewFooter({
    filteredCount,
    safePage,
    totalPages,
    onPageChange,
    paginationLabel,
}: {
    filteredCount: number;
    safePage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    paginationLabel: string;
}) {
    return (
        <div className="shrink-0 border-t px-6 py-4" style={{ borderColor: LX.border }}>
            {filteredCount === 0 ? (
                <p className="luxia-type-metadata" style={{ color: LX.textMuted }}>
                    0 rows shown
                </p>
            ) : (
                <ListPagination
                    page={safePage}
                    pageCount={totalPages}
                    onPageChange={onPageChange}
                    totalItems={filteredCount}
                    pageSize={ROWS_PER_PAGE}
                    ariaLabel={paginationLabel}
                />
            )}
        </div>
    );
}

function HeaderIconButton({
    label,
    onClick,
    children,
    tooltip,
    tone = "drawer",
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
    tooltip?: string;
    tone?: "drawer" | "dialog";
}) {
    const button = (
        <button
            type="button"
            className={
                tone === "dialog"
                    ? `${HEADER_ICON_BUTTON_CLASS} !border-[var(--luxia-opacity-white-24)] !text-[var(--luxia-text-inverse)] hover:!bg-[var(--luxia-opacity-white-12)]`
                    : HEADER_ICON_BUTTON_CLASS
            }
            style={
                tone === "drawer"
                    ? { borderColor: LX.border, color: LX.textMuted }
                    : undefined
            }
            onClick={onClick}
            aria-label={label}
        >
            {children}
        </button>
    );

    if (!tooltip) return button;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

export function TablePreviewDrawer({
    table,
    open,
    onOpenChange,
    onEditDetails,
    onConfigureColumns,
    entityKind = "table",
    hideMutatingActions = false,
}: {
    table: DataTableRecord | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEditDetails: () => void;
    onConfigureColumns: () => void;
    /** Local copy context — defaults preserve Active Data Tables labels. */
    entityKind?: "table" | "view";
    /** Hide edit/configure when surface is read-only. */
    hideMutatingActions?: boolean;
}) {
    const isView = entityKind === "view";
    const editDetailsLabel = isView ? "Edit view details" : "Edit table details";
    const searchRowsLabel = isView ? "Search view rows" : "Search table rows";
    const emptyTitle = isView ? "No rows in this view" : "No rows in this table";
    const emptyBody = isView ? "This view currently has no rows." : "This table currently has no rows.";
    const paginationLabel = isView ? "View preview pagination" : "Table preview pagination";
    const closeDrawerLabel = isView ? "Close view preview" : "Close preview";
    const expandLabel = isView ? "Expand view preview" : "Expand preview";
    const closeExpandedLabel = isView ? "Close expanded view preview" : "Close expanded preview";

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(false);

    const filteredRows = useMemo(() => {
        if (!table) return [];
        const lowered = search.trim().toLowerCase();
        const columns = table.columns.filter((column) => column.active);
        if (!lowered) return table.rows;
        return table.rows.filter((row) =>
            columns.some((column) =>
                [column.displayName, column.originalName, row.values[column.id] ?? ""]
                    .join(" ")
                    .toLowerCase()
                    .includes(lowered),
            ),
        );
    }, [search, table]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const activeColumns = useMemo(
        () => (table ? table.columns.filter((column) => column.active) : []),
        [table],
    );
    const shareAvailableWidth = activeColumns.length > 0 && activeColumns.length <= 6;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        if (!open) setExpanded(false);
    }, [open]);

    const pageRows = useMemo(
        () => filteredRows.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE),
        [filteredRows, safePage],
    );

    if (!table) return null;

    const handleSearchChange = (next: string) => {
        setSearch(next);
        setPage(1);
    };

    const previewBody = (keyPrefix: string) => (
        <>
            <PreviewToolbar
                key={`${keyPrefix}-toolbar`}
                search={search}
                onSearchChange={handleSearchChange}
                searchRowsLabel={searchRowsLabel}
                hideMutatingActions={hideMutatingActions}
                editDetailsLabel={editDetailsLabel}
                onEditDetails={onEditDetails}
                onConfigureColumns={onConfigureColumns}
            />
            <PreviewTableRegion
                key={`${keyPrefix}-table`}
                table={table}
                filteredRows={filteredRows}
                pageRows={pageRows}
                activeColumns={activeColumns}
                shareAvailableWidth={shareAvailableWidth}
                emptyTitle={emptyTitle}
                emptyBody={emptyBody}
            />
            <PreviewFooter
                key={`${keyPrefix}-footer`}
                filteredCount={filteredRows.length}
                safePage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                paginationLabel={paginationLabel}
            />
        </>
    );

    return (
        <>
            <Drawer
                open={open}
                direction="right"
                onOpenChange={(next) => {
                    // Esc/outside while expanded collapses expand first; drawer stays open.
                    if (!next && expanded) {
                        setExpanded(false);
                        return;
                    }
                    onOpenChange(next);
                }}
            >
                <DrawerContent className="w-[min(96vw,1280px)] max-w-none p-0">
                    <div className="flex h-full flex-col" style={{ background: LX.surface }}>
                        <DrawerHeader className="border-b" style={{ borderColor: LX.border }}>
                            <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <DrawerTitle
                                        className="truncate luxia-type-title-modal"
                                        style={{ color: LX.primary }}
                                    >
                                        {table.displayName}
                                    </DrawerTitle>
                                    {isView ? (
                                        <p
                                            className="mt-1 truncate luxia-type-caption"
                                            style={{ color: LX.textMuted }}
                                        >
                                            {table.originalName}
                                        </p>
                                    ) : null}
                                    {table.description ? (
                                        <DrawerDescription
                                            className="mt-1.5 max-w-[80ch] luxia-type-metadata"
                                            style={{ color: LX.textMuted }}
                                        >
                                            {table.description}
                                        </DrawerDescription>
                                    ) : null}
                                    <p
                                        className="mt-2 luxia-type-metadata"
                                        style={{ color: LX.textMuted }}
                                    >
                                        {filteredRows.length} rows
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <HeaderIconButton
                                        label={expandLabel}
                                        tooltip="Expand preview"
                                        onClick={() => setExpanded(true)}
                                    >
                                        <Maximize2 size={15} />
                                    </HeaderIconButton>
                                    <HeaderIconButton
                                        label={closeDrawerLabel}
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <X size={15} />
                                    </HeaderIconButton>
                                </div>
                            </div>
                        </DrawerHeader>
                        {previewBody("drawer")}
                    </div>
                </DrawerContent>
            </Drawer>

            <Dialog
                open={open && expanded}
                onOpenChange={(next) => {
                    if (!next) setExpanded(false);
                }}
            >
                <DialogContent
                    hideCloseButton
                    overlayClassName="z-[60]"
                    className={EXPANDED_DIALOG_CLASS}
                >
                    <div className="flex min-h-0 flex-1 flex-col" style={{ background: LX.surface }}>
                        <DialogHeader className="shrink-0">
                            <div className="flex items-start gap-3 pr-2">
                                <div className="min-w-0 flex-1">
                                    <DialogTitle className="truncate text-left">
                                        {table.displayName}
                                    </DialogTitle>
                                    {isView ? (
                                        <DialogDescription className="mt-1 truncate text-left">
                                            {table.originalName}
                                        </DialogDescription>
                                    ) : (
                                        <DialogDescription className="sr-only">
                                            Expanded table preview
                                        </DialogDescription>
                                    )}
                                    {table.description ? (
                                        <p
                                            className="mt-1.5 max-w-[80ch] luxia-type-metadata"
                                            style={{ color: "var(--luxia-purple-10)" }}
                                        >
                                            {table.description}
                                        </p>
                                    ) : null}
                                    <p
                                        className="mt-2 luxia-type-metadata"
                                        style={{ color: "var(--luxia-purple-10)" }}
                                    >
                                        {filteredRows.length} rows
                                    </p>
                                </div>
                                <HeaderIconButton
                                    label={closeExpandedLabel}
                                    tone="dialog"
                                    onClick={() => setExpanded(false)}
                                >
                                    <X size={15} />
                                </HeaderIconButton>
                            </div>
                        </DialogHeader>
                        {previewBody("expanded")}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
