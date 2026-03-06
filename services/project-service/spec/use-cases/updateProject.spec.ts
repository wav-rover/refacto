import { createRepository } from '../../src/persistence';
import { createProject, updateProject } from '../../src/use-cases';

describe('updateProject', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('allows owner to update project name', async () => {
    const create = await createProject(repo, 'Original', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await updateProject(
      repo,
      create.project.id,
      { name: 'Updated Name' },
      'owner-1',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.name).toBe('Updated Name');
  });

  it('returns FORBIDDEN when non-owner updates', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await updateProject(
      repo,
      create.project.id,
      { name: 'Hacked' },
      'user-other',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
  });

  it('returns CONFLICT when project is closed', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await updateProject(repo, create.project.id, { status: 'closed' }, 'owner-1');

    const result = await updateProject(
      repo,
      create.project.id,
      { name: 'New Name' },
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns INVALID_INPUT when name is empty', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await updateProject(
      repo,
      create.project.id,
      { name: '   ' },
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns NOT_FOUND for unknown project', async () => {
    const result = await updateProject(
      repo,
      'non-existent-id',
      { name: 'Name' },
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});
