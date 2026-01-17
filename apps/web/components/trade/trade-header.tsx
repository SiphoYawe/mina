'use client';

import { Wallet, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ConnectButton } from '@/components/wallet/connect-button';
import { usePearPortfolio, usePearAuth } from '@/lib/pear';
import { cn } from '@/lib/utils';

interface TradeHeaderProps {
  className?: string;
}

export function TradeHeader({ className }: TradeHeaderProps) {
  const { isAuthenticated } = usePearAuth();
  const { data: portfolio, isLoading } = usePearPortfolio();

  // Calculate total balance from portfolio
  const totalBalance = portfolio?.overall?.currentOpenInterest || 0;
  const unrealizedPnl = portfolio?.overall?.unrealizedPnl || 0;
  const isPnlPositive = unrealizedPnl >= 0;

  return (
    <header className={cn('relative z-20 border-b border-border-default/30 bg-bg-base/80 backdrop-blur-3xl backdrop-saturate-150', className)}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Back */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-small hidden sm:inline">Bridge</span>
            </Link>
            <div className="h-6 w-px bg-border-subtle" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
              <span className="text-body font-semibold text-text-primary">
                Trade on Hyperliquid
              </span>
            </div>
          </div>

          {/* Center: Balance (Desktop) */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-text-muted" />
                <div className="text-right">
                  <p className="text-caption text-text-muted">Open Interest</p>
                  <p className="text-body font-mono text-text-primary">
                    {isLoading ? (
                      <span className="animate-pulse">---</span>
                    ) : (
                      `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </p>
                </div>
              </div>
              {unrealizedPnl !== 0 && (
                <div className="text-right">
                  <p className="text-caption text-text-muted">Unrealized P&L</p>
                  <p className={cn(
                    'text-body font-mono',
                    isPnlPositive ? 'text-success' : 'text-error'
                  )}>
                    {isPnlPositive ? '+' : ''}{unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Right: Connect Button */}
          <ConnectButton />
        </div>

        {/* Mobile Balance */}
        {isAuthenticated && (
          <div className="flex md:hidden items-center justify-center gap-6 mt-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-text-muted" />
              <div>
                <p className="text-caption text-text-muted">Open Interest</p>
                <p className="text-body font-mono text-text-primary">
                  {isLoading ? (
                    <span className="animate-pulse">---</span>
                  ) : (
                    `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </p>
              </div>
            </div>
            {unrealizedPnl !== 0 && (
              <div>
                <p className="text-caption text-text-muted">P&L</p>
                <p className={cn(
                  'text-body font-mono',
                  isPnlPositive ? 'text-success' : 'text-error'
                )}>
                  {isPnlPositive ? '+' : ''}${unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
