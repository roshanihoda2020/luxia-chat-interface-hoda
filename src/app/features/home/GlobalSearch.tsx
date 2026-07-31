import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { getProjectNameById } from "@/app/features/project/data";
import { EntityIcon } from "./entityIdentity";
import { HS } from "./homeSurfaces";
import type { HomeProjectCard, HomeRecentWorkItem } from "./types";

export interface HomeSearchResult {
  id: string;
  label: string;
  kind: "project" | "chat" | "galaxy" | "constellation";
  entityId: string;
  projectId: string;
  constellationId?: string;
  subtitle: string;
  color: string;
}

interface GlobalSearchProps {
  projects: HomeProjectCard[];
  recentWork: HomeRecentWorkItem[];
  constellations: Array<{
    id: string;
    label: string;
    projectId: string;
    type: "database" | "csv" | "pdf";
  }>;
  onSelect: (result: HomeSearchResult) => void;
}

export function GlobalSearch({
  projects,
  recentWork,
  constellations,
  onSelect,
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: HomeSearchResult[] = [];

    projects.forEach((project) => {
      const haystack = [
        project.name,
        project.description ?? "",
        "project",
      ].join(" ").toLowerCase();
      if (haystack.includes(q)) {
        matches.push({
          id: `project-${project.id}`,
          label: project.name,
          kind: "project",
          entityId: project.id,
          projectId: project.id,
          subtitle: "PROJECT",
          color: HS.accentProject,
        });
      }
    });

    recentWork.forEach((item) => {
      const entityKind = item.kind === "galaxySession" ? "galaxy" : "chat";
      const sourceToken = item.constellationSource === "database"
        ? "db database"
        : item.constellationSource === "csv"
          ? "csv"
          : item.constellationSource === "pdf"
            ? "pdf"
            : "";
      const haystack = [
        item.title,
        getProjectNameById(item.projectId, projects),
        item.constellationName ?? "",
        sourceToken,
        entityKind,
        entityKind === "galaxy" ? "galaxies" : "chats",
      ].join(" ").toLowerCase();

      if (haystack.includes(q)) {
        matches.push({
          id: `work-${item.id}`,
          label: item.title,
          kind: entityKind,
          entityId: item.kind === "galaxySession" ? item.conversationId : item.chatId,
          projectId: item.projectId,
          constellationId: item.constellationId,
          subtitle: item.kind === "galaxySession" ? "GALAXY" : "CHAT",
          color: item.kind === "galaxySession" ? HS.accentGalaxy : HS.accentChat,
        });
      }
    });

    constellations.forEach((con) => {
      const projectName = getProjectNameById(con.projectId, projects, "");
      const sourceToken = con.type === "pdf" ? "pdf" : "db database";
      const haystack = `${con.label} ${projectName} ${sourceToken} constellation`.toLowerCase();
      if (haystack.includes(q)) {
        matches.push({
          id: `con-${con.id}`,
          label: con.label,
          kind: "constellation",
          entityId: con.id,
          projectId: con.projectId,
          constellationId: con.id,
          subtitle: con.type === "pdf" ? "PDF · CONSTELLATION" : "DB · CONSTELLATION",
          color: con.type === "pdf" ? HS.sourcePdfSoft : HS.sourceDatabaseSoft,
        });
      }
    });

    return matches.slice(0, 24);
  }, [constellations, projects, query, recentWork]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, results.length]);

  function selectResult(result: HomeSearchResult) {
    onSelect(result);
    setQuery("");
    setOpen(false);
    setHighlightIndex(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !query.trim()) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }

    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const result = results[highlightIndex] ?? results[0];
      if (result) selectResult(result);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-search-index="${highlightIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  return (
    <div className="relative mb-7 w-full">
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--luxia-text-muted)" }}
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search Projects, Galaxies, Chats, and Constellations"
          aria-label="Search Projects, Galaxies, Chats, and Constellations"
          aria-autocomplete="list"
          aria-expanded={open && Boolean(query.trim())}
          aria-controls="luxia-home-search-results"
          role="combobox"
          className="h-11 rounded-[12px] pl-10 luxia-type-body-default"
          style={{
            background: HS.searchBg,
            borderColor: HS.searchBorder,
          }}
        />
      </div>

      {open && query.trim() ? (
        <div
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-[12px] border shadow-md"
          style={{ background: HS.menuBg, borderColor: HS.menuBorder }}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            <ul
              id="luxia-home-search-results"
              ref={listRef}
              role="listbox"
              className="max-h-80 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical"
            >
              {results.map((result, index) => {
                const entityType = result.kind === "project"
                  ? "project"
                  : result.kind === "galaxy"
                    ? "galaxy-conversation"
                    : "chat";
                const active = index === highlightIndex;

                return (
                  <li key={result.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-search-index={index}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
                      style={{
                        background: active ? "var(--luxia-opacity-brand-primary-04)" : undefined,
                      }}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectResult(result)}
                    >
                      <EntityIcon
                        entityType={entityType}
                        size={18}
                        color={result.color}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate luxia-type-body-default-strong" style={{ color: "var(--luxia-text-primary)" }}>
                          {result.label}
                        </span>
                        <span className="block truncate luxia-type-body-dense" style={{ color: "var(--luxia-text-muted)" }}>
                          {result.subtitle}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
