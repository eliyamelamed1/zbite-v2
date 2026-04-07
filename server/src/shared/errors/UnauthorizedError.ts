/** Error thrown when authentication is required but missing or invalid. Maps to HTTP 401. */
export class UnauthorizedError extends Error {
  public readonly statusCode = 401;

  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
