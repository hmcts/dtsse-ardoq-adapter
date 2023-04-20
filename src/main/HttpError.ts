export class HTTPError extends Error {
  readonly status: number;
  readonly errors: unknown[]; // this is to play nicely with openapi-validator ValidationError

  constructor(message: string, status: number, errors?: unknown[]) {
    super(message);
    this.status = status;
    this.errors = errors || [];
  }
}
