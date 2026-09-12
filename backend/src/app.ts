import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import type { AppEnv } from './core/env';
import { handleError, handleNotFound } from './core/error-handler';
import { errorBody } from './core/errors';
import { openApiInfo } from './core/openapi';
import { requestContext } from './core/request-context';
import { registerHealthRoutes } from './features/health';

export function createApp() {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(errorBody('VALIDATION_ERROR', 'Invalid request'), 400);
      }
    },
  });

  app.use('*', requestContext);
  app.use('*', (c, next) =>
    cors({
      origin: c.env.FRONTEND_ORIGIN,
      credentials: true,
    })(c, next),
  );

  registerHealthRoutes(app);

  app.doc31('/api/openapi.json', openApiInfo);

  app.onError(handleError);
  app.notFound(handleNotFound);

  return app;
}

export const app = createApp();
