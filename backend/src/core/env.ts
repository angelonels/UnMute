import type { AuthBindings } from '../features/auth';

export type AppVariables = {
  requestId: string;
};

export type AppEnv = {
  Bindings: Env & AuthBindings;
  Variables: AppVariables;
};
