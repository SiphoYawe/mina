'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowDown, RefreshCw, Info, Loader2 } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useChainId } from 'wagmi';
import { useShallow } from 'zustand/react/shallow';
import { ChainSelector } from './chain-selector';
import { QuoteDisplay } from './quote-display';
import { BalanceWarning } from './balance-warning';
import { AutoDepositToggle } from './auto-deposit-toggle';
import { ExecutionModal } from './execution-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkSwitchPrompt } from '@/components/wallet';
import { useChains, useNetworkSwitchNeeded, useNetworkSwitch, useWalletBalance, useBridgeQuote, useBalanceValidation, useBridgeExecution } from '@/lib/hooks';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import { cn } from '@/lib/utils';
import type { Chain } from '@siphoyawe/mina-sdk';

/**
 * Destination Chain Display
 * Shows HyperEVM as the fixed destination
 */
function DestinationChainDisplay() {
  return (
    <div className="flex items-center gap-3 h-12 px-4 rounded-card border border-border-default bg-bg-surface/50">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-bg-base">H</span>
      </div>
      <span className="text-body text-text-primary">HyperEVM</span>
      <span className="ml-auto text-caption text-text-muted">(Destination)</span>
    </div>
  );
}

/**
 * Tooltip component for bridge button
 */
function BridgeButtonTooltip({ show, children, message }: { show: boolean; children: React.ReactNode; message: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {children}
      {show && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-elevated border border-border-default rounded-lg shadow-lg z-10 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 duration-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-warning" />
            <span className="text-caption text-text-primary">{message}</span>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-border-default" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bridge Form Component
 *
 * Main form for initiating bridge transactions.
 * Integrates:
 * - Chain selection
 * - Network switch detection with enhanced prompt
 * - Amount input (placeholder for token selection)
 * - Transaction blocking when network mismatch
 * - Balance refresh after network switch
 */
export function BridgeForm() {
  const { isConnected } = useAppKitAccount();
  const walletChainId = useChainId();
  const { chains, isLoading, error, refreshChains } = useChains();
  const { needsSwitch, targetChainId } = useNetworkSwitchNeeded();
  const { refetchBalances } = useWalletBalance();
  const { isPending: isSwitchPending, status: switchStatus } = useNetworkSwitch();
  const { quote, isLoading: isQuoteLoading, error: quoteError } = useBridgeQuote();
  const { warnings, isValid: isBalanceValid } = useBalanceValidation({ quote });
  const { execute, retry, isExecuting, isRetrying, reset: resetExecution } = useBridgeExecution();

  // State for managing dismissed prompt
  const [isDismissed, setIsDismissed] = useState(false);
  // State for auto-deposit toggle
  const [autoDepositEnabled, setAutoDepositEnabled] = useState(true);

  // Issue 2 fix: Use useShallow for state to batch subscriptions
  // Actions are stable references and can be selected directly - no need for getState()
  const { sourceChain, amount, setSourceChain, setAmount } = useBridgeStore(
    useShallow((state) => ({
      sourceChain: state.sourceChain,
      amount: state.amount,
      setSourceChain: state.setSourceChain,
      setAmount: state.setAmount,
    }))
  );

  // Find target chain for network switch prompt
  const targetChain = sourceChain && needsSwitch ? sourceChain : null;

  // Issue 8 fix: Use useRef to store refetchBalances to prevent memory leak from unstable reference
  const refetchBalancesRef = useRef(refetchBalances);
  useEffect(() => {
    refetchBalancesRef.current = refetchBalances;
  }, [refetchBalances]);

  // Reset dismissed state when chain selection changes
  useEffect(() => {
    setIsDismissed(false);
  }, [sourceChain?.id]);

  // Refresh balances when network switch succeeds
  useEffect(() => {
    if (switchStatus === 'success') {
      // Refresh balances for the new chain
      refetchBalancesRef.current();
      console.log('[BridgeForm] Network switched, refreshing balances');
    }
  }, [switchStatus]);

  // Also refresh balances when wallet chain changes
  useEffect(() => {
    if (isConnected && walletChainId) {
      // Small delay to ensure chain switch is complete
      const timer = setTimeout(() => {
        refetchBalancesRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, walletChainId]);

  // Handle chain selection
  const handleChainChange = useCallback((chain: Chain) => {
    setSourceChain(chain);
    setIsDismissed(false); // Reset dismissed state
  }, [setSourceChain]);

  // Handle amount change
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow valid numeric input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, [setAmount]);

  // Handle prompt dismiss
  const handlePromptDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Handle successful network switch
  const handleSwitchSuccess = useCallback(() => {
    setIsDismissed(false);
    // Balance refresh is handled by the useEffect above
  }, []);

  // Determine if we should show the network switch prompt
  const showNetworkPrompt = targetChain && !isDismissed;

  // Handle auto-deposit toggle
  const handleAutoDepositToggle = useCallback((enabled: boolean) => {
    setAutoDepositEnabled(enabled);
    // In a full implementation, this would trigger a quote refetch with autoDeposit param
  }, []);

  // Handle bridge execution
  const handleBridge = useCallback(async () => {
    if (!quote) {
      console.error('[BridgeForm] No quote available');
      return;
    }

    console.log('[BridgeForm] Starting bridge execution');
    const result = await execute(quote);

    if (result.success) {
      console.log('[BridgeForm] Bridge completed successfully:', result);
      // Reset form amount after successful bridge
      setAmount('');
    } else {
      console.error('[BridgeForm] Bridge failed:', result.error);
    }
  }, [quote, execute, setAmount]);

  // Handle bridge again (reset and refetch quote)
  const handleBridgeAgain = useCallback(() => {
    resetExecution();
    setAmount('');
  }, [resetExecution, setAmount]);

  // Handle start over (reset form completely)
  const handleStartOver = useCallback(() => {
    resetExecution();
    setAmount('');
  }, [resetExecution, setAmount]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    console.log('[BridgeForm] Retrying execution');
    const result = await retry();
    if (result.success) {
      console.log('[BridgeForm] Retry completed successfully:', result);
    } else {
      console.error('[BridgeForm] Retry failed:', result.error);
    }
  }, [retry]);

  // Get tooltip message for disabled bridge button
  const getTooltipMessage = useCallback((): string => {
    if (!isConnected) return 'Connect your wallet to bridge';
    if (needsSwitch) return 'Switch to the correct network first';
    if (!sourceChain) return 'Select a source chain';
    if (!amount) return 'Enter an amount to bridge';
    if (quote && !isBalanceValid) return 'Insufficient balance for this transaction';
    if (isExecuting) return 'Transaction in progress';
    return '';
  }, [isConnected, needsSwitch, sourceChain, amount, quote, isBalanceValid, isExecuting]);

  // Determine if bridge button should be disabled
  const hasBalanceIssue = Boolean(quote && !isBalanceValid);
  const isBridgeDisabled = !isConnected || !sourceChain || needsSwitch || !amount || isSwitchPending || hasBalanceIssue || isExecuting || !quote;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>
              Bridge from 40+ chains to Hyperliquid
            </CardDescription>
          </div>
          {/* Refresh button */}
          <button
            onClick={refreshChains}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors',
              isLoading && 'animate-spin'
            )}
            title="Refresh chains"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Switch Prompt - Enhanced with current vs target chain display */}
        {showNetworkPrompt && (
          <NetworkSwitchPrompt
            targetChain={targetChain}
            onDismiss={handlePromptDismiss}
            onSuccess={handleSwitchSuccess}
            variant="banner"
          />
        )}

        {/* Dismissed prompt warning (shows inline if user dismissed) */}
        {targetChain && isDismissed && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated border border-border-subtle">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-caption text-text-muted">
              Network switch required to bridge
            </span>
            <button
              onClick={() => setIsDismissed(false)}
              className="ml-auto text-caption text-accent-primary hover:underline"
            >
              Switch
            </button>
          </div>
        )}

        {/* From Section */}
        <div className="space-y-2">
          <label className="text-small text-text-secondary">From</label>
          <ChainSelector
            value={sourceChain}
            onChange={handleChainChange}
            chains={chains}
            isLoading={isLoading}
            error={error}
            disabled={!isConnected}
            placeholder={isConnected ? 'Select source chain' : 'Connect wallet first'}
          />
        </div>

        {/* Amount Input (placeholder for token integration) */}
        <div className="space-y-2">
          <label className="text-small text-text-secondary">Amount</label>
          <div className="relative">
            <Input
              placeholder="0.00"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              disabled={!sourceChain || needsSwitch}
              className="pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-small text-text-muted">
                {/* Token selector will go here - Story 2.7 */}
                Token
              </span>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center">
            <ArrowDown className="w-5 h-5 text-text-muted" />
          </div>
        </div>

        {/* To Section */}
        <div className="space-y-2">
          <label className="text-small text-text-secondary">To</label>
          <DestinationChainDisplay />
        </div>

        {/* Quote Display */}
        <QuoteDisplay
          quote={quote}
          isLoading={isQuoteLoading}
          error={quoteError}
        />

        {/* Balance Warnings */}
        {quote && warnings.length > 0 && (
          <BalanceWarning warnings={warnings} />
        )}

        {/* Auto-Deposit Toggle */}
        {quote && (
          <AutoDepositToggle
            enabled={autoDepositEnabled}
            onToggle={handleAutoDepositToggle}
            includesAutoDeposit={quote.includesAutoDeposit}
          />
        )}

        {/* Bridge Button with Tooltip */}
        <BridgeButtonTooltip
          show={Boolean(isBridgeDisabled && isConnected && !isExecuting)}
          message={getTooltipMessage()}
        >
          <Button
            className="w-full hover:shadow-glow"
            size="lg"
            disabled={isBridgeDisabled}
            onClick={handleBridge}
          >
            {!isConnected
              ? 'Connect Wallet'
              : isExecuting
              ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bridging...
                </>
              )
              : isSwitchPending
              ? 'Switching Network...'
              : needsSwitch
              ? 'Switch Network First'
              : !sourceChain
              ? 'Select Chain'
              : !amount
              ? 'Enter Amount'
              : isQuoteLoading
              ? 'Getting Quote...'
              : !quote
              ? 'Get Quote'
              : hasBalanceIssue
              ? 'Insufficient Balance'
              : 'Bridge Now'}
          </Button>
        </BridgeButtonTooltip>

        {/* Info Text */}
        {isConnected && sourceChain && !needsSwitch && (
          <p className="text-center text-caption text-text-muted">
            Bridging from {sourceChain.name} to HyperEVM
          </p>
        )}

        {/* Network mismatch warning when dismissed */}
        {isConnected && needsSwitch && isDismissed && (
          <p className="text-center text-caption text-warning">
            Switch to {sourceChain?.name} to continue
          </p>
        )}
      </CardContent>

      {/* Execution Modal */}
      <ExecutionModal
        onBridgeAgain={handleBridgeAgain}
        onStartOver={handleStartOver}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    </Card>
  );
}

export default BridgeForm;
