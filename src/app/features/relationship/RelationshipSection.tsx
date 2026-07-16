import { useEffect, useMemo, useState } from "react";
import { CompactRelationshipList } from "./CompactRelationshipList";
import { INITIAL_RELATIONSHIPS } from "./data";
import { RelationshipManager } from "./RelationshipManager";
import type { RelationshipRecord } from "./types";
import { cloneRelationships, relationshipsSignature } from "./utils";

export function RelationshipSection({ isOpen, onToggle, onSignatureChange }: { isOpen: boolean; onToggle: () => void; onSignatureChange?: (signature: string) => void }) {
    const [relationships, setRelationships] = useState<RelationshipRecord[]>(() => cloneRelationships(INITIAL_RELATIONSHIPS));
    const [compactSearch, setCompactSearch] = useState("");
    const [managerOpen, setManagerOpen] = useState(false);

    const visibleRelationships = useMemo(
        () => relationships.filter((item) => !item.markedForRemoval),
        [relationships],
    );

    useEffect(() => {
        onSignatureChange?.(relationshipsSignature(relationships));
    }, [relationships, onSignatureChange]);

    return (
        <>
            <CompactRelationshipList
                relationships={visibleRelationships}
                isOpen={isOpen}
                search={compactSearch}
                onSearchChange={setCompactSearch}
                onToggle={onToggle}
                onOpenManager={() => setManagerOpen(true)}
            />

            <RelationshipManager
                open={managerOpen}
                relationships={relationships}
                onCommit={(next) => setRelationships(next)}
                onCancel={() => setManagerOpen(false)}
            />
        </>
    );
}
