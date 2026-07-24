/**
 * One-shot typography migration: replace arbitrary text sizes with luxia-type-* classes.
 * Run: node scripts/migrate-typography.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");
const SKIP = new Set(["imports"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Ordered replacements — more specific patterns first */
const REPLACEMENTS = [
  // Dense table headers / overlines data
  [/text-\[11px\]\s+uppercase\s+tracking-\[0\.12em\](?:\s+font-(?:semibold|bold|extrabold|medium))?/g, "luxia-type-table-header-dense"],
  [/text-\[11px\]\s+font-(?:semibold|bold|extrabold)\s+uppercase\s+tracking-\[0\.12em\]/g, "luxia-type-overline-data"],
  [/text-\[11px\]\s+font-semibold\s+tracking-\[0\.12em\]\s+uppercase/g, "luxia-type-overline-data"],
  [/text-\[11px\]\s+font-semibold\s+tracking-wide\s+uppercase/g, "luxia-type-overline-data"],
  [/text-\[10px\]\s+font-semibold\s+tracking-\[0\.12em\]\s+uppercase/g, "luxia-type-overline-data"],
  [/text-\[10px\]\s+font-medium\s+uppercase\s+tracking-\[0\.04em\]/g, "luxia-type-overline-data"],
  [/text-\[11px\]\s+leading-4\s+font-medium\s+uppercase\s+tracking-\[0\.04em\]/g, "luxia-type-overline-data"],
  [/text-\[12px\]\s+font-(?:semibold|bold)\s+uppercase\s+tracking-\[0\.08em\]/g, "luxia-type-overline-form"],
  [/text-\[12px\]\s+font-bold\s+tracking-wide\s+uppercase/g, "luxia-type-overline-form"],
  [/text-\[12px\]\s+font-semibold\s+uppercase\s+tracking-\[0\.08em\]/g, "luxia-type-overline-form"],

  // Modal / panel / page titles
  [/text-\[32px\]\s+leading-\[40px\]/g, "luxia-type-title-page"],
  [/text-\[18px\]\s+font-extrabold/g, "luxia-type-title-modal"],
  [/text-\[18px\]\s+font-bold/g, "luxia-type-title-modal"],
  [/text-\[16px\]\s+font-extrabold/g, "luxia-type-title-panel"],
  [/text-\[16px\]\s+font-bold(?:\s+leading-none)?/g, "luxia-type-title-panel"],
  [/text-\[14px\]\s+font-extrabold/g, "luxia-type-title-component"],
  [/text-\[22px\]\s+font-bold/g, "luxia-type-heading-h4"],
  [/text-\[17px\]\s+font-extrabold/g, "luxia-type-title-panel"],

  // Buttons / labels (13 semibold)
  [/text-\[13px\]\s+font-semibold/g, "luxia-type-body-dense-strong"],
  [/text-\[13px\]\s+font-bold/g, "luxia-type-body-dense-strong"],
  [/text-\[13px\]\s+font-extrabold/g, "luxia-type-body-dense-strong"],
  [/text-\[13px\]\s+font-medium/g, "luxia-type-body-dense-strong"],
  [/text-\[13px\]\s+leading-\[1\.6\]/g, "luxia-type-body-dense"],
  [/text-\[13px\]\s+leading-\[1\.7\]/g, "luxia-type-body-dense"],
  [/text-\[13px\]\s+leading-\[1\.45\]/g, "luxia-type-body-dense"],
  [/text-\[13px\]\s+leading-5/g, "luxia-type-body-dense"],
  [/text-\[13px\](?![0-9])/g, "luxia-type-body-dense"],

  // Search dense overrides often: h-8 ... text-[13px]
  [/className="h-8 border-0 bg-transparent px-0 text-\[13px\] shadow-none focus-visible:ring-0"/g,
    'className="h-8 border-0 bg-transparent px-0 luxia-type-input-search-dense shadow-none focus-visible:ring-0"'],

  // 12px variants
  [/text-\[12px\]\s+font-semibold/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+font-bold/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+font-medium/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+leading-\[1\.45\]/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+leading-\[1\.6\]/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+leading-5/g, "luxia-type-metadata"],
  [/text-\[12px\]\s+leading-\[16px\]/g, "luxia-type-metadata"],
  [/text-\[12\.5px\]\s+font-semibold/g, "luxia-type-profile-secondary"],
  [/text-\[12\.5px\]/g, "luxia-type-body-dense"],
  [/text-\[12px\](?![0-9])/g, "luxia-type-metadata"],

  // 11px
  [/text-\[11\.5px\]\s+font-semibold/g, "luxia-type-caption"],
  [/text-\[11\.5px\]\s+font-medium/g, "luxia-type-caption"],
  [/text-\[11\.5px\]/g, "luxia-type-caption"],
  [/text-\[11px\]\s+font-semibold/g, "luxia-type-caption"],
  [/text-\[11px\]\s+font-bold/g, "luxia-type-caption"],
  [/text-\[11px\]\s+font-medium/g, "luxia-type-caption"],
  [/text-\[11px\]\s+leading-none/g, "luxia-type-caption"],
  [/text-\[11px\]\s+leading-tight/g, "luxia-type-caption"],
  [/text-\[11px\](?![0-9])/g, "luxia-type-caption"],

  // 14px
  [/text-\[14\.5px\]\s+leading-\[1\.65\]\s+font-medium/g, "luxia-type-body-small-strong"],
  [/text-\[14\.5px\]/g, "luxia-type-body-small"],
  [/text-\[14px\]\s+font-semibold/g, "luxia-type-body-small-strong"],
  [/text-\[14px\]\s+font-bold/g, "luxia-type-title-component"],
  [/text-\[14px\]\s+font-medium/g, "luxia-type-body-small-strong"],
  [/text-\[14px\]\s+leading-relaxed/g, "luxia-type-body-small"],
  [/text-\[14px\](?![0-9])/g, "luxia-type-body-small"],

  // 15px → body small
  [/text-\[15px\]\s+font-semibold/g, "luxia-type-body-small-strong"],
  [/text-\[15px\]\s+font-bold/g, "luxia-type-body-small-strong"],
  [/text-\[15px\]\s+leading-\[1\.7\]/g, "luxia-type-body-small"],
  [/text-\[15px\](?![0-9])/g, "luxia-type-body-small"],

  // 10 / 9
  [/text-\[10px\]\s+font-bold/g, "luxia-type-badge"],
  [/text-\[10px\]\s+font-semibold/g, "luxia-type-caption"],
  [/text-\[10px\]\s+font-medium/g, "luxia-type-caption"],
  [/text-\[10\.5px\]\s+font-semibold/g, "luxia-type-caption"],
  [/text-\[10px\](?![0-9])/g, "luxia-type-caption"],
  [/text-\[9px\]\s+font-bold/g, "luxia-type-badge"],

  // Nav fractional
  [/text-\[13\.5px\]/g, "luxia-type-nav-sidebar"],

  // Strip redundant font-medium / tracking remnants next to luxia-type when duplicated poorly
  [/fontWeight:\s*500/g, "fontWeight: 600"],
  [/font-weight:\s*500/g, "font-weight: 600"],
];

let changedFiles = 0;
let totalHits = 0;

for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  for (const [re, rep] of REPLACEMENTS) {
    const next = src.replace(re, (m) => {
      totalHits++;
      return rep;
    });
    src = next;
  }
  // Fix double-classes that may have been created: luxia-type-X luxia-type-Y from overlapping — leave as-is
  // Clean: "luxia-type-body-dense luxia-type-body-dense" duplicates
  src = src.replace(/(luxia-type-[\w-]+)\s+\1/g, "$1");
  // Remove leftover truncate max-w with redundant truncate in labelClassName patterns already handled

  if (src !== before) {
    fs.writeFileSync(file, src);
    changedFiles++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}

console.log(`\nDone. Files: ${changedFiles}, replacements: ${totalHits}`);
