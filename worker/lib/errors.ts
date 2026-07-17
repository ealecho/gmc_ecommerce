import type { Context } from 'hono';

// Lightweight error type carrying an HTTP status so route handlers can throw
// and a single Hono error handler can translate it to a JSON response.
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const badRequest = (message: string) => new ApiError(message, 400);
export const unauthorized = (message = 'Authentication required.') => new ApiError(message, 401);
export const forbidden = (message = 'Forbidden') => new ApiError(message, 403);
export const notFound = (message = 'Not found') => new ApiError(message, 404);

// Convert any thrown error into a JSON response for the client. 500s are
// logged and their detail is hidden, matching the previous behavior.
export const toErrorResponse = (c: Context, error: any) => {
  const status = error?.status || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  if (status === 500) {
    console.error(error);
  }

  return c.json({ error: message }, status);
};
