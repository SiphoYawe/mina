'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, type State } from 'wagmi';
import { wagmiConfig, initializeAppKit } from '@/lib/config/wagmi';
import { AlertTriangle } from 'lucide-react';

interface WalletProviderProps {
  children: ReactNode;
  initialState?: State;
}

// WALLET-001: Error banner component for missing project ID
function MissingProjectIdError() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-elevated border border-error/30 rounded-card p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-error" />
        </div>
        <h2 className="text-h4 text-text-primary mb-2">Wallet Configuration Error</h2>
        <p className="text-small text-text-secondary mb-4">
          The wallet connection is not configured properly. Please contact support or try again later.
        </p>
        <div className="bg-bg-surface rounded-lg p-3 text-left">
          <p className="text-caption text-text-muted font-mono">
            Missing: NEXT_PUBLIC_REOWN_PROJECT_ID
          </p>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-4 text-caption text-text-muted">
            Add this environment variable to your .env.local file to enable wallet connections.
          </p>
        )}
      </div>
    </div>
  );
}

export function WalletProvider({ children, initialState }: WalletProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasProjectId, setHasProjectId] = useState(true);

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
    // WALLET-001: Check for project ID and show error UI if missing
    const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
    if (!projectId) {
      setHasProjectId(false);
      setIsReady(true);
      return;
    }

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

  // WALLET-001: Show error UI if project ID is missing
  if (!hasProjectId) {
    return <MissingProjectIdError />;
  }

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
