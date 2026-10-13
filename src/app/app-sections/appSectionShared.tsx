import { Badge } from "@/app/components/ui/badge";
import {
  CAPSULE_CAPABILITY_ICON,
  capsuleCapabilitiesForType,
} from "@/app/features/constellation";
import type { GalaxyRoutingMeta } from "@/app/features/galaxy";
import type { LuxiaResponsePresentation } from "@/app/features/chat/LuxiaResponseCard";
import type { LucideIcon } from "lucide-react";

export const CONSTELLATION_STYLE: Record<string, {
  color: string; bg: string; activeBg: string;
  border: string; activeBorder: string;
}> = {
  database: {
    color: "#7652C4",
    bg: "rgba(118,82,196,0.05)",
    activeBg: "rgba(118,82,196,0.10)",
    border: "rgba(118,82,196,0.18)",
    activeBorder: "rgba(118,82,196,0.35)",
  },
  pdf: {
    color: "#2B8DC4",
    bg: "rgba(43,141,196,0.05)",
    activeBg: "rgba(43,141,196,0.10)",
    border: "rgba(43,141,196,0.18)",
    activeBorder: "rgba(43,141,196,0.35)",
  },
  csv: {
    color: "#2B8DC4",
    bg: "rgba(43,141,196,0.05)",
    activeBg: "rgba(43,141,196,0.10)",
    border: "rgba(43,141,196,0.18)",
    activeBorder: "rgba(43,141,196,0.35)",
  },
};

export type SectionId = "kb" | "dataTable" | "views" | "contextFiles" | "relationship" | "metrics" | "instr" | "pdfFiles" | "crawler";
export type ConstellationType = "database" | "csv" | "pdf";

export type SectionIcon = LucideIcon;

export const SECTION_META: Record<SectionId, { label: string; icon: SectionIcon }> = {
  kb: { label: "Knowledge Base", icon: CAPSULE_CAPABILITY_ICON.kb },
  dataTable: { label: "Active Data Tables", icon: CAPSULE_CAPABILITY_ICON.dataTable },
  views: { label: "Views", icon: CAPSULE_CAPABILITY_ICON.views },
  contextFiles: { label: "Extra Context Files", icon: CAPSULE_CAPABILITY_ICON.contextFiles },
  relationship: { label: "Relationship", icon: CAPSULE_CAPABILITY_ICON.relationship },
  metrics: { label: "Metrics", icon: CAPSULE_CAPABILITY_ICON.metrics },
  instr: { label: "Instruction", icon: CAPSULE_CAPABILITY_ICON.instr },
  pdfFiles: { label: "PDF Files", icon: CAPSULE_CAPABILITY_ICON.pdfFiles },
  crawler: { label: "Crawler URLs", icon: CAPSULE_CAPABILITY_ICON.crawler },
};

/**
 * Chat capsule capability order — single source via capsuleCapabilitiesForType.
 * Database includes Views; CSV/PDF do not.
 */
export const CONSTELLATION_SECTIONS: Record<ConstellationType, SectionId[]> = {
  database: capsuleCapabilitiesForType("database") as SectionId[],
  pdf: capsuleCapabilitiesForType("pdf") as SectionId[],
  csv: capsuleCapabilitiesForType("csv") as SectionId[],
};

export const SECTION_DEFAULTS: Partial<Record<SectionId, string[]>> = {
  kb: [],
  dataTable: ["Table 1", "Table 2"],
  views: [],
  contextFiles: ["Context File A", "Context File B"],
  relationship: ["Relation 1"],
  metrics: ["Metric 1", "Metric 2"],
  pdfFiles: ["Report A.pdf", "Guide B.pdf"],
  crawler: ["https://site-1.example", "https://site-2.example"],
};

export const SECTION_INSTRUCTION: Record<ConstellationType, string> = {
  database: "Answer based on the connected data sources and documents.",
  pdf: "Extract and summarise information from the connected PDF files.",
  csv: "Answer based on the connected CSV tabular data.",
};

export interface Source { id: string; label: string; }
export type ResponseInsights = {
  format: "bullets" | "paragraphs";
  items: string[];
};
export interface Message {
  id: string; role: "user" | "ai"; content: string; timestamp: string;
  sources?: Source[]; insights?: ResponseInsights;
  galaxy?: GalaxyRoutingMeta;
  responsePresentation?: {
    state: LuxiaResponsePresentation;
    notice?: string;
  };
}
export interface Chat {
  id: string;
  label: string;
  chatType: ChatScope;
  projectId: string;
  constellationId?: string;
  pinned?: boolean;
}
export interface Project {
  id: string;
  label: string;
}
export interface Constellation {
  id: string;
  label: string;
  type: ConstellationType;
  projectId: string;
  description: string;
}

export type ChatScope = "galaxy" | "constellation";
export type NewChatPayload = {
  chatType: ChatScope;
  projectId: string;
  constellationId?: string;
};

export function getConstellationSourceLabel(type: ConstellationType): "PDF" | "CSV" | "DB" {
  if (type === "pdf") return "PDF";
  if (type === "csv") return "CSV";
  return "DB";
}

export function constellationBadgeVariant(type: ConstellationType): "database" | "csv" | "pdf" {
  if (type === "csv") return "csv";
  if (type === "pdf") return "pdf";
  return "database";
}

export function ConstellationSourceBadge({
  type,
  className = "",
}: {
  type: ConstellationType;
  className?: string;
}) {
  return (
    <Badge
      variant={constellationBadgeVariant(type)}
      className={`min-h-0 h-[15px] px-1 py-0 luxia-type-badge ${className}`}
    >
      {getConstellationSourceLabel(type)}
    </Badge>
  );
}

export function ConstellationNameWithSource({
  label,
  type,
  className = "",
  labelClassName = "",
  badgeClassName = "",
}: {
  label: string;
  type: ConstellationType;
  className?: string;
  labelClassName?: string;
  badgeClassName?: string;
}) {
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center justify-start gap-1.5 text-left ${className}`} title={label}>
      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left ${labelClassName}`}>{label}</span>
      <ConstellationSourceBadge type={type} className={`flex-shrink-0 ${badgeClassName}`} />
    </span>
  );
}
