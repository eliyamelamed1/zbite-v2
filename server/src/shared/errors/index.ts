export { NotFoundError } from './NotFoundError';
export { ConflictError } from './ConflictError';
export { ForbiddenError } from './ForbiddenError';
export { UnauthorizedError } from './UnauthorizedError';
export { ValidationError } from './ValidationError';

/** Union of all domain error types with a statusCode property. */
export type DomainError =
  | import('./NotFoundError').NotFoundError
  | import('./ConflictError').ConflictError
  | import('./ForbiddenError').ForbiddenError
  | import('./UnauthorizedError').UnauthorizedError
  | import('./ValidationError').ValidationError;

/** Type guard to check if an error is a domain error with a statusCode. */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof Error && 'statusCode' in error && typeof (error as DomainError).statusCode === 'number';
}
