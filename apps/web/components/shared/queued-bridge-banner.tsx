'use client';

import { useState, useCallback } from 'react';
import { Clock, WifiOff, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePendingBridge } from '@/lib/hooks/use-pending-bridge';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import type { PendingBridge } from '@/lib/storage/pending-bridges';

interface QueuedBridgeBannerProps {
  /** Optional wallet address to filter bridges */
  walletAddress?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Format relative time since bridge was queued
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Format amount for display
 */
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(6);
}

/**
 * Single Queued Bridge Item
 */
function QueuedBridgeItem({
  bridge,
  onRemove,
}: {
  bridge: PendingBridge;
  onRemove: (id: string) => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(bridge.id);
    setIsRemoving(false);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'px-3 py-2',
        'bg-bg-surface/50 rounded-lg',
        'border border-border-subtle'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-accent-primary/10">
          <Clock className="w-4 h-4 text-accent-primary" />
        </div>

        <div className="min-w-0">
          <p className="text-small font-medium text-text-primary truncate">
            {formatAmount(bridge.amount)} {bridge.sourceTokenSymbol}
          </p>
          <p className="text-caption text-text-secondary truncate">
            {bridge.sourceChainName} {bridge.autoDeposit ? '+ deposit' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-caption text-text-muted">
          {formatTimeAgo(bridge.createdAt)}
        </span>

        <button
          onClick={handleRemove}
          disabled={isRemoving}
          aria-label="Remove queued bridge"
          className={cn(
            'p-1.5 rounded-lg',
            'text-text-muted hover:text-error',
            'hover:bg-error/10',
            'transition-all duration-standard',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Queued Bridge Banner Component
 *
 * Displays a banner when there are bridges queued for offline execution.
 * Shows:
 * - "Bridge queued - will execute when online" message
 * - Number of pending bridges
 * - Expandable list of queued bridges
 * - Option to remove individual bridges
 *
 * Story 11.4 Implementation
 *
 * @example
 * ```tsx
 * // In your layout or bridge page
 * <QueuedBridgeBanner walletAddress={address} />
 * ```
 */
export function QueuedBridgeBanner({
  walletAddress,
  className,
}: QueuedBridgeBannerProps) {
  const { pendingBridges, hasPending, pendingCount, removePendingBridge, clearPending } =
    usePendingBridge(walletAddress);
  const isOnline = useOnlineStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Don't render if no pending bridges or dismissed
  if (!hasPending || isDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Positioning - fixed at bottom right on desktop, bottom on mobile
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40',
        // Layout
        'flex flex-col',
        // Styling - using design system colors
        'bg-bg-elevated border border-border-default rounded-card',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]',
        // Animation
        'animate-slide-up',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg',
            isOnline ? 'bg-success/10' : 'bg-warning/10'
          )}
        >
          {isOnline ? (
            <Clock className="w-5 h-5 text-success" />
          ) : (
            <WifiOff className="w-5 h-5 text-warning" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-small font-medium text-text-primary">
            {pendingCount === 1
              ? 'Bridge Queued'
              : `${pendingCount} Bridges Queued`}
          </p>
          <p className="text-caption text-text-secondary">
            {isOnline
              ? 'Ready to execute - open app to continue'
              : 'Will execute when online'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpand}
            aria-label={isExpanded ? 'Collapse queue' : 'Expand queue'}
            aria-expanded={isExpanded}
            className={cn(
              'p-1.5 rounded-lg',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-bg-surface',
              'transition-all duration-standard'
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className={cn(
              'p-1.5 rounded-lg',
              'text-text-secondary hover:text-text-primary',
              'hover:bg-bg-surface',
              'transition-all duration-standard'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Queue List */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
            {pendingBridges.map((bridge) => (
              <QueuedBridgeItem
                key={bridge.id}
                bridge={bridge}
                onRemove={removePendingBridge}
              />
            ))}
          </div>

          {/* Clear All Button */}
          {pendingCount > 1 && (
            <button
              onClick={clearPending}
              className={cn(
                'w-full py-2 rounded-lg',
                'text-caption font-medium text-error',
                'bg-error/5 hover:bg-error/10',
                'border border-error/20',
                'transition-all duration-standard'
              )}
            >
              Clear All Queued Bridges
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline Queued Status Component
 *
 * A smaller inline component to show in the bridge form when offline
 * and a bridge has been queued.
 */
export function QueuedBridgeStatus({
  className,
}: {
  className?: string;
}) {
  const { hasPending, pendingCount } = usePendingBridge();
  const isOnline = useOnlineStatus();

  // Only show when offline and have pending bridges
  if (isOnline || !hasPending) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        'px-4 py-3',
        'rounded-card',
        'bg-accent-primary/5 border border-accent-primary/20',
        'text-small text-accent-primary',
        className
      )}
    >
      <Clock className="w-4 h-4" />
      <span>
        {pendingCount === 1
          ? 'Bridge queued - will execute when online'
          : `${pendingCount} bridges queued - will execute when online`}
      </span>
    </div>
  );
}

export default QueuedBridgeBanner;
