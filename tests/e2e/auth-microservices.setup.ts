import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = "e2e-test@example.com";
const TEST_PASSWORD = "testpassword123";
const STORAGE_STATE_PATH = "storageState-microservices.json";

setup("authenticate for microservices", async ({ page }) => {
  // Nginx (port 3000) becomes available before the auth-service is fully
  // initialised behind the gateway. Poll until /api/v1/auth/me gives a real
  // HTTP status (200 or 401) so we know the whole chain is ready.
  for (let i = 0; i < 15; i++) {
    const res = await page.request.get("/api/v1/auth/me").catch(() => null);
    if (res && (res.status() === 200 || res.status() === 401)) break;
    await page.waitForTimeout(2000);
  }

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true })
  ).toBeVisible({ timeout: 15000 });

  // Fast path: user already exists from a previous run on a persistent volume.
  await page.locator("#login-email").fill(TEST_EMAIL);
  await page.locator("#login-password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Wait for a DEFINITIVE outcome before touching the DOM again.
  // Using isVisible() right after click() is a race: the login request may
  // still be in-flight, so we get false → we try to fill the register form →
  // meanwhile login succeeds → React unmounts the form → "element detached".
  const loginOutcome = await Promise.race([
    page
      .getByRole("heading", { name: "Projets" })
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => "success" as const),
    page
      .getByText(/Identifiants incorrects|Erreur de connexion/i)
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => "failed" as const),
  ]).catch(() => "failed" as const);

  if (loginOutcome !== "success") {
    // User doesn't exist yet → register (app auto-logs in after successful register).
    await page.locator("#register-email").fill(TEST_EMAIL);
    await page.locator("#register-password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Créer un compte" }).click();

    // Edge case: another process registered the same email between the login
    // attempt above and this register attempt.
    const emailAlreadyUsed = await page
      .getByText(/Email déjà utilisé/i)
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (emailAlreadyUsed) {
      await page.getByRole("button", { name: "Se connecter" }).click();
    }
  }

  // Final guard: only write the storageState once we are confirmed on the
  // authenticated page. Any failure above surfaces here as a clear timeout
  // instead of silently producing an empty storageState.
  await expect(
    page.getByRole("heading", { name: "Projets" })
  ).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
