'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UIStepStatus } from '@/lib/stores/transaction-store';

/**
 * Props for the ExecutionStepper component
 */
export interface ExecutionStepperProps {
  /** Array of step statuses from the transaction store */
  steps: UIStepStatus[];
  /** Index of the current active step */
  currentStepIndex: number;
  /** Optional class name */
  className?: string;
}

/**
 * Step indicator icons based on status
 */
function StepIndicator({ status }: { status: UIStepStatus['status'] }) {
  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300';

  switch (status) {
    case 'completed':
      return (
        <div className={cn(baseClasses, 'bg-success text-bg-base')}>
          <Check className="w-4 h-4" />
        </div>
      );
    case 'active':
      return (
        <div className={cn(baseClasses, 'bg-accent-primary text-bg-base animate-pulse')}>
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      );
    case 'failed':
      return (
        <div className={cn(baseClasses, 'bg-error text-bg-base')}>
          <span className="text-small font-bold">!</span>
        </div>
      );
    case 'pending':
    default:
      return (
        <div className={cn(baseClasses, 'bg-bg-elevated border-2 border-border-default text-text-muted')}>
          <span className="text-caption font-medium">&bull;</span>
        </div>
      );
  }
}

/**
 * Get human-readable step title based on step type
 */
function getStepTitle(stepType: string): string {
  switch (stepType) {
    case 'approval':
      return 'Token Approval';
    case 'swap':
      return 'Token Swap';
    case 'bridge':
      return 'Cross-chain Bridge';
    case 'deposit':
      return 'Deposit to Hyperliquid';
    default:
      return 'Processing';
  }
}

/**
 * Get step icon based on step type
 */
function getStepIcon(stepType: string): string {
  switch (stepType) {
    case 'approval':
      return '🔓';
    case 'swap':
      return '🔄';
    case 'bridge':
      return '🌉';
    case 'deposit':
      return '💰';
    default:
      return '⏳';
  }
}

/**
 * Execution Stepper Component
 *
 * Displays a vertical stepper showing the progress of a bridge transaction.
 * Shows 4 possible stages: Approval, Swap, Bridge, Deposit
 *
 * - Completed steps show checkmarks
 * - Active step animates with a pulse
 * - Failed steps show error indicator
 * - Future steps are dimmed
 *
 * @example
 * ```tsx
 * <ExecutionStepper
 *   steps={transactionStore.steps}
 *   currentStepIndex={transactionStore.currentStepIndex}
 * />
 * ```
 */
export function ExecutionStepper({ steps, currentStepIndex, className }: ExecutionStepperProps) {
  if (steps.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary mb-4" />
        <p className="text-body text-text-muted">Preparing transaction...</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isFuture = step.status === 'pending';
        const isActive = step.status === 'active';
        const isCompleted = step.status === 'completed';
        const isFailed = step.status === 'failed';

        return (
          <div key={step.stepId} className="relative">
            {/* Step content */}
            <div
              className={cn(
                'flex items-start gap-4 p-3 rounded-lg transition-all duration-300',
                isFuture && 'opacity-50',
                isActive && 'bg-bg-elevated/50',
                isFailed && 'bg-error/5'
              )}
            >
              {/* Step indicator */}
              <StepIndicator status={step.status} />

              {/* Step details */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStepIcon(step.stepType)}</span>
                  <p className={cn(
                    'text-body font-medium',
                    isFuture ? 'text-text-muted' : 'text-text-primary'
                  )}>
                    {getStepTitle(step.stepType)}
                  </p>
                </div>
                <p className={cn(
                  'text-small mt-1',
                  isActive ? 'text-accent-primary' :
                  isFailed ? 'text-error' :
                  'text-text-muted'
                )}>
                  {step.message}
                </p>
                {/* Show tx hash if available */}
                {step.txHash && (
                  <p className="text-caption text-text-muted mt-1 truncate">
                    TX: {step.txHash.slice(0, 10)}...{step.txHash.slice(-8)}
                  </p>
                )}
                {/* Show error if failed */}
                {step.error && (
                  <p className="text-caption text-error mt-1">
                    {step.error}
                  </p>
                )}
              </div>

              {/* Status badge */}
              <div className="flex-shrink-0">
                {isCompleted && (
                  <span className="text-caption text-success font-medium">Done</span>
                )}
                {isActive && (
                  <span className="text-caption text-accent-primary font-medium">In Progress</span>
                )}
                {isFailed && (
                  <span className="text-caption text-error font-medium">Failed</span>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[1.9rem] top-[3.25rem] w-0.5 h-4 -translate-x-1/2">
                <div className={cn(
                  'w-full h-full transition-colors duration-300',
                  isCompleted ? 'bg-success' : 'bg-border-default'
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ExecutionStepper;
