import { AuthPage, SessionPending, useAuthSession } from '../../auth';
import { WorkspacePage } from '../../workspace';

export function HomePage({ authError = false }: { authError?: boolean }) {
  const { data: session, initialPending } = useAuthSession();
  if (initialPending) return <SessionPending />;
  return session ? <WorkspacePage user={session.user} /> : <AuthPage authError={authError} />;
}
