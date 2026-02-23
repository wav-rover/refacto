import type { Request, Response, NextFunction } from "express";
import requireAuth from "../../src/middleware/requireAuth";

const createRes = (): Response =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }) as unknown as Response;

describe("requireAuth", () => {
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    next = jest.fn();
  });

  test("returns 401 and does not call next when session has no user", () => {
    const req = { session: {} } as unknown as Request;
    const res = createRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 and does not call next when session is undefined", () => {
    const req = {} as unknown as Request;
    const res = createRes();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  test("calls next when session has user", () => {
    const req = { session: { user: "admin" } } as unknown as Request;
    const res = createRes();

    requireAuth(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
