// Test d'intégration : prouve que le schéma PRODUIT PAR LES MIGRATIONS donne un
// repository sqlite fonctionnel de bout en bout (init = exécution des migrations).
process.env.TASK_SQLITE_DB_LOCATION = ':memory:';

import repo from '../src/persistence/sqlite';

describe('task-service repository on a migrated database', () => {
  beforeAll(async () => {
    // init() ouvre la connexion ET joue les migrations (runMigrations up).
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('create / findById round-trips on the migrated schema', async () => {
    const created = await repo.create({
      title: 'Write migration tests',
      projectId: 'p1',
      createdBy: 'u1',
    });

    const found = await repo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Write migration tests');
    expect(found?.status).toBe('todo');
    expect(found?.priority).toBe('medium');
  });

  it('update and remove work against the migrated schema', async () => {
    const created = await repo.create({
      title: 'Temp',
      projectId: 'p2',
      createdBy: 'u2',
    });

    const updated = await repo.update(created.id, { completed: true });
    expect(updated?.completed).toBe(true);

    const removed = await repo.remove(created.id);
    expect(removed).toBe(true);
    expect(await repo.findById(created.id)).toBeNull();
  });
});
