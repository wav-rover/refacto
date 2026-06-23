// Test d'intégration : le schéma produit par les migrations donne un repository
// sqlite fonctionnel (init = exécution des migrations), tables liées comprises.
process.env.PROJECT_SQLITE_DB_LOCATION = ':memory:';

import repo from '../src/persistence/sqlite';

describe('project-service repository on a migrated database', () => {
  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('create seeds the owner as a member and findById round-trips', async () => {
    const created = await repo.create({ name: 'Migrated', ownerId: 'owner-1' });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Migrated');
    expect(found?.status).toBe('open');
    expect(found?.memberIds).toContain('owner-1');
  });

  it('addMember / removeMember work across the FK-linked tables', async () => {
    const created = await repo.create({ name: 'Team', ownerId: 'owner-2' });

    await repo.addMember(created.id, 'member-2');
    let found = await repo.findById(created.id);
    expect(found?.memberIds).toContain('member-2');

    await repo.removeMember(created.id, 'member-2');
    found = await repo.findById(created.id);
    expect(found?.memberIds).not.toContain('member-2');
  });
});
