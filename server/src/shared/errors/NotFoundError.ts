/** Error thrown when a requested resource does not exist. Maps to HTTP 404. */
export class NotFoundError extends Error {
  public readonly statusCode = 404;

  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" was not found`);
    this.name = 'NotFoundError';
  }
}
