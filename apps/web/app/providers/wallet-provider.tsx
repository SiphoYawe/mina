'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, type State } from 'wagmi';
import { wagmiConfig, initializeAppKit } from '@/lib/config/wagmi';

interface WalletProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function WalletProvider({ children, initialState }: WalletProviderProps) {
  const [isReady, setIsReady] = useState(false);

  // Issue 1 Fix: Create QueryClient inside component using useState to prevent SSR data leaks
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Quote caching: 30 seconds stale, 15 seconds refetch
            staleTime: 30 * 1000,
            refetchInterval: 15 * 1000,
            retry: 2,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize AppKit on client-side only
    initializeAppKit();
    setIsReady(true);
  }, []);

  // Show nothing until AppKit is initialized to prevent hydration mismatch
  if (!isReady) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
