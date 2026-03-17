import type {
  NewProject,
  Project,
  ProjectId,
  ProjectUpdate,
} from '../domain/project';

export type { NewProject, Project, ProjectId, ProjectUpdate };

export interface ProjectRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  create(project: NewProject): Promise<Project>;
  findById(id: ProjectId): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  findByUser(userId: string): Promise<Project[]>;
  update(id: ProjectId, update: ProjectUpdate): Promise<Project | null>;
  addMember(projectId: ProjectId, userId: string): Promise<Project | null>;
  removeMember(projectId: ProjectId, userId: string): Promise<Project | null>;
}
