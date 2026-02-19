import { test, expect } from "@playwright/test";

test("home page loads and shows add form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder("New Item")).toBeVisible({ timeout: 15000 });
});
