import { LinkProvider } from '@astryxdesign/core/Link';
import { Theme } from '@astryxdesign/core/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AstryxRouterLink } from './lib/astryx-link';
import { unmuteTheme } from '../theme/unmute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Theme theme={unmuteTheme} mode="dark">
      <LinkProvider component={AstryxRouterLink}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster theme="dark" richColors />
        </QueryClientProvider>
      </LinkProvider>
    </Theme>
  );
}

export function RootLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
