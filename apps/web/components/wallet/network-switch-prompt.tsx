'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, RefreshCw, Plus, X, Wifi, WifiOff } from 'lucide-react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useNetworkSwitch } from '@/lib/hooks/use-network-switch';
import { cn } from '@/lib/utils';
import type { Chain } from '@siphoyawe/mina-sdk';
import type { Chain as WagmiChain } from 'wagmi/chains';

interface NetworkSwitchPromptProps {
  /** Target chain to switch to */
  targetChain: Chain;
  /** Called when prompt is dismissed */
  onDismiss?: () => void;
  /** Called when switch is successful */
  onSuccess?: () => void;
  /** Display variant */
  variant?: 'banner' | 'modal' | 'compact';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Chain icon with fallback
 * Issue 6 fix: Use React state to track image error and show letter fallback
 */
function ChainIcon({ chain, size = 'md' }: { chain: { name: string; logoUrl?: string } | null; size?: 'sm' | 'md' | 'lg' }) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  if (!chain) {
    return (
      <div className={cn(sizeClasses[size], 'rounded-full bg-bg-elevated flex items-center justify-center')}>
        <WifiOff className="w-3 h-3 text-text-muted" />
      </div>
    );
  }

  // Show letter fallback if no logo URL or image failed to load
  if (!chain.logoUrl || imageError) {
    return (
      <div className={cn(
        sizeClasses[size],
        'rounded-full bg-gradient-to-br from-accent-primary to-accent-muted flex items-center justify-center flex-shrink-0'
      )}>
        <span className={cn('text-bg-base font-bold', textSizes[size])}>
          {chain.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={chain.logoUrl}
      alt={`${chain.name} logo`}
      className={cn(sizeClasses[size], 'rounded-full flex-shrink-0 object-contain')}
      onError={() => setImageError(true)}
    />
  );
}

/**
 * Get chain name from chain ID using wagmi config
 */
function useChainName(chainId: number | null): string {
  const { chain: currentChain } = useAccount();
  const config = useConfig();

  return useMemo(() => {
    if (!chainId) return 'Unknown';

    // Check if it's the current chain
    if (currentChain?.id === chainId) {
      return currentChain.name;
    }

    // Look up in supported chains from config
    const chains = config.chains || [];
    const chain = chains.find((c: WagmiChain) => c.id === chainId);
    return chain?.name || `Chain ${chainId}`;
  }, [chainId, currentChain, config.chains]);
}

/**
 * NetworkSwitchPrompt Component
 *
 * Displays a prompt when user's wallet is on a different network than selected.
 * Features:
 * - Shows current vs target network with visual comparison
 * - Switch Network button with loading states
 * - Handles add network fallback automatically
 * - Dark Luxe styling
 */
export function NetworkSwitchPrompt({
  targetChain,
  onDismiss,
  onSuccess,
  variant = 'banner',
  className,
}: NetworkSwitchPromptProps) {
  const walletChainId = useChainId();
  const currentChainName = useChainName(walletChainId);
  const { chain: currentChain } = useAccount();

  const {
    switchToSourceChain,
    isPending,
    isAdding,
    error,
    status,
    resetStatus,
  } = useNetworkSwitch();

  const handleSwitch = useCallback(async () => {
    const success = await switchToSourceChain();
    if (success) {
      onSuccess?.();
    }
  }, [switchToSourceChain, onSuccess]);

  const handleDismiss = useCallback(() => {
    resetStatus();
    onDismiss?.();
  }, [onDismiss, resetStatus]);

  // Get button text based on status
  const buttonText = useMemo(() => {
    if (isAdding) return 'Adding Network...';
    if (isPending) return 'Switching...';
    return 'Switch Network';
  }, [isPending, isAdding]);

  // Get button icon based on status
  // Issue 1 fix: Reorder to check isAdding first, then isPending
  const ButtonIcon = useMemo(() => {
    if (isAdding) {
      return <Plus className="w-4 h-4 animate-spin" />;
    }
    if (isPending) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return <ArrowRight className="w-4 h-4" />;
  }, [isPending, isAdding]);

  // Issue 5 fix: Add escape key handler for modal (must be before any returns to follow hooks rules)
  useEffect(() => {
    if (variant !== 'modal') return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onDismiss && !isPending) {
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [variant, onDismiss, isPending, handleDismiss]);

  // Issue 5 fix: Handle backdrop click to dismiss modal (must be before any returns to follow hooks rules)
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Only dismiss if clicking on the backdrop itself, not the modal content
    if (event.target === event.currentTarget && onDismiss && !isPending) {
      handleDismiss();
    }
  }, [onDismiss, isPending, handleDismiss]);

  // Compact variant (inline with other elements)
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30',
        className
      )}>
        <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-caption text-text-primary flex-1">
          Switch to {targetChain.name}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSwitch}
          disabled={isPending}
          className="h-7 px-2 text-caption"
        >
          {isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Switch'}
        </Button>
      </div>
    );
  }

  // Banner variant (default)
  if (variant === 'banner') {
    return (
      <div className={cn(
        'relative rounded-card border overflow-hidden',
        error
          ? 'bg-error/10 border-error/30'
          : 'bg-warning/10 border-warning/30',
        className
      )}>
        {/* Main Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              error ? 'bg-error/20' : 'bg-warning/20'
            )}>
              <AlertCircle className={cn(
                'w-5 h-5',
                error ? 'text-error' : 'text-warning'
              )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-small font-medium text-text-primary mb-1">
                Network Switch Required
              </h4>
              <p className="text-caption text-text-muted mb-3">
                Your wallet is connected to{' '}
                <span className="text-text-secondary font-medium">{currentChainName}</span>
                {'. '}
                Switch to{' '}
                <span className="text-accent-primary font-medium">{targetChain.name}</span>
                {' '}to continue.
              </p>

              {/* Chain Comparison */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-bg-surface/50 mb-3">
                {/* Current Chain */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ChainIcon chain={{ name: currentChainName, logoUrl: currentChain?.blockExplorers?.default ? undefined : undefined }} size="sm" />
                  <span className="text-caption text-text-secondary truncate">
                    {currentChainName}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0" />

                {/* Target Chain */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ChainIcon chain={targetChain} size="sm" />
                  <span className="text-caption text-accent-primary font-medium truncate">
                    {targetChain.name}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-caption text-error mb-3">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSwitch}
                  disabled={isPending}
                  className="gap-2"
                >
                  {ButtonIcon}
                  {buttonText}
                </Button>

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    disabled={isPending}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>

            {/* Dismiss Button - Issue 3 fix: Added aria-label for accessibility */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="text-text-muted hover:text-text-secondary transition-colors p-1"
                disabled={isPending}
                aria-label="Dismiss network switch prompt"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isPending && (
          <div className="h-1 bg-bg-surface">
            <div className="h-full bg-accent-primary animate-pulse" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    );
  }

  // Modal variant (full-screen centered)
  // Issue 5 fix: Added role="dialog", aria-modal="true", backdrop click handler
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm',
        className
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="network-switch-modal-title"
    >
      <div className="w-full max-w-md bg-bg-elevated border border-border-default rounded-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 id="network-switch-modal-title" className="text-h3 text-text-primary">Switch Network</h3>
          {/* Issue 3 fix: Added aria-label for accessibility */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-text-muted hover:text-text-secondary transition-colors p-1"
              disabled={isPending}
              aria-label="Dismiss network switch prompt"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-warning" />
            </div>
          </div>

          {/* Message */}
          <p className="text-center text-body text-text-secondary mb-6">
            To bridge from{' '}
            <span className="text-accent-primary font-medium">{targetChain.name}</span>
            , please switch your wallet from{' '}
            <span className="text-text-primary font-medium">{currentChainName}</span>.
          </p>

          {/* Chain Comparison */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-card bg-bg-surface mb-6">
            {/* Current Chain */}
            <div className="text-center">
              <ChainIcon chain={{ name: currentChainName }} size="lg" />
              <p className="mt-2 text-caption text-text-muted">{currentChainName}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-6 h-6 text-text-muted" />

            {/* Target Chain */}
            <div className="text-center">
              <ChainIcon chain={targetChain} size="lg" />
              <p className="mt-2 text-caption text-accent-primary font-medium">
                {targetChain.name}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 mb-4">
              <p className="text-caption text-error text-center">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSwitch}
              disabled={isPending}
              className="w-full gap-2"
            >
              {ButtonIcon}
              {buttonText}
            </Button>

            {onDismiss && (
              <Button
                variant="ghost"
                size="lg"
                onClick={handleDismiss}
                disabled={isPending}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkSwitchPrompt;
