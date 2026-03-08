import { createRepository } from '../../src/persistence';
import { createInMemoryEventBus } from '../../src/eventBus';
import { createTask, completeTask, reopenTask } from '../../src/use-cases';

describe('reopenTask', () => {
  const repo = createRepository();
  const eventBus = createInMemoryEventBus();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  beforeEach(async () => {
    const tasks = await repo.findAll();
    for (const task of tasks) {
      await repo.remove(task.id);
    }
    eventBus.clear();
  });

  it('reopens a completed task', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');
    eventBus.clear();
    const result = await reopenTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('todo');
    expect(result.task.completed).toBe(false);
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await reopenTask(repo, eventBus, 'non-existent-id', 'user-1', 'owner-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns same task if not completed without publishing event', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    eventBus.clear();
    const result = await reopenTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('todo');

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });

  it('publishes TaskReopened event on success', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, eventBus, createResult.task.id, 'user-2', 'owner-1');
    eventBus.clear();
    const result = await reopenTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TaskReopened');
    expect(events[0].payload.taskId).toBe(createResult.task.id);
    expect(events[0].payload.projectId).toBe('project-1');
    expect(events[0].payload.actionUserId).toBe('user-1');
    expect(events[0].payload.projectOwnerId).toBe('owner-1');
    expect(events[0].payload.assignedTo).toBe('user-2');
  });

  it('does not include assignedTo in event when not assigned', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');
    eventBus.clear();
    const result = await reopenTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    expect(result.ok).toBe(true);

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].payload.assignedTo).toBeUndefined();
  });

  it('does not publish event on failure', async () => {
    eventBus.clear();
    await reopenTask(repo, eventBus, 'non-existent-id', 'user-1', 'owner-1');

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });
});
