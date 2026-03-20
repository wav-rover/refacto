import { test, expect } from "@playwright/test";

test.describe("Authentification Microservices", () => {
  const password = "testpassword123";

  test("Afficher le formulaire de login quand non connecté", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se connecter" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Créer un compte" })
    ).toBeVisible();
  });

  test("Inscription d'un nouvel utilisateur", async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill(uniqueEmail);
    await page.locator("#login-password").fill(password);
    await page.locator("#register-email").fill(uniqueEmail);
    await page.locator("#register-password").fill(password);
    await page.getByRole("button", { name: "Créer un compte" }).click();

    // En cas de collision (rare en local, mais possible si volumes persistants),
    // l'UI affiche "Email déjà utilisé" et on peut basculer sur "Se connecter".
    const emailAlreadyUsed = await page
      .getByText(/Email déjà utilisé|already in use/i)
      .isVisible()
      .catch(() => false);
    if (emailAlreadyUsed) await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole("button", { name: "Déconnexion" })
    ).toBeVisible();
  });

  test("Login avec mauvais identifiants affiche une erreur", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 15000 });

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
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill(existingEmail);
    await page.locator("#login-password").fill(existingPassword);
    await page.locator("#register-email").fill(existingEmail);
    await page.locator("#register-password").fill(existingPassword);

    await page.getByRole("button", { name: "Créer un compte" }).click();

    const projectsHeading = page.getByRole("heading", { name: "Projets" });
    const emailAlreadyUsedMessage = page.getByText(
      /Email déjà utilisé|already in use/i
    );

    // Attendre soit la redirection vers "Projets", soit l'erreur "Email déjà utilisé".
    await Promise.race([
      projectsHeading.waitFor({ state: "visible", timeout: 10000 }),
      emailAlreadyUsedMessage.waitFor({ state: "visible", timeout: 10000 }),
    ]);

    if (await emailAlreadyUsedMessage.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Se connecter" }).click();
    }

    await expect(projectsHeading).toBeVisible({ timeout: 10000 });
  });

  test("Logout revient à l'écran de connexion", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 15000 });

    await page.locator("#login-email").fill("e2e-test@example.com");
    await page.locator("#login-password").fill("testpassword123");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByRole("heading", { name: "Projets" })).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: "Déconnexion" }).click();

    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#login-email")).toBeVisible();
  });
});
