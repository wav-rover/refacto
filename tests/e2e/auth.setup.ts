import { test as setup, request } from "@playwright/test";
import fs from "fs";

setup("authenticate", async () => {
  const requestContext = await request.newContext({
    baseURL: "http://localhost:3000",
  });

  const response = await requestContext.post("/login", {
    data: {
      username: "admin",
      password: "secret",
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const storageState = await requestContext.storageState();
  fs.writeFileSync("storageState.json", JSON.stringify(storageState));

  await requestContext.dispose();
});
