'use client';

import React, { useCallback, useId } from 'react';
import { Info, ArrowUpRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface AutoDepositToggleProps {
  /** Whether auto-deposit is enabled */
  enabled: boolean;
  /** Callback when toggle changes */
  onToggle: (enabled: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Whether the quote includes auto-deposit */
  includesAutoDeposit?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Auto-Deposit Toggle Component
 *
 * Controls whether bridged funds are automatically deposited
 * to Hyperliquid L1 for trading.
 *
 * Features:
 * - Clear explanatory text
 * - Visual indicator for current state
 * - Manual deposit notice when disabled
 */
export function AutoDepositToggle({
  enabled,
  onToggle,
  disabled = false,
  includesAutoDeposit = true,
  className,
}: AutoDepositToggleProps) {
  const id = useId();

  const handleToggle = useCallback(
    (checked: boolean) => {
      onToggle(checked);
    },
    [onToggle]
  );

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-border-subtle bg-bg-surface/30',
        className
      )}
    >
      {/* Toggle Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-accent-primary" />
          </div>
          <label
            htmlFor={id}
            className="text-small font-medium text-text-primary cursor-pointer"
          >
            Auto-deposit to Hyperliquid
          </label>
        </div>
        <Switch
          id={id}
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
          aria-label="Toggle auto-deposit to Hyperliquid"
        />
      </div>

      {/* Explanation Text */}
      <p className="mt-2 text-caption text-text-muted pl-11">
        {enabled
          ? 'Funds will be automatically deposited to your Hyperliquid trading account'
          : 'Funds will arrive on HyperEVM. You can deposit to Hyperliquid later.'}
      </p>

      {/* Manual Deposit Notice */}
      {!enabled && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-bg-elevated/50 border border-border-subtle">
          <Info className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
          <p className="text-caption text-text-secondary">
            After bridging, you&apos;ll need to manually deposit from HyperEVM to
            Hyperliquid L1 to start trading.
          </p>
        </div>
      )}

      {/* Status indicator when auto-deposit is included */}
      {enabled && includesAutoDeposit && (
        <div className="mt-3 flex items-center gap-2 text-caption text-success">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span>Auto-deposit included in quote</span>
        </div>
      )}
    </div>
  );
}

export default AutoDepositToggle;
