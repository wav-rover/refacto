import { test, expect } from "@playwright/test";

test.describe("Todo - flux principaux", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("New Item")).toBeVisible({
      timeout: 15000,
    });
  });

  test("Créer une tâche et la voir dans la liste", async ({ page }) => {
    const taskName = "Ma tâche E2E " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();
    await expect(
      page.locator(".item").filter({ hasText: taskName }),
    ).toBeVisible();
  });

  test("Modifier une tâche (cocher / décocher)", async ({ page }) => {
    const taskName = "Tâche à cocher " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    const row = page.locator(".item").filter({ hasText: taskName });
    await expect(row).not.toHaveClass(/completed/);
    await row.getByRole("button", { name: "Mark item as complete" }).click();
    await expect(row).toHaveClass(/completed/);

    await row.getByRole("button", { name: "Mark item as incomplete" }).click();
    await expect(row).not.toHaveClass(/completed/);
  });

  test("Supprimer une tâche", async ({ page }) => {
    const taskName = "Tâche à supprimer " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    await page
      .locator(".item")
      .filter({ hasText: taskName })
      .getByRole("button", { name: "Remove Item" })
      .click();
    await expect(page.getByText(taskName)).not.toBeVisible();
  });

  test("Créer une tâche avec priorité haute et vérifier l'affichage", async ({
    page,
  }) => {
    const taskName = "Tâche priorité haute " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByLabel("Priorité").first().selectOption("high");
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    const row = page.locator(".item").filter({ hasText: taskName });
    await expect(row.locator("span.text-muted", { hasText: "Haute" })).toBeVisible();
  });

  test("Modifier le statut d'une tâche", async ({ page }) => {
    const taskName = "Tâche statut " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    const row = page.locator(".item").filter({ hasText: taskName });
    await expect(row.locator("span.text-muted", { hasText: "À faire" })).toBeVisible();

    await row.getByLabel("Statut").selectOption("in_progress");
    await expect(row.locator("span.text-muted", { hasText: "En cours" })).toBeVisible();
  });

  test("Modifier la date d'échéance d'une tâche", async ({ page }) => {
    const taskName = "Tâche échéance " + Date.now();
    await page.getByPlaceholder("New Item").fill(taskName);
    await page.getByRole("button", { name: "Add Item" }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    const row = page.locator(".item").filter({ hasText: taskName });
    await row.getByLabel("Échéance").fill("2025-12-31");
    await expect(row.getByText("31/12/2025")).toBeVisible();
  });
});
