/** Error thrown when input data fails validation. Maps to HTTP 400. */
export class ValidationError extends Error {
  public readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
