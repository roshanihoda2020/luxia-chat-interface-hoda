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
  await page.waitForTimeout(400);

  const title = (await page.locator("h1").first().textContent())?.trim();
  if (title !== "Galaxy Chat") errors.push(`Title expected "Galaxy Chat", got "${title}"`);

  const crumb = (await page.getByLabel("Breadcrumb").innerText()).replace(/\s+/g, " ").trim();
  if (!/Home\s*\/\s*Project Name 1\s*\/\s*Galaxy\s*\/\s*Galaxy Chat/i.test(crumb)) {
    errors.push(`Breadcrumb unexpected: "${crumb}"`);
  }

  if ((await page.locator('[data-galaxy-project-selector="true"]').count()) > 0) {
    errors.push("Project selector still present in page heading");
  }

  const options = await page.getByRole("button", { name: /Options/i }).count();
  if (options < 1) errors.push("Options button missing");

  await page.locator("h1").first().locator("..").screenshot({
    path: path.join(outDir, "galaxy-page-heading-restored.png"),
  });

  console.log(JSON.stringify({ ok: errors.length === 0, title, crumb, errors }, null, 2));
  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
