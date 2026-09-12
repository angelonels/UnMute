import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from './env';
import { log } from './logging';

export const requestContext: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('x-request-id', requestId);

  const started = Date.now();
  await next();

  log({
    event: 'request_completed',
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    status: c.res.status,
    durationMs: Date.now() - started,
  });
};
