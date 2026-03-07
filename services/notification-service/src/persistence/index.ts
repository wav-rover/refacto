import type { NotificationRepository } from '../ports/notificationRepository';
import inMemory from './inMemory';
import sqlite from './sqlite';

function createRepository(): NotificationRepository {
  if (process.env.NODE_ENV === 'test') return inMemory;
  return sqlite;
}

export { createRepository };
