'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Layers,
  ChevronDown,
  AlertTriangle,
  Fuel,
  ArrowRightLeft,
  Sparkles,
  Info,
  WifiOff,
  Calculator,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import type { Quote, Token } from '@siphoyawe/mina-sdk';

interface QuoteDisplayProps {
  /** The quote data to display */
  quote: Quote | null;
  /** Whether quote is being loaded */
  isLoading: boolean;
  /** Error message if quote fetch failed */
  error: Error | null;
  /** Current route preference */
  routePreference?: 'recommended' | 'fastest' | 'cheapest';
  /** Callback when route preference changes */
  onRoutePreferenceChange?: (preference: 'recommended' | 'fastest' | 'cheapest') => void;
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
 * Enhanced quote calculation loading state
 * Shows animated progress with meaningful visual feedback
 */
function QuoteLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6"
    >
      {/* Main loading card */}
      <div className="relative overflow-hidden rounded-xl border-2 border-accent-primary/30 bg-gradient-to-br from-bg-elevated/80 via-bg-surface/60 to-bg-elevated/80 p-6">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/5 to-accent-primary/0 animate-[shimmer_2s_ease-in-out_infinite]" />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center py-4">
          {/* Animated calculator icon */}
          <div className="relative mb-4">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-muted/20 flex items-center justify-center shadow-lg shadow-accent-primary/10"
            >
              <Calculator className="w-8 h-8 text-accent-primary" />
            </motion.div>

            {/* Orbiting dots */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-primary" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-muted" />
            </motion.div>
          </div>

          {/* Status text */}
          <div className="text-center space-y-1.5">
            <p className="text-body font-semibold text-text-primary">Calculating best route</p>
            <p className="text-small text-text-muted">Finding optimal fees and execution</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2 mt-5">
            {['Analyzing', 'Routing', 'Optimizing'].map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface/80 border border-border-subtle"
              >
                <Zap className="w-3 h-3 text-accent-primary" />
                <span className="text-caption text-text-secondary">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </motion.div>
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
 * Token display with logo and symbol - Enhanced premium version
 */
function TokenBadge({ token }: { token: Token }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-bg-surface/80 border border-border-subtle/50 backdrop-blur-sm">
      <div className="relative">
        {token.logoUrl ? (
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="w-7 h-7 rounded-full ring-2 ring-accent-primary/20"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <span className="text-xs font-bold text-bg-base">
              {token.symbol.charAt(0)}
            </span>
          </div>
        )}
        {/* Subtle glow behind token */}
        <div className="absolute inset-0 rounded-full bg-accent-primary/20 blur-sm -z-10" />
      </div>
      <span className="text-body font-semibold text-text-primary">{token.symbol}</span>
    </div>
  );
}

/**
 * Inline route preference selector
 * Allows quick switching between recommended, fastest, and cheapest routes
 */
function RoutePreferenceSelector({
  value,
  onChange,
  isLoading,
}: {
  value: 'recommended' | 'fastest' | 'cheapest';
  onChange: (preference: 'recommended' | 'fastest' | 'cheapest') => void;
  isLoading?: boolean;
}) {
  const options = [
    { value: 'recommended' as const, label: 'Best', icon: Sparkles },
    { value: 'fastest' as const, label: 'Fast', icon: Zap },
    { value: 'cheapest' as const, label: 'Cheap', icon: Fuel },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-surface/60 border border-border-subtle/50">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-small font-medium transition-all",
              isSelected
                ? "bg-accent-primary/20 text-accent-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
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
 * Offline Quote Message Component
 * Displays when user is offline and trying to get quotes
 */
function OfflineQuoteMessage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        'px-4 py-3',
        'rounded-card',
        'bg-bg-elevated border border-border-subtle',
        'text-small text-text-secondary',
        className
      )}
    >
      <WifiOff className="w-4 h-4 text-warning" />
      <span>Offline - connect to get quotes</span>
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
 * - Offline state message when disconnected
 */
export function QuoteDisplay({
  quote,
  isLoading,
  error,
  routePreference = 'recommended',
  onRoutePreferenceChange,
  className,
}: QuoteDisplayProps) {
  const isOnline = useOnlineStatus();

  // Show offline message when not connected
  if (!isOnline) {
    return <OfflineQuoteMessage className={className} />;
  }

  // Show nothing if no quote and not loading
  if (!quote && !isLoading && !error) {
    return null;
  }

  // Show enhanced loading state while calculating
  if (isLoading && !quote) {
    return (
      <div className={cn('space-y-4', className)}>
        <QuoteLoadingState />
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
    <div className={cn('space-y-4 relative mb-10', className)}>
      {/* High price impact warning banner */}
      {showHighImpactWarning && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-warning/30 bg-warning/5">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <p className="text-small text-warning">
            High price impact! You may receive significantly less than expected.
          </p>
        </div>
      )}

      {/* Output amount card - Premium design with glow */}
      <div className="relative group">
        {/* Glow effect behind card */}
        {!showHighImpactWarning && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-success/20 via-accent-primary/15 to-success/20 rounded-2xl blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
        )}

        <div
          className={cn(
            'relative p-5 rounded-xl border-2 transition-all duration-standard backdrop-blur-sm',
            showHighImpactWarning
              ? 'border-warning/40 bg-warning/5'
              : 'border-success/30 bg-gradient-to-br from-bg-elevated/60 via-bg-surface/40 to-bg-elevated/60'
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-caption text-text-muted uppercase tracking-wider font-medium">You&apos;ll receive</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
                  {outputAmount}
                </p>
              </div>
            </div>
            <TokenBadge token={quote.toToken} />
          </div>
        </div>
      </div>

      {/* Route preference selector - Quick switch between routes */}
      {onRoutePreferenceChange && (
        <div className="flex items-center justify-center">
          <RoutePreferenceSelector
            value={routePreference}
            onChange={onRoutePreferenceChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Quick stats row - Premium pill badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface/60 border border-border-subtle/50 backdrop-blur-sm">
          <span className="text-success font-semibold text-small">
            {formatUsd(quote.fees.totalUsd)}
          </span>
          <span className="text-text-muted text-caption">fees</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface/60 border border-border-subtle/50 backdrop-blur-sm">
          <Clock className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-text-primary font-medium text-small">{formatTime(quote.estimatedTime)}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-surface/60 border border-border-subtle/50 backdrop-blur-sm">
          <Layers className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-text-primary font-medium text-small">
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
