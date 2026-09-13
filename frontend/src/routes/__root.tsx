import { createRootRoute } from '@tanstack/react-router';
import { RootLayout } from '../app/providers';

export const Route = createRootRoute({
  component: RootLayout,
});
