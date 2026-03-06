export type ProjectId = string;

export type ProjectStatus = 'open' | 'closed';

export interface Project {
  id: ProjectId;
  name: string;
  ownerId: string;
  memberIds: string[];
  status: ProjectStatus;
  createdAt: string;
}

export interface NewProject {
  name: string;
  ownerId: string;
}

export interface ProjectUpdate {
  name?: string;
  status?: ProjectStatus;
}
