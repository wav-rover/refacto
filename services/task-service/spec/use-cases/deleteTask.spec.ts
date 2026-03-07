import { createRepository } from '../../src/persistence';
import { createTask, deleteTask } from '../../src/use-cases';

describe('deleteTask', () => {
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

  it('deletes an existing task', async () => {
    const createResult = await createTask(repo, {
      title: 'Test Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const result = await deleteTask(repo, createResult.task.id);

    expect(result.ok).toBe(true);

    // Verify task is deleted
    const task = await repo.findById(createResult.task.id);
    expect(task).toBeNull();
  });

  it('returns NOT_FOUND for non-existent task', async () => {
    const result = await deleteTask(repo, 'non-existent-id');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('NOT_FOUND');
  });
});
