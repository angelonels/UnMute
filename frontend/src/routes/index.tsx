import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '../features/home';

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error === 'oauth' ? 'oauth' : undefined,
  }),
  component: IndexRoute,
});

function IndexRoute() {
  const { error } = Route.useSearch();
  return <HomePage authError={error === 'oauth'} />;
}
