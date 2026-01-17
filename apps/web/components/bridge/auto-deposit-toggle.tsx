'use client';

import React, { useCallback, useId } from 'react';
import { Info, ArrowUpRight, Zap, CheckCircle2 } from 'lucide-react';
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
 * - Premium glassmorphic design
 * - Clear visual state indication
 * - Smooth transitions between states
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
        'relative overflow-hidden rounded-xl transition-all duration-300',
        enabled ? 'bg-gradient-to-r from-success/[0.08] via-success/[0.05] to-transparent' : 'bg-bg-surface/40',
        className
      )}
    >
      {/* Subtle border glow when enabled */}
      <div className={cn(
        'absolute inset-0 rounded-xl transition-opacity duration-300',
        enabled
          ? 'opacity-100 ring-1 ring-success/30'
          : 'opacity-100 ring-1 ring-border-subtle/50'
      )} />

      <div className="relative p-4">
        {/* Main Toggle Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Icon with conditional styling */}
            <div className={cn(
              'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
              enabled
                ? 'bg-success/15 shadow-[0_0_20px_rgba(14,204,131,0.15)]'
                : 'bg-bg-elevated/80'
            )}>
              {enabled ? (
                <Zap className="w-5 h-5 text-success" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-text-muted" />
              )}
              {/* Pulse effect when enabled */}
              {enabled && (
                <div className="absolute inset-0 rounded-xl bg-success/20 animate-ping opacity-30" style={{ animationDuration: '2s' }} />
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor={id}
                className="text-small font-semibold text-text-primary cursor-pointer"
              >
                Auto-deposit to Hyperliquid
              </label>
              <span className={cn(
                'text-caption transition-colors duration-200',
                enabled ? 'text-success/80' : 'text-text-muted'
              )}>
                {enabled ? 'Instant trading access' : 'Manual deposit required'}
              </span>
            </div>
          </div>

          <Switch
            id={id}
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={disabled}
            aria-label="Toggle auto-deposit to Hyperliquid"
          />
        </div>

        {/* Status Badge - Shows when enabled and included in quote */}
        {enabled && includesAutoDeposit && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-caption text-success font-medium">Auto-deposit included in quote</span>
          </div>
        )}

        {/* Manual Deposit Notice - Shows when disabled */}
        {!enabled && (
          <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-bg-elevated/60 border border-border-subtle/50">
            <Info className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
            <p className="text-caption text-text-secondary leading-relaxed">
              Funds arrive on HyperEVM. Deposit to Hyperliquid L1 separately to start trading.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoDepositToggle;
