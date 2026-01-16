'use client';

import React from 'react';
import { CheckCircle2, XCircle, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExecutionStepper } from './execution-stepper';
import { useTransactionStore, type UIStepStatus } from '@/lib/stores/transaction-store';
import { cn } from '@/lib/utils';

/**
 * Explorer URLs by chain ID
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
  998: 'https://explorer.hyperliquid-testnet.xyz/tx/', // HyperEVM Testnet
  999: 'https://explorer.hyperliquid.xyz/tx/', // HyperEVM Mainnet
};

/**
 * Get explorer URL for a transaction
 */
function getExplorerUrl(chainId: number | null, txHash: string): string | null {
  if (!chainId || !EXPLORER_URLS[chainId]) {
    return null;
  }
  return `${EXPLORER_URLS[chainId]}${txHash}`;
}

/**
 * Props for ExecutionModal
 */
export interface ExecutionModalProps {
  /** Callback when user clicks "Bridge Again" */
  onBridgeAgain?: () => void;
}

/**
 * Success state content
 */
function SuccessContent({
  txHash,
  receivingTxHash,
  receivedAmount,
  fromChainId,
  toChainId,
  onBridgeAgain,
  onClose,
}: {
  txHash: string | null;
  receivingTxHash: string | null;
  receivedAmount: string | null;
  fromChainId: number | null;
  toChainId: number | null;
  onBridgeAgain?: () => void;
  onClose: () => void;
}) {
  const sourceExplorerUrl = txHash && fromChainId ? getExplorerUrl(fromChainId, txHash) : null;
  const destExplorerUrl = receivingTxHash && toChainId ? getExplorerUrl(toChainId, receivingTxHash) : null;

  return (
    <>
      <DialogBody className="text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        {/* Success message */}
        <h3 className="text-h3 text-text-primary mb-2">Bridge Complete!</h3>
        <p className="text-body text-text-muted mb-6">
          Your assets have been successfully bridged to Hyperliquid.
        </p>

        {/* Amount received */}
        {receivedAmount && (
          <div className="bg-bg-elevated rounded-card p-4 mb-6">
            <p className="text-caption text-text-muted mb-1">Amount Received</p>
            <p className="text-h2 text-text-primary font-mono">
              {receivedAmount} <span className="text-body text-text-muted">USDC</span>
            </p>
          </div>
        )}

        {/* Explorer links */}
        <div className="space-y-3">
          {sourceExplorerUrl && (
            <a
              href={sourceExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-elevated hover:bg-bg-surface transition-colors text-body text-text-primary"
            >
              <span>View Source Transaction</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {destExplorerUrl && (
            <a
              href={destExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-bg-elevated hover:bg-bg-surface transition-colors text-body text-text-primary"
            >
              <span>View on HyperEVM Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </DialogBody>

      <DialogFooter className="flex-col gap-3">
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            onClose();
            onBridgeAgain?.();
          }}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Bridge Again
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={onClose}
        >
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Failed state content
 */
function FailedContent({
  error,
  errorDetails,
  onRetry,
  onClose,
}: {
  error: string | null;
  errorDetails: {
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  } | null;
  onRetry?: () => void;
  onClose: () => void;
}) {
  const canRetry = errorDetails?.recoverable !== false;
  const userMessage = errorDetails?.userMessage || error || 'An error occurred during the bridge transaction.';

  return (
    <>
      <DialogBody className="text-center">
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-error" />
          </div>
        </div>

        {/* Error message */}
        <h3 className="text-h3 text-text-primary mb-2">Transaction Failed</h3>
        <p className="text-body text-text-muted mb-4">
          {userMessage}
        </p>

        {/* Error code */}
        {errorDetails?.code && (
          <div className="bg-bg-elevated rounded-card p-3 mb-6">
            <p className="text-caption text-text-muted font-mono">
              Error Code: {errorDetails.code}
            </p>
          </div>
        )}

        {/* Recovery suggestion */}
        {errorDetails?.recoveryAction && (
          <p className="text-small text-text-muted">
            Suggestion: {getRecoverySuggestion(errorDetails.recoveryAction)}
          </p>
        )}
      </DialogBody>

      <DialogFooter className="flex-col gap-3">
        {canRetry && onRetry && (
          <Button
            className="w-full"
            size="lg"
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Transaction
          </Button>
        )}
        <Button
          variant={canRetry ? 'secondary' : 'primary'}
          className="w-full"
          onClick={onClose}
        >
          {canRetry ? 'Cancel' : 'Close'}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Get user-friendly recovery suggestion
 */
function getRecoverySuggestion(action: string): string {
  switch (action) {
    case 'retry':
      return 'Try the transaction again.';
    case 'add_funds':
      return 'Add more funds to your wallet and try again.';
    case 'increase_slippage':
      return 'Try increasing the slippage tolerance.';
    case 'try_different_amount':
      return 'Try a different amount or token.';
    case 'fetch_new_quote':
      return 'Get a fresh quote and try again.';
    case 'try_again':
      return 'Please try the transaction again.';
    case 'switch_network':
      return 'Switch to the correct network and try again.';
    case 'contact_support':
      return 'If the issue persists, please contact support.';
    default:
      return 'Please try again or contact support if the issue persists.';
  }
}

/**
 * Executing state content
 */
function ExecutingContent({
  steps,
  currentStepIndex,
  progress,
}: {
  steps: UIStepStatus[];
  currentStepIndex: number;
  progress: number;
}) {
  return (
    <DialogBody>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-caption text-text-muted mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-muted transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stepper */}
      <ExecutionStepper steps={steps} currentStepIndex={currentStepIndex} />

      {/* Warning message */}
      <div className="mt-6 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
        <p className="text-caption text-text-muted text-center">
          Please do not close this window while the transaction is in progress.
          This may take a few minutes.
        </p>
      </div>
    </DialogBody>
  );
}

/**
 * Execution Modal Component
 *
 * Displays the progress of a bridge transaction in a modal.
 * Shows different states:
 * - Executing: Shows stepper with progress
 * - Completed: Shows success state with explorer links
 * - Failed: Shows error state with retry option
 *
 * @example
 * ```tsx
 * <ExecutionModal onBridgeAgain={() => reset()} />
 * ```
 */
export function ExecutionModal({ onBridgeAgain }: ExecutionModalProps) {
  const {
    isModalOpen,
    status,
    steps,
    currentStepIndex,
    progress,
    txHash,
    receivingTxHash,
    receivedAmount,
    fromChainId,
    toChainId,
    error,
    errorDetails,
    closeModal,
    reset,
  } = useTransactionStore();

  // Handle close - only allow if not executing
  const handleClose = () => {
    if (status !== 'executing' && status !== 'pending') {
      closeModal();
      if (status === 'completed') {
        reset();
      }
    }
  };

  // Handle retry (for Story 4.5)
  const handleRetry = () => {
    // This will be implemented in Story 4.5
    console.log('Retry requested - will be implemented in Story 4.5');
  };

  // Get modal title based on status
  const getTitle = () => {
    switch (status) {
      case 'pending':
        return 'Preparing Transaction...';
      case 'executing':
        return 'Bridging in Progress';
      case 'completed':
        return 'Bridge Complete';
      case 'failed':
        return 'Transaction Failed';
      default:
        return 'Bridge Transaction';
    }
  };

  // Determine if modal can be closed
  const canClose = status !== 'executing' && status !== 'pending';

  return (
    <Dialog open={isModalOpen} onOpenChange={canClose ? closeModal : () => {}}>
      <DialogContent
        className="max-w-lg"
        onClose={canClose ? handleClose : undefined}
        showCloseButton={canClose}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {/* Render content based on status */}
        {(status === 'executing' || status === 'pending') && (
          <ExecutingContent
            steps={steps}
            currentStepIndex={currentStepIndex}
            progress={progress}
          />
        )}

        {status === 'completed' && (
          <SuccessContent
            txHash={txHash}
            receivingTxHash={receivingTxHash}
            receivedAmount={receivedAmount}
            fromChainId={fromChainId}
            toChainId={toChainId}
            onBridgeAgain={onBridgeAgain}
            onClose={handleClose}
          />
        )}

        {status === 'failed' && (
          <FailedContent
            error={error}
            errorDetails={errorDetails}
            onRetry={handleRetry}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExecutionModal;
