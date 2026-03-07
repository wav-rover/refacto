import type { Task } from '../domain/task';

export type UseCaseSuccess<T = Task> = { ok: true; task: T };
export type UseCaseError = {
  ok: false;
  code: 'INVALID_INPUT' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';
  message?: string;
};
export type UseCaseResult<T = Task> = UseCaseSuccess<T> | UseCaseError;
