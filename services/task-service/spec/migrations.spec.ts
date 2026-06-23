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
  all<ColumnInfo>(db, 'PRAGMA table_info(tasks)');

describe('task-service migrations', () => {
  let db: sqlite3Pkg.Database;

  beforeEach(async () => {
    db = await openMemory();
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => db.close(() => resolve()));
  });

  it('applies all migrations and tracks them in _migrations', async () => {
    const applied = await runMigrations(db, 'up', migrations);
    expect(applied).toEqual(['001_init', '002_add_archived', '003_rename_archived']);

    const tracked = await all<{ id: string }>(
      db,
      'SELECT id FROM _migrations ORDER BY id',
    );
    expect(tracked.map((r) => r.id)).toEqual([
      '001_init',
      '002_add_archived',
      '003_rename_archived',
    ]);
  });

  it('is idempotent: a second up applies nothing', async () => {
    await runMigrations(db, 'up', migrations);
    const second = await runMigrations(db, 'up', migrations);
    expect(second).toEqual([]);
  });

  it('002 adds a column with a default value (back-fills existing rows)', async () => {
    // Schéma de base seulement, puis insertion AVANT l'ajout de colonne.
    await runMigrations(db, 'up', [migrations[0]]);
    await run(
      db,
      `INSERT INTO tasks (id, title, projectId, createdBy, completed, status, priority, createdAt)
       VALUES ('t1', 'Task', 'p1', 'u1', 0, 'todo', 'medium', '2026-01-01T00:00:00.000Z')`,
    );

    await runMigrations(db, 'up', [migrations[0], migrations[1]]);

    const cols = await columns(db);
    const archived = cols.find((c) => c.name === 'archived');
    expect(archived).toBeDefined();
    expect(archived?.notnull).toBe(1);
    expect(archived?.dflt_value).toBe('0');

    // La ligne pré-existante a bien reçu la valeur par défaut.
    const rows = await all<{ archived: number }>(
      db,
      'SELECT archived FROM tasks WHERE id = ?',
      ['t1'],
    );
    expect(rows[0].archived).toBe(0);
  });

  it('003 renames archived -> isArchived', async () => {
    await runMigrations(db, 'up', migrations);
    const cols = await columns(db);
    const names = cols.map((c) => c.name);
    expect(names).toContain('isArchived');
    expect(names).not.toContain('archived');
  });

  it('rolls back without losing data on the preserved columns', async () => {
    await runMigrations(db, 'up', migrations);
    await run(
      db,
      `INSERT INTO tasks (id, title, projectId, createdBy, completed, status, priority, dueDate, createdAt, isArchived)
       VALUES ('t1', 'Keep me', 'p1', 'u1', 0, 'todo', 'high', '2026-02-02', '2026-01-01T00:00:00.000Z', 1)`,
    );

    // down de 003 (rename) puis 002 (drop colonne) — 2 steps.
    await runMigrations(db, 'down', migrations, { steps: 2 });

    const cols = (await columns(db)).map((c) => c.name);
    expect(cols).not.toContain('isArchived');
    expect(cols).not.toContain('archived');

    // Les données des colonnes conservées sont intactes.
    const rows = await all<{ title: string; priority: string; dueDate: string }>(
      db,
      'SELECT title, priority, dueDate FROM tasks WHERE id = ?',
      ['t1'],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Keep me');
    expect(rows[0].priority).toBe('high');
    expect(rows[0].dueDate).toBe('2026-02-02');

    // _migrations ne contient plus que 001.
    const tracked = await all<{ id: string }>(db, 'SELECT id FROM _migrations');
    expect(tracked.map((r) => r.id)).toEqual(['001_init']);

    // On peut ré-appliquer up sans erreur.
    const reapplied = await runMigrations(db, 'up', migrations);
    expect(reapplied).toEqual(['002_add_archived', '003_rename_archived']);
  });
});
