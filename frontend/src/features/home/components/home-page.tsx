import { authClient } from '../../../api/auth-client';
import { AuthPage } from '../../auth';
import { WorkspacePage } from '../../workspace';

export function HomePage({ authError = false }: { authError?: boolean }) {
  const { data: session } = authClient.useSession();
  return session ? <WorkspacePage user={session.user} /> : <AuthPage authError={authError} />;
}
