import type { NextFunction, Request, Response } from "express";

import { getAuthServiceUrl } from "../config/authConfig";
import { forwardJson } from "../infra/httpClient";

declare module "express-serve-static-core" {
  interface Request {
    auth?: { userId: string };
  }
}

type MeResponseBody = {
  id: string;
  email: string;
};

export async function requireAuthGateway(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const baseUrl = getAuthServiceUrl();

  try {
    const { status, body } = await forwardJson<MeResponseBody>({
      baseUrl,
      path: "/auth/me",
      method: "GET",
      headers: {
        cookie: req.header("cookie"),
        accept: "application/json",
        "user-agent": req.header("user-agent"),
      },
    });

    if (status === 200 && body && typeof body.id === "string") {
      req.auth = { userId: body.id };
      req.headers["x-user-id"] = body.id;
      next();
      return;
    }

    if (status === 401 || status === 403) {
      res.status(status).json(body);
      return;
    }

    res.status(503).json({ error: "Auth service unavailable" });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Auth service unavailable" });
  }
}
