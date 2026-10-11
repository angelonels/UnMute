import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

// Schema generation requires the adapter shape, never a live database or secrets.
export const auth = betterAuth({
  database: drizzleAdapter(
    drizzle(async () => ({ rows: [] })),
    { provider: 'sqlite' },
  ),
  rateLimit: { enabled: true, storage: 'database' },
});
