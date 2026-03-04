export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: () => new AppError(401, 'Unauthorized', 'UNAUTHORIZED'),
  forbidden: () => new AppError(403, 'Forbidden', 'FORBIDDEN'),
  notFound: (resource = 'Resource') => new AppError(404, `${resource} not found`, 'NOT_FOUND'),
  badRequest: (msg: string) => new AppError(400, msg, 'BAD_REQUEST'),
  conflict: (msg: string) => new AppError(409, msg, 'CONFLICT'),
  internal: (msg = 'Internal server error') => new AppError(500, msg, 'INTERNAL'),
};
