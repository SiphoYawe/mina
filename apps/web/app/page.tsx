'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SdkStatus } from '@/components/sdk-status';
import { ConnectButton } from '@/components/wallet/connect-button';
import { BridgeForm } from '@/components/bridge';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <main className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-subtle">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <span className="text-accent-primary font-bold">M</span>
            </div>
            <span className="text-h3 text-gradient">Mina</span>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-h1 text-text-primary mb-4">
          Bridge to <span className="text-gradient">Hyperliquid</span>
        </h1>
        <p className="text-body text-text-secondary max-w-2xl mx-auto mb-8">
          Seamlessly bridge assets from 40+ chains directly to your Hyperliquid trading account.
          One click, zero hassle.
        </p>

        {/* Issue 7 fix: Bridge Form wrapped with Error Boundary */}
        <ErrorBoundary FallbackComponent={BridgeFormErrorFallback}>
          <BridgeForm />
        </ErrorBoundary>

        {/* SDK Status */}
        <SdkStatus />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">40+ Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Bridge from Ethereum, Arbitrum, Optimism, Base, Polygon, and many more.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">Auto Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Funds automatically deposited to your Hyperliquid L1 trading account.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">Best Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Optimal routing via LI.FI for the best rates and lowest fees.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
