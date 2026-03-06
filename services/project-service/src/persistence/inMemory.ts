import crypto from 'crypto';
import type { NewProject, Project, ProjectId } from '../domain/project';
import type { ProjectRepository } from '../ports/projectRepository';

const byId = new Map<ProjectId, Project>();

async function init(): Promise<void> {
  byId.clear();
}

async function teardown(): Promise<void> {
  byId.clear();
}

async function create(project: NewProject): Promise<Project> {
  const id: ProjectId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const created: Project = {
    id,
    name: project.name.trim(),
    ownerId: project.ownerId,
    memberIds: [project.ownerId],
    status: 'open',
    createdAt,
  };
  byId.set(id, created);
  return created;
}

async function findById(id: ProjectId): Promise<Project | null> {
  return byId.get(id) ?? null;
}

async function findAll(): Promise<Project[]> {
  return Array.from(byId.values());
}

async function update(
  id: ProjectId,
  update: { name?: string; status?: 'open' | 'closed' },
): Promise<Project | null> {
  const project = byId.get(id);
  if (!project) return null;
  if (update.name !== undefined) project.name = update.name.trim();
  if (update.status !== undefined) project.status = update.status;
  return project;
}

async function addMember(
  projectId: ProjectId,
  userId: string,
): Promise<Project | null> {
  const project = byId.get(projectId);
  if (!project) return null;
  if (project.memberIds.includes(userId)) return project;
  project.memberIds = [...project.memberIds, userId];
  return project;
}

async function removeMember(
  projectId: ProjectId,
  userId: string,
): Promise<Project | null> {
  const project = byId.get(projectId);
  if (!project) return null;
  project.memberIds = project.memberIds.filter((id) => id !== userId);
  return project;
}

const inMemoryRepository: ProjectRepository = {
  init,
  teardown,
  create,
  findById,
  findAll,
  update,
  addMember,
  removeMember,
};

export default inMemoryRepository;
