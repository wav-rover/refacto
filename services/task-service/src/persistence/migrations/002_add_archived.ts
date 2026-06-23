import { run, type Migration } from './runner';

// Démonstration « valeur par défaut » : ajout d'une colonne NOT NULL DEFAULT.
// Les lignes existantes sont rétro-remplies automatiquement par SQLite (0).
// Le `down` supprime la colonne SANS perte de données via la procédure
// officielle SQLite de recréation de table (compatible toutes versions, là où
// `ALTER TABLE ... DROP COLUMN` n'existe que depuis 3.35) : on recrée la table
// sans la colonne, on recopie les colonnes conservées, on substitue.
const migration: Migration = {
  id: '002_add_archived',
  async up(db) {
    await run(
      db,
      "ALTER TABLE tasks ADD COLUMN archived integer NOT NULL DEFAULT 0",
    );
  },
  async down(db) {
    await run(
      db,
      `CREATE TABLE tasks_new (
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
    await run(
      db,
      `INSERT INTO tasks_new
        (id, title, projectId, createdBy, assignedTo, completed, status, priority, dueDate, createdAt)
       SELECT
        id, title, projectId, createdBy, assignedTo, completed, status, priority, dueDate, createdAt
       FROM tasks`,
    );
    await run(db, 'DROP TABLE tasks');
    await run(db, 'ALTER TABLE tasks_new RENAME TO tasks');
  },
};

export default migration;
