import type { NextFunction, Request, Response } from 'express';

const HEADER_USER_ID = 'x-user-id';

export function currentUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.get(HEADER_USER_ID)?.trim();
  req.currentUserId = userId ?? undefined;
  next();
}

export function requireCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.currentUserId) {
    res.status(401).json({ error: 'Unauthorized', message: 'X-User-Id header required' });
    return;
  }
  next();
}
