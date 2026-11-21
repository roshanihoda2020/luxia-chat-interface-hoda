export type LuxiaVignetteKind = "ask" | "write" | "data" | "vidget" | "tag" | "verify";

const INK = "var(--luxia-purple-70)";
const ACCENT = "var(--luxia-purple-50)";
const LINE = "var(--luxia-purple-10)";
const HIGHLIGHT = "var(--luxia-purple-20)";
const SKY = "var(--luxia-brand-tertiary)";
const PAPER = "var(--luxia-surface)";
const MUTED = "var(--luxia-border-default)";
// Review outcomes, in the severity colours the VerifAI results use.
const MET = "var(--luxia-success)";
const NOT_MET = "var(--luxia-error)";
const REVIEW = "var(--luxia-warning-50)";
const REVIEW_SOFT = "var(--luxia-warning-10)";

function Spark({ x, y, color = ACCENT }: { x: number; y: number; color?: string }) {
  return <path transform={`translate(${x} ${y})`} d="M0 -7C1 -2 2 -1 7 0C2 1 1 2 0 7C-1 2-2 1-7 0C-2-1-1-2 0-7Z" fill={color} />;
}

function Scene({ kind }: { kind: LuxiaVignetteKind }) {
  switch (kind) {
    case "ask":
      return (
        <>
          <rect x="6" y="8" width="56" height="74" rx="9" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <rect x="15" y="20" width="34" height="5" rx="2.5" fill={MUTED} />
          <rect x="15" y="30" width="40" height="5" rx="2.5" fill={MUTED} />
          <rect x="12" y="39" width="46" height="11" rx="4" fill={HIGHLIGHT} opacity="0.6" />
          <rect x="15" y="42" width="38" height="5" rx="2.5" fill={ACCENT} />
          <rect x="15" y="56" width="30" height="5" rx="2.5" fill={MUTED} />
          <rect x="15" y="66" width="22" height="5" rx="2.5" fill={MUTED} />
          <path d="M58 45C64 45 62 40 68 40" fill="none" stroke={ACCENT} strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
          <rect x="62" y="24" width="52" height="38" rx="11" fill={INK} />
          <path d="M72 62L66 74L84 62Z" fill={INK} />
          <rect x="71" y="33" width="34" height="4" rx="2" fill={PAPER} opacity="0.92" />
          <rect x="71" y="41" width="24" height="4" rx="2" fill={PAPER} opacity="0.6" />
          <rect x="71" y="50" width="30" height="7" rx="3.5" fill={SKY} />
          <Spark x={108} y={14} />
        </>
      );
    case "write":
      return (
        <>
          <path d="M22 6H74L90 22V84H22Z" fill={PAPER} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M74 6V22H90" fill={LINE} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <rect x="31" y="28" width="44" height="5" rx="2.5" fill={MUTED} />
          <rect x="31" y="38" width="36" height="5" rx="2.5" fill={MUTED} />
          <rect x="28" y="47" width="52" height="16" rx="4" fill={HIGHLIGHT} opacity="0.55" />
          <rect x="31" y="50" width="44" height="4" rx="2" fill={ACCENT} />
          <rect x="31" y="56" width="30" height="4" rx="2" fill={ACCENT} />
          <rect x="31" y="70" width="40" height="5" rx="2.5" fill={MUTED} />
          <g transform="translate(96 46) rotate(35)">
            <rect x="-4" y="-26" width="8" height="30" rx="2.5" fill={ACCENT} />
            <path d="M-4 4L0 12L4 4Z" fill={INK} />
          </g>
          <rect x="76" y="62" width="40" height="14" rx="7" fill={INK} />
          <rect x="83" y="67" width="26" height="4" rx="2" fill={PAPER} />
          <Spark x={14} y={16} />
        </>
      );
    case "data":
      return (
        <>
          <rect x="6" y="16" width="50" height="58" rx="8" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <path d="M6 30H56M6 44H56M6 58H56M23 16V74M39 16V74" stroke={MUTED} strokeWidth="2" />
          <path d="M60 45H72" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M68 40L74 45L68 50" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="78" y="12" width="38" height="66" rx="9" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <rect x="85" y="50" width="7" height="20" rx="2" fill={SKY} />
          <rect x="94" y="38" width="7" height="32" rx="2" fill={ACCENT} />
          <rect x="103" y="28" width="7" height="42" rx="2" fill={INK} />
          <Spark x={110} y={20} color={SKY} />
        </>
      );
    case "vidget":
      return (
        <>
          <rect x="6" y="8" width="86" height="64" rx="9" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <path d="M6 20H92" stroke={LINE} strokeWidth="2" />
          <circle cx="14" cy="14" r="2" fill={HIGHLIGHT} />
          <circle cx="21" cy="14" r="2" fill={HIGHLIGHT} />
          <rect x="15" y="28" width="38" height="7" rx="3.5" fill={INK} />
          <rect x="15" y="40" width="46" height="4" rx="2" fill={MUTED} />
          <rect x="15" y="48" width="34" height="4" rx="2" fill={MUTED} />
          <rect x="15" y="58" width="22" height="7" rx="3.5" fill={ACCENT} />
          <rect x="66" y="44" width="48" height="36" rx="11" fill={INK} />
          <path d="M100 80L106 88L108 78Z" fill={INK} />
          <rect x="73" y="52" width="26" height="6" rx="3" fill={HIGHLIGHT} />
          <rect x="81" y="62" width="26" height="6" rx="3" fill={PAPER} />
          <Spark x={108} y={34} />
        </>
      );
    case "tag":
      return (
        <>
          <path d="M14 8H62L78 24V84H14Z" fill={PAPER} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M62 8V24H78" fill={LINE} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <rect x="23" y="32" width="40" height="5" rx="2.5" fill={MUTED} />
          <rect x="23" y="42" width="32" height="5" rx="2.5" fill={MUTED} />
          <rect x="23" y="52" width="38" height="5" rx="2.5" fill={MUTED} />
          <rect x="60" y="34" width="48" height="13" rx="6.5" fill={INK} />
          <rect x="67" y="38.5" width="22" height="4" rx="2" fill={PAPER} />
          <rect x="66" y="52" width="44" height="13" rx="6.5" fill={ACCENT} />
          <rect x="73" y="56.5" width="26" height="4" rx="2" fill={PAPER} />
          <rect x="58" y="70" width="40" height="13" rx="6.5" fill={SKY} />
          <rect x="65" y="74.5" width="18" height="4" rx="2" fill={INK} />
          <Spark x={104} y={18} color={SKY} />
        </>
      );
    case "verify":
      // VerifAI: highlighted passages of a document linked to checklist requirements, each with its
      // outcome (met, not met, needs review), sealed by the VerifAI shield.
      return (
        <>
          <path d="M8 10H46L58 22V84H8Z" fill={PAPER} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M46 10V22H58" fill={LINE} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <rect x="16" y="28" width="28" height="5" rx="2.5" fill={MUTED} />
          <rect x="13" y="38" width="40" height="13" rx="4" fill={HIGHLIGHT} opacity="0.6" />
          <rect x="16" y="42" width="32" height="5" rx="2.5" fill={ACCENT} />
          <rect x="13" y="56" width="40" height="13" rx="4" fill={REVIEW_SOFT} />
          <rect x="16" y="60" width="26" height="5" rx="2.5" fill={REVIEW} />
          <rect x="16" y="74" width="22" height="5" rx="2.5" fill={MUTED} />
          <path d="M54 44.5C62 44.5 62 38 70 38" fill="none" stroke={ACCENT} strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
          <path d="M54 62.5C62 62.5 62 66 70 66" fill="none" stroke={REVIEW} strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
          <rect x="68" y="10" width="46" height="66" rx="8" fill={PAPER} stroke={LINE} strokeWidth="2" />
          <path d="M68 18A8 8 0 0 1 76 10H106A8 8 0 0 1 114 18V22H68Z" fill={INK} />
          <rect x="74" y="14" width="22" height="4" rx="2" fill={PAPER} opacity="0.85" />
          <circle cx="78" cy="31" r="5" fill={MET} />
          <path d="M75.6 31L77.3 32.8L80.6 29.3" fill="none" stroke={PAPER} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="87" y="29" width="21" height="4" rx="2" fill={MUTED} />
          <circle cx="78" cy="45" r="5" fill={NOT_MET} />
          <path d="M75.8 42.8L80.2 47.2M80.2 42.8L75.8 47.2" stroke={PAPER} strokeWidth="1.8" strokeLinecap="round" />
          <rect x="87" y="43" width="17" height="4" rx="2" fill={MUTED} />
          <circle cx="78" cy="59" r="5" fill={REVIEW} />
          <path d="M78 56.2V59.6" stroke={PAPER} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="78" cy="62" r="1" fill={PAPER} />
          <rect x="87" y="57" width="19" height="4" rx="2" fill={MUTED} />
          <g transform="translate(98 74)">
            <path d="M0 -12L10 -8V-1C10 6 5 10 0 13C-5 10 -10 6 -10 -1V-8Z" fill={INK} stroke={PAPER} strokeWidth="2" strokeLinejoin="round" />
            <path d="M-4.2 0.2L-1 3.4L4.6 -2.6" fill="none" stroke={SKY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <Spark x={62} y={8} />
        </>
      );
    default:
      return null;
  }
}

/**
 * Small 2D scene of what a capability produces (an answer with its source, an
 * improved passage, a chart from a spreadsheet, an assistant on a website).
 * Drawn on its own light plate so it reads on Default, Soft and Featured tiles.
 * Decorative: the caption next to it carries the meaning.
 */
export function LuxiaVignette({ kind, className = "" }: { kind: LuxiaVignetteKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      aria-hidden
      focusable="false"
      className={`block shrink-0 rounded-[10px] ${className}`}
      style={{ background: "var(--luxia-surface)", boxShadow: "inset 0 0 0 1px var(--luxia-opacity-brand-secondary-16)" }}
      data-luxia-vignette={kind}
    >
      <Scene kind={kind} />
    </svg>
  );
}
