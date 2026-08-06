import { getProjectNameById } from "@/app/features/project/data";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { FilterChip, FilterGroup } from "./browserShared";
import { EntityIdentityRow } from "./entityIdentity";
import { getSourceAccentColor, HS } from "./homeSurfaces";
import type { HomeEntityKey } from "./homeEntityKeys";
import type { HomeProjectCard, HomeRecentWorkItem } from "./types";
import { workItemEntityKey } from "./homeEntityKeys";

interface ChangePrimaryDialogProps {
  open: boolean;
  items: HomeRecentWorkItem[];
  currentKey: HomeEntityKey | null;
  projects: readonly HomeProjectCard[];
  onClose: () => void;
  onSelect: (entityKey: HomeEntityKey) => void;
}

type DialogEntityFilter = "all" | "chat" | "galaxy";

export function ChangePrimaryDialog({
  open,
  items,
  currentKey,
  projects,
  onClose,
  onSelect,
}: ChangePrimaryDialogProps) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<DialogEntityFilter>("all");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (entityFilter === "chat" && item.kind !== "chat") return false;
      if (entityFilter === "galaxy" && item.kind !== "galaxySession") return false;

      if (!q) return true;
      const projectName = getProjectNameById(item.projectId, projects);
      return (
        item.title.toLowerCase().includes(q)
        || projectName.toLowerCase().includes(q)
        || (item.constellationName ?? "").toLowerCase().includes(q)
        || (item.kind === "galaxySession" ? "galaxy" : "chat").includes(q)
        || (item.constellationSource ?? "").includes(q)
      );
    });
  }, [entityFilter, items, projects, query]);

  function handleClose() {
    setQuery("");
    setEntityFilter("all");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Home focus</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--luxia-text-muted)" }}
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Chats and Galaxies"
            className="h-9 pl-9"
            aria-label="Search Chats and Galaxies"
          />
        </div>

        <div className="mb-3">
          <FilterGroup label="Type">
            <FilterChip active={entityFilter === "all"} onClick={() => setEntityFilter("all")}>All</FilterChip>
            <FilterChip active={entityFilter === "chat"} onClick={() => setEntityFilter("chat")}>Chat</FilterChip>
            <FilterChip active={entityFilter === "galaxy"} onClick={() => setEntityFilter("galaxy")}>Galaxy</FilterChip>
          </FilterGroup>
        </div>

        <div className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical">
          {filteredItems.map((item) => {
            const key = workItemEntityKey(item);
            const entityType = item.kind === "galaxySession" ? "galaxy-conversation" : "chat";
            const sourceColor = getSourceAccentColor(item.constellationSource, "soft");
            const entityColor = item.kind === "galaxySession"
              ? HS.accentGalaxy
              : (sourceColor ?? HS.accentChat);
            const selected = key === currentKey;
            const projectName = getProjectNameById(item.projectId, projects);

            return (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-start gap-3 rounded-[10px] border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                style={{
                  borderColor: selected
                    ? "var(--luxia-opacity-brand-secondary-24)"
                    : "var(--luxia-border-default)",
                  background: selected
                    ? "var(--luxia-opacity-brand-primary-04)"
                    : "transparent",
                }}
                onClick={() => {
                  onSelect(key);
                  handleClose();
                }}
              >
                <div className="min-w-0 flex-1">
                  <EntityIdentityRow
                    entityType={entityType}
                    iconColor={entityColor}
                    size="row"
                  />
                  <span
                    className="mt-1 block truncate luxia-type-body-default-strong"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="mt-0.5 block truncate luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-muted)" }}
                    aria-label={`Project: ${projectName}`}
                  >
                    {projectName}
                  </span>
                  {item.constellationName ? (
                    <span
                      className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate luxia-type-body-dense"
                      style={{ color: "var(--luxia-text-muted)" }}
                      aria-label={`Constellation: ${item.constellationName}${
                        item.constellationSource
                          ? `, Source: ${
                              item.constellationSource === "database"
                                ? "DB"
                                : item.constellationSource === "csv"
                                  ? "CSV"
                                  : "PDF"
                            }`
                          : ""
                      }`}
                    >
                      <span className="truncate">{item.constellationName}</span>
                      {item.constellationSource ? (
                        <span
                          className="inline-flex shrink-0 rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
                          style={{
                            color: getSourceAccentColor(item.constellationSource, "soft"),
                            background: item.constellationSource === "database"
                              ? "var(--luxia-opacity-brand-secondary-16)"
                              : "var(--luxia-opacity-blue-16)",
                          }}
                        >
                          {item.constellationSource === "database"
                            ? "DB"
                            : item.constellationSource === "csv"
                              ? "CSV"
                              : "PDF"}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {selected ? (
                    <span
                      className="mt-1.5 inline-flex rounded-[6px] px-1.5 py-0.5 luxia-type-overline-data"
                      style={{
                        color: HS.accentGalaxy,
                        background: "var(--luxia-opacity-brand-primary-08)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      HOME FOCUS
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
          {filteredItems.length === 0 ? (
            <p className="px-1 py-2 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
              No matching Chats or Galaxies.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
