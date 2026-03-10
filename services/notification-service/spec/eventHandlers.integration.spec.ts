import { createRepository } from '../src/persistence';
import {
  createInMemoryEventBus,
  type InMemoryEventBus,
} from '../src/eventBus/inMemory';
import { registerHandlers } from '../src/handlers';

const repo = createRepository();
const eventBus = createInMemoryEventBus();

describe('event handlers integration', () => {
  beforeAll(async () => {
    await repo.init();
    registerHandlers(eventBus, repo);
    await eventBus.start();
  });

  afterAll(async () => {
    await eventBus.stop();
    await repo.teardown();
  });

  it('TaskAssigned: creates notification for assigned user', async () => {
    const payload = {
      taskId: 't1',
      projectId: 'p1',
      actionUserId: 'user-ta-assigner',
      assignedTo: 'user-ta-assignee',
      title: 'Fix bug',
    };
    await (eventBus as InMemoryEventBus).emit('TaskAssigned', payload);

    const notifications = await repo.findByUserId('user-ta-assignee');
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('TaskAssigned');
    expect(notifications[0].message).toBe('Task "Fix bug" was assigned to you');
    expect(notifications[0].userId).toBe('user-ta-assignee');
  });

  it('TaskAssigned: no notification when actionUserId === assignedTo', async () => {
    const before = await repo.findByUserId('user-ta-same');
    const payload = {
      taskId: 't2',
      projectId: 'p2',
      actionUserId: 'user-ta-same',
      assignedTo: 'user-ta-same',
    };
    await (eventBus as InMemoryEventBus).emit('TaskAssigned', payload);
    const after = await repo.findByUserId('user-ta-same');
    expect(after.length).toBe(before.length);
  });

  it('TaskCompleted: creates notification for project owner (and assignee if different)', async () => {
    const payload = {
      taskId: 't3',
      projectId: 'p3',
      actionUserId: 'user-tc-doer',
      projectOwnerId: 'user-tc-owner',
      assignedTo: 'user-tc-doer',
    };
    await (eventBus as InMemoryEventBus).emit('TaskCompleted', payload);

    const ownerNotifications = await repo.findByUserId('user-tc-owner');
    expect(ownerNotifications.length).toBeGreaterThanOrEqual(1);
    const forOwner = ownerNotifications.find((n) => n.type === 'TaskCompleted');
    expect(forOwner?.message).toBe('A task was completed');

    const doerNotifications = await repo.findByUserId('user-tc-doer');
    expect(doerNotifications.filter((n) => n.type === 'TaskCompleted').length).toBe(0);
  });

  it('TaskReopened: creates notification for project owner', async () => {
    const payload = {
      taskId: 't4',
      projectId: 'p4',
      actionUserId: 'user-tro-doer',
      projectOwnerId: 'user-tro-owner',
    };
    await (eventBus as InMemoryEventBus).emit('TaskReopened', payload);

    const notifications = await repo.findByUserId('user-tro-owner');
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    const reopened = notifications.find((n) => n.type === 'TaskReopened');
    expect(reopened?.message).toBe('A task was reopened');
  });

  it('TaskDeleted: creates notifications for project owner and assignee', async () => {
    const payload = {
      taskId: 't5',
      projectId: 'p5',
      actionUserId: 'user-td-by',
      projectOwnerId: 'user-td-owner',
      assignedTo: 'user-td-assignee',
    };
    await (eventBus as InMemoryEventBus).emit('TaskDeleted', payload);

    const ownerNotifications = await repo.findByUserId('user-td-owner');
    expect(ownerNotifications.some((n) => n.type === 'TaskDeleted')).toBe(true);

    const assigneeNotifications = await repo.findByUserId('user-td-assignee');
    expect(assigneeNotifications.some((n) => n.type === 'TaskDeleted')).toBe(true);
  });

  it('ProjectClosed: creates notification for each member (except when member === closedBy)', async () => {
    const payload = {
      projectId: 'p6',
      closedAt: new Date().toISOString(),
      closedByUserId: 'user-pc-by',
      memberIds: ['user-pc-by', 'user-pc-m1', 'user-pc-m2'],
    };
    await (eventBus as InMemoryEventBus).emit('ProjectClosed', payload);

    const forM1 = await repo.findByUserId('user-pc-m1');
    expect(forM1.some((n) => n.type === 'ProjectClosed')).toBe(true);

    const forM2 = await repo.findByUserId('user-pc-m2');
    expect(forM2.some((n) => n.type === 'ProjectClosed')).toBe(true);

    const forCloser = await repo.findByUserId('user-pc-by');
    expect(forCloser.filter((n) => n.type === 'ProjectClosed').length).toBe(0);
  });

  it('invalid payload: does not crash and creates no notification', async () => {
    await (eventBus as InMemoryEventBus).emit('TaskAssigned', {});
    await (eventBus as InMemoryEventBus).emit('TaskAssigned', { taskId: 'x' });

    const notifications = await repo.findByUserId('user-invalid-never-used');
    expect(notifications.length).toBe(0);
  });
});
