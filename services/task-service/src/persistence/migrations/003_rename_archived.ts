import { run, type Migration } from './runner';

// Démonstration « renommage sans perte de données » : RENAME COLUMN conserve
// les valeurs de la colonne (SQLite >= 3.25). Le `down` rejoue le renommage
// inverse.
const migration: Migration = {
  id: '003_rename_archived',
  async up(db) {
    await run(db, 'ALTER TABLE tasks RENAME COLUMN archived TO isArchived');
  },
  async down(db) {
    await run(db, 'ALTER TABLE tasks RENAME COLUMN isArchived TO archived');
  },
};

export default migration;
