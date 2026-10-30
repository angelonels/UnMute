import { render, screen } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '../../../test/query-wrapper';
import { HomePage } from './home-page';

vi.stubGlobal(
  'fetch',
  vi.fn(async () => Response.json(null)),
);

describe('HomePage', () => {
  it('renders the sign-in action after the session resolves', async () => {
    const root = createRootRoute({ component: Outlet });
    const home = createRoute({ getParentRoute: () => root, path: '/', component: HomePage });
    const router = createRouter({
      routeTree: root.addChildren([home]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
      scrollRestoration: false,
    });
    render(<RouterProvider router={router} />, { wrapper: createQueryWrapper() });
    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
  });
});
