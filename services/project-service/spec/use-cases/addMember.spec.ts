import { createRepository } from '../../src/persistence';
import { createProject, addMember } from '../../src/use-cases';

describe('addMember', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('allows owner to add a member', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    const projectId = create.project.id;

    const result = await addMember(repo, projectId, 'user-2', 'owner-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.memberIds).toContain('owner-1');
    expect(result.project.memberIds).toContain('user-2');
  });

  it('returns FORBIDDEN when non-owner adds member', async () => {
    const create = await createProject(repo, 'Project 2', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await addMember(repo, create.project.id, 'user-2', 'user-other');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
  });

  it('returns CONFLICT when user is already member', async () => {
    const create = await createProject(repo, 'Project 3', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await addMember(repo, create.project.id, 'user-2', 'owner-1');

    const result = await addMember(repo, create.project.id, 'user-2', 'owner-1');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns NOT_FOUND for unknown project', async () => {
    const result = await addMember(
      repo,
      'non-existent-id',
      'user-2',
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});
