import { createRepository } from '../../src/persistence';
import { createTask, updateTask, completeTask } from '../../src/use-cases';

describe('updateTask', () => {
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

  it('updates task title', async () => {
    const createResult = await createTask(repo, {
      title: 'Original Title',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      title: 'Updated Title',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.title).toBe('Updated Title');
  });

  it('updates task status', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      status: 'in_progress',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('in_progress');
  });

  it('updates task priority', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      priority: 'high',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.priority).toBe('high');
  });

  it('updates task dueDate', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      dueDate: '2024-12-31',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.dueDate).toBe('2024-12-31');
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await updateTask(repo, 'non-existent-id', {
      title: 'New Title',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns INVALID_INPUT when title is empty', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      title: '',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns CONFLICT when trying to update a completed task', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, createResult.task.id);

    const result = await updateTask(repo, createResult.task.id, {
      title: 'New Title',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
  });

  it('trims title when updating', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await updateTask(repo, createResult.task.id, {
      title: '  Trimmed Title  ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.title).toBe('Trimmed Title');
  });
});
