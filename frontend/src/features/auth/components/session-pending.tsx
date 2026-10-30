import { PageLoading } from '../../../components/page-loading';

/** Session resolution must not briefly expose either signed-in or signed-out content. */
export function SessionPending() {
  return <PageLoading label="Loading account" />;
}
