'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ConnectButton } from '@/components/wallet/connect-button';
import { BridgeForm, RecentTransactions } from '@/components/bridge';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spotlight } from '@/components/ui/spotlight';
import { motion } from 'motion/react';
import { Footer } from '@/components/shared/footer';

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
    <main className="relative min-h-screen min-h-[100dvh] bg-bg-base overflow-x-hidden overflow-y-auto pb-safe">
      {/* Header */}
      <header className="relative z-20 border-b border-border-default/30 bg-bg-base/80 backdrop-blur-3xl backdrop-saturate-150">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src="/mina-logo.svg" alt="Mina" className="h-8" />
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section - MOBILE-001 Fix: Reduced padding on mobile */}
      <section className="relative z-10 container mx-auto px-4 py-8 sm:py-12 md:py-16 text-center">
        {/* Spotlight Effect */}
        <Spotlight />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-20 text-text-primary mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
        >
          Bridge to
          <br />
          <span className="text-accent-primary">Hyperliquid</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-20 text-body text-text-secondary max-w-md mx-auto mb-6 sm:mb-10 px-2"
        >
          Seamlessly bridge assets from 40+ chains directly to your Hyperliquid trading account.
          One click, zero hassle.
        </motion.p>

        {/* Issue 7 fix: Bridge Form wrapped with Error Boundary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <ErrorBoundary FallbackComponent={BridgeFormErrorFallback}>
            <BridgeForm />
          </ErrorBoundary>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-md mx-auto mt-8"
        >
          <RecentTransactions maxItems={5} />
        </motion.div>

        {/* Footer */}
        <Footer />
      </section>

    </main>
  );
}
