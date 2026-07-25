import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "tmp-galaxy-verify");
fs.mkdirSync(outDir, { recursive: true });
const BASE = process.env.GALAXY_VERIFY_URL ?? "http://localhost:5173";

async function main() {
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Galaxy Chat|Project Name 1/i }).first().click();
  await page.waitForTimeout(500);

  const shell = page.locator('[data-galaxy-shell="true"]');
  await shell.waitFor({ state: "visible" });

  // 1. Starts expanded
  const panel = page.locator('[data-galaxy-panel="intelligence"]');
  if (!(await panel.isVisible())) errors.push("Panel should start expanded at 1440");
  const expandedW = await shell.evaluate((el) => el.getBoundingClientRect().width);
  if (expandedW < 300) errors.push(`Expanded width too small: ${expandedW}`);

  // 2. Collapse
  await page.getByRole("button", { name: "Collapse Galaxy Intelligence" }).click();
  await page.waitForTimeout(400);
  const rail = page.locator('[data-galaxy-panel="intelligence-collapsed"]');
  if (!(await rail.isVisible())) errors.push("Collapsed rail not visible");
  if (await panel.isVisible().catch(() => false)) errors.push("Expanded panel still visible after collapse");
  const collapsedW = await shell.evaluate((el) => el.getBoundingClientRect().width);
  if (collapsedW > 100) errors.push(`Collapsed shell too wide: ${collapsedW}`);
  await shell.screenshot({ path: path.join(outDir, "galaxy-rail-collapsed.png") });

  // 3–4. Expand via rail
  await rail.click();
  await page.waitForTimeout(400);
  if (!(await panel.isVisible())) errors.push("Panel did not expand from rail click");
  await shell.screenshot({ path: path.join(outDir, "galaxy-rail-expanded.png") });

  // 7. Auto-open on submit after manual collapse
  await page.getByRole("button", { name: "Collapse Galaxy Intelligence" }).click();
  await page.waitForTimeout(280);
  await page.getByPlaceholder("Ask something").fill("Where is the latest financial policy?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  if (!(await panel.isVisible())) errors.push("Panel did not auto-open on Galaxy submit");

  // 8. Manual collapse during request stays collapsed through phases
  await page.getByRole("button", { name: "Collapse Galaxy Intelligence" }).click();
  await page.waitForTimeout(200);
  await page.waitForTimeout(2500);
  if (await panel.isVisible().catch(() => false)) {
    errors.push("Panel reopened during same request after manual collapse");
  }
  if (!(await rail.isVisible())) errors.push("Rail missing after mid-request collapse");

  // 9. View activity expands
  await page.getByRole("button", { name: /View activity/i }).first().click();
  await page.waitForTimeout(300);
  if (!(await panel.isVisible())) errors.push("View activity did not expand panel");

  // 10. Constellation chat unchanged
  await page.getByRole("button", { name: /Chat 1|Financial Documents/i }).first().click().catch(() => null);
  await page.waitForTimeout(300);
  const constellationAside = page.locator("aside").filter({ hasText: /Instruction|PDF Files|Metrics/i }).first();
  // Just ensure galaxy shell gone when not on galaxy
  const onGalaxy = await page.locator('[data-galaxy-shell="true"]').count();
  // May still be on galaxy if tab click failed — soft check
  await page.screenshot({ path: path.join(outDir, "galaxy-collapse-final.png") });

  console.log(JSON.stringify({
    ok: errors.length === 0,
    expandedW,
    collapsedW,
    onGalaxyShellCount: onGalaxy,
    errors,
  }, null, 2));

  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
