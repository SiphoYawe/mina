'use client';

import React, { useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2, ExternalLink, ChevronRight, History } from 'lucide-react';
import { useTransactionHistory } from '@/lib/hooks/use-transaction-history';
import type { StoredTransaction, StoredTransactionStatus } from '@/lib/storage/transactions';
import { cn } from '@/lib/utils';

/**
 * Get explorer URL for a transaction
 */
const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  250: 'https://ftmscan.com/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/',
  42161: 'https://arbiscan.io/tx/',
  43114: 'https://snowtrace.io/tx/',
  59144: 'https://lineascan.build/tx/',
  534352: 'https://scrollscan.com/tx/',
  998: 'https://explorer.hyperliquid-testnet.xyz/tx/',
  999: 'https://explorer.hyperliquid.xyz/tx/',
};

function getExplorerUrl(chainId: number, txHash: string): string | null {
  const baseUrl = EXPLORER_URLS[chainId];
  return baseUrl ? `${baseUrl}${txHash}` : null;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

/**
 * Get status icon component
 */
function StatusIcon({ status }: { status: StoredTransactionStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-error" />;
    case 'executing':
      return <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />;
    case 'pending':
    default:
      return <Clock className="w-4 h-4 text-warning" />;
  }
}

/**
 * Get status text
 */
function getStatusText(status: StoredTransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'executing':
      return 'In Progress';
    case 'pending':
    default:
      return 'Pending';
  }
}

/**
 * Transaction item component
 */
function TransactionItem({
  transaction,
  onClick,
}: {
  transaction: StoredTransaction;
  onClick: () => void;
}) {
  const explorerUrl = transaction.txHash
    ? getExplorerUrl(transaction.fromChainId, transaction.txHash)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg',
        'bg-bg-surface hover:bg-bg-elevated border border-border-subtle',
        'transition-all duration-200',
        'text-left'
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        <StatusIcon status={transaction.status} />
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0">
        {/* Token pair and amount */}
        <div className="flex items-center gap-2">
          <span className="text-body font-medium text-text-primary truncate">
            {transaction.fromAmount} {transaction.fromToken.symbol}
          </span>
          <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-body text-text-muted truncate">
            {transaction.toToken.symbol}
          </span>
        </div>

        {/* Chain path and time */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-caption text-text-muted truncate">
            {transaction.fromChainName} → {transaction.toChainName}
          </span>
          <span className="text-caption text-text-muted">•</span>
          <span className="text-caption text-text-muted">
            {formatRelativeTime(transaction.createdAt)}
          </span>
        </div>
      </div>

      {/* Status and Explorer Link */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'text-caption px-2 py-0.5 rounded-full',
            transaction.status === 'completed' && 'bg-success/10 text-success',
            transaction.status === 'failed' && 'bg-error/10 text-error',
            transaction.status === 'executing' && 'bg-accent-primary/10 text-accent-primary',
            transaction.status === 'pending' && 'bg-warning/10 text-warning'
          )}
        >
          {getStatusText(transaction.status)}
        </span>

        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-bg-elevated transition-colors"
            title="View on Explorer"
          >
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
        )}
      </div>
    </button>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-elevated flex items-center justify-center">
        <History className="w-6 h-6 text-text-muted" />
      </div>
      <p className="text-body text-text-muted">No recent transactions</p>
      <p className="text-caption text-text-muted mt-1">
        Your bridge transactions will appear here
      </p>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-bg-elevated animate-pulse"
        />
      ))}
    </div>
  );
}

/**
 * Recent Transactions Component
 *
 * Displays a list of recent bridge transactions with status and details.
 * Automatically resumes polling for pending transactions on mount.
 *
 * @example
 * ```tsx
 * <RecentTransactions maxItems={5} />
 * ```
 */
export function RecentTransactions({
  maxItems = 5,
  className,
}: {
  maxItems?: number;
  className?: string;
}) {
  const {
    transactions,
    isLoading,
    isRestoringPending,
    resumePending,
    viewTransaction,
  } = useTransactionHistory();

  // Resume polling for pending transactions on mount
  useEffect(() => {
    resumePending();
  }, [resumePending]);

  // Show only limited items
  const displayedTransactions = transactions.slice(0, maxItems);

  if (isLoading) {
    return (
      <div className={className}>
        <h3 className="text-small font-medium text-text-secondary mb-3">
          Recent Transactions
        </h3>
        <LoadingState />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={className}>
        <h3 className="text-small font-medium text-text-secondary mb-3">
          Recent Transactions
        </h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-small font-medium text-text-secondary">
          Recent Transactions
        </h3>
        {isRestoringPending && (
          <div className="flex items-center gap-1 text-caption text-text-muted">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {displayedTransactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onClick={() => viewTransaction(tx)}
          />
        ))}
      </div>

      {transactions.length > maxItems && (
        <button
          className="w-full mt-3 py-2 text-caption text-accent-primary hover:text-accent-hover transition-colors"
        >
          View all {transactions.length} transactions
        </button>
      )}
    </div>
  );
}

export default RecentTransactions;
