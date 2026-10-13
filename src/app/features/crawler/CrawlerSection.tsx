import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/app/features/shared/ConfirmDialog";
import {
    DESTRUCTIVE_CONFIRM,
    DESTRUCTIVE_REMOVE_DELAY_MS,
} from "@/app/features/shared/destructiveConfirmCopy";
import { luxiaToast } from "@/app/features/shared/luxiaToast";
import { CompactCrawlerList } from "./CompactCrawlerList";
import { CrawlerManager } from "./CrawlerManager";
import { EditCrawlerDialog } from "./EditCrawlerDialog";
import { ViewCrawlerDialog } from "./ViewCrawlerDialog";
import type { CrawlerState } from "./types";
import { cloneCrawlerState } from "./utils";

/**
 * Chat capsule Crawler URLs — expandable summary + dialog shortcut.
 * Reads/writes the same Constellation `bundle.crawler` as Settings.
 */
export function CrawlerSection({
    state,
    onCommitState,
    isOpen,
    onToggle,
    readOnly = false,
}: {
    state: CrawlerState;
    onCommitState: (next: CrawlerState) => void;
    isOpen: boolean;
    onToggle: () => void;
    readOnly?: boolean;
}) {
    const [managerOpen, setManagerOpen] = useState(false);
    const [viewId, setViewId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const removeTimerRef = useRef<number | null>(null);

    const visibleEntries = useMemo(
        () => state.entries.filter((e) => !e.markedForRemoval),
        [state.entries],
    );
    const viewItem = visibleEntries.find((e) => e.id === viewId) ?? null;
    const editItem = visibleEntries.find((e) => e.id === editId) ?? null;

    useEffect(() => {
        return () => {
            if (removeTimerRef.current !== null) {
                window.clearTimeout(removeTimerRef.current);
            }
        };
    }, []);

    function commit(next: CrawlerState) {
        if (readOnly) return;
        onCommitState(cloneCrawlerState(next));
    }

    function confirmRemove() {
        if (readOnly || !confirmRemoveId || removing) return;
        const removeId = confirmRemoveId;
        setRemoving(true);
        removeTimerRef.current = window.setTimeout(() => {
            removeTimerRef.current = null;
            try {
                commit({
                    ...state,
                    entries: state.entries.filter((e) => e.id !== removeId),
                });
                if (viewId === removeId) setViewId(null);
                if (editId === removeId) setEditId(null);
                luxiaToast.success(DESTRUCTIVE_CONFIRM.crawler.successToast);
                setConfirmRemoveId(null);
            } catch {
                luxiaToast.error(DESTRUCTIVE_CONFIRM.crawler.errorToast);
            } finally {
                setRemoving(false);
            }
        }, DESTRUCTIVE_REMOVE_DELAY_MS);
    }

    return (
        <>
            <CompactCrawlerList
                entries={visibleEntries}
                isOpen={isOpen}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
                onView={(id) => setViewId(id)}
                onEdit={readOnly ? undefined : (id) => setEditId(id)}
                onRemove={readOnly ? undefined : (id) => setConfirmRemoveId(id)}
                readOnly={readOnly}
            />

            <CrawlerManager
                open={managerOpen}
                state={state}
                onCommit={(next) => {
                    if (readOnly) return;
                    onCommitState(next);
                }}
                onCancel={() => setManagerOpen(false)}
            />

            {!readOnly && editItem ? (
                <EditCrawlerDialog
                    open={Boolean(editId)}
                    onOpenChange={(o) => {
                        if (!o) setEditId(null);
                    }}
                    initialValues={{
                        url: editItem.url,
                        description: editItem.description,
                        exactSearch: editItem.exactSearch,
                    }}
                    onUpdate={(values) => {
                        commit({
                            ...state,
                            entries: state.entries.map((e) =>
                                e.id === editId
                                    ? {
                                        ...e,
                                        url: values.url.trim(),
                                        description: values.description.trim(),
                                        exactSearch: values.exactSearch,
                                    }
                                    : e,
                            ),
                        });
                        setEditId(null);
                        luxiaToast.success("Crawler URL updated");
                    }}
                />
            ) : null}

            <ViewCrawlerDialog
                open={Boolean(viewItem)}
                onOpenChange={(o) => {
                    if (!o) setViewId(null);
                }}
                item={viewItem}
            />

            <ConfirmDialog
                open={Boolean(confirmRemoveId)}
                onOpenChange={(next) => {
                    if (!next && !removing) setConfirmRemoveId(null);
                }}
                tone="destructive"
                title={DESTRUCTIVE_CONFIRM.crawler.title}
                description={DESTRUCTIVE_CONFIRM.crawler.description}
                cancelLabel="Cancel"
                confirmLabel={DESTRUCTIVE_CONFIRM.crawler.confirmLabel}
                busy={removing}
                busyLabel={DESTRUCTIVE_CONFIRM.crawler.busyLabel}
                onConfirm={confirmRemove}
            />
        </>
    );
}
