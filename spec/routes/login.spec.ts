import type { Request, Response } from "express";
const login = require("../../src/routes/login");

const createRes = (): Response =>
  ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe("login", () => {
  const originalAuthUsername = process.env.AUTH_USERNAME;
  const originalAuthPassword = process.env.AUTH_PASSWORD;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_USERNAME = "admin";
    process.env.AUTH_PASSWORD = "secret";
  });

  afterAll(() => {
    process.env.AUTH_USERNAME = originalAuthUsername;
    process.env.AUTH_PASSWORD = originalAuthPassword;
  });

  test("returns 401 when username is missing", async () => {
    const req = {
      body: { password: "secret" },
      session: {},
    } as Request;
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    expect((req.session as { user?: string }).user).toBeUndefined();
  });

  test("returns 401 when password is wrong", async () => {
    const req = {
      body: { username: "admin", password: "wrong" },
      session: {},
    } as Request;
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    expect((req.session as { user?: string }).user).toBeUndefined();
  });

  test("returns 401 when username is wrong", async () => {
    const req = {
      body: { username: "other", password: "secret" },
      session: {},
    } as Request;
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    expect((req.session as { user?: string }).user).toBeUndefined();
  });

  test("returns 200 and sets session.user when credentials are valid", async () => {
    const req = {
      body: { username: "admin", password: "secret" },
      session: {},
    } as Request;
    const res = createRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect((req.session as { user?: string }).user).toBe("admin");
  });
});
