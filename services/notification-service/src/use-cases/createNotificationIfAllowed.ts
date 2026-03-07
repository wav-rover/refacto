import type { NotificationRepository } from '../ports/notificationRepository';
import type { Notification, NotificationType } from '../domain/notification';

export interface CreateNotificationIfAllowedParams {
  actionUserId: string;
  targetUserId: string;
  message: string;
  type: NotificationType;
}

/**
 * Crée une notification uniquement si actionUserId !== targetUserId
 * (règle métier : pas d'auto-notification).
 */
export async function createNotificationIfAllowed(
  repo: NotificationRepository,
  params: CreateNotificationIfAllowedParams,
): Promise<Notification | null> {
  if (params.actionUserId === params.targetUserId) {
    return null;
  }
  return repo.create({
    userId: params.targetUserId,
    message: params.message,
    type: params.type,
  });
}
