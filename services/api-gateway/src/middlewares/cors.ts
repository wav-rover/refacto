import type { NextFunction, Request, Response } from "express";

const FRONTEND_ORIGIN_ENV = "FRONTEND_ORIGIN";

export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = process.env[FRONTEND_ORIGIN_ENV];

  if (!origin || origin === "") {
    next();
    return;
  }

  const requestOrigin = req.header("origin");
  if (requestOrigin === origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie"
  );

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
}
