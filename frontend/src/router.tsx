import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { PageLoading } from './components/page-loading';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingComponent: PageLoading,
  defaultPendingMs: 150,
  defaultPendingMinMs: 0,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
