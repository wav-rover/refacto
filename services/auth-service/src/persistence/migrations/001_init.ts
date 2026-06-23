import { run, type Migration } from './runner';

// Schéma initial de la table `users` (repris verbatim de l'ancien init() inline).
const migration: Migration = {
  id: '001_init',
  async up(db) {
    await run(
      db,
      'CREATE TABLE IF NOT EXISTS users (id varchar(36) PRIMARY KEY, email varchar(255) UNIQUE NOT NULL, passwordHash varchar(255) NOT NULL, createdAt varchar(30) NOT NULL)',
    );
  },
  async down(db) {
    await run(db, 'DROP TABLE IF EXISTS users');
  },
};

export default migration;
