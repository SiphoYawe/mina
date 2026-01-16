'use client';

import React from 'react';
import { AlertTriangle, Fuel, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BalanceWarning as BalanceWarningType } from '@siphoyawe/mina-sdk';

interface BalanceWarningProps {
  /** List of balance warnings to display */
  warnings: BalanceWarningType[];
  /** Additional class names */
  className?: string;
}

/**
 * Formats a token amount with proper decimals
 */
function formatTokenAmount(amount: string, decimals: number, maxDecimals = 6): string {
  // Input validation
  if (!amount || typeof amount !== 'string' || decimals < 0) {
    return '0';
  }

  try {
    const paddedAmount = amount.padStart(decimals + 1, '0');
    const insertPosition = paddedAmount.length - decimals;
    const whole = paddedAmount.slice(0, insertPosition) || '0';
    const fraction = paddedAmount.slice(insertPosition);
    const trimmedFraction = fraction.slice(0, maxDecimals).replace(/0+$/, '');

    const wholeNum = parseInt(whole, 10);
    if (Number.isNaN(wholeNum)) {
      return '0';
    }

    if (trimmedFraction) {
      return `${wholeNum.toLocaleString()}.${trimmedFraction}`;
    }
    return wholeNum.toLocaleString();
  } catch {
    return '0';
  }
}

/**
 * Individual warning item
 */
const WarningItem = React.memo(function WarningItem({ warning }: { warning: BalanceWarningType }) {
  const isGasWarning = warning.type === 'INSUFFICIENT_GAS';
  const Icon = isGasWarning ? Fuel : Wallet;

  const shortfallFormatted = formatTokenAmount(
    warning.shortfall,
    warning.token.decimals
  );

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border',
        isGasWarning
          ? 'border-warning/30 bg-warning/5'
          : 'border-error/30 bg-error/5'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isGasWarning ? 'bg-warning/10' : 'bg-error/10'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            isGasWarning ? 'text-warning' : 'text-error'
          )}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p
          className={cn(
            'text-small font-medium',
            isGasWarning ? 'text-warning' : 'text-error'
          )}
        >
          {isGasWarning ? 'Insufficient Gas' : 'Insufficient Balance'}
        </p>
        <p className="text-caption text-text-muted">
          {warning.message || (
            <>
              Need{' '}
              <span className="font-medium text-text-secondary">
                {shortfallFormatted} {warning.token.symbol}
              </span>{' '}
              more to complete this transaction
            </>
          )}
        </p>
      </div>
    </div>
  );
});

/**
 * Balance Warning Component
 *
 * Displays warnings when user has insufficient balance or gas
 * for the bridge transaction.
 *
 * Features:
 * - Different styling for token vs gas warnings
 * - Clear shortfall amounts displayed
 * - Supports multiple warnings
 */
export function BalanceWarning({ warnings, className }: BalanceWarningProps) {
  // Don't render if no warnings
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {warnings.map((warning, index) => (
        <WarningItem key={`${warning.type}-${index}`} warning={warning} />
      ))}
    </div>
  );
}

/**
 * Compact inline warning for use in other contexts
 */
export function BalanceWarningInline({
  warnings,
  className,
}: BalanceWarningProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const hasTokenWarning = warnings.some(
    (w) => w.type === 'INSUFFICIENT_BALANCE'
  );
  const hasGasWarning = warnings.some((w) => w.type === 'INSUFFICIENT_GAS');

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-caption',
        hasTokenWarning
          ? 'bg-error/10 border border-error/20 text-error'
          : 'bg-warning/10 border border-warning/20 text-warning',
        className
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        {hasTokenWarning && hasGasWarning
          ? 'Insufficient balance and gas'
          : hasTokenWarning
            ? 'Insufficient balance'
            : 'Insufficient gas'}
      </span>
    </div>
  );
}

export default BalanceWarning;
