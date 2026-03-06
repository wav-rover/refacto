import { createRepository } from '../../src/persistence';
import { createProject } from '../../src/use-cases';

describe('createProject', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('creates a project with owner as member and status open', async () => {
    const result = await createProject(repo, 'My Project', 'owner-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.name).toBe('My Project');
    expect(result.project.ownerId).toBe('owner-1');
    expect(result.project.memberIds).toContain('owner-1');
    expect(result.project.status).toBe('open');
    expect(result.project.id).toBeDefined();
    expect(result.project.createdAt).toBeDefined();
  });

  it('trims project name', async () => {
    const result = await createProject(repo, '  Trimmed  ', 'owner-2');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.name).toBe('Trimmed');
  });

  it('returns INVALID_INPUT when name is empty', async () => {
    const result = await createProject(repo, '', 'owner-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.message).toContain('Name');
  });

  it('returns INVALID_INPUT when name is only spaces', async () => {
    const result = await createProject(repo, '   ', 'owner-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns INVALID_INPUT when ownerId is empty', async () => {
    const result = await createProject(repo, 'Valid Name', '');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.message).toContain('Owner');
  });
});
