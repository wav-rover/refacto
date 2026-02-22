import type { Request, Response, NextFunction } from "express";

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = (req.session as { user?: string } | undefined)?.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export default requireAuth;
module.exports = requireAuth;
