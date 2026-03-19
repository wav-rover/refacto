import { test as setup, request } from "@playwright/test";
import fs from "fs";

const TEST_EMAIL = "e2e-test@example.com";
const TEST_PASSWORD = "testpassword123";

setup("authenticate for microservices", async () => {
  const requestContext = await request.newContext({
    baseURL: "http://localhost:3000",
  });

  let response = await requestContext.post("/api/auth/register", {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  if (response.status() === 409) {
    response = await requestContext.post("/api/auth/login", {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
  }

  if (!response.ok()) {
    throw new Error(
      `Authentication failed: ${response.status()} - ${await response.text()}`
    );
  }

  const storageState = await requestContext.storageState();
  fs.writeFileSync(
    "storageState-microservices.json",
    JSON.stringify(storageState)
  );

  await requestContext.dispose();
});
