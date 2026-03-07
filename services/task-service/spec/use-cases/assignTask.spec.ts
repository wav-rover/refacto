import { createRepository } from '../../src/persistence';
import { createTask, assignTask, unassignTask, completeTask } from '../../src/use-cases';

describe('assignTask', () => {
  const repo = createRepository();

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
  });

  it('assigns a task to a user', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await assignTask(repo, createResult.task.id, 'user-2');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.assignedTo).toBe('user-2');
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await assignTask(repo, 'non-existent-id', 'user-1');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns INVALID_INPUT when userId is empty', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await assignTask(repo, createResult.task.id, '');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns CONFLICT when user already has an active task', async () => {
    // Create first task assigned to user-2
    const task1 = await createTask(repo, {
      title: 'Task 1',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(task1.ok).toBe(true);

    // Create second unassigned task
    const task2 = await createTask(repo, {
      title: 'Task 2',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(task2.ok).toBe(true);
    if (!task2.ok) return;

    // Try to assign task2 to user-2
    const result = await assignTask(repo, task2.task.id, 'user-2');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns CONFLICT when trying to assign a completed task', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, createResult.task.id);

    const result = await assignTask(repo, createResult.task.id, 'user-2');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('returns same task when already assigned to the same user', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await assignTask(repo, createResult.task.id, 'user-2');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.assignedTo).toBe('user-2');
  });
});

describe('unassignTask', () => {
  const repo = createRepository();

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
  });

  it('unassigns a task', async () => {
    const createResult = await createTask(repo, {
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
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, createResult.task.id);

    const result = await unassignTask(repo, createResult.task.id);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });
});
