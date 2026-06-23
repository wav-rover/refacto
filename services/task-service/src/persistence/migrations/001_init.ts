import { run, type Migration } from './runner';

// Schéma initial de la table `tasks` (repris verbatim de l'ancien init() inline).
const migration: Migration = {
  id: '001_init',
  async up(db) {
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS tasks (
        id varchar(36) PRIMARY KEY,
        title varchar(255) NOT NULL,
        projectId varchar(36) NOT NULL,
        createdBy varchar(36) NOT NULL,
        assignedTo varchar(36),
        completed boolean NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'todo',
        priority varchar(20) NOT NULL DEFAULT 'medium',
        dueDate varchar(30),
        createdAt varchar(30) NOT NULL
      )`,
    );
  },
  async down(db) {
    await run(db, 'DROP TABLE IF EXISTS tasks');
  },
};

export default migration;
