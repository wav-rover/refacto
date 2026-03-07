import { createRepository } from '../../src/persistence';
import { createTask } from '../../src/use-cases';

describe('createTask', () => {
  const repo = createRepository();

  beforeAll(async () => {
    await repo.init();
  });

  afterAll(async () => {
    await repo.teardown();
  });

  beforeEach(async () => {
    // Clear all tasks before each test
    const tasks = await repo.findAll();
    for (const task of tasks) {
      await repo.remove(task.id);
    }
  });

  it('creates a task with default values', async () => {
    const result = await createTask(repo, {
      title: 'My Task',
      projectId: 'project-1',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.task.title).toBe('My Task');
    expect(result.task.projectId).toBe('project-1');
    expect(result.task.createdBy).toBe('user-1');
    expect(result.task.assignedTo).toBeNull();
    expect(result.task.completed).toBe(false);
    expect(result.task.status).toBe('todo');
    expect(result.task.priority).toBe('medium');
    expect(result.task.dueDate).toBeNull();
    expect(result.task.id).toBeDefined();
    expect(result.task.createdAt).toBeDefined();
  });

  it('creates a task with all optional fields', async () => {
    const result = await createTask(repo, {
      title: 'Full Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2024-12-31',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.task.assignedTo).toBe('user-2');
    expect(result.task.status).toBe('in_progress');
    expect(result.task.priority).toBe('high');
    expect(result.task.dueDate).toBe('2024-12-31');
  });

  it('trims task title', async () => {
    const result = await createTask(repo, {
      title: '  Trimmed Title  ',
      projectId: 'project-1',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.task.title).toBe('Trimmed Title');
  });

  it('returns INVALID_INPUT when title is empty', async () => {
    const result = await createTask(repo, {
      title: '',
      projectId: 'project-1',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.message).toContain('Title');
  });

  it('returns INVALID_INPUT when title is only spaces', async () => {
    const result = await createTask(repo, {
      title: '   ',
      projectId: 'project-1',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
  });

  it('returns INVALID_INPUT when projectId is empty', async () => {
    const result = await createTask(repo, {
      title: 'Valid Title',
      projectId: '',
      createdBy: 'user-1',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.message).toContain('Project');
  });

  it('returns INVALID_INPUT when createdBy is empty', async () => {
    const result = await createTask(repo, {
      title: 'Valid Title',
      projectId: 'project-1',
      createdBy: '',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('INVALID_INPUT');
    expect(result.message).toContain('Creator');
  });

  it('returns CONFLICT when assignedTo user already has an active task', async () => {
    // First, create a task assigned to user-2
    await createTask(repo, {
      title: 'First Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });

    // Try to create another task assigned to user-2
    const result = await createTask(repo, {
      title: 'Second Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('CONFLICT');
    expect(result.message).toContain('active task');
  });

  it('allows assigning to user who only has completed tasks', async () => {
    // Create a task assigned to user-2 and complete it
    const firstResult = await createTask(repo, {
      title: 'First Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) return;

    // Complete the task
    await repo.update(firstResult.task.id, { status: 'done', completed: true });

    // Now create another task for user-2
    const result = await createTask(repo, {
      title: 'Second Task',
      projectId: 'project-1',
      createdBy: 'user-1',
      assignedTo: 'user-2',
    });

    expect(result.ok).toBe(true);
  });
});
