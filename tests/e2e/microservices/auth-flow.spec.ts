import { test, expect } from "@playwright/test";

test.describe("Authentification Microservices", () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const password = "testpassword123";

  test("Afficher le formulaire de login quand non connecté", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se connecter" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Créer un compte" }),
    ).toBeVisible();
  });

  test("Inscription d'un nouvel utilisateur", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill(uniqueEmail);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Créer un compte" }).click();

    await expect(page.getByText("Projets")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: "Déconnexion" }),
    ).toBeVisible();
  });

  test("Login avec mauvais identifiants affiche une erreur", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill("wrong@example.com");
    await page.locator("#login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText(/Identifiants incorrects|Erreur/)).toBeVisible({
      timeout: 5000,
    });
  });

  test("Connexion si l'email existe déjà", async ({ page }) => {
    const existingEmail = "e2e-test@example.com";
    const existingPassword = "testpassword123";

    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill(existingEmail);
    await page.locator("#login-password").fill(existingPassword);

    await page.getByRole("button", { name: "Créer un compte" }).click();

    const errorVisible = await page
      .getByText(/existe déjà|already exists/i)
      .isVisible()
      .catch(() => false);

    if (errorVisible) {
      await page.getByRole("button", { name: "Se connecter" }).click();
    }

    await expect(page.getByText("Projets")).toBeVisible({ timeout: 10000 });
  });

  test("Logout revient à l'écran de connexion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill("e2e-test@example.com");
    await page.locator("#login-password").fill("testpassword123");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByText("Projets")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Déconnexion" }).click();

    await expect(page.getByText("Connexion")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#login-email")).toBeVisible();
  });
});
