import { createInMemoryEventBus } from '../../src/eventBus/inMemory';
import { createRepository } from '../../src/persistence';
import { createProject, closeProject } from '../../src/use-cases';

describe('closeProject', () => {
  const repo = createRepository();
  const eventBus = createInMemoryEventBus();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  beforeEach(() => {
    eventBus.clear();
  });

  it('allows owner to close project', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await closeProject(repo, eventBus, create.project.id, 'owner-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.status).toBe('closed');

    const published = eventBus.getPublishedEvents();
    expect(published).toHaveLength(1);
    expect(published[0].type).toBe('ProjectClosed');
    expect(published[0].payload).toMatchObject({
      projectId: create.project.id,
      closedByUserId: 'owner-1',
      memberIds: ['owner-1'],
    });
    expect(published[0].payload.closedAt).toBeDefined();
    expect(typeof published[0].payload.closedAt).toBe('string');
  });

  it('returns FORBIDDEN when non-owner closes', async () => {
    const create = await createProject(repo, 'Project 2', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await closeProject(repo, eventBus, create.project.id, 'user-other');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
    expect(eventBus.getPublishedEvents()).toHaveLength(0);
  });

  it('returns CONFLICT when project already closed', async () => {
    const create = await createProject(repo, 'Project 3', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await closeProject(repo, eventBus, create.project.id, 'owner-1');

    const result = await closeProject(repo, eventBus, create.project.id, 'owner-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
    expect(eventBus.getPublishedEvents()).toHaveLength(1);
  });

  it('returns NOT_FOUND for unknown project', async () => {
    const result = await closeProject(
      repo,
      eventBus,
      'non-existent-id',
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
    expect(eventBus.getPublishedEvents()).toHaveLength(0);
  });
});
