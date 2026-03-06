import { createRepository } from '../../src/persistence';
import { createProject, closeProject } from '../../src/use-cases';

describe('closeProject', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('allows owner to close project', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await closeProject(repo, create.project.id, 'owner-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.status).toBe('closed');
  });

  it('returns FORBIDDEN when non-owner closes', async () => {
    const create = await createProject(repo, 'Project 2', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await closeProject(repo, create.project.id, 'user-other');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
  });

  it('returns CONFLICT when project already closed', async () => {
    const create = await createProject(repo, 'Project 3', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await closeProject(repo, create.project.id, 'owner-1');

    const result = await closeProject(repo, create.project.id, 'owner-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns NOT_FOUND for unknown project', async () => {
    const result = await closeProject(
      repo,
      'non-existent-id',
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});
