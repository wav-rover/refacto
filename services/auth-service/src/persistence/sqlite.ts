import fs from "fs";
import path from "path";
import sqlite3Pkg from "sqlite3";
import crypto from "crypto";
import type { NewUser, User, UserId } from "../domain/user";
import type { UserRepository } from "../ports/userRepository";
import migrations from "./migrations";
import { runMigrations } from "./migrations/runner";

const sqlite3 = sqlite3Pkg.verbose();

export const getDatabaseLocation = (): string =>
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
  birthDate: string | null;
}

let db: Database | null = null;

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    birthDate: row.birthDate ?? undefined,
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

      // En production, les migrations sont jouées par un conteneur dédié
      // (RUN_MIGRATIONS_ON_STARTUP=false). En développement/tests, on migre
      // au démarrage. Le runner est idempotent : double exécution sans effet.
      if (process.env.RUN_MIGRATIONS_ON_STARTUP === "false") {
        if (process.env.NODE_ENV !== "test") {
          console.log(
            `[auth-service] Using sqlite database at ${location} (migrations skipped at startup)`
          );
        }
        resolve();
        return;
      }

      runMigrations(database, "up", migrations)
        .then(() => {
          if (process.env.NODE_ENV !== "test") {
            console.log(`[auth-service] Using sqlite database at ${location}`);
          }
          resolve();
        })
        .catch(reject);
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
      "SELECT id, email, passwordHash, createdAt, birthDate FROM users WHERE email = ?",
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
      "SELECT id, email, passwordHash, createdAt, birthDate FROM users WHERE id = ?",
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
