export type LuxiaCharacterRole = "guide" | "chat" | "writing" | "data" | "assistant";

const ROLE_COLORS: Record<LuxiaCharacterRole, string> = {
  guide: "var(--luxia-purple-60)",
  chat: "var(--luxia-purple-50)",
  writing: "#B4690E",
  data: "#0F766E",
  assistant: "var(--luxia-purple-70)",
};

function Prop({ role }: { role: LuxiaCharacterRole }) {
  switch (role) {
    case "chat":
      return (
        <g transform="translate(43 11)">
          <rect width="19" height="13" rx="5" fill="#fff" />
          <path d="M4 13l-1 5 5-5z" fill="#fff" />
          <circle cx="5.5" cy="6.5" r="1.4" fill="currentColor" />
          <circle cx="9.5" cy="6.5" r="1.4" fill="currentColor" />
          <circle cx="13.5" cy="6.5" r="1.4" fill="currentColor" />
        </g>
      );
    case "writing":
      return (
        <g transform="translate(47 40) rotate(35)">
          <rect width="7" height="22" rx="2" fill="#fff" />
          <path d="M0 22l3.5 6 3.5-6z" fill="#30214E" />
        </g>
      );
    case "data":
      return (
        <g transform="translate(45 40)">
          <rect width="20" height="18" rx="3" fill="#fff" />
          <rect x="4" y="9" width="3" height="6" rx="1" fill="currentColor" />
          <rect x="8.5" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="13" y="7" width="3" height="8" rx="1" fill="currentColor" />
        </g>
      );
    case "guide":
      return <path d="M54 39l2.2 5.8L62 47l-5.8 2.2L54 55l-2.2-5.8L46 47l5.8-2.2z" fill="#fff" />;
    default:
      return null;
  }
}

/**
 * Friendly Luxia character: the visual identity of a capability (or of a
 * Vidget, in its avatar colour). Always paired with a text label, never on its own.
 */
export function LuxiaCharacter({
  role,
  size = 48,
  color,
}: {
  role: LuxiaCharacterRole;
  size?: number;
  /** Overrides the role colour, e.g. a Vidget's avatar colour. */
  color?: string;
}) {
  const body = color ?? ROLE_COLORS[role];
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className="shrink-0"
      style={{ color: body }}
    >
      <circle cx="36" cy="36" r="36" fill="currentColor" opacity="0.12" />
      <path d="M36 9v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 4.5l1.3 3.2 3.2 1.3-3.2 1.3L36 13.5l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor" />
      <rect x="16" y="15" width="40" height="30" rx="13" fill="currentColor" />
      <rect x="21" y="21" width="30" height="16" rx="8" fill="#1E173A" />
      <circle cx="29.5" cy="29" r="3.3" fill="#96DBFB" />
      <circle cx="42.5" cy="29" r="3.3" fill="#96DBFB" />
      <path d="M32 33.5q4 2.6 8 0" stroke="#96DBFB" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="12" y="25" width="5" height="11" rx="2.5" fill="currentColor" />
      <rect x="55" y="25" width="5" height="11" rx="2.5" fill="currentColor" />
      <rect x="23" y="47" width="26" height="17" rx="8" fill="currentColor" />
      <Prop role={role} />
    </svg>
  );
}
