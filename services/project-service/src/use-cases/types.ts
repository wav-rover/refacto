import type { Project } from '../domain/project';

export type UseCaseSuccess<T = Project> = { ok: true; project: T };
export type UseCaseError = {
  ok: false;
  code: 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';
  message?: string;
};
export type UseCaseResult<T = Project> = UseCaseSuccess<T> | UseCaseError;
