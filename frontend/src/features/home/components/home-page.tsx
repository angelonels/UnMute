import { AuthPage } from '../../auth';

export function HomePage({ authError = false }: { authError?: boolean }) {
  return <AuthPage authError={authError} />;
}
