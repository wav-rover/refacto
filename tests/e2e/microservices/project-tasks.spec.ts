import { test, expect } from "@playwright/test";

function formatDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

function formatDateFR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR");
}

test.describe("Projet et Tâches - Flux principal", () => {
  const projectName = `Projet E2E ${Date.now()}`;

  const tasks = [
    {
      title: "Tâche urgente à faire",
      priority: "high",
      status: "todo",
      dueDate: formatDate(7),
    },
    {
      title: "Tâche moyenne en cours",
      priority: "medium",
      status: "in_progress",
      dueDate: formatDate(14),
    },
    {
      title: "Tâche basse terminée",
      priority: "low",
      status: "done",
      dueDate: formatDate(30),
    },
    {
      title: "Tâche critique demain",
      priority: "high",
      status: "in_progress",
      dueDate: formatDate(1),
    },
    {
      title: "Tâche sans échéance",
      priority: "medium",
      status: "todo",
      dueDate: null,
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Projets" })
    ).toBeVisible({ timeout: 15000 });
  });

  test("Créer un projet", async ({ page }) => {
    await page.locator("#project-name").fill(projectName);
    await page.getByRole("button", { name: "Créer" }).click();

    await expect(
      page.locator("li").filter({ hasText: projectName }).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("li").filter({ hasText: projectName })).toContainText("Ouvert");
  });

  test("Créer 5 tâches avec priorités, statuts et échéances variés", async ({
    page,
  }) => {
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

    for (const task of tasks) {
      await page.locator('[name="task-title"]').fill(task.title);

      await page.locator('[name="task-priority"]').selectOption(task.priority);
      await page.locator('[name="task-status"]').selectOption(task.status);

      if (task.dueDate) {
        await page.locator('[name="task-dueDate"]').fill(task.dueDate);
      } else {
        await page.locator('[name="task-dueDate"]').clear();
      }

      await page.getByRole("button", { name: "Créer", exact: true }).click();

      await expect(page.getByText(task.title)).toBeVisible({ timeout: 5000 });
    }

    await expect(page.locator("table tbody tr")).toHaveCount(5);
  });

  test("Vérifier les détails des tâches créées", async ({ page }) => {
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

    for (const task of tasks) {
      await page.locator('[name="task-title"]').fill(task.title);
      await page.locator('[name="task-priority"]').selectOption(task.priority);
      await page.locator('[name="task-status"]').selectOption(task.status);
      if (task.dueDate) {
        await page.locator('[name="task-dueDate"]').fill(task.dueDate);
      } else {
        await page.locator('[name="task-dueDate"]').clear();
      }
      await page.getByRole("button", { name: "Créer", exact: true }).click();
      await expect(page.getByText(task.title)).toBeVisible({ timeout: 5000 });
    }

    const taskVerifications = [
      { title: "Tâche urgente à faire", status: "À faire", priority: "Haute" },
      {
        title: "Tâche moyenne en cours",
        status: "En cours",
        priority: "Moyenne",
      },
      { title: "Tâche basse terminée", status: "Terminé", priority: "Basse" },
      { title: "Tâche critique demain", status: "En cours", priority: "Haute" },
      { title: "Tâche sans échéance", status: "À faire", priority: "Moyenne" },
    ];

    for (const verif of taskVerifications) {
      const row = page.locator("table tbody tr").filter({ hasText: verif.title });
      await expect(row).toBeVisible();
      await expect(row).toContainText(verif.status);
      await expect(row).toContainText(verif.priority);
    }

    const taskWithDate = page
      .locator("table tbody tr")
      .filter({ hasText: "Tâche urgente à faire" });
    await expect(taskWithDate).toContainText(formatDateFR(formatDate(7)));

    const taskWithoutDate = page
      .locator("table tbody tr")
      .filter({ hasText: "Tâche sans échéance" });
    await expect(taskWithoutDate).toContainText("—");
  });
});
