import type sqlite3Pkg from 'sqlite3';

type Database = sqlite3Pkg.Database;

// Une migration versionnée : `up` applique le changement, `down` le rejoue à l'envers.
// `id` sert de clé d'ordre ET de clé de suivi dans la table `_migrations`.
export interface Migration {
  id: string;
  up(db: Database): Promise<void>;
  down(db: Database): Promise<void>;
}

export type Direction = 'up' | 'down';

// --- Helpers promisifiés autour de l'API callback de sqlite3 -----------------

export function run(
  db: Database,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function all<T>(
  db: Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) reject(err);
      else resolve(rows ?? []);
    });
  });
}

// --- Suivi des migrations appliquées -----------------------------------------

function ensureMigrationsTable(db: Database): Promise<void> {
  return run(
    db,
    `CREATE TABLE IF NOT EXISTS _migrations (
      id varchar(255) PRIMARY KEY,
      appliedAt varchar(30) NOT NULL
    )`,
  );
}

async function appliedIds(db: Database): Promise<Set<string>> {
  const rows = await all<{ id: string }>(
    db,
    'SELECT id FROM _migrations ORDER BY id',
  );
  return new Set(rows.map((r) => r.id));
}

// Exécute un bloc dans une transaction (ROLLBACK automatique sur erreur).
async function inTransaction(
  db: Database,
  work: () => Promise<void>,
): Promise<void> {
  await run(db, 'BEGIN');
  try {
    await work();
    await run(db, 'COMMIT');
  } catch (err) {
    await run(db, 'ROLLBACK').catch(() => {});
    throw err;
  }
}

// --- Orchestration -----------------------------------------------------------

export interface RunOptions {
  // Nombre de migrations à dérouler pour 'down' (défaut : 1, la dernière appliquée).
  steps?: number;
}

/**
 * Applique ('up') les migrations non encore jouées, ou rejoue à l'envers ('down')
 * les N dernières migrations appliquées. Chaque migration est transactionnelle :
 * en cas d'échec, la base reste dans un état cohérent (rollback).
 */
export async function runMigrations(
  db: Database,
  direction: Direction,
  migrations: Migration[],
  options: RunOptions = {},
): Promise<string[]> {
  await ensureMigrationsTable(db);
  const done = await appliedIds(db);
  const changed: string[] = [];

  if (direction === 'up') {
    for (const migration of migrations) {
      if (done.has(migration.id)) continue;
      await inTransaction(db, async () => {
        await migration.up(db);
        await run(db, 'INSERT INTO _migrations (id, appliedAt) VALUES (?, ?)', [
          migration.id,
          new Date().toISOString(),
        ]);
      });
      changed.push(migration.id);
    }
    return changed;
  }

  // direction === 'down' : on déroule depuis la plus récente appliquée.
  const steps = options.steps ?? 1;
  const appliedInOrder = migrations.filter((m) => done.has(m.id));
  const toRollback = appliedInOrder.slice(-steps).reverse();
  for (const migration of toRollback) {
    await inTransaction(db, async () => {
      await migration.down(db);
      await run(db, 'DELETE FROM _migrations WHERE id = ?', [migration.id]);
    });
    changed.push(migration.id);
  }
  return changed;
}
