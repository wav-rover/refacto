import { run, type Migration } from './runner';

// Schéma initial : tables `projects` et `project_members` (FK vers projects),
// reprises verbatim de l'ancien init() inline.
const migration: Migration = {
  id: '001_init',
  async up(db) {
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS projects (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        ownerId varchar(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'open',
        createdAt varchar(30) NOT NULL
      )`,
    );
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS project_members (
        projectId varchar(36) NOT NULL,
        userId varchar(36) NOT NULL,
        PRIMARY KEY (projectId, userId),
        FOREIGN KEY (projectId) REFERENCES projects(id)
      )`,
    );
  },
  async down(db) {
    // Ordre inverse des dépendances FK : enfant d'abord.
    await run(db, 'DROP TABLE IF EXISTS project_members');
    await run(db, 'DROP TABLE IF EXISTS projects');
  },
};

export default migration;
