'use client';

import { Card, CardContent } from '@/components/ui/card';
import { SdkStatus } from '@/components/sdk-status';
import { ConnectButton } from '@/components/wallet/connect-button';
import { BridgeForm, RecentTransactions } from '@/components/bridge';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { Spotlight } from '@/components/ui/spotlight';
import { cn } from '@/lib/utils';

/**
 * Issue 7 fix: Fallback UI for BridgeForm error boundary
 * Uses FallbackProps type from react-error-boundary for correct typing
 */
function BridgeFormErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-error" />
          <div>
            <h3 className="text-h3 text-text-primary mb-2">Something went wrong</h3>
            <p className="text-body text-text-muted mb-4">
              The bridge form encountered an error. Please try again.
            </p>
            <p className="text-caption text-text-muted font-mono bg-bg-elevated p-2 rounded mb-4">
              {errorMessage}
            </p>
          </div>
          <Button onClick={resetErrorBoundary} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg-base overflow-hidden">
      {/* Animated Grid Background */}
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.08}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12'
        )}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-border-subtle">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/mina-logo.svg" alt="Mina" className="h-8" />
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 text-center">
        {/* Spotlight Effect */}
        <Spotlight />

        <h1 className="relative z-20 text-h1 text-text-primary mb-4">
          Bridge to <span className="text-gradient">Hyperliquid</span>
        </h1>
        <p className="relative z-20 text-body text-text-secondary max-w-2xl mx-auto mb-8">
          Seamlessly bridge assets from 40+ chains directly to your Hyperliquid trading account.
          One click, zero hassle.
        </p>

        {/* Issue 7 fix: Bridge Form wrapped with Error Boundary */}
        <ErrorBoundary FallbackComponent={BridgeFormErrorFallback}>
          <BridgeForm />
        </ErrorBoundary>

        {/* Recent Transactions */}
        <div className="max-w-md mx-auto mt-8">
          <RecentTransactions maxItems={5} />
        </div>

        {/* SDK Status */}
        <SdkStatus />
      </section>

    </main>
  );
}
