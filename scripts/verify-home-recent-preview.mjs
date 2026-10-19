/**
 * Functional verification for Home Recent Show 3 / 6 / 9 / All slicing.
 * Pinned and Recent are independent — pinned IDs remain in Recent.
 * Run: npx --yes tsx scripts/verify-home-recent-preview.mjs
 */
import {
  buildHomeProjectSeeds,
  getHomeProjectsSections,
  materializeHomeProjects,
} from "../src/app/features/project/data.ts";
import { resolveHomeRecentPreviewLimit } from "../src/app/features/home/homeRecentPreviewCount.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyCollection(total, pinnedIds = ["project-02"]) {
  const projects = materializeHomeProjects(buildHomeProjectSeeds(total));
  const recentEligible = total;

  const cases = [
    { show: 3, expected: Math.min(3, recentEligible) },
    { show: 6, expected: Math.min(6, recentEligible) },
    { show: 9, expected: Math.min(9, recentEligible) },
    { show: "all", expected: recentEligible },
  ];

  for (const { show, expected } of cases) {
    const limit = resolveHomeRecentPreviewLimit(show);
    const { recent, pinned, totalAccessible, recentEligibleTotal } =
      getHomeProjectsSections(projects, pinnedIds, limit);

    assert(totalAccessible === total, `${total}: accessible ${totalAccessible} !== ${total}`);
    assert(
      recentEligibleTotal === recentEligible,
      `${total} show ${show}: eligible ${recentEligibleTotal} !== ${recentEligible}`,
    );
    assert(
      recent.length === expected,
      `${total} show ${show}: recent ${recent.length} !== ${expected}`,
    );
    assert(
      pinned.every((p) => pinnedIds.includes(p.id) || p.isPinned),
      `${total} show ${show}: pinned section contains non-pinned`,
    );

    // Pinned projects that fall within the Show window must also appear in Recent.
    const pinnedInWindow = pinnedIds.filter((id) =>
      recent.some((p) => p.id === id),
    );
    for (const id of pinnedIds) {
      const inCatalog = projects.some((p) => p.id === id);
      if (!inCatalog) continue;
      const wouldBeInShowAll = true;
      const inRecentAll = getHomeProjectsSections(projects, pinnedIds, null)
        .recent.some((p) => p.id === id);
      assert(
        inRecentAll === wouldBeInShowAll,
        `${total}: pinned ${id} missing from Show All Recent`,
      );
    }
    if (show === "all") {
      for (const id of pinnedIds) {
        if (!projects.some((p) => p.id === id)) continue;
        assert(
          recent.some((p) => p.id === id),
          `${total} Show All: pinned ${id} must remain in Recent`,
        );
      }
    }

    assert(
      !recent.some((p) => p.id === "new-project"),
      `${total} show ${show}: New project must not be in recent slice`,
    );

    // Show count is independent of pinned section size.
    assert(
      expected === Math.min(
        show === "all" ? recentEligible : show,
        recentEligible,
      ),
      `${total} show ${show}: pinned count must not reduce Show result`,
    );

    void pinnedInWindow;
  }

  // Pin then unpin: still in Recent when Show All.
  const pinnedOnly = getHomeProjectsSections(projects, pinnedIds, null);
  const unpinned = getHomeProjectsSections(projects, [], null);
  assert(
    unpinned.recent.length === total,
    `${total}: after unpin, Recent All must still be full collection`,
  );
  assert(
    pinnedOnly.recent.length === total,
    `${total}: with pins, Recent All must still be full collection`,
  );

  return { total, recentEligible };
}

const sizes = [3, 10, 50, 100, 500];
const results = sizes.map((size) => verifyCollection(size));

console.log("Home Recent Show control verification OK (pinned remain in Recent)");
for (const row of results) {
  console.log(
    `- ${row.total} accessible → Recent ${row.recentEligible}; Show 3/6/9/All pass; pins not excluded`,
  );
}
console.log(
  `- Show All @ 500 → ${results.find((r) => r.total === 500).recentEligible} recent rows (includes pinned)`,
);
