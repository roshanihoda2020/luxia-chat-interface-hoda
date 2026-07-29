import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
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
    type: "database" | "pdf";
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: HomeSearchResult[] = [];

    projects.forEach((project) => {
      if (project.name.toLowerCase().includes(q)) {
        matches.push({
          id: `project-${project.id}`,
          label: project.name,
          kind: "project",
          entityId: project.id,
          projectId: project.id,
          subtitle: "Project",
          color: HS.accentProject,
        });
      }
    });

    recentWork.forEach((item) => {
      const entityKind = item.kind === "galaxySession" ? "galaxy" : "chat";
      const sourceToken = item.constellationSource === "database"
        ? "db database"
        : item.constellationSource === "pdf"
          ? "pdf"
          : "";
      const haystack = [
        item.title,
        item.projectName,
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
          subtitle: item.kind === "galaxySession" ? "Galaxy" : "Chat",
          color: item.kind === "galaxySession" ? HS.accentGalaxy : HS.accentChat,
        });
      }
    });

    constellations.forEach((con) => {
      const sourceToken = con.type === "pdf" ? "pdf" : "db database";
      const haystack = `${con.label} ${sourceToken} constellation`.toLowerCase();
      if (haystack.includes(q)) {
        matches.push({
          id: `con-${con.id}`,
          label: con.label,
          kind: "constellation",
          entityId: con.id,
          projectId: con.projectId,
          constellationId: con.id,
          subtitle: con.type === "pdf" ? "PDF Constellation" : "Database Constellation",
          color: con.type === "pdf" ? HS.sourcePdfSoft : HS.sourceDatabaseSoft,
        });
      }
    });

    return matches.slice(0, 24);
  }, [constellations, projects, query, recentWork]);

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
          placeholder="Search Projects, Galaxies, Chats, and Constellations"
          aria-label="Search Projects, Galaxies, Chats, and Constellations"
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
            <ul>
              {results.map((result) => {
                const entityType = result.kind === "project"
                  ? "project"
                  : result.kind === "galaxy"
                    ? "galaxy-conversation"
                    : result.kind === "constellation"
                      ? "chat"
                      : "chat";

                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--luxia-border-focus)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onSelect(result);
                        setQuery("");
                        setOpen(false);
                      }}
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
