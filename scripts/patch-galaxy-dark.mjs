import fs from "node:fs";

const path = "src/app/features/galaxy/GalaxyActivityPanel.tsx";
let s = fs.readFileSync(path, "utf8");

const replacements = [
  // Shell
  [
    `background: GC.card,
          border: \`1px solid \${GC.border}\`,
          boxShadow: GC.shadow,`,
    `background: GC.shell,
          border: \`1px solid \${GC.shellBorder}\`,
          boxShadow: GC.shellShadow,`,
  ],
  [
    `background: GC.page,
            borderBottom: \`1px solid \${GC.border}\`,`,
    `background: GC.header,
            borderBottom: \`1px solid \${GC.headerDivider}\`,`,
  ],
  [
    `background: isProcessing ? GC.purple : isComplete ? GC.success : GC.textMuted,`,
    `background: isProcessing ? GC.processing : isComplete ? GC.success : GC.idle,`,
  ],
  [
    `style={{ color: GC.textPrimary, fontWeight: 600 }}
            >
              Galaxy Intelligence`,
    `style={{ color: GC.textPrimary, fontWeight: 600 }}
            >
              Galaxy Intelligence`,
  ],
  [`style={{ color: GC.textSecondary }}
            >
              {session.projectName}`, `style={{ color: "rgba(255, 255, 255, 0.62)" }}
            >
              {session.projectName}`],
  [
    `scrollbarColor: \`\${GC.scrollThumb} transparent\`,
            background: GC.page,`,
    `scrollbarColor: \`\${GC.scrollThumb} transparent\`,
            background: GC.page,
            scrollbarWidth: "thin",`,
  ],
  // Overview
  [
    `background: GC.card,
                border: \`1px solid \${GC.border}\`,
                boxShadow: GC.shadow,`,
    `background: GC.card,
                border: \`1px solid \${GC.cardBorder}\`,`,
  ],
  [
    `<h3 className="mb-2.5 luxia-type-body-dense-strong" style={{ color: GC.textPrimary, fontWeight: 600 }}>
              Galaxy Overview
            </h3>`,
    `<h3 className="mb-2.5 luxia-type-body-dense-strong" style={{ color: GC.textHeading, fontWeight: 600 }}>
              Galaxy Overview
            </h3>`,
  ],
  // Insights header hover
  [
    `onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = GC.section; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = SURF.header; }}`,
    `onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SURF.hover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = transparencyOpen ? SURF.header : SURF.collapsed; }}`,
  ],
  [
    `style={{
                  background: SURF.header,
                  transition: TRANSITION,
                }}`,
    `style={{
                  background: transparencyOpen ? SURF.header : SURF.collapsed,
                  transition: TRANSITION,
                }}`,
  ],
  [`color: GC.icon,`, `color: GC.chevron,`],
  // Routing
  [
    `background: GC.card,
                          border: \`1px solid \${GC.border}\`,`,
    `background: GC.routing,
                          border: \`1px solid \${GC.cardBorder}\`,`,
  ],
  [`style={{ background: GC.section }}`, `style={{ background: "rgba(0,0,0,0.18)" }}`],
  [`!isManualMode ? GC.purpleDeep : "transparent"`, `!isManualMode ? GC.selected : "transparent"`],
  [`isManualMode ? GC.purpleDeep : "transparent"`, `isManualMode ? GC.selected : "transparent"`],
  [`!isManualMode ? "#FFFFFF" : GC.textPrimary`, `!isManualMode ? "#FFFFFF" : GC.textInactiveTitle`],
  [`isManualMode ? "#FFFFFF" : GC.textPrimary`, `isManualMode ? "#FFFFFF" : GC.textInactiveTitle`],
  [
    `!isManualMode ? "rgba(255,255,255,0.72)" : GC.textSecondary`,
    `!isManualMode ? "rgba(255,255,255,0.78)" : GC.textInactiveDesc`,
  ],
  [
    `isManualMode ? "rgba(255,255,255,0.72)" : GC.textSecondary`,
    `isManualMode ? "rgba(255,255,255,0.78)" : GC.textInactiveDesc`,
  ],
  // Selected constellation trigger
  [
    `background: GC.selectedBg,
                                  border: \`1px solid \${GC.selectedBorder}\`,`,
    `background: GC.trigger,
                                  border: \`1px solid \${GC.triggerBorder}\`,`,
  ],
  [
    `background: GC.card,
                                  border: \`1px solid \${GC.border}\`,`,
    `background: GC.trigger,
                                  border: \`1px solid \${GC.triggerBorder}\`,`,
  ],
  [
    `style={{ border: \`1px solid \${GC.border}\`, background: GC.card, boxShadow: GC.shadow }}`,
    `style={{ border: \`1px solid \${GC.searchBorder}\`, background: GC.dropdown }}`,
  ],
  [
    `borderBottom: \`1px solid \${GC.border}\`,
                                  background: GC.card,`,
    `borderBottom: \`1px solid \${GC.searchBorder}\`,
                                  background: GC.searchField,`,
  ],
  [
    `e.currentTarget.style.boxShadow = \`inset 0 0 0 1px \${GC.purple}, 0 0 0 3px \${GC.focusRing}\`;`,
    `e.currentTarget.style.boxShadow = \`inset 0 0 0 1px \${GC.purple}\`; e.currentTarget.parentElement && (e.currentTarget.parentElement.style.boxShadow = GC.focusRing);`,
  ],
  [
    `className="h-8 w-full min-w-0 rounded-[7px] bg-transparent pl-7 pr-2 outline-none luxia-type-caption placeholder:text-[#98A2B3]"
                                  style={{ color: GC.textPrimary }}`,
    `className="h-8 w-full min-w-0 rounded-[7px] bg-transparent pl-7 pr-2 outline-none luxia-type-caption placeholder:text-[rgba(255,255,255,0.42)]"
                                  style={{ color: GC.textPrimary }}`,
  ],
  [
    `background: selected || highlighted
                                              ? GC.selectedRow
                                              : highlighted
                                                ? GC.hover
                                                : "transparent"`,
    `background: selected
                                              ? GC.rowSelected
                                              : highlighted
                                                ? GC.rowHover
                                                : "transparent"`,
  ],
  [`? GC.selectedRow`, `? GC.rowSelected`],
  [`style={{ color: GC.purple }}`, `style={{ color: GC.interactiveBlue }}`],
  [`Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: GC.purple }}`, `Check size={12} className="mt-0.5 flex-shrink-0" style={{ color: GC.interactiveBlue }}`],
  // Activity
  [
    `background: active
                                      ? "rgba(255,255,255,0.55)"
                                      : "rgba(255,255,255,0.28)",`,
    `background: GC.activityRow,`,
  ],
  [`style={{ background: GC.purple }}`, `style={{ background: GC.idle }}`],
  [`style={{ color: GC.purple, fontWeight: 500 }}`, `style={{ color: GC.interactivePurple, fontWeight: 500 }}`],
  [`style={{ color: GC.purple, fontWeight: 600, transition: TRANSITION }}`, `style={{ color: GC.interactiveBlue, fontWeight: 600, transition: TRANSITION }}`],
  // Sources / Best Match badge leftovers
  [
    `color: GC.iconActive,
                                background: GC.section,`,
    `color: session.selected.type === "PDF" ? GC.pdfBadgeText : GC.dbBadgeText,
                                background: session.selected.type === "PDF" ? GC.pdfBadgeBg : GC.dbBadgeBg,`,
  ],
  // Instruction
  [
    `background: GC.card,
                border: \`1px solid \${GC.border}\`,
                boxShadow: GC.shadow,`,
    `background: GC.instruction,
                border: \`1px solid \${GC.instructionBorder}\`,`,
  ],
  [
    `border: \`1px solid \${focused ? GC.purple : GC.borderInput}\`,
                  boxShadow: focused ? \`0 0 0 3px \${GC.focusRing}\` : "none",`,
    `border: \`1px solid \${focused ? GC.purple : GC.textareaBorder}\`,
                  boxShadow: focused ? GC.focusRing : "none",
                  background: GC.textarea,`,
  ],
  [`background: dirty ? GC.purpleDeep : GC.section,`, `background: dirty ? GC.selected : GC.saveDisabledBg,`],
  [`color: dirty ? "#FFFFFF" : GC.textMuted,`, `color: dirty ? "#FFFFFF" : GC.textDisabled,`],
  [`onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = GC.hover; }}`, `onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}`],
  [`style={{ background: GC.section }}`, `style={{ background: "rgba(255,255,255,0.06)" }}`],
  [`FileText size={13} className="mt-0.5 flex-shrink-0" style={{ color: GC.textSecondary }}`, `FileText size={13} className="mt-0.5 flex-shrink-0" style={{ color: GC.interactiveBlue }}`],
];

let applied = 0;
for (const [from, to] of replacements) {
  if (s.includes(from)) {
    const count = s.split(from).length - 1;
    s = s.split(from).join(to);
    applied += count;
  } else {
    console.log("MISS:", JSON.stringify(from.slice(0, 90)));
  }
}

fs.writeFileSync(path, s);
console.log(`Applied ${applied} replacements`);
