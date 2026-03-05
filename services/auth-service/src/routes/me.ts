import type { Request, Response } from "express";
import { getSessionUser } from "../middleware/requireAuth";

export function me(req: Request, res: Response): void {
  const user = getSessionUser(req);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(200).json({ id: user.id, email: user.email });
}

