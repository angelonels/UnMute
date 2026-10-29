import { authClient } from '../../../api/auth-client';
import { AuthPage, SessionPending } from '../../auth';
import { WorkspacePage } from '../../workspace';

export function HomePage({ authError = false }: { authError?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <SessionPending />;
  return session ? <WorkspacePage user={session.user} /> : <AuthPage authError={authError} />;
}
