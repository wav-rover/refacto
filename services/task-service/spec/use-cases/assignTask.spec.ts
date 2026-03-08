import { createRepository } from '../../src/persistence';
import { createInMemoryEventBus } from '../../src/eventBus';
import { createTask, assignTask, unassignTask, completeTask } from '../../src/use-cases';

describe('assignTask', () => {
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

  it('assigns a task to a user', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    eventBus.clear();
    const result = await assignTask(repo, eventBus, createResult.task.id, 'user-2', 'user-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.assignedTo).toBe('user-2');
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await assignTask(repo, eventBus, 'non-existent-id', 'user-1', 'user-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns INVALID_INPUT when userId is empty', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await assignTask(repo, eventBus, createResult.task.id, '', 'user-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns CONFLICT when user already has an active task', async () => {
    const task1 = await createTask(repo, eventBus, {
      title: 'Task 1',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(task1.ok).toBe(true);

    const task2 = await createTask(repo, eventBus, {
      title: 'Task 2',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(task2.ok).toBe(true);
    if (!task2.ok) return;

    const result = await assignTask(repo, eventBus, task2.task.id, 'user-2', 'user-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns CONFLICT when trying to assign a completed task', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    const result = await assignTask(repo, eventBus, createResult.task.id, 'user-2', 'user-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns same task when already assigned to the same user', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    eventBus.clear();
    const result = await assignTask(repo, eventBus, createResult.task.id, 'user-2', 'user-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.assignedTo).toBe('user-2');

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });

  it('publishes TaskAssigned event on success', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    eventBus.clear();
    const result = await assignTask(repo, eventBus, createResult.task.id, 'user-2', 'user-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('TaskAssigned');
    expect(events[0].payload.taskId).toBe(createResult.task.id);
    expect(events[0].payload.projectId).toBe('project-1');
    expect(events[0].payload.actionUserId).toBe('user-1');
    expect(events[0].payload.assignedTo).toBe('user-2');
    expect(events[0].payload.title).toBe('Test Task');
  });

  it('does not publish event on failure', async () => {
    eventBus.clear();
    await assignTask(repo, eventBus, 'non-existent-id', 'user-1', 'user-1');

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });
});

describe('unassignTask', () => {
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

  it('unassigns a task', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await unassignTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.assignedTo).toBeNull();
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await unassignTask(repo, 'non-existent-id');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns CONFLICT when trying to unassign a completed task', async () => {
    const createResult = await createTask(repo, eventBus, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, eventBus, createResult.task.id, 'user-1', 'owner-1');

    const result = await unassignTask(repo, createResult.task.id);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });
});
