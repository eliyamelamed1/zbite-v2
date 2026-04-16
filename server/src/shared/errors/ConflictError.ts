/** Error thrown when a resource already exists. Maps to HTTP 409. */
export class ConflictError extends Error {
  public readonly statusCode = 409;

  constructor(resource: string, identifier: string) {
    super(`${resource} "${identifier}" already exists`);
    this.name = 'ConflictError';
  }
}
