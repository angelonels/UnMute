import { createRoute, z, type OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '../../../core/env';

const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
    service: z.literal('unmute-api'),
  })
  .openapi('HealthResponse');

const getHealthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

export function registerHealthRoutes(app: OpenAPIHono<AppEnv>): void {
  app.openapi(getHealthRoute, (c) => c.json({ status: 'ok', service: 'unmute-api' }, 200));
}
