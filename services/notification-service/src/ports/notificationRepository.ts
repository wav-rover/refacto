import type {
  NewNotification,
  Notification,
  NotificationId,
} from '../domain/notification';

export type { NewNotification, Notification, NotificationId };

export interface NotificationRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  create(notification: NewNotification): Promise<Notification>;
  findByUserId(userId: string): Promise<Notification[]>;
}
