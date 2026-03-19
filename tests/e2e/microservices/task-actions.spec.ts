import { test, expect } from "@playwright/test";

function formatDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

test.describe("Actions sur les tâches", () => {
  const projectName = `Projet Actions ${Date.now()}`;

  async function createProjectAndNavigateToTasks(page: import("@playwright/test").Page) {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Projets" })
    ).toBeVisible({ timeout: 15000 });

    await page.locator("#project-name").fill(projectName);
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(
      page.locator("li").filter({ hasText: projectName }).first()
    ).toBeVisible({ timeout: 10000 });

    const projectRow = page
      .locator("li")
      .filter({ hasText: projectName })
      .last();
    await projectRow.getByRole("button", { name: "Voir les tâches" }).click();
    await expect(page.getByText("Tâches du projet")).toBeVisible({
      timeout: 10000,
    });
  }

  async function createTask(
    page: import("@playwright/test").Page,
    title: string,
    priority = "medium",
    status = "todo",
    dueDate: string | null = null
  ) {
    await page.locator('[name="task-title"]').fill(title);
    await page.locator('[name="task-priority"]').selectOption(priority);
    await page.locator('[name="task-status"]').selectOption(status);
    if (dueDate) {
      await page.locator('[name="task-dueDate"]').fill(dueDate);
    } else {
      await page.locator('[name="task-dueDate"]').clear();
    }
    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });
  }

  test("Modifier une tâche (titre, priorité, statut, échéance)", async ({
    page,
  }) => {
    await createProjectAndNavigateToTasks(page);

    const taskTitle = `Tâche à modifier ${Date.now()}`;
    await createTask(page, taskTitle, "low", "todo", formatDate(7));

    // Une fois en mode édition, le texte du titre peut ne plus être présent (value vs text),
    // donc on évite de réutiliser un locator basé sur hasText(taskTitle) pour remplir.
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: taskTitle })
      .first();
    await row.getByRole("button", { name: "Éditer" }).click();

    const newTitle = `Tâche modifiée ${Date.now()}`;
    // Cibler uniquement la ligne en mode édition (celle qui contient "Enregistrer").
    const editRow = page
      .getByRole("button", { name: "Enregistrer" })
      .first()
      .locator("xpath=ancestor::tr");

    await editRow.locator('input[aria-label="Titre"]').fill(newTitle);
    await editRow
      .locator('select[aria-label="Statut"]')
      .selectOption("in_progress");
    await editRow
      .locator('select[aria-label="Priorité"]')
      .selectOption("high");
    await editRow
      .locator("input[aria-label=\"Date d'échéance\"]")
      .fill(formatDate(14));

    await editRow.getByRole("button", { name: "Enregistrer" }).click();

    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 5000 });
    const updatedRow = page.locator("table tbody tr").filter({ hasText: newTitle });
    await expect(updatedRow).toContainText("En cours");
    await expect(updatedRow).toContainText("Haute");
  });

  test("Terminer et réouvrir une tâche", async ({ page }) => {
    await createProjectAndNavigateToTasks(page);

    const taskTitle = `Tâche à terminer ${Date.now()}`;
    await createTask(page, taskTitle, "medium", "todo");

    const row = page.locator("table tbody tr").filter({ hasText: taskTitle });
    await expect(row).toContainText("À faire");

    await row.getByRole("button", { name: "Terminer" }).click();

    await expect(row).toContainText("Terminé", { timeout: 5000 });

    await row.getByRole("button", { name: "Réouvrir" }).click();

    await expect(row).toContainText("À faire", { timeout: 5000 });
  });

  test("Assigner et désassigner une tâche", async ({ page }) => {
    await createProjectAndNavigateToTasks(page);

    const taskTitle = `Tâche à assigner ${Date.now()}`;
    await createTask(page, taskTitle, "high", "todo");

    const row = page.locator("table tbody tr").filter({ hasText: taskTitle });

    await expect(row.locator("td").nth(4)).toContainText("—");

    const userIdToAssign = `user-${Date.now()}`;
    await row.locator('input[placeholder="userId"]').fill(userIdToAssign);
    await row.getByRole("button", { name: "Assigner" }).click();

    await expect(row.locator("td").nth(4)).toContainText(userIdToAssign, {
      timeout: 5000,
    });

    await row.getByRole("button", { name: "Désassigner" }).click();

    await expect(row.locator("td").nth(4)).toContainText("—", { timeout: 5000 });
  });

  test("Supprimer une tâche", async ({ page }) => {
    await createProjectAndNavigateToTasks(page);

    const taskTitle = `Tâche à supprimer ${Date.now()}`;
    await createTask(page, taskTitle, "low", "todo");

    await expect(page.getByText(taskTitle)).toBeVisible();

    const row = page.locator("table tbody tr").filter({ hasText: taskTitle });

    page.on("dialog", (dialog) => dialog.accept());

    await row.getByRole("button", { name: "Supprimer" }).click();

    await expect(page.getByText(taskTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test("Clôturer un projet", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Projets" })
    ).toBeVisible({ timeout: 15000 });

    const closeProjectName = `Projet à clore ${Date.now()}`;
    await page.locator("#project-name").fill(closeProjectName);
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(
      page.locator("li").filter({ hasText: closeProjectName }).first()
    ).toBeVisible({ timeout: 10000 });

    const projectRow = page
      .locator("li")
      .filter({ hasText: closeProjectName })
      .last();
    await expect(projectRow).toContainText("Ouvert");

    await projectRow.getByRole("button", { name: "Clore" }).click();

    await expect(projectRow).toContainText("Clos", { timeout: 5000 });

    await expect(
      projectRow.getByRole("button", { name: "Clore" })
    ).not.toBeVisible();
  });
});
