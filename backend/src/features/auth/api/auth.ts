import type { OpenAPIHono } from '@hono/zod-openapi';
import { Effect } from 'effect';
import type { AppEnv } from '../../../core/env';
import { errorBody } from '../../../core/errors';
import { log } from '../../../core/logging';
import { createAuth } from '../integration/auth';

export function registerAuthRoutes(app: OpenAPIHono<AppEnv>) {
  app.all('/api/auth/*', async (c) => {
    // ASVS 10.2.1: require the configured browser origin for cookie-auth mutations.
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method) &&
      c.req.header('Origin') !== c.env.FRONTEND_ORIGIN
    ) {
      return c.json(errorBody('INVALID_ORIGIN', 'Untrusted request origin'), 403);
    }
    const result = await Effect.runPromise(
      Effect.tryPromise({
        try: () => createAuth(c.env).handler(c.req.raw),
        catch: () => 'AUTH_UNAVAILABLE' as const,
      }).pipe(
        Effect.match({
          onSuccess: (response) => response,
          onFailure: (code) => {
            log({ event: 'auth_unavailable', requestId: c.get('requestId'), code, status: 503 });
            return c.json(errorBody(code, 'Sign-in is temporarily unavailable'), 503);
          },
        }),
      ),
    );
    result.headers.set('Cache-Control', 'no-store');
    return result;
  });
}
