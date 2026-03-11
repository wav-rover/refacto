import request from "supertest";

describe("API Gateway healthcheck", () => {
  it("returns 200 and ok payload on /health", async () => {
    const { createApp } = await import("../src/server");

    const app = createApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
