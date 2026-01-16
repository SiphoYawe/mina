'use client';

import React, { useState, useCallback } from 'react';
import {
  Clock,
  Layers,
  ChevronDown,
  AlertTriangle,
  Fuel,
  ArrowRightLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quote, Token } from '@siphoyawe/mina-sdk';

interface QuoteDisplayProps {
  /** The quote data to display */
  quote: Quote | null;
  /** Whether quote is being loaded */
  isLoading: boolean;
  /** Error message if quote fetch failed */
  error: Error | null;
  /** Additional class names */
  className?: string;
}

/**
 * Formats a token amount with proper decimals
 */
function formatTokenAmount(amount: string, decimals: number, maxDecimals = 6): string {
  try {
    // Handle the raw amount (in smallest unit)
    const paddedAmount = amount.padStart(decimals + 1, '0');
    const insertPosition = paddedAmount.length - decimals;
    const whole = paddedAmount.slice(0, insertPosition) || '0';
    const fraction = paddedAmount.slice(insertPosition);

    // Remove trailing zeros and limit decimals
    const trimmedFraction = fraction.slice(0, maxDecimals).replace(/0+$/, '');

    if (trimmedFraction) {
      // Format whole number with commas
      const formattedWhole = parseInt(whole, 10).toLocaleString();
      return `${formattedWhole}.${trimmedFraction}`;
    }
    return parseInt(whole, 10).toLocaleString();
  } catch {
    return '0';
  }
}

/**
 * Formats USD amount with proper symbol and decimals
 */
function formatUsd(amount: number): string {
  if (amount < 0.01 && amount > 0) {
    return '<$0.01';
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats time in seconds to human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `~${minutes}m`;
  }
  return `~${minutes}m ${remainingSeconds}s`;
}

/**
 * Skeleton loader for quote display
 */
function QuoteSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Output amount skeleton */}
      <div className="p-4 rounded-xl bg-bg-elevated/50 border border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-border-subtle rounded" />
            <div className="h-7 w-32 bg-border-default rounded" />
          </div>
          <div className="h-8 w-8 bg-border-subtle rounded-full" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="flex items-center justify-between px-2">
        <div className="h-4 w-16 bg-border-subtle rounded" />
        <div className="h-4 w-12 bg-border-subtle rounded" />
        <div className="h-4 w-14 bg-border-subtle rounded" />
      </div>

      {/* Fee breakdown trigger skeleton */}
      <div className="h-10 w-full bg-border-subtle/50 rounded-lg" />
    </div>
  );
}

/**
 * Price impact indicator with severity colors
 */
function PriceImpactBadge({
  priceImpact,
  severity,
}: {
  priceImpact: number;
  severity: 'low' | 'medium' | 'high' | 'very_high';
}) {
  const impactPercent = (priceImpact * 100).toFixed(2);

  const severityConfig = {
    low: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
    },
    medium: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
    },
    high: {
      bg: 'bg-error/10',
      text: 'text-error',
      border: 'border-error/20',
    },
    very_high: {
      bg: 'bg-error/20',
      text: 'text-error',
      border: 'border-error/30',
    },
  };

  const config = severityConfig[severity];
  const showWarning = severity === 'high' || severity === 'very_high';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-caption border',
        config.bg,
        config.text,
        config.border
      )}
    >
      {showWarning && <AlertTriangle className="w-3 h-3" />}
      <span>{impactPercent}%</span>
    </div>
  );
}

/**
 * Token display with logo and symbol
 */
function TokenBadge({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-2">
      {token.logoUrl ? (
        <img
          src={token.logoUrl}
          alt={token.symbol}
          className="w-6 h-6 rounded-full ring-1 ring-border-subtle"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center">
          <span className="text-[10px] font-bold text-bg-base">
            {token.symbol.charAt(0)}
          </span>
        </div>
      )}
      <span className="text-body font-medium text-text-primary">{token.symbol}</span>
    </div>
  );
}

/**
 * Expandable fee breakdown section
 */
function FeeBreakdown({
  fees,
  priceImpact,
  severity,
}: {
  fees: Quote['fees'];
  priceImpact: number;
  severity: 'low' | 'medium' | 'high' | 'very_high';
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const feeItems = [
    {
      label: 'Gas Cost',
      amount: fees.gasUsd,
      icon: Fuel,
      detail: fees.gasFee
        ? `${formatTokenAmount(fees.gasFee.amount, fees.gasFee.token.decimals)} ${fees.gasFee.token.symbol}`
        : null,
    },
    {
      label: 'Bridge Fee',
      amount: fees.bridgeFeeUsd,
      icon: ArrowRightLeft,
      detail: fees.bridgeFee
        ? `${formatTokenAmount(fees.bridgeFee.amount, fees.bridgeFee.token.decimals)} ${fees.bridgeFee.token.symbol}`
        : null,
    },
    {
      label: 'Protocol Fee',
      amount: fees.protocolFeeUsd,
      icon: Sparkles,
      detail: fees.protocolFee
        ? `${formatTokenAmount(fees.protocolFee.amount, fees.protocolFee.token.decimals)} ${fees.protocolFee.token.symbol}`
        : null,
    },
  ];

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      {/* Trigger */}
      <button
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="fee-breakdown-content"
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'bg-bg-surface/50 hover:bg-bg-elevated/50 transition-colors duration-micro',
          'text-small text-text-secondary'
        )}
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          View fee breakdown
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-text-muted transition-transform duration-standard',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        id="fee-breakdown-content"
        className={cn(
          'grid transition-all duration-standard ease-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 space-y-3 border-t border-border-subtle bg-bg-base/50">
            {feeItems.map(({ label, amount, icon: Icon, detail }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-muted">
                  <Icon className="w-4 h-4" />
                  <span className="text-small">{label}</span>
                </div>
                <div className="text-right">
                  <span className="text-small text-text-primary">{formatUsd(amount)}</span>
                  {detail && (
                    <p className="text-caption text-text-muted">{detail}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Price Impact row */}
            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-text-muted">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-small">Price Impact</span>
              </div>
              <PriceImpactBadge priceImpact={priceImpact} severity={severity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Quote Display Component
 *
 * Displays bridge quote information including:
 * - Expected output amount with token
 * - Total fees, estimated time, and route steps
 * - Expandable fee breakdown
 * - Price impact warnings
 */
export function QuoteDisplay({
  quote,
  isLoading,
  error,
  className,
}: QuoteDisplayProps) {
  // Show nothing if no quote and not loading
  if (!quote && !isLoading && !error) {
    return null;
  }

  // Show skeleton while loading
  if (isLoading && !quote) {
    return (
      <div className={cn('space-y-4', className)}>
        <QuoteSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className={cn(
          'p-4 rounded-xl border border-error/30 bg-error/5',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-small font-medium text-error">Failed to get quote</p>
            <p className="text-caption text-text-muted">
              {error.message || 'Please try again or adjust your parameters.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No quote available
  if (!quote) {
    return null;
  }

  const outputAmount = formatTokenAmount(quote.toAmount, quote.toToken.decimals);
  const showHighImpactWarning = quote.highImpact;

  return (
    <div className={cn('space-y-4 relative', className)}>
      {/* High price impact warning banner */}
      {showHighImpactWarning && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-warning/30 bg-warning/5">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-small text-warning">
            High price impact! You may receive significantly less than expected.
          </p>
        </div>
      )}

      {/* Output amount card */}
      <div
        className={cn(
          'p-4 rounded-xl border transition-all duration-standard',
          showHighImpactWarning
            ? 'border-warning/30 bg-warning/5'
            : 'border-border-subtle bg-bg-elevated/30'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-caption text-text-muted">You&apos;ll receive</p>
            <p className="text-h3 font-semibold text-text-primary tracking-tight">
              {outputAmount}
            </p>
          </div>
          <TokenBadge token={quote.toToken} />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex items-center justify-between px-2 text-small">
        <div className="flex items-center gap-1.5 text-text-muted">
          <span className="text-text-secondary font-medium">
            {formatUsd(quote.fees.totalUsd)}
          </span>
          <span>fees</span>
        </div>

        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(quote.estimatedTime)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-text-muted">
          <Layers className="w-3.5 h-3.5" />
          <span>
            {quote.steps.length} {quote.steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>
      </div>

      {/* Fee breakdown */}
      <FeeBreakdown
        fees={quote.fees}
        priceImpact={quote.priceImpact}
        severity={quote.impactSeverity}
      />

      {/* Loading overlay when refetching */}
      {isLoading && quote && (
        <div className="absolute inset-0 bg-bg-base/50 rounded-xl flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default QuoteDisplay;
