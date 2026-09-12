import { LinkProvider } from '@astryxdesign/core/Link';
import { Theme } from '@astryxdesign/core/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AstryxRouterLink } from './lib/astryx-link';

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
    <Theme theme={neutralTheme}>
      <LinkProvider component={AstryxRouterLink}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster theme="system" richColors />
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
