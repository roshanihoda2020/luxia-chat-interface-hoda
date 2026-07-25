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

  // Open Galaxy chat tab (now labeled with project name)
  const galaxyTab = page.getByRole("button", { name: /Project Name 1/i }).first();
  await galaxyTab.click();
  await page.waitForTimeout(400);

  const projectBtn = page.locator('[data-galaxy-project-selector="true"]');
  await projectBtn.waitFor({ state: "visible", timeout: 8000 });
  const btnText = (await projectBtn.innerText()).replace(/\s+/g, " ").trim();
  if (!/^Galaxy\s+Project Name 1$/i.test(btnText) && !(/Galaxy/i.test(btnText) && /Project Name 1/i.test(btnText))) {
    errors.push(`Selector missing Galaxy / Project Name hierarchy: "${btnText}"`);
  }
  if (/\bPROJECT\b/.test(btnText) || /Project Intelligence|Galaxy Chat/i.test(btnText)) {
    errors.push(`Forbidden wording in selector: "${btnText}"`);
  }

  const projectBadgeCount = await page.locator("span.luxia-type-overline-data", { hasText: /^Project$/i }).count();
  if (projectBadgeCount > 0) errors.push("PROJECT/Project overline badge still visible");

  const title = await projectBtn.getAttribute("title");
  if (title !== "Project Name 1") errors.push(`Tooltip title unexpected: "${title}"`);

  await projectBtn.screenshot({ path: path.join(outDir, "galaxy-project-selector.png") });

  await projectBtn.click();
  await page.waitForTimeout(200);
  await page.getByRole("option", { name: /Enterprise Multi-Region/i }).click();
  await page.waitForTimeout(200);

  const after = (await projectBtn.innerText()).replace(/\s+/g, " ").trim();
  if (!/Enterprise Multi-Region/i.test(after)) errors.push(`Did not switch project: "${after}"`);
  if (!/^Galaxy\b/i.test(after)) errors.push(`Galaxy label missing after switch: "${after}"`);

  const trunc = await page.evaluate(() => {
    const btn = document.querySelector('[data-galaxy-project-selector="true"]');
    const nameEl = document.querySelector('[data-galaxy-project-name="true"]');
    if (!btn || !nameEl) return { ok: false, reason: "selector/name missing" };
    const cs = getComputedStyle(nameEl);
    const styleOk =
      cs.textOverflow === "ellipsis" &&
      cs.whiteSpace === "nowrap" &&
      (cs.overflow === "hidden" || cs.overflowX === "hidden");
    const full = btn.getAttribute("title") || "";
    return {
      ok: styleOk && full.length > 40 && nameEl.clientWidth < 400,
      styleOk,
      scrollWidth: nameEl.scrollWidth,
      clientWidth: nameEl.clientWidth,
      title: full,
      textOverflow: cs.textOverflow,
      visible: (nameEl.textContent || "").trim().slice(0, 60),
    };
  });
  if (!trunc.ok) errors.push(`Long name truncation failed: ${JSON.stringify(trunc)}`);

  await page.screenshot({ path: path.join(outDir, "galaxy-project-selector-long.png") });

  console.log(JSON.stringify({ ok: errors.length === 0, errors, btnText, after, trunc }, null, 2));
  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
