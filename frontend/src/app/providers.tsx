import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { LazyMotion, MotionConfig, domMax } from 'motion/react';
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LazyMotion features={domMax}>
        <MotionConfig
          reducedMotion="user"
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        >
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </MotionConfig>
      </LazyMotion>
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
