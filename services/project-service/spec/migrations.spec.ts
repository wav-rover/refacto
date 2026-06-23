import sqlite3Pkg from 'sqlite3';
import migrations from '../src/persistence/migrations';
import { runMigrations, run, all } from '../src/persistence/migrations/runner';

const sqlite3 = sqlite3Pkg.verbose();

type ColumnInfo = { name: string; dflt_value: string | null; notnull: number };

function openMemory(): Promise<sqlite3Pkg.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) =>
      err ? reject(err) : resolve(db),
    );
  });
}

const columns = (db: sqlite3Pkg.Database): Promise<ColumnInfo[]> =>
  all<ColumnInfo>(db, 'PRAGMA table_info(projects)');

describe('project-service migrations', () => {
  let db: sqlite3Pkg.Database;

  beforeEach(async () => {
    db = await openMemory();
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => db.close(() => resolve()));
  });

  it('applies all migrations (both tables) and tracks them', async () => {
    const applied = await runMigrations(db, 'up', migrations);
    expect(applied).toEqual(['001_init', '002_add_archived', '003_rename_archived']);

    const tables = await all<{ name: string }>(
      db,
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects','project_members')",
    );
    expect(tables.map((t) => t.name).sort()).toEqual([
      'project_members',
      'projects',
    ]);
  });

  it('002 adds a default-valued column, back-filling existing rows', async () => {
    await runMigrations(db, 'up', [migrations[0]]);
    await run(
      db,
      `INSERT INTO projects (id, name, ownerId, status, createdAt)
       VALUES ('p1', 'Demo', 'u1', 'open', '2026-01-01T00:00:00.000Z')`,
    );

    await runMigrations(db, 'up', [migrations[0], migrations[1]]);

    const archived = (await columns(db)).find((c) => c.name === 'archived');
    expect(archived?.notnull).toBe(1);
    expect(archived?.dflt_value).toBe('0');

    const rows = await all<{ archived: number }>(
      db,
      'SELECT archived FROM projects WHERE id = ?',
      ['p1'],
    );
    expect(rows[0].archived).toBe(0);
  });

  it('003 renames archived -> isArchived', async () => {
    await runMigrations(db, 'up', migrations);
    const names = (await columns(db)).map((c) => c.name);
    expect(names).toContain('isArchived');
    expect(names).not.toContain('archived');
  });

  it('rolls back without losing data (projects + members preserved)', async () => {
    await runMigrations(db, 'up', migrations);
    await run(
      db,
      `INSERT INTO projects (id, name, ownerId, status, createdAt, isArchived)
       VALUES ('p1', 'Keep me', 'u1', 'open', '2026-01-01T00:00:00.000Z', 1)`,
    );
    await run(
      db,
      "INSERT INTO project_members (projectId, userId) VALUES ('p1', 'u1')",
    );

    await runMigrations(db, 'down', migrations, { steps: 2 });

    const names = (await columns(db)).map((c) => c.name);
    expect(names).not.toContain('isArchived');
    expect(names).not.toContain('archived');

    const projects = await all<{ name: string }>(
      db,
      'SELECT name FROM projects WHERE id = ?',
      ['p1'],
    );
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Keep me');

    // La table liée et ses lignes sont intactes.
    const members = await all<{ userId: string }>(
      db,
      'SELECT userId FROM project_members WHERE projectId = ?',
      ['p1'],
    );
    expect(members.map((m) => m.userId)).toEqual(['u1']);
  });
});
