import sqlite3Pkg from 'sqlite3';
import migrations from '../src/persistence/migrations';
import { runMigrations, run, all } from '../src/persistence/migrations/runner';

const sqlite3 = sqlite3Pkg.verbose();

type ColumnInfo = { name: string; notnull: number };

function openMemory(): Promise<sqlite3Pkg.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) =>
      err ? reject(err) : resolve(db),
    );
  });
}

const columns = (db: sqlite3Pkg.Database): Promise<ColumnInfo[]> =>
  all<ColumnInfo>(db, 'PRAGMA table_info(users)');

describe('auth-service migrations', () => {
  let db: sqlite3Pkg.Database;

  beforeEach(async () => {
    db = await openMemory();
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => db.close(() => resolve()));
  });

  it('applies all migrations and tracks them', async () => {
    const applied = await runMigrations(db, 'up', migrations);
    expect(applied).toEqual(['001_init', '002_add_birth_date']);

    const tables = await all<{ name: string }>(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
    );
    expect(tables.map((t) => t.name)).toEqual(['users']);
  });

  it('002 adds a nullable birthDate column, back-filling existing rows', async () => {
    await runMigrations(db, 'up', [migrations[0]]);
    await run(
      db,
      `INSERT INTO users (id, email, passwordHash, createdAt)
       VALUES ('u1', 'legacy@example.com', 'hash', '2026-01-01T00:00:00.000Z')`,
    );

    await runMigrations(db, 'up', [migrations[0], migrations[1]]);

    const birthDate = (await columns(db)).find((c) => c.name === 'birthDate');
    expect(birthDate?.notnull).toBe(0);

    const rows = await all<{ birthDate: string | null }>(
      db,
      'SELECT birthDate FROM users WHERE id = ?',
      ['u1'],
    );
    expect(rows[0].birthDate).toBeNull();
  });

  it('rolls back without losing user data', async () => {
    await runMigrations(db, 'up', migrations);
    await run(
      db,
      `INSERT INTO users (id, email, passwordHash, createdAt, birthDate)
       VALUES ('u1', 'keep@example.com', 'hash', '2026-01-01T00:00:00.000Z', NULL)`,
    );

    await runMigrations(db, 'down', migrations, { steps: 1 });

    const names = (await columns(db)).map((c) => c.name);
    expect(names).not.toContain('birthDate');

    const users = await all<{ email: string }>(
      db,
      'SELECT email FROM users WHERE id = ?',
      ['u1'],
    );
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('keep@example.com');
  });
});
