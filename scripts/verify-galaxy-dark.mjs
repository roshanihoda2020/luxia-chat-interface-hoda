import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "tmp-galaxy-verify");
fs.mkdirSync(outDir, { recursive: true });
const BASE = process.env.GALAXY_VERIFY_URL ?? "http://localhost:5173";

function rgbOf(css) {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isDark([r, g, b]) {
  // Perceived luminance — dark purple shell should be well below mid gray
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 80;
}

function isNearWhite([r, g, b]) {
  return r > 240 && g > 240 && b > 240;
}

async function main() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Galaxy Chat|Project Name 1/i }).first().click();
  await page.waitForTimeout(500);

  const panel = page.locator('[data-galaxy-panel="intelligence"]');
  await panel.waitFor({ state: "visible" });

  // Shell must be dark, not white
  const shellBg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
  const shellRgb = rgbOf(shellBg);
  if (!shellRgb || !isDark(shellRgb)) errors.push(`Panel shell not dark: ${shellBg}`);
  if (shellRgb && isNearWhite(shellRgb)) errors.push(`Panel shell is white: ${shellBg}`);

  // No Confidence / Why this Match / How Galaxy Worked
  const body = await panel.innerText();
  if (/Confidence|Why this Match|How Galaxy Worked|\bTransparency\b/i.test(body)) {
    errors.push("Deprecated section text still visible");
  }
  if (!/Galaxy Insights/i.test(body)) errors.push("Galaxy Insights label missing");

  // 1. Collapsed
  const insightsBtn = page.getByRole("button", { name: /Galaxy Insights/i }).first();
  if ((await insightsBtn.getAttribute("aria-expanded")) === "true") {
    await insightsBtn.click();
    await page.waitForTimeout(280);
  }
  await panel.screenshot({ path: path.join(outDir, "galaxy-dark-collapsed.png") });

  // 2. Expanded Auto
  await insightsBtn.click();
  await page.waitForTimeout(280);
  await panel.screenshot({ path: path.join(outDir, "galaxy-dark-expanded-auto.png") });

  // 3. Specific + dropdown
  await page.getByRole("radio", { name: /Specific/i }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("textbox", { name: /Search constellations/i }).click();
  await page.waitForTimeout(150);
  await panel.screenshot({ path: path.join(outDir, "galaxy-dark-specific-search.png") });

  // Cards inside panel should not be near-white solid surfaces
  // (sidebar-style rgba(255,255,255,0.06) lifts are intentional and allowed)
  const whiteCards = await page.evaluate(() => {
    const panelEl = document.querySelector('[data-galaxy-panel="intelligence"]');
    if (!panelEl) return ["panel missing"];
    const bad = [];
    const parseBg = (bg) => {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/i);
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] === undefined ? 1 : Number(m[4]),
      };
    };
    const isSolidNearWhite = ({ r, g, b, a }) =>
      a > 0.85 && r > 240 && g > 240 && b > 240;

    for (const el of panelEl.querySelectorAll("[data-galaxy-description], [data-galaxy-instruction], [data-galaxy-activity], [data-transparency-open] > *")) {
      const parsed = parseBg(getComputedStyle(el).backgroundColor);
      if (!parsed) continue;
      if (isSolidNearWhite(parsed)) {
        bad.push(`${el.getAttribute("data-galaxy-description") || el.getAttribute("data-galaxy-instruction") || el.tagName}: rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.a})`);
      }
    }
    for (const el of panelEl.querySelectorAll("div")) {
      const parsed = parseBg(getComputedStyle(el).backgroundColor);
      if (!parsed) continue;
      if (isSolidNearWhite(parsed) && el.getBoundingClientRect().height > 40) {
        bad.push(`white-card rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.a})`);
      }
    }
    return [...new Set(bad)].slice(0, 8);
  });
  if (whiteCards.length) errors.push(`White content cards remain: ${whiteCards.join("; ")}`);

  // 4-5. Complete state with Best Match / Sources
  await page.getByRole("radio", { name: /Auto/i }).first().click();
  await page.waitForTimeout(100);
  await page.getByPlaceholder("Ask something").fill("Where is the latest financial policy?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3800);
  const after = await panel.innerText();
  if (!/Best Match|Sources/i.test(after)) errors.push("Best Match / Sources missing after answer");
  if (/Confidence|Why this Match/i.test(after)) errors.push("Confidence/Why still visible after answer");
  await panel.screenshot({ path: path.join(outDir, "galaxy-dark-complete.png") });

  // 6. Instruction save states — dirty enables purple button
  const instruction = page.locator('[data-galaxy-instruction="true"]');
  const textarea = instruction.locator("textarea");
  await textarea.fill((await textarea.inputValue()) + "\nPrefer concise answers.");
  await page.waitForTimeout(100);
  await panel.screenshot({ path: path.join(outDir, "galaxy-dark-instruction-dirty.png") });

  console.log(JSON.stringify({
    ok: errors.length === 0,
    shellBg,
    errors,
    screenshots: [
      "galaxy-dark-collapsed.png",
      "galaxy-dark-expanded-auto.png",
      "galaxy-dark-specific-search.png",
      "galaxy-dark-complete.png",
      "galaxy-dark-instruction-dirty.png",
    ],
  }, null, 2));

  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
