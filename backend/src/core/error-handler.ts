import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from './env';
import { AppError, errorBody } from './errors';
import { log } from './logging';

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId');

  if (err instanceof AppError) {
    log({
      event: 'request_error',
      requestId,
      code: err.code,
      status: err.status,
    });
    return c.json(errorBody(err.code, err.message), err.status as ContentfulStatusCode);
  }

  log({
    event: 'unhandled_error',
    requestId,
    code: 'INTERNAL_ERROR',
    status: 500,
  });

  return c.json(errorBody('INTERNAL_ERROR', 'Something went wrong'), 500);
};

export const handleNotFound: NotFoundHandler<AppEnv> = (c) => {
  return c.json(errorBody('NOT_FOUND', 'Not found'), 404);
};
