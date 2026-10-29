import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/features/auth/db/schema.ts',
  out: './migrations',
});
