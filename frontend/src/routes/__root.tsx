import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '../shared/providers';

export const Route = createRootRoute({
  component: RootLayout,
});
