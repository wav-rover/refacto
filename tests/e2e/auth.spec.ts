import { test, expect } from "@playwright/test";

test.describe("Authentification", () => {
  test("Afficher le formulaire de login quand non connecté", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#login-username")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se connecter" })
    ).toBeVisible();
  });

  test("Login avec mauvais identifiants affiche une erreur", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });

    await page.locator("#login-username").fill("wrong");
    await page.locator("#login-password").fill("credentials");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText("Identifiants incorrects")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Login avec bons identifiants redirige vers la liste", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });

    await page.locator("#login-username").fill("admin");
    await page.locator("#login-password").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByPlaceholder("New Item")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole("button", { name: "Déconnexion" })
    ).toBeVisible();
  });

  test("Logout revient à l'écran de connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });

    await page.locator("#login-username").fill("admin");
    await page.locator("#login-password").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByPlaceholder("New Item")).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Déconnexion" }).click();

    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#login-username")).toBeVisible();
  });
});
