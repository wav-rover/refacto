import { createRepository } from '../../src/persistence';
import { createTask, completeTask, reopenTask } from '../../src/use-cases';

describe('completeTask', () => {
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

  it('marks a task as completed', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await completeTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('done');
    expect(result.task.completed).toBe(true);
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await completeTask(repo, 'non-existent-id');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns same task if already completed', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, createResult.task.id);
    const result = await completeTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('done');
  });
});

describe('reopenTask', () => {
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

  it('reopens a completed task', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    await completeTask(repo, createResult.task.id);
    const result = await reopenTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('todo');
    expect(result.task.completed).toBe(false);
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await reopenTask(repo, 'non-existent-id');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });

  it('returns same task if not completed', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await reopenTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.status).toBe('todo');
  });
});
