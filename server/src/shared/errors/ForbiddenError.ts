/** Error thrown when a user is authenticated but not authorized. Maps to HTTP 403. */
export class ForbiddenError extends Error {
  public readonly statusCode = 403;

  constructor(message = 'Not authorized to perform this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
