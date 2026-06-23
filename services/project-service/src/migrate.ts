import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sqlite3Pkg from 'sqlite3';
import migrations from './persistence/migrations';
import { runMigrations, type Direction } from './persistence/migrations/runner';
import { getDatabaseLocation } from './persistence/sqlite';

// CLI de migration — exécuté au déploiement par un conteneur dédié (production).
// Usage : node dist/migrate.js up
//         node dist/migrate.js down [steps]
const sqlite3 = sqlite3Pkg.verbose();

function openDatabase(location: string): Promise<sqlite3Pkg.Database> {
  const dirName = path.dirname(location);
  if (location !== ':memory:' && !fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(location, (err: Error | null) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

async function main(): Promise<void> {
  const direction = (process.argv[2] ?? 'up') as Direction;
  if (direction !== 'up' && direction !== 'down') {
    throw new Error(`Unknown direction "${direction}" (expected up|down)`);
  }
  const steps = Number(process.argv[3]) || 1;

  const location = getDatabaseLocation();
  const db = await openDatabase(location);
  console.log(`[project-service:migrate] ${direction} on ${location}`);

  const changed = await runMigrations(db, direction, migrations, { steps });
  console.log(
    changed.length
      ? `[project-service:migrate] applied: ${changed.join(', ')}`
      : '[project-service:migrate] nothing to do (up to date)',
  );

  await new Promise<void>((resolve) => db.close(() => resolve()));
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[project-service:migrate] failed:', err);
    process.exit(1);
  });
