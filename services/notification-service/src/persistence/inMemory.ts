import crypto from 'crypto';
import type {
  NewNotification,
  Notification,
  NotificationId,
} from '../domain/notification';
import type { NotificationRepository } from '../ports/notificationRepository';

const byId = new Map<NotificationId, Notification>();

async function init(): Promise<void> {
  byId.clear();
}

async function teardown(): Promise<void> {
  byId.clear();
}

async function create(notification: NewNotification): Promise<Notification> {
  const id: NotificationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const created: Notification = {
    id,
    userId: notification.userId,
    message: notification.message,
    type: notification.type,
    createdAt,
  };
  byId.set(id, created);
  return created;
}

async function findByUserId(userId: string): Promise<Notification[]> {
  return Array.from(byId.values()).filter((n) => n.userId === userId);
}

const inMemoryRepository: NotificationRepository = {
  init,
  teardown,
  create,
  findByUserId,
};

export default inMemoryRepository;
