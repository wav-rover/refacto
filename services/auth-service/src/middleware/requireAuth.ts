import type { NextFunction, Request, Response } from "express";

type SessionUser = {
  id: string;
  email: string;
};

export function getSessionUser(
  req: Request,
): SessionUser | undefined {
  const session = req.session as { user?: SessionUser } | undefined;
  return session?.user;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

