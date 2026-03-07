import { createRepository } from '../src/persistence';
import type { NewNotification } from '../src/ports/notificationRepository';

const repo = createRepository();

describe('NotificationRepository contract (inMemory)', () => {
  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  it('creates and retrieves notifications by userId', async () => {
    const newNotif: NewNotification = {
      userId: 'user-1',
      message: 'Task assigned to you',
      type: 'TaskAssigned',
    };

    const created = await repo.create(newNotif);
    expect(created.id).toBeDefined();
    expect(created.userId).toBe('user-1');
    expect(created.message).toBe(newNotif.message);
    expect(created.type).toBe('TaskAssigned');
    expect(created.createdAt).toBeDefined();

    const byUser = await repo.findByUserId('user-1');
    expect(byUser.length).toBeGreaterThanOrEqual(1);
    expect(byUser.some((n) => n.id === created.id)).toBe(true);
  });

  it('findByUserId returns only notifications for that user', async () => {
    await repo.create({
      userId: 'user-a',
      message: 'For A',
      type: 'TaskCompleted',
    });
    await repo.create({
      userId: 'user-b',
      message: 'For B',
      type: 'TaskAssigned',
    });

    const forA = await repo.findByUserId('user-a');
    expect(forA.every((n) => n.userId === 'user-a')).toBe(true);
  });
});
