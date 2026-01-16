'use client';

import { useState, useCallback } from 'react';
import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { useBridgeStore } from '@/lib/stores/bridge-store';
import { getChainConfig, AddEthereumChainParameter } from '@/lib/config/chain-configs';

/**
 * Issue 4 fix: Define EIP1193Provider interface for type safety
 */
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * Issue 4 fix: Type guard to check if provider is EIP1193 compatible
 */
function isEIP1193Provider(provider: unknown): provider is EIP1193Provider {
  return (
    provider !== null &&
    typeof provider === 'object' &&
    'request' in provider &&
    typeof (provider as EIP1193Provider).request === 'function'
  );
}

/**
 * Error codes from wallet providers
 */
const WALLET_ERROR_CODES = {
  CHAIN_NOT_ADDED: 4902, // Chain not added to wallet
  USER_REJECTED: 4001, // User rejected the request
};

/**
 * Network switch status
 */
export type NetworkSwitchStatus = 'idle' | 'pending' | 'adding' | 'success' | 'error';

/**
 * Hook for network switching with add network fallback.
 *
 * Features:
 * - Switch to supported chains
 * - Auto-add chain if not in wallet (error 4902)
 * - Handle user rejection gracefully
 * - Track status for UI feedback
 */
export function useNetworkSwitch() {
  const { connector } = useAccount();
  const currentChainId = useChainId();
  const { isConnected } = useAppKitAccount();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();

  const [status, setStatus] = useState<NetworkSwitchStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const sourceChain = useBridgeStore((state) => state.sourceChain);
  const setNeedsNetworkSwitch = useBridgeStore((state) => state.setNeedsNetworkSwitch);

  /**
   * Add a network to the wallet using wallet_addEthereumChain
   */
  const addNetworkToWallet = useCallback(async (chainId: number): Promise<boolean> => {
    const chainConfig = getChainConfig(chainId);

    if (!chainConfig) {
      console.error('[Network Switch] No chain config found for chainId:', chainId);
      throw new Error(`Chain configuration not found for chain ID ${chainId}`);
    }

    try {
      // Get the wallet provider
      const provider = await connector?.getProvider();
      if (!provider) {
        throw new Error('No wallet provider available');
      }

      // Issue 4 fix: Use type guard instead of unsafe type assertion
      if (!isEIP1193Provider(provider)) {
        throw new Error('Wallet provider does not support EIP-1193 standard');
      }

      // Request to add the chain
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [chainConfig],
      });

      return true;
    } catch (err: any) {
      // User rejected adding the network
      if (err?.code === WALLET_ERROR_CODES.USER_REJECTED) {
        throw new Error('You rejected adding the network to your wallet');
      }
      throw err;
    }
  }, [connector]);

  /**
   * Switch to a target chain with add network fallback
   */
  const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return false;
    }

    if (currentChainId === targetChainId) {
      // Already on the correct chain
      setStatus('success');
      setNeedsNetworkSwitch(false);
      return true;
    }

    setStatus('pending');
    setError(null);

    try {
      // Attempt to switch chain
      await switchChainAsync({ chainId: targetChainId });

      setStatus('success');
      setNeedsNetworkSwitch(false);
      return true;
    } catch (err: any) {
      console.error('[Network Switch] Switch failed:', err);

      // Check if chain needs to be added
      if (err?.code === WALLET_ERROR_CODES.CHAIN_NOT_ADDED ||
          err?.message?.includes('Unrecognized chain ID') ||
          err?.message?.includes('wallet_addEthereumChain')) {

        // Try to add the network
        setStatus('adding');

        try {
          await addNetworkToWallet(targetChainId);

          // After adding, try switching again
          setStatus('pending');
          await switchChainAsync({ chainId: targetChainId });

          setStatus('success');
          setNeedsNetworkSwitch(false);
          return true;
        } catch (addErr: any) {
          console.error('[Network Switch] Add network failed:', addErr);
          const message = addErr?.message || 'Failed to add network to wallet';
          setError(message);
          setStatus('error');
          return false;
        }
      }

      // User rejected the switch
      if (err?.code === WALLET_ERROR_CODES.USER_REJECTED) {
        setError('You rejected the network switch');
        setStatus('error');
        return false;
      }

      // Other errors
      const message = err?.message || 'Failed to switch network';
      setError(message);
      setStatus('error');
      return false;
    }
  }, [isConnected, currentChainId, switchChainAsync, addNetworkToWallet, setNeedsNetworkSwitch]);

  /**
   * Switch to the source chain selected in bridge form
   */
  const switchToSourceChain = useCallback(async (): Promise<boolean> => {
    if (!sourceChain) {
      setError('No source chain selected');
      return false;
    }

    return switchNetwork(sourceChain.id);
  }, [sourceChain, switchNetwork]);

  /**
   * Reset status
   */
  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  /**
   * Check if network switch is needed
   */
  const needsSwitch = isConnected && sourceChain && currentChainId !== sourceChain.id;

  return {
    switchNetwork,
    switchToSourceChain,
    resetStatus,
    currentChainId,
    targetChainId: sourceChain?.id ?? null,
    targetChainName: sourceChain?.name ?? null,
    needsSwitch,
    status,
    isPending: status === 'pending' || status === 'adding' || isSwitchPending,
    isAdding: status === 'adding',
    error,
  };
}
