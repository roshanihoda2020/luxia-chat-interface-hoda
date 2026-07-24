import { ArrowDown, ArrowUp, Columns3, Eye, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { LX } from "./tokens";

export function TableRowMenu({
    onMoveUp,
    onMoveDown,
    disableMoveUp,
    disableMoveDown,
    onView,
    onEditDetails,
    onConfigureColumns,
    onRemove,
}: {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    disableMoveUp?: boolean;
    disableMoveDown?: boolean;
    onView: () => void;
    onEditDetails: () => void;
    onConfigureColumns: () => void;
    onRemove: () => void;
}) {
    const [open, setOpen] = useState(false);
    const triggerWrapRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!open) return;

        function updatePosition() {
            const trigger = triggerWrapRef.current;
            if (!trigger) return;
            const rect = trigger.getBoundingClientRect();
            setMenuStyle({
                position: "fixed",
                top: rect.bottom + 6,
                left: rect.right,
                transform: "translateX(-100%)",
                zIndex: 9999,
            });
        }

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function handleOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (triggerWrapRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        }
        window.addEventListener("mousedown", handleOutside);
        return () => window.removeEventListener("mousedown", handleOutside);
    }, [open]);

    function runAction(action: () => void) {
        setOpen(false);
        requestAnimationFrame(() => {
            action();
        });
    }

    const menu = open ? createPortal(
        <div
            ref={menuRef}
            className="min-w-[220px] max-w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-[12px] border p-2"
            style={{
                ...menuStyle,
                pointerEvents: "auto",
                background: LX.surface,
                borderColor: LX.border,
                boxShadow: LX.shadow.md,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            {(onMoveUp || onMoveDown) && (
                <>
                    <button
                        type="button"
                        disabled={disableMoveUp || !onMoveUp}
                        onClick={() => onMoveUp && runAction(onMoveUp)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ color: LX.primary }}
                    >
                        <ArrowUp size={14} />Move up
                    </button>
                    <button
                        type="button"
                        disabled={disableMoveDown || !onMoveDown}
                        onClick={() => onMoveDown && runAction(onMoveDown)}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ color: LX.primary }}
                    >
                        <ArrowDown size={14} />Move down
                    </button>
                    <Separator className="my-1" />
                </>
            )}
            <button
                type="button"
                onClick={() => runAction(onView)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap"
                style={{ color: LX.primary }}
            >
                <Eye size={14} />View data
            </button>
            <button
                type="button"
                onClick={() => runAction(onEditDetails)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap"
                style={{ color: LX.primary }}
            >
                <PencilLine size={14} />Edit table details
            </button>
            <button
                type="button"
                onClick={() => runAction(onConfigureColumns)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap"
                style={{ color: LX.primary }}
            >
                <Columns3 size={14} />Configure columns
            </button>
            <Separator className="my-1" />
            <button
                type="button"
                onClick={() => runAction(onRemove)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap"
                style={{ color: LX.error }}
            >
                <Trash2 size={14} />Remove from constellation
            </button>
        </div>,
        document.body,
    ) : null;

    return (
        <>
            <div
                ref={triggerWrapRef}
                className="inline-flex"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    aria-label="Open table actions"
                    aria-expanded={open}
                    style={{ color: LX.textMuted }}
                    onClick={() => setOpen((current) => !current)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            setOpen((current) => !current);
                        }
                    }}
                >
                    <MoreHorizontal size={14} />
                </Button>
            </div>
            {menu}
        </>
    );
}
