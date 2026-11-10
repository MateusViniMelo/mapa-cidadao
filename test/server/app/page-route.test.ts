import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("page file is my-occurrences", () => {
  const stalePage = `pages/my-${"oc"}${"urrences"}.vue`;
  const pagePath = "pages/my-occurrences.vue";

  expect(existsSync(pagePath)).toBe(true);
  expect(existsSync(stalePage)).toBe(false);

  const page = readFileSync(pagePath, "utf8");
  const navbar = readFileSync("components/layout/Navbar.vue", "utf8");

  expect(page).toContain('title: "Minhas Ocorrências"');
  expect(page).toContain("per_page");
  expect(page).toContain(".page");
  expect(navbar).toContain('to: "/my-occurrences"');
});
