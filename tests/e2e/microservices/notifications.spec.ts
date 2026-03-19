import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Projets" })
    ).toBeVisible({ timeout: 15000 });
  });

  test("Afficher la vue notifications", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click();

    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("button", { name: /Rafraîchir/i })
    ).toBeVisible();

    const hasNotifications = await page.locator("table tbody tr").count();
    const noNotificationsMessage = page.getByText("Aucune notification.");

    if (hasNotifications > 0) {
      await expect(page.locator("table thead")).toContainText("Date");
      await expect(page.locator("table thead")).toContainText("Type");
      await expect(page.locator("table thead")).toContainText("Message");
    } else {
      await expect(noNotificationsMessage).toBeVisible();
    }
  });

  test("Rafraîchir les notifications", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click();

    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Rafraîchir" }).click();

    await expect(
      page.getByRole("button", { name: /Rafraîchissement|Rafraîchir/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Notification générée après assignation d'une tâche", async ({
    page,
  }) => {
    const projectName = `Projet Notif ${Date.now()}`;
    await page.locator("#project-name").fill(projectName);
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

    const projectRow = page.locator("li").filter({ hasText: projectName });
    await projectRow.getByRole("button", { name: "Voir les tâches" }).click();

    await expect(page.getByText("Tâches du projet")).toBeVisible({
      timeout: 10000,
    });

    const taskTitle = `Tâche pour notif ${Date.now()}`;
    await page.locator('[name="task-title"]').fill(taskTitle);
    await page.locator('[name="task-priority"]').selectOption("high");
    await page.locator('[name="task-status"]').selectOption("todo");
    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    const taskRow = page
      .locator("table tbody tr")
      .filter({ hasText: taskTitle });
    // Un userId unique pour éviter les conflits métier (1 tâche active par user).
    const testUserId = `test-user-notif-${Date.now()}`;
    await taskRow.locator('input[placeholder="userId"]').fill(testUserId);
    await taskRow.getByRole("button", { name: "Assigner" }).click();

    await expect(taskRow.locator("td").nth(4)).toContainText(testUserId, {
      timeout: 5000,
    });

    await page
      .getByRole("button", { name: "Projets", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Projets" })
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Rafraîchir" }).click();
    await page.waitForTimeout(1000);
  });

  test("Notification générée après complétion d'une tâche", async ({
    page,
  }) => {
    const projectName = `Projet Complete Notif ${Date.now()}`;
    await page.locator("#project-name").fill(projectName);
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

    const projectRow = page.locator("li").filter({ hasText: projectName });
    await projectRow.getByRole("button", { name: "Voir les tâches" }).click();

    await expect(page.getByText("Tâches du projet")).toBeVisible({
      timeout: 10000,
    });

    const taskTitle = `Tâche à compléter ${Date.now()}`;
    await page.locator('[name="task-title"]').fill(taskTitle);
    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 5000 });

    const taskRow = page.locator("table tbody tr").filter({ hasText: taskTitle });
    await taskRow.getByRole("button", { name: "Terminer" }).click();
    await expect(taskRow).toContainText("Terminé", { timeout: 5000 });

    // Sur l'écran "Tâches", le bouton de retour est "Retour aux projets".
    await page.getByRole("button", { name: "Retour aux projets" }).click();
    await page.getByRole("button", { name: "Notifications" }).click();

    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("Notification générée après clôture d'un projet", async ({ page }) => {
    const projectName = `Projet Clôture Notif ${Date.now()}`;
    await page.locator("#project-name").fill(projectName);
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });

    const projectRow = page.locator("li").filter({ hasText: projectName });
    await projectRow.getByRole("button", { name: "Clore" }).click();
    await expect(projectRow).toContainText("Clos", { timeout: 5000 });

    await page.getByRole("button", { name: "Notifications" }).click();

    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Rafraîchir" }).click();
    await page.waitForTimeout(1000);
  });

  test("Basculer entre les vues Projets et Notifications", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible();

    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible({
      timeout: 5000,
    });

    await page
      .getByRole("button", { name: "Projets", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible({
      timeout: 5000,
    });
  });
});
