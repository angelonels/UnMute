import { describe, expect, it } from 'vitest';
import { createApp } from './app';

const env = {
  ENVIRONMENT: 'development',
  FRONTEND_ORIGIN: 'http://localhost:5173',
};

describe('API', () => {
  it('returns health', async () => {
    const app = createApp();
    const response = await app.request('/api/health', {}, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'unmute-api',
    });
  });

  it('exposes an OpenAPI document that includes health', async () => {
    const app = createApp();
    const response = await app.request('/api/openapi.json', {}, env);
    expect(response.status).toBe(200);
    const spec = (await response.json()) as {
      paths: Record<string, unknown>;
    };
    expect(spec.paths['/api/health']).toBeTruthy();
  });

  it('uses stable error codes for unknown routes', async () => {
    const app = createApp();
    const response = await app.request('/api/missing', {}, env);
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  });
});
