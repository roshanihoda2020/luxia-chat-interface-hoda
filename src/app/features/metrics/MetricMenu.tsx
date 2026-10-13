import { Eye, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { LX } from "./tokens";

const VIEWPORT_PADDING = 12;

export function MetricMenu({
    onView,
    onEdit,
    onRemove,
}: {
    onView: () => void;
    onEdit?: () => void;
    onRemove?: () => void;
}) {
    const canEdit = typeof onEdit === "function";
    const canRemove = typeof onRemove === "function";
    const [open, setOpen] = useState(false);
    const triggerWrapRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!open) return;

        function updatePosition() {
            const trigger = triggerWrapRef.current;
            const menu = menuRef.current;
            if (!trigger) return;

            const rect = trigger.getBoundingClientRect();
            const menuHeight = menu?.offsetHeight ?? 140;
            const menuWidth = menu?.offsetWidth ?? 180;

            let top = rect.bottom + 6;
            let left = rect.right;

            if (top + menuHeight > window.innerHeight - VIEWPORT_PADDING) {
                top = Math.max(VIEWPORT_PADDING, rect.top - menuHeight - 6);
            }
            if (left > window.innerWidth - VIEWPORT_PADDING) {
                left = window.innerWidth - VIEWPORT_PADDING;
            }
            if (left - menuWidth < VIEWPORT_PADDING) {
                left = VIEWPORT_PADDING + menuWidth;
            }

            setMenuStyle({
                position: "fixed",
                top,
                left,
                transform: "translateX(-100%)",
                zIndex: 9999,
            });
        }

        updatePosition();
        const frame = window.requestAnimationFrame(updatePosition);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.cancelAnimationFrame(frame);
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

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                (triggerWrapRef.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
            }
        }

        window.addEventListener("mousedown", handleOutside);
        window.addEventListener("keydown", handleEscape, true);
        return () => {
            window.removeEventListener("mousedown", handleOutside);
            window.removeEventListener("keydown", handleEscape, true);
        };
    }, [open]);

    function runAction(action: () => void) {
        setOpen(false);
        requestAnimationFrame(() => {
            action();
            (triggerWrapRef.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
        });
    }

    const menu = open ? createPortal(
        <div
            ref={menuRef}
            role="menu"
            aria-label="Metric actions"
            className="min-w-[160px] max-w-[min(280px,calc(100vw-24px))] overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical rounded-[14px] border p-1 z-[9999]"
            style={{
                ...menuStyle,
                pointerEvents: "auto",
                background: LX.surface,
                borderColor: LX.border,
                boxShadow: LX.shadow.lg,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
        >
            <button type="button" role="menuitem" onClick={() => runAction(onView)} className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-1" style={{ color: LX.primary }}>
                <Eye size={14} />View
            </button>
            {canEdit ? (
                <button type="button" role="menuitem" onClick={() => runAction(onEdit)} className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-1" style={{ color: LX.primary }}>
                    <PencilLine size={14} />Edit
                </button>
            ) : null}
            {canRemove ? (
                <>
                    <Separator className="my-1" />
                    <button type="button" role="menuitem" onClick={() => runAction(onRemove)} className="flex w-full cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2 text-left luxia-type-body-dense-strong outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-1" style={{ color: LX.error }}>
                        <Trash2 size={14} />Remove
                    </button>
                </>
            ) : null}
        </div>,
        document.body,
    ) : null;

    return (
        <>
            <div ref={triggerWrapRef} className="inline-flex" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 "
                    aria-label="Open metric actions"
                    aria-expanded={open}
                    aria-haspopup="menu"
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
