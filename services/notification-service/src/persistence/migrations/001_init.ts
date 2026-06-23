import { run, type Migration } from './runner';

// Schéma initial de la table `notifications` (repris verbatim de l'ancien init()).
const migration: Migration = {
  id: '001_init',
  async up(db) {
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS notifications (
        id varchar(36) PRIMARY KEY,
        userId varchar(36) NOT NULL,
        message text NOT NULL,
        type varchar(64) NOT NULL,
        createdAt varchar(30) NOT NULL
      )`,
    );
  },
  async down(db) {
    await run(db, 'DROP TABLE IF EXISTS notifications');
  },
};

export default migration;
