import { useState } from 'react';
import { authClient } from '../../api/auth-client';

/** Initial identity stays neutral; a retry retains the already resolved recovery surface. */
export function useAuthSession() {
  const session = authClient.useSession();
  const [resolved, setResolved] = useState(false);
  if (!session.isPending && !resolved) setResolved(true);
  return { ...session, initialPending: session.isPending && !resolved };
}
