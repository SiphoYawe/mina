'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StepStatusPayload, TransactionStatusPayload, StepType } from '@siphoyawe/mina-sdk';

/**
 * Step status with UI-friendly message
 */
export interface UIStepStatus {
  stepId: string;
  stepType: StepType;
  status: 'pending' | 'active' | 'completed' | 'failed';
  message: string;
  txHash?: string;
  error?: string;
  timestamp: number;
}

/**
 * Execution state for tracking bridge transactions
 */
export interface ExecutionState {
  /** Whether a transaction is currently executing */
  isExecuting: boolean;
  /** Whether the execution modal is open */
  isModalOpen: boolean;
  /** Current execution ID */
  executionId: string | null;
  /** Overall execution status */
  status: 'idle' | 'pending' | 'executing' | 'completed' | 'failed';
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step statuses with UI messages */
  steps: UIStepStatus[];
  /** Progress percentage (0-100) */
  progress: number;
  /** Bridge transaction hash */
  txHash: string | null;
  /** Destination transaction hash */
  receivingTxHash: string | null;
  /** Received amount after completion */
  receivedAmount: string | null;
  /** Source chain ID */
  fromChainId: number | null;
  /** Destination chain ID */
  toChainId: number | null;
  /** Error if failed */
  error: string | null;
  /** Error details for recovery */
  errorDetails: {
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  } | null;
  /** Timestamp when execution started */
  startedAt: number | null;
  /** Timestamp when execution completed/failed */
  completedAt: number | null;
  /** Whether auto-deposit was executed */
  autoDepositCompleted: boolean;
  /** Deposit transaction hash on HyperEVM */
  depositTxHash: string | null;
  /** Final trading account balance on Hyperliquid L1 */
  finalTradingBalance: string | null;
}

/**
 * Execution actions
 */
export interface ExecutionActions {
  /** Start a new execution */
  startExecution: (params: {
    executionId: string;
    steps: Array<{ id: string; type: StepType }>;
    fromChainId: number;
    toChainId: number;
  }) => void;
  /** Open the execution modal */
  openModal: () => void;
  /** Close the execution modal */
  closeModal: () => void;
  /** Update step status from SDK callback */
  updateStep: (stepStatus: StepStatusPayload) => void;
  /** Update overall status from SDK callback */
  updateStatus: (status: TransactionStatusPayload) => void;
  /** Set execution as completed */
  setCompleted: (result: {
    txHash?: string;
    receivingTxHash?: string;
    receivedAmount?: string;
    autoDepositCompleted?: boolean;
    depositTxHash?: string;
    finalTradingBalance?: string;
  }) => void;
  /** Set execution as failed */
  setFailed: (error: {
    message: string;
    code?: string;
    recoverable?: boolean;
    recoveryAction?: string;
    userMessage?: string;
  }) => void;
  /** Reset execution state */
  reset: () => void;
}

/**
 * Step messages for each step type
 */
const STEP_MESSAGES: Record<StepType, string> = {
  approval: 'Approving token for transfer...',
  swap: 'Swapping tokens...',
  bridge: 'Bridging to Hyperliquid...',
  deposit: 'Depositing to trading account...',
};

const STEP_COMPLETED_MESSAGES: Record<StepType, string> = {
  approval: 'Token approved',
  swap: 'Swap complete',
  bridge: 'Bridge complete',
  deposit: 'Deposited to Hyperliquid',
};

const STEP_FAILED_MESSAGES: Record<StepType, string> = {
  approval: 'Approval failed',
  swap: 'Swap failed',
  bridge: 'Bridge failed',
  deposit: 'Deposit failed',
};

const STEP_PENDING_MESSAGES: Record<StepType, string> = {
  approval: 'Waiting for approval...',
  swap: 'Waiting to swap...',
  bridge: 'Waiting to bridge...',
  deposit: 'Waiting to deposit...',
};

/**
 * Get step message based on status
 */
function getStepMessage(stepType: StepType, status: UIStepStatus['status']): string {
  switch (status) {
    case 'pending':
      return STEP_PENDING_MESSAGES[stepType];
    case 'active':
      return STEP_MESSAGES[stepType];
    case 'completed':
      return STEP_COMPLETED_MESSAGES[stepType];
    case 'failed':
      return STEP_FAILED_MESSAGES[stepType];
    default:
      return STEP_MESSAGES[stepType];
  }
}

const initialState: ExecutionState = {
  isExecuting: false,
  isModalOpen: false,
  executionId: null,
  status: 'idle',
  currentStepIndex: 0,
  totalSteps: 0,
  steps: [],
  progress: 0,
  txHash: null,
  receivingTxHash: null,
  receivedAmount: null,
  fromChainId: null,
  toChainId: null,
  error: null,
  errorDetails: null,
  startedAt: null,
  completedAt: null,
  autoDepositCompleted: false,
  depositTxHash: null,
  finalTradingBalance: null,
};

export const useTransactionStore = create<ExecutionState & ExecutionActions>()(
  devtools(
    (set) => ({
      ...initialState,

      startExecution: (params) =>
        set(
          {
            isExecuting: true,
            isModalOpen: true,
            executionId: params.executionId,
            status: 'pending',
            currentStepIndex: 0,
            totalSteps: params.steps.length,
            steps: params.steps.map((step) => ({
              stepId: step.id,
              stepType: step.type,
              status: 'pending' as const,
              message: STEP_PENDING_MESSAGES[step.type],
              timestamp: Date.now(),
            })),
            progress: 0,
            txHash: null,
            receivingTxHash: null,
            receivedAmount: null,
            fromChainId: params.fromChainId,
            toChainId: params.toChainId,
            error: null,
            errorDetails: null,
            startedAt: Date.now(),
            completedAt: null,
          },
          false,
          'startExecution'
        ),

      openModal: () =>
        set({ isModalOpen: true }, false, 'openModal'),

      closeModal: () =>
        set({ isModalOpen: false }, false, 'closeModal'),

      updateStep: (stepStatus) =>
        set(
          (state) => {
            const stepIndex = state.steps.findIndex((s) => s.stepId === stepStatus.stepId);
            if (stepIndex === -1) return state;

            const newSteps = [...state.steps];
            const mappedStatus = stepStatus.status === 'active' ? 'active' : stepStatus.status;
            newSteps[stepIndex] = {
              ...newSteps[stepIndex]!,
              status: mappedStatus as UIStepStatus['status'],
              message: getStepMessage(stepStatus.step, mappedStatus as UIStepStatus['status']),
              txHash: stepStatus.txHash ?? undefined,
              error: stepStatus.error?.message ?? undefined,
              timestamp: stepStatus.timestamp,
            };

            // Find current step index (first non-completed step)
            const currentStepIndex = newSteps.findIndex((s) => s.status !== 'completed');
            const actualCurrentStep = currentStepIndex === -1 ? newSteps.length : currentStepIndex;

            // Calculate progress
            const completedSteps = newSteps.filter((s) => s.status === 'completed').length;
            const progress = state.totalSteps > 0
              ? Math.round((completedSteps / state.totalSteps) * 100)
              : 0;

            return {
              steps: newSteps,
              currentStepIndex: actualCurrentStep,
              progress,
              status: stepStatus.status === 'failed' ? 'failed' : 'executing',
              txHash: stepStatus.txHash ?? state.txHash,
            };
          },
          false,
          'updateStep'
        ),

      updateStatus: (status) =>
        set(
          (state) => ({
            status: status.status === 'completed'
              ? 'completed'
              : status.status === 'failed'
              ? 'failed'
              : 'executing',
            progress: status.progress,
            txHash: status.txHash || state.txHash,
            receivingTxHash: status.receivingTxHash ?? state.receivingTxHash,
          }),
          false,
          'updateStatus'
        ),

      setCompleted: (result) =>
        set(
          {
            isExecuting: false,
            status: 'completed',
            progress: 100,
            txHash: result.txHash ?? null,
            receivingTxHash: result.receivingTxHash ?? null,
            receivedAmount: result.receivedAmount ?? null,
            completedAt: Date.now(),
            autoDepositCompleted: result.autoDepositCompleted ?? false,
            depositTxHash: result.depositTxHash ?? null,
            finalTradingBalance: result.finalTradingBalance ?? null,
          },
          false,
          'setCompleted'
        ),

      setFailed: (error) =>
        set(
          {
            isExecuting: false,
            status: 'failed',
            error: error.message,
            errorDetails: {
              code: error.code,
              recoverable: error.recoverable,
              recoveryAction: error.recoveryAction,
              userMessage: error.userMessage,
            },
            completedAt: Date.now(),
          },
          false,
          'setFailed'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'TransactionStore' }
  )
);

// Selector hooks
export const useIsExecuting = () => useTransactionStore((state) => state.isExecuting);
export const useIsModalOpen = () => useTransactionStore((state) => state.isModalOpen);
export const useExecutionStatus = () => useTransactionStore((state) => state.status);
export const useExecutionSteps = () => useTransactionStore((state) => state.steps);
export const useExecutionProgress = () => useTransactionStore((state) => state.progress);
export const useExecutionError = () => useTransactionStore((state) => ({
  error: state.error,
  errorDetails: state.errorDetails,
}));
