import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export type AuthBindings = {
  DB: D1Database;
  FRONTEND_ORIGIN: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export function createAuth(env: AuthBindings) {
  if (
    !env.BETTER_AUTH_URL ||
    !env.BETTER_AUTH_SECRET ||
    env.BETTER_AUTH_SECRET.length < 32 ||
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET
  ) {
    throw new Error('Auth configuration is incomplete');
  }
  return betterAuth({
    appName: 'UnMute',
    // ASVS 13.3.1: Worker bindings keep credentials out of client bundles and source.
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(env.DB), { provider: 'sqlite', schema }),
    // ASVS 10.2.1: retain Better Auth's state, CSRF, origin, and redirect checks.
    trustedOrigins: [env.FRONTEND_ORIGIN],
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: 'select_account',
        // ASVS 10.2.3: sign-in requests identity only, with no offline access.
        accessType: 'online',
        includeGrantedScopes: false,
      },
    },
    account: { accountLinking: { enabled: false }, encryptOAuthTokens: true },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60 },
    logger: { disabled: true },
  });
}
