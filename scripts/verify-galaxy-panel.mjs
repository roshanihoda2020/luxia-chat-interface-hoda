import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "tmp-galaxy-verify");
fs.mkdirSync(outDir, { recursive: true });

const BASE = process.env.GALAXY_VERIFY_URL ?? "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];

  await page.goto(BASE, { waitUntil: "networkidle" });

  // Open existing Galaxy Chat tab (tab label may show project name)
  const galaxyTab = page.getByRole("button", { name: /Galaxy Chat|Project Name 1/i }).first();
  await galaxyTab.click();
  await page.waitForTimeout(400);

  const title = page.locator('[data-galaxy-title="true"]');
  await title.waitFor({ state: "visible", timeout: 8000 });
  const titleText = (await title.textContent())?.trim();
  if (titleText !== "Galaxy Intelligence") {
    errors.push(`Title expected "Galaxy Intelligence", got "${titleText}"`);
  }

  const subtitle = page.locator('[data-galaxy-subtitle="true"]');
  await subtitle.waitFor({ state: "visible" });
  const subtitleText = (await subtitle.textContent())?.trim() ?? "";
  if (/Project intelligence/i.test(subtitleText)) {
    errors.push("Repetitive subtitle 'Project intelligence' still visible");
  }
  if (!/.+ · \d+ constellation(s)?$/.test(subtitleText)) {
    errors.push(`Header subtitle unexpected: "${subtitleText}"`);
  }
  if (/intelligence|\bAI\b|\bGalaxy\b/i.test(subtitleText)) {
    errors.push(`Subtitle should not repeat intelligence/AI/Galaxy wording: "${subtitleText}"`);
  }

  // Old title must be gone
  const oldTitleCount = await page.getByText("How Galaxy Worked").count();
  if (oldTitleCount > 0) errors.push("Old title 'How Galaxy Worked' still visible");

  const insightsBtn = page.getByRole("button", { name: /Galaxy Insights/i }).first();
  await insightsBtn.waitFor({ state: "visible" });
  if ((await insightsBtn.getAttribute("aria-expanded")) !== "true") {
    errors.push("Galaxy Insights should be expanded by default");
  }

  // Instruction always open
  const instruction = page.locator('[data-galaxy-instruction="true"]');
  await instruction.waitFor({ state: "visible" });
  const helper = await instruction.locator("text=This is how Galaxy has been instructed to behave.").count();
  if (helper < 1) errors.push("Instruction helper text missing");

  // Galaxy Overview removed — description replaces it
  const overviewGone = await page.locator('[data-galaxy-overview="true"]').count();
  if (overviewGone > 0) errors.push("Galaxy Overview should be removed");
  if (await page.getByText("Galaxy Overview", { exact: true }).count()) {
    errors.push("Galaxy Overview heading still visible");
  }
  if (await page.getByText("Available resources", { exact: false }).count()) {
    errors.push("Available resources metadata still visible");
  }

  // Editable Description — display mode, no card chrome
  const description = page.locator('[data-galaxy-description="true"]');
  await description.waitFor({ state: "visible" });
  const descText = page.locator('[data-galaxy-description-text="true"]');
  await descText.waitFor({ state: "visible" });
  const descCopy = (await descText.textContent())?.trim() ?? "";
  if (descCopy.length < 20) errors.push("Description text missing or too short");
  const descLabel = await description.locator("h3").first().textContent();
  if (!/Description/i.test(descLabel ?? "")) errors.push("Description label missing");

  // Edit control present and accessible
  const editBtn = page.locator('[data-galaxy-description-edit="true"]');
  await editBtn.waitFor({ state: "attached" });
  if ((await editBtn.getAttribute("aria-label")) !== "Edit description") {
    errors.push("Edit description control missing accessible name");
  }

  // Inline edit → save
  await editBtn.focus();
  await editBtn.click();
  const descInput = page.locator('[data-galaxy-description-input="true"]');
  await descInput.waitFor({ state: "visible" });
  const updated = "Routes Project Name 1 questions to the strongest constellation and verified sources.";
  await descInput.click();
  await descInput.fill(updated);
  // Ensure controlled field holds only the intended value
  await descInput.evaluate((el, value) => {
    const input = el;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, updated);
  await page.locator('[data-galaxy-description-save="true"]').click();
  await page.waitForTimeout(120);
  const afterSave = (await page.locator('[data-galaxy-description-text="true"]').textContent())?.trim() ?? "";
  if (afterSave !== updated) errors.push(`Description save failed: "${afterSave}"`);

  // Cancel restores previous
  await page.locator('[data-galaxy-description-edit="true"]').click();
  await descInput.waitFor({ state: "visible" });
  await descInput.evaluate((el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, "Temporary draft that should be discarded");
  await page.locator('[data-galaxy-description-cancel="true"]').click();
  await page.waitForTimeout(120);
  const afterCancel = (await page.locator('[data-galaxy-description-text="true"]').textContent())?.trim() ?? "";
  if (afterCancel !== updated) errors.push(`Description cancel failed: "${afterCancel}"`);

  // Empty save blocked
  await page.locator('[data-galaxy-description-edit="true"]').click();
  await descInput.waitFor({ state: "visible" });
  await descInput.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, "   ");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const saveDisabled = await page.locator('[data-galaxy-description-save="true"]').isDisabled();
  if (!saveDisabled) {
    await page.locator('[data-galaxy-description-save="true"]').click();
    await page.waitForTimeout(80);
  }
  if (await page.locator('[data-galaxy-description-input="true"]').count()) {
    // still editing — good; Escape to cancel back
    await descInput.press("Escape");
    await page.waitForTimeout(80);
  }
  const afterEmpty = (await page.locator('[data-galaxy-description-text="true"]').textContent())?.trim() ?? "";
  if (afterEmpty !== updated) errors.push(`Empty description was saved: "${afterEmpty}"`);

  // No decorative left accent rails inside Galaxy Intelligence content cards
  const leftAccentCheck = await page.evaluate(() => {
    const panel = document.querySelector('[data-galaxy-panel="intelligence"]');
    if (!panel) return { ok: false, reason: "Galaxy panel missing" };
    const offenders = [];
    for (const el of panel.querySelectorAll("*")) {
      // Skip the functional resize handle on the panel edge
      if (el.classList.contains("cursor-col-resize") || el.closest(".cursor-col-resize")) continue;
      const cs = getComputedStyle(el);
      const blw = parseFloat(cs.borderLeftWidth) || 0;
      const brw = parseFloat(cs.borderRightWidth) || 0;
      const btw = parseFloat(cs.borderTopWidth) || 0;
      const bbw = parseFloat(cs.borderBottomWidth) || 0;
      // Decorative left-only accent (thicker or colored while other sides are none/0)
      if (blw >= 1.5 && (brw < 0.5 || btw < 0.5 || bbw < 0.5) && cs.borderLeftStyle !== "none") {
        const color = cs.borderLeftColor;
        offenders.push({
          tag: el.tagName,
          className: String(el.className).slice(0, 80),
          borderLeft: `${blw}px ${cs.borderLeftStyle} ${color}`,
        });
      }
      // Absolute vertical strips used as rails (not search icons)
      if (cs.position === "absolute") {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.width <= 4 && r.height >= 24) {
          const bg = cs.backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            offenders.push({
              tag: el.tagName,
              className: String(el.className).slice(0, 80),
              absoluteRail: `${Math.round(r.width)}x${Math.round(r.height)} ${bg}`,
            });
          }
        }
      }
    }
    return { ok: offenders.length === 0, offenders };
  });
  if (!leftAccentCheck.ok) {
    errors.push(`Left accent remnants: ${JSON.stringify(leftAccentCheck.offenders?.slice(0, 5))}`);
  }

  // Expanded screenshot
  await page.locator('[data-galaxy-panel="intelligence"]').screenshot({
    path: path.join(outDir, "galaxy-insights-expanded.png"),
  });

  // Collapse Galaxy Insights
  await insightsBtn.click();
  await page.waitForTimeout(280);
  if ((await insightsBtn.getAttribute("aria-expanded")) !== "false") {
    errors.push("Galaxy Insights did not collapse");
  }

  // Description still visible when Insights collapsed
  if (!(await page.locator('[data-galaxy-description="true"]').isVisible())) {
    errors.push("Description hidden after Galaxy Insights collapse");
  }

  const panelOpen = await page.locator('[data-transparency-open="true"]').count();
  if (panelOpen > 0) errors.push("Galaxy Insights content still marked open after collapse");

  const summary = page.locator('[data-transparency-summary="true"]');
  await summary.waitFor({ state: "visible", timeout: 3000 });
  const summaryText = (await summary.textContent())?.trim() ?? "";
  if (!/Auto Routing|Ready|Best Match/i.test(summaryText)) {
    errors.push(`Collapsed summary unexpected: "${summaryText}"`);
  }

  // Instruction still open after collapse
  if (!(await instruction.isVisible())) {
    errors.push("Instruction hidden after Galaxy Insights collapse");
  }

  await page.locator('[data-galaxy-panel="intelligence"]').screenshot({
    path: path.join(outDir, "galaxy-insights-collapsed.png"),
  });

  // Re-expand and send a message to verify live updates + process rows
  await insightsBtn.click();
  await page.waitForTimeout(280);

  const composer = page.getByPlaceholder("Ask something");
  await composer.fill("Where is the latest financial policy?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4200);

  const bodyText = await page.locator('[data-galaxy-panel="intelligence"]').innerText();
  if (!/Best Match|Financial Documents|Sources/i.test(bodyText)) {
    errors.push("After send, Best Match / Sources not visible in panel");
  }
  if (/Confidence|96%|Very High|Highest confidence/i.test(bodyText)) {
    errors.push("Confidence UI still visible in Galaxy panel");
  }
  if (/Why this Match|Financial policies detected|Credit approval workflow|Historical reports available/i.test(bodyText)) {
    errors.push("Why this Match UI still visible in Galaxy panel");
  }

  // Best Match should follow Activity (no Why section between)
  const sectionOrder = await page.evaluate(() => {
    const panel = document.querySelector('[data-transparency-open="true"]')
      || document.querySelector('#galaxy-transparency-panel');
    if (!panel) return null;
    const text = panel.innerText || "";
    const activity = text.search(/Activity/i);
    const why = text.search(/Why this Match/i);
    const best = text.search(/Best Match/i);
    const sources = text.search(/Sources/i);
    return { activity, why, best, sources, snippet: text.slice(0, 280) };
  });
  if (sectionOrder) {
    if (sectionOrder.why >= 0) errors.push("Why this Match still present in Insights content");
    if (sectionOrder.activity < 0 || sectionOrder.best < 0) {
      errors.push(`Activity or Best Match missing after answer (${JSON.stringify(sectionOrder)})`);
    } else if (sectionOrder.best < sectionOrder.activity) {
      errors.push("Best Match appears before Activity");
    }
  }

  // Collapse again after answer to verify summary has no confidence
  await insightsBtn.click();
  await page.waitForTimeout(280);
  const completeSummary = (await page.locator('[data-transparency-summary="true"]').textContent())?.trim() ?? "";
  if (/[Cc]onfidence/i.test(completeSummary)) {
    errors.push(`Collapsed summary still mentions confidence: "${completeSummary}"`);
  }
  await insightsBtn.click();
  await page.waitForTimeout(280);

  // Expand process list if collapsed summary is shown
  const viewProcess = page.getByRole("button", { name: /View process/i });
  if (await viewProcess.count()) {
    await viewProcess.first().click();
    await page.waitForTimeout(200);
  }

  const activityList = page.locator('[data-galaxy-activity-list="true"]');
  if (await activityList.count()) {
    const rowCount = await page.locator('[data-galaxy-activity-row="true"]').count();
    if (rowCount < 1) errors.push("Activity process rows not readable after answer");

    const postProcessConnector = await page.evaluate(() => {
      const list = document.querySelector('[data-galaxy-activity-list="true"]');
      if (!list) return { ok: false, reason: "Activity list missing after View process" };
      const absoluteBars = [...list.querySelectorAll("*")].filter((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return (
          s.position === "absolute" &&
          r.width > 0 &&
          r.width <= 3 &&
          r.height >= 12
        );
      });
      if (absoluteBars.length > 0) {
        return { ok: false, reason: `Process list has ${absoluteBars.length} vertical connector bar(s)` };
      }
      return { ok: true, rows: list.querySelectorAll('[data-galaxy-activity-row="true"]').length };
    });
    if (!postProcessConnector.ok) {
      errors.push(postProcessConnector.reason || "Post-process connector check failed");
    }
  }

  await page.locator('[data-galaxy-panel="intelligence"]').screenshot({
    path: path.join(outDir, "galaxy-insights-activity-rows.png"),
  });

  // Specific constellation selector: long names + large catalog
  const specificBtn = page.getByRole("radio", { name: /Specific/i }).first();
  await specificBtn.click();
  await page.waitForTimeout(200);

  const selector = page.locator('[data-galaxy-specific-selector="true"]');
  await selector.waitFor({ state: "visible" });

  const hint = page.locator('[data-galaxy-results-hint="true"]');
  await hint.waitFor({ state: "visible" });
  const hintText = (await hint.textContent())?.trim() ?? "";
  if (!/Type to narrow .*constellations/i.test(hintText) && !/results shown/i.test(hintText)) {
    errors.push(`Expected large-catalog hint, got "${hintText}"`);
  }

  const resultCount = await page.locator('[data-galaxy-constellation-results="true"] [role="option"]').count();
  if (resultCount > 50) errors.push(`Expected at most 50 visible results, got ${resultCount}`);
  if (resultCount < 1) errors.push("Expected some constellation results in Specific mode");

  // Select a short placeholder constellation
  const firstOption = page.locator('[data-galaxy-constellation-results="true"] [role="option"]').first();
  const fullName = (await firstOption.getAttribute("title")) ?? "";
  if (!/^Constellation \d+$/.test(fullName)) {
    errors.push(`Expected short constellation name, got "${fullName}"`);
  }
  const noisy = await page.locator('[data-galaxy-constellation-results="true"]').innerText();
  if (/Knowledge Base|Credit Policy|Regulatory|Financial Documents|Project Name/i.test(noisy)) {
    errors.push("Long/noisy mock names still present in results");
  }
  await firstOption.click();
  await page.waitForTimeout(150);

  const trigger = page.locator('[data-galaxy-selected-trigger="true"]');
  await trigger.waitFor({ state: "visible" });
  const triggerTitle = (await trigger.getAttribute("title")) ?? "";
  if (fullName && triggerTitle !== fullName) {
    errors.push(`Trigger tooltip missing name. expected "${fullName}", got "${triggerTitle}"`);
  }
  const triggerText = (await trigger.innerText()).replace(/\s+/g, " ");
  if (!/^Constellation \d+/.test(triggerText.trim()) || /Knowledge Base|Project Name/i.test(triggerText)) {
    errors.push(`Selected value unexpected: "${triggerText}"`);
  }

  const badgeCheck = await page.evaluate(() => {
    const triggerEl = document.querySelector('[data-galaxy-selected-trigger="true"]');
    if (!triggerEl) return { ok: false, reason: "Selected trigger missing" };
    const text = triggerEl.textContent || "";
    // Type badges must not appear in the selected-value capsule
    if (/\bPDF\b|\bDB\b/.test(text)) {
      return { ok: false, reason: `Type badge still in trigger: "${text.trim()}"` };
    }
    return { ok: true };
  });
  if (!badgeCheck.ok) {
    errors.push(`Selected trigger badge check failed: ${JSON.stringify(badgeCheck)}`);
  }

  // Search matches short name (case-insensitive partial)
  const search = page.getByRole("textbox", { name: /Search constellations/i });
  await search.fill("constellation 12");
  await page.waitForTimeout(150);
  const matchCount = await page.locator('[data-galaxy-constellation-results="true"] [role="option"]').count();
  if (matchCount < 1) errors.push("Search did not match constellation placeholder name");
  const matchTitle = await page.locator('[data-galaxy-constellation-results="true"] [role="option"]').first().getAttribute("title");
  if (matchTitle && !/^Constellation \d+$/.test(matchTitle)) {
    errors.push(`Search result name unexpected: "${matchTitle}"`);
  }

  await page.locator('[data-galaxy-panel="intelligence"]').screenshot({
    path: path.join(outDir, "galaxy-specific-selector.png"),
  });

  // Exactly one Description (Overview removed)
  const overviewCount = await page.locator('[data-galaxy-overview="true"]').count();
  if (overviewCount !== 0) errors.push(`Expected 0 Galaxy Overview, found ${overviewCount}`);
  const descriptionCount = await page.locator('[data-galaxy-description="true"]').count();
  if (descriptionCount !== 1) errors.push(`Expected 1 Description, found ${descriptionCount}`);

  // Duplicate checks
  const titleCount = await page.locator('[data-galaxy-title="true"]').count();
  if (titleCount !== 1) errors.push(`Expected 1 Galaxy Intelligence title, found ${titleCount}`);
  const insightsCount = await page.getByRole("button", { name: /Galaxy Insights/i }).count();
  if (insightsCount !== 1) errors.push(`Expected 1 Galaxy Insights button, found ${insightsCount}`);
  const instructionCount = await page.locator('[data-galaxy-instruction="true"]').count();
  if (instructionCount !== 1) errors.push(`Expected 1 Instruction card, found ${instructionCount}`);

  console.log(JSON.stringify({
    ok: errors.length === 0,
    titleText,
    summaryText,
    subtitleText,
    hintText,
    errors,
    screenshots: [
      path.join(outDir, "galaxy-insights-expanded.png"),
      path.join(outDir, "galaxy-insights-collapsed.png"),
      path.join(outDir, "galaxy-insights-activity-rows.png"),
      path.join(outDir, "galaxy-specific-selector.png"),
    ],
  }, null, 2));

  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
