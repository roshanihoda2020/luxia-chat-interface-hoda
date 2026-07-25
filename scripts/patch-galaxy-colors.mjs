import fs from "node:fs";

const path = "src/app/features/galaxy/GalaxyActivityPanel.tsx";
let s = fs.readFileSync(path, "utf8");

const replacements = [
  [
    `background: SURF.overview,
                          border: "1px solid rgba(142, 99, 235, 0.14)",`,
    `background: GC.card,
                          border: \`1px solid \${GC.border}\`,`,
  ],
  [`style={{ background: "rgba(48,33,78,0.04)" }}`, `style={{ background: GC.section }}`],
  [
    `background: "rgba(142,99,235,0.08)",
                                  border: "1px solid rgba(142,99,235,0.14)",`,
    `background: GC.selectedBg,
                                  border: \`1px solid \${GC.selectedBorder}\`,`,
  ],
  [`style={{ background: "rgba(48,33,78,0.05)" }}`, `style={{ background: GC.section }}`],
  [
    `background: "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(142,99,235,0.14)",`,
    `background: GC.card,
                                  border: \`1px solid \${GC.border}\`,`,
  ],
  [
    `style={{ border: \`1px solid rgba(142,99,235,0.14)\`, background: "rgba(255,255,255,0.55)" }}`,
    `style={{ border: \`1px solid \${GC.border}\`, background: GC.card, boxShadow: GC.shadow }}`,
  ],
  [
    `style={{ borderBottom: \`1px solid \${LX.borderSubtle}\` }}`,
    `style={{ borderBottom: \`1px solid \${GC.border}\` }}`,
  ],
  [
    `background: SURF.activity,
                          border: \`1px solid rgba(150, 219, 251, 0.22)\`,`,
    `background: SURF.activity,
                          border: \`1px solid \${SURF.activityBorder}\`,`,
  ],
  [
    `background: "rgba(142,99,235,0.10)",
                border: "1px solid rgba(142,99,235,0.22)",`,
    `background: GC.card,
                border: \`1px solid \${GC.border}\`,
                boxShadow: GC.shadow,`,
  ],
  [
    `border: \`1px solid \${focused ? LX.borderStrong : LX.border}\`,
                  boxShadow: focused ? \`0 0 0 3px rgba(48,33,78,0.06)\` : "none",`,
    `border: \`1px solid \${focused ? GC.purple : GC.borderInput}\`,
                  boxShadow: focused ? \`0 0 0 3px \${GC.focusRing}\` : "none",`,
  ],
  [`background: dirty ? LX.primary : "rgba(48,33,78,0.04)",`, `background: dirty ? GC.purpleDeep : GC.section,`],
  [
    `onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(48,33,78,0.06)"; }}`,
    `onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = GC.hover; }}`,
  ],
  [
    `color: LX.primary,
                                background: "rgba(48,33,78,0.08)",`,
    `color: GC.iconActive,
                                background: GC.section,`,
  ],
  [`!isManualMode ? LX.primary : "transparent"`, `!isManualMode ? GC.purpleDeep : "transparent"`],
  [`isManualMode ? LX.primary : "transparent"`, `isManualMode ? GC.purpleDeep : "transparent"`],
  [`!isManualMode ? "#FFFFFF" : LX.primary`, `!isManualMode ? "#FFFFFF" : GC.textPrimary`],
  [`isManualMode ? "#FFFFFF" : LX.primary`, `isManualMode ? "#FFFFFF" : GC.textPrimary`],
  [
    `!isManualMode ? "rgba(255,255,255,0.72)" : LX.textMuted`,
    `!isManualMode ? "rgba(255,255,255,0.72)" : GC.textSecondary`,
  ],
  [
    `isManualMode ? "rgba(255,255,255,0.72)" : LX.textMuted`,
    `isManualMode ? "rgba(255,255,255,0.72)" : GC.textSecondary`,
  ],
  [
    `background: selected || highlighted
                                              ? "rgba(142,99,235,0.08)"
                                              : "transparent"`,
    `background: selected || highlighted
                                              ? GC.selectedRow
                                              : highlighted
                                                ? GC.hover
                                                : "transparent"`,
  ],
  [`background: selected ? "rgba(142,99,235,0.08)" : "transparent"`, `background: selected ? GC.selectedRow : "transparent"`],
  [`Check size={12} style={{ color: LX.success }}`, `Check size={12} style={{ color: GC.success }}`],
  [`Check size={12} style={{ color: LX.secondary }}`, `Check size={12} style={{ color: GC.purple }}`],
  [`style={{ color: LX.secondary, fontWeight: 500 }}`, `style={{ color: GC.purple, fontWeight: 500 }}`],
  [`style={{ color: LX.secondary, fontWeight: 600, transition: TRANSITION }}`, `style={{ color: GC.purple, fontWeight: 600, transition: TRANSITION }}`],
  [`style={{ background: LX.secondary }}`, `style={{ background: GC.purple }}`],
  [`background: "rgba(48,33,78,0.22)"`, `background: GC.textMuted`],
  [`color: LX.textMuted`, `color: GC.textSecondary`],
  [`style={{ color: LX.primary, fontWeight: 600 }}`, `style={{ color: GC.textPrimary, fontWeight: 600 }}`],
  [`style={{ color: LX.primary, fontWeight: 700, fontSize: 15 }}`, `style={{ color: GC.textPrimary, fontWeight: 700, fontSize: 15 }}`],
  [`style={{ color: LX.primary, fontWeight: active ? 600 : 500 }}`, `style={{ color: GC.textPrimary, fontWeight: active ? 600 : 500 }}`],
  [`color: LX.primary,`, `color: GC.textPrimary,`],
  [
    `className="h-8 w-full min-w-0 rounded-[7px] bg-transparent pl-7 pr-2 outline-none luxia-type-caption"
                                  style={{ color: GC.textPrimary }}`,
    `className="h-8 w-full min-w-0 rounded-[7px] bg-transparent pl-7 pr-2 outline-none luxia-type-caption placeholder:text-[#98A2B3]"
                                  style={{ color: GC.textPrimary }}`,
  ],
];

let applied = 0;
for (const [from, to] of replacements) {
  if (s.includes(from)) {
    s = s.split(from).join(to);
    applied += 1;
  } else {
    console.log("MISS:", JSON.stringify(from.slice(0, 80)));
  }
}

fs.writeFileSync(path, s);
console.log(`Applied ${applied}/${replacements.length} replacements`);
