import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { unmuteTheme } from '../theme/unmute';

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <Theme theme={unmuteTheme} mode="dark">
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Theme>
    );
  };
}
