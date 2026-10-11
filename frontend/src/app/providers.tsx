import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

export function RootLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
