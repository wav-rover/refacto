import { run, type Migration } from './runner';

const migration: Migration = {
  id: '002_add_birth_date',
  async up(db) {
    await run(db, 'ALTER TABLE users ADD COLUMN birthDate varchar(30)');
  },
  async down(db) {
    await run(db, 'ALTER TABLE users DROP COLUMN birthDate');
  },
};

export default migration;
