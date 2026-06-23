import fs from 'fs';
import path from 'path';
import sqlite3Pkg from 'sqlite3';
import crypto from 'crypto';
import type {
  NewNotification,
  Notification,
  NotificationId,
} from '../domain/notification';
import type { NotificationRepository } from '../ports/notificationRepository';
import migrations from './migrations';
import { runMigrations } from './migrations/runner';

const sqlite3 = sqlite3Pkg.verbose();

export const getDatabaseLocation = (): string =>
  process.env.NOTIFICATION_SQLITE_DB_LOCATION ??
  path.join(
    path.resolve(__dirname, '..', '..', '..', '..'),
    'data',
    'notification-service.db',
  );

type Database = sqlite3Pkg.Database;

interface NotificationRow {
  id: string;
  userId: string;
  message: string;
  type: string;
  createdAt: string;
}

let db: Database | null = null;

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.userId,
    message: row.message,
    type: row.type as Notification['type'],
    createdAt: row.createdAt,
  };
}

function init(): Promise<void> {
  const location = getDatabaseLocation();
  const dirName = path.dirname(location);
  if (location !== ':memory:' && !fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(location, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }

      const database = db;
      if (!database) {
        reject(new Error('Database not initialised'));
        return;
      }

      // En production, les migrations sont jouées par un conteneur dédié
      // (RUN_MIGRATIONS_ON_STARTUP=false). En développement/tests, on migre
      // au démarrage. Le runner est idempotent : double exécution sans effet.
      if (process.env.RUN_MIGRATIONS_ON_STARTUP === 'false') {
        if (process.env.NODE_ENV !== 'test') {
          console.log(
            `[notification-service] Using sqlite database at ${location} (migrations skipped at startup)`,
          );
        }
        resolve();
        return;
      }

      runMigrations(database, 'up', migrations)
        .then(() => {
          if (process.env.NODE_ENV !== 'test') {
            console.log(
              `[notification-service] Using sqlite database at ${location}`,
            );
          }
          resolve();
        })
        .catch(reject);
    });
  });
}

function teardown(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err: Error | null) => {
      db = null;
      if (err) reject(err);
      else resolve();
    });
  });
}

function create(notification: NewNotification): Promise<Notification> {
  const id: NotificationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const created: Notification = {
    id,
    userId: notification.userId,
    message: notification.message,
    type: notification.type,
    createdAt,
  };

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.run(
      `INSERT INTO notifications (id, userId, message, type, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [
        created.id,
        created.userId,
        created.message,
        created.type,
        created.createdAt,
      ],
      (runErr: Error | null) => {
        if (runErr) {
          reject(runErr);
          return;
        }
        resolve(created);
      },
    );
  });
}

function findByUserId(userId: string): Promise<Notification[]> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialised'));
      return;
    }
    db.all<NotificationRow>(
      'SELECT id, userId, message, type, createdAt FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [userId],
      (err: Error | null, rows: NotificationRow[] | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []).map(mapRow));
      },
    );
  });
}

const sqliteRepository: NotificationRepository = {
  init,
  teardown,
  create,
  findByUserId,
};

export default sqliteRepository;
