import { run, type Migration } from './runner';

// Démonstration « valeur par défaut » sur la table `projects` : ajout d'une
// colonne NOT NULL DEFAULT (les lignes existantes sont rétro-remplies à 0).
// Le `down` supprime la colonne SANS perte de données via la procédure SQLite
// de recréation de table (compatible toutes versions). `project_members` n'est
// pas touchée : la relation FK est préservée (mêmes id de projets).
const migration: Migration = {
  id: '002_add_archived',
  async up(db) {
    await run(
      db,
      "ALTER TABLE projects ADD COLUMN archived integer NOT NULL DEFAULT 0",
    );
  },
  async down(db) {
    await run(
      db,
      `CREATE TABLE projects_new (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        ownerId varchar(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'open',
        createdAt varchar(30) NOT NULL
      )`,
    );
    await run(
      db,
      `INSERT INTO projects_new (id, name, ownerId, status, createdAt)
       SELECT id, name, ownerId, status, createdAt FROM projects`,
    );
    await run(db, 'DROP TABLE projects');
    await run(db, 'ALTER TABLE projects_new RENAME TO projects');
  },
};

export default migration;
