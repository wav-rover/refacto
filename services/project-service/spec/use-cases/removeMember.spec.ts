import { createRepository } from '../../src/persistence';
import { createProject, addMember, removeMember } from '../../src/use-cases';

describe('removeMember', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('allows owner to remove a member', async () => {
    const create = await createProject(repo, 'Project', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await addMember(repo, create.project.id, 'user-2', 'owner-1');

    const result = await removeMember(
      repo,
      create.project.id,
      'user-2',
      'owner-1',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.memberIds).not.toContain('user-2');
    expect(result.project.memberIds).toContain('owner-1');
  });

  it('returns FORBIDDEN when non-owner removes member', async () => {
    const create = await createProject(repo, 'Project 2', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;
    await addMember(repo, create.project.id, 'user-2', 'owner-1');

    const result = await removeMember(
      repo,
      create.project.id,
      'user-2',
      'user-other',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
  });

  it('returns FORBIDDEN when trying to remove owner', async () => {
    const create = await createProject(repo, 'Project 3', 'owner-1');
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await removeMember(
      repo,
      create.project.id,
      'owner-1',
      'owner-1',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('FORBIDDEN');
  });

  it('returns NOT_FOUND for unknown project', async () => {
    const result = await removeMember(
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
