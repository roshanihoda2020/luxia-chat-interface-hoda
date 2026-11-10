export type DiscoverSceneKind = "ask" | "write" | "data" | "vidget";

const INK = "var(--luxia-purple-70)";
const PURPLE = "var(--luxia-purple-50)";
const VIOLET = "var(--luxia-purple-60)";
const LILAC = "var(--luxia-purple-20)";
const LAVENDER = "var(--luxia-purple-10)";
const SKY = "var(--luxia-brand-tertiary)";
const SUN = "var(--luxia-data-yellow)";
const PAPER = "var(--luxia-surface)";
const MIST = "var(--luxia-border-default)";

function Spark({ x, y, size = 1, color = SUN }: { x: number; y: number; size?: number; color?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${size})`}
      d="M0 -9C1.2 -2.6 2.6 -1.2 9 0C2.6 1.2 1.2 2.6 0 9C-1.2 2.6 -2.6 1.2 -9 0C-2.6 -1.2 -1.2 -2.6 0 -9Z"
      fill={color}
    />
  );
}

/** Ask a Project: a question travels through the Project's knowledge and comes back as an answer with its source. */
function AskScene() {
  return (
    <>
      <ellipse cx="128" cy="86" rx="104" ry="58" fill={LAVENDER} opacity="0.55" />
      <g stroke={LILAC} strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" fill="none">
        <path d="M150 34 L178 24 L204 44 L178 62 L214 76" />
        <path d="M178 24 L186 8" />
      </g>
      <circle cx="150" cy="34" r="5" fill={VIOLET} />
      <circle cx="178" cy="24" r="6.5" fill={INK} />
      <circle cx="204" cy="44" r="5" fill={PURPLE} />
      <circle cx="178" cy="62" r="4.5" fill={SKY} />
      <circle cx="214" cy="76" r="4" fill={VIOLET} />
      <circle cx="186" cy="8" r="3" fill={LILAC} />
      <rect x="18" y="26" width="104" height="48" rx="20" fill={INK} />
      <path d="M38 74 L30 92 L58 74Z" fill={INK} />
      <circle cx="44" cy="50" r="13" fill={PURPLE} />
      <path d="M40 45.5a4.5 4.5 0 1 1 6 4.2c-1.4.6-2 1.4-2 2.8" fill="none" stroke={PAPER} strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="57" r="1.9" fill={PAPER} />
      <rect x="64" y="41" width="44" height="6" rx="3" fill={PAPER} opacity="0.95" />
      <rect x="64" y="53" width="30" height="6" rx="3" fill={PAPER} opacity="0.55" />
      <path d="M118 52 C142 54 150 70 148 86" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeDasharray="3 5" strokeLinecap="round" />
      <rect x="92" y="88" width="132" height="58" rx="20" fill={PAPER} stroke={LILAC} strokeWidth="2" />
      <path d="M204 146 L214 158 L190 146Z" fill={PAPER} />
      <rect x="108" y="102" width="86" height="7" rx="3.5" fill={INK} />
      <rect x="108" y="115" width="62" height="7" rx="3.5" fill={MIST} />
      <rect x="108" y="128" width="58" height="12" rx="6" fill={SKY} />
      <rect x="114" y="132" width="8" height="4" rx="1" fill={INK} />
      <rect x="126" y="132" width="32" height="4" rx="2" fill={INK} opacity="0.7" />
      <Spark x={226} y={16} size={0.9} />
      <Spark x={86} y={106} size={0.6} color={PURPLE} />
    </>
  );
}

/** Write or improve: a rough line is crossed out and rewritten as a clearer one, with the pen still moving. */
function WriteScene() {
  return (
    <>
      <circle cx="176" cy="66" r="62" fill={LAVENDER} opacity="0.5" />
      <g transform="rotate(-5 96 82)">
        <rect x="30" y="16" width="132" height="128" rx="14" fill={PAPER} stroke={LILAC} strokeWidth="2" />
        <rect x="48" y="36" width="60" height="9" rx="4.5" fill={INK} />
        <rect x="48" y="56" width="92" height="6" rx="3" fill={MIST} />
        <rect x="48" y="70" width="80" height="6" rx="3" fill={MIST} />
        <path d="M46 73 H132" stroke={VIOLET} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="42" y="84" width="104" height="30" rx="9" fill={LILAC} opacity="0.55" />
        <rect x="50" y="92" width="84" height="6" rx="3" fill={PURPLE} />
        <rect x="50" y="103" width="56" height="6" rx="3" fill={PURPLE} />
        <rect x="48" y="124" width="70" height="6" rx="3" fill={MIST} />
      </g>
      <path d="M150 128 C170 112 186 140 206 124 C216 116 222 120 228 128" fill="none" stroke={PURPLE} strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(190 52) rotate(38)">
        <rect x="-9" y="-46" width="18" height="70" rx="5" fill={INK} />
        <rect x="-9" y="-46" width="18" height="12" rx="5" fill={SKY} />
        <path d="M-9 24 L0 44 L9 24Z" fill={SUN} />
        <path d="M-3 36 L0 44 L3 36Z" fill={INK} />
      </g>
      <rect x="168" y="12" width="46" height="24" rx="12" fill={INK} />
      <text x="191" y="29" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize="14" fontWeight="800" fill={PAPER}>Aa</text>
      <Spark x={22} y={30} size={0.8} />
      <Spark x={222} y={96} size={0.6} color={PURPLE} />
    </>
  );
}

/** Work with your data: rows of a spreadsheet rise into a chart, with the trend called out. */
function DataScene() {
  return (
    <>
      <ellipse cx="120" cy="96" rx="110" ry="52" fill={LAVENDER} opacity="0.55" />
      <path d="M22 118 L104 96 L192 118 L110 142Z" fill={PAPER} stroke={LILAC} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={LILAC} strokeWidth="1.5">
        <path d="M42.5 112.5 L130.5 136.5" />
        <path d="M63 107 L151 131" />
        <path d="M83.5 101.5 L171.5 125.5" />
        <path d="M48 126 L130 104" />
        <path d="M76 133 L158 111" />
      </g>
      <rect x="54" y="62" width="20" height="50" rx="6" fill={SKY} />
      <rect x="82" y="44" width="20" height="62" rx="6" fill={PURPLE} />
      <rect x="110" y="28" width="20" height="82" rx="6" fill={INK} />
      <rect x="138" y="52" width="20" height="62" rx="6" fill={LILAC} />
      <path d="M64 52 L92 34 L120 18 L148 40" fill="none" stroke={VIOLET} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="120" cy="18" r="6" fill={SUN} stroke={INK} strokeWidth="2" />
      <g transform="translate(196 50)">
        <circle r="26" fill={PAPER} stroke={LILAC} strokeWidth="2" />
        <path d="M0 0 L0 -20 A20 20 0 0 1 17.3 10 Z" fill={PURPLE} />
        <path d="M0 0 L17.3 10 A20 20 0 0 1 -12 16 Z" fill={SKY} />
        <circle r="7" fill={PAPER} />
      </g>
      <Spark x={30} y={40} size={0.8} />
      <Spark x={226} y={110} size={0.55} color={PURPLE} />
    </>
  );
}

/** Customer assistants: a website and a phone, each with a friendly chat that answers visitors. */
function VidgetScene() {
  return (
    <>
      <ellipse cx="124" cy="84" rx="108" ry="60" fill={LAVENDER} opacity="0.55" />
      <rect x="16" y="22" width="146" height="100" rx="14" fill={PAPER} stroke={LILAC} strokeWidth="2" />
      <path d="M16 40 H162" stroke={LILAC} strokeWidth="2" />
      <circle cx="28" cy="31" r="3" fill={LILAC} />
      <circle cx="38" cy="31" r="3" fill={LILAC} />
      <circle cx="48" cy="31" r="3" fill={LILAC} />
      <rect x="30" y="52" width="70" height="10" rx="5" fill={INK} />
      <rect x="30" y="68" width="88" height="6" rx="3" fill={MIST} />
      <rect x="30" y="80" width="64" height="6" rx="3" fill={MIST} />
      <rect x="30" y="96" width="44" height="14" rx="7" fill={PURPLE} />
      <circle cx="140" cy="104" r="12" fill={INK} />
      <circle cx="135.5" cy="104" r="1.8" fill={PAPER} />
      <circle cx="140" cy="104" r="1.8" fill={PAPER} />
      <circle cx="144.5" cy="104" r="1.8" fill={PAPER} />
      <rect x="168" y="30" width="62" height="118" rx="14" fill={INK} />
      <rect x="174" y="40" width="50" height="98" rx="9" fill={PAPER} />
      <rect x="190" y="33" width="18" height="3" rx="1.5" fill={VIOLET} />
      <rect x="180" y="50" width="32" height="14" rx="7" fill={LAVENDER} />
      <rect x="188" y="70" width="30" height="14" rx="7" fill={PURPLE} />
      <rect x="180" y="90" width="36" height="14" rx="7" fill={LAVENDER} />
      <rect x="194" y="110" width="24" height="14" rx="7" fill={SKY} />
      <path d="M150 64 C160 56 166 58 172 64" fill="none" stroke={PURPLE} strokeWidth="2.5" strokeDasharray="2 5" strokeLinecap="round" />
      <Spark x={14} y={140} size={0.7} />
      <Spark x={162} y={16} size={0.8} />
    </>
  );
}

/**
 * Illustrated preview of what a capability does, for Discover. Drawn on its own
 * light stage so it reads on Default, Soft and Featured tiles. Decorative: the
 * card's title carries the meaning.
 */
export function DiscoverScene({ kind, className = "" }: { kind: DiscoverSceneKind; className?: string }) {
  return (
    <span
      className={`relative block overflow-hidden rounded-[12px] ${className}`}
      style={{
        background: "linear-gradient(150deg, rgba(255, 255, 255, 0) 30%, var(--luxia-opacity-brand-secondary-16) 100%), var(--luxia-surface)",
        boxShadow: "inset 0 0 0 1px var(--luxia-opacity-brand-secondary-16)",
      }}
      data-discover-scene={kind}
    >
      <svg viewBox="0 0 240 160" preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false" className="absolute inset-0 h-full w-full">
        {kind === "ask" ? <AskScene /> : kind === "write" ? <WriteScene /> : kind === "data" ? <DataScene /> : <VidgetScene />}
      </svg>
    </span>
  );
}
