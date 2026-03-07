import { createRepository } from '../src/persistence';
import { createNotificationIfAllowed } from '../src/use-cases/createNotificationIfAllowed';

const repo = createRepository();

describe('createNotificationIfAllowed', () => {
  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('returns null when actionUserId === targetUserId', async () => {
    const result = await createNotificationIfAllowed(repo, {
      actionUserId: 'user-1',
      targetUserId: 'user-1',
      message: 'You did something',
      type: 'TaskCompleted',
    });
    expect(result).toBeNull();
  });

  it('creates notification when actionUserId !== targetUserId', async () => {
    const result = await createNotificationIfAllowed(repo, {
      actionUserId: 'user-a',
      targetUserId: 'user-b',
      message: 'Task assigned to you',
      type: 'TaskAssigned',
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.userId).toBe('user-b');
    expect(result.message).toBe('Task assigned to you');
    expect(result.type).toBe('TaskAssigned');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });
});
