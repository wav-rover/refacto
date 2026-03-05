import fs from "fs";
import path from "path";
import sqlite3Pkg from "sqlite3";
import crypto from "crypto";
import type { NewUser, User, UserId } from "../domain/user";
import type { UserRepository } from "../ports/userRepository";

const sqlite3 = sqlite3Pkg.verbose();

const getDatabaseLocation = (): string =>
  process.env.AUTH_SQLITE_DB_LOCATION ??
  path.join(
    path.resolve(__dirname, "..", "..", "..", ".."),
    "data",
    "auth-users.db"
  );

type Database = sqlite3Pkg.Database;

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

let db: Database | null = null;

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  };
}

function init(): Promise<void> {
  const location = getDatabaseLocation();
  const dirName = path.dirname(location);
  if (location !== ":memory:" && !fs.existsSync(dirName)) {
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
        reject(new Error("Database not initialised"));
        return;
      }

      database.run(
        "CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) UNIQUE NOT NULL, passwordHash varchar(255) NOT NULL, createdAt varchar(30) NOT NULL)",
        (createErr: Error | null) => {
          if (createErr) {
            reject(createErr);
            return;
          }

          if (process.env.NODE_ENV !== "test") {
            // eslint-disable-next-line no-console
            console.log(`[auth-service] Using sqlite database at ${location}`);
          }

          resolve();
        }
      );
    });
  });
}

function teardown(): Promise<void> {
  if (!db) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const database = db;

    if (!database) {
      resolve();
      return;
    }

    database.close((err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function create(user: NewUser): Promise<User> {
  const id: UserId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const toStore: User = {
    id,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt,
  };

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialised"));
      return;
    }

    db.run(
      "INSERT INTO users (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
      [toStore.id, toStore.email, toStore.passwordHash, toStore.createdAt],
      (err: Error | null) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(toStore);
      }
    );
  });
}

function findByEmail(email: string): Promise<User | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialised"));
      return;
    }

    db.get(
      "SELECT id, email, passwordHash, createdAt FROM users WHERE email = ?",
      [email],
      (err: Error | null, row: UserRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        resolve(mapRow(row));
      }
    );
  });
}

function findById(id: UserId): Promise<User | null> {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialised"));
      return;
    }

    db.get(
      "SELECT id, email, passwordHash, createdAt FROM users WHERE id = ?",
      [id],
      (err: Error | null, row: UserRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        resolve(mapRow(row));
      }
    );
  });
}

const sqliteRepository: UserRepository = {
  init,
  teardown,
  create,
  findByEmail,
  findById,
};

export default sqliteRepository;
