import type { ErrorHandler, NotFoundHandler } from 'hono';
import type { AppEnv } from './env';
import { errorBody } from './errors';
import { log } from './logging';

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId');

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
