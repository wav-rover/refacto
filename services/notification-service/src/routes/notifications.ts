import type { Request, Response } from 'express';
import type { NotificationRepository } from '../ports/notificationRepository';
import { requireCurrentUser } from '../middleware/currentUser';

export function mountNotificationRoutes(
  app: import('express').Router,
  repo: NotificationRepository,
): void {
  app.get(
    '/notifications',
    requireCurrentUser,
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.currentUserId!;
      const notifications = await repo.findByUserId(userId);
      res.status(200).json(notifications);
    },
  );
}
