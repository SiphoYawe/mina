'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Chain, Token } from '@siphoyawe/mina-sdk';

/**
 * Bridge mode type - "bridge" requires wallet, "simulate" works without
 */
export type BridgeMode = 'bridge' | 'simulate';

/**
 * Bridge store state and actions
 *
 * Issue 6 fix: Only persist sourceChainId (number) instead of full Chain object
 * to prevent hydration mismatches. Chain object is rehydrated by finding chain by ID.
 */
interface BridgeState {
  // Bridge/Simulate mode toggle
  mode: BridgeMode;
  // Source chain selection
  sourceChain: Chain | null;
  // Issue 6: Persisted chain ID for rehydration
  _sourceChainId: number | null;
  // Selected token on source chain
  sourceToken: Token | null;
  // Bridge amount (user input)
  amount: string;
  // Flag indicating wallet needs to switch networks
  needsNetworkSwitch: boolean;
  // Loading states
  isLoadingChains: boolean;
  isLoadingTokens: boolean;
  // Error states
  chainsError: string | null;
  tokensError: string | null;
}

interface BridgeActions {
  // Mode toggle
  setMode: (mode: BridgeMode) => void;
  // Chain selection
  setSourceChain: (chain: Chain | null) => void;
  // Issue 6: Rehydrate sourceChain from persisted chain ID
  rehydrateSourceChain: (chains: Chain[]) => void;
  // Token selection
  setSourceToken: (token: Token | null) => void;
  // Amount input
  setAmount: (amount: string) => void;
  // Network switch flag
  setNeedsNetworkSwitch: (needs: boolean) => void;
  // Loading states
  setIsLoadingChains: (loading: boolean) => void;
  setIsLoadingTokens: (loading: boolean) => void;
  // Error states
  setChainsError: (error: string | null) => void;
  setTokensError: (error: string | null) => void;
  // Reset to initial state
  reset: () => void;
  // Clear token when chain changes
  clearTokenOnChainChange: () => void;
}

const initialState: BridgeState = {
  mode: 'simulate', // Default to simulate mode (accessible without wallet)
  sourceChain: null,
  _sourceChainId: null,
  sourceToken: null,
  amount: '',
  needsNetworkSwitch: false,
  isLoadingChains: false,
  isLoadingTokens: false,
  chainsError: null,
  tokensError: null,
};

export const useBridgeStore = create<BridgeState & BridgeActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setMode: (mode) =>
          set({ mode }, false, 'setMode'),

        setSourceChain: (chain) =>
          set(
            (state) => {
              // Clear token when chain changes
              const shouldClearToken = chain?.id !== state.sourceChain?.id;
              return {
                sourceChain: chain,
                // Issue 6: Also update persisted chain ID
                _sourceChainId: chain?.id ?? null,
                sourceToken: shouldClearToken ? null : state.sourceToken,
                tokensError: shouldClearToken ? null : state.tokensError,
              };
            },
            false,
            'setSourceChain'
          ),

        // Issue 6: Rehydrate sourceChain from persisted chain ID when chains are loaded
        rehydrateSourceChain: (chains) =>
          set(
            (state) => {
              // If we have a persisted chain ID but no sourceChain, find and set it
              if (state._sourceChainId && !state.sourceChain && chains.length > 0) {
                const chain = chains.find((c) => c.id === state._sourceChainId);
                if (chain) {
                  return { sourceChain: chain };
                }
              }
              return {};
            },
            false,
            'rehydrateSourceChain'
          ),

        setSourceToken: (token) =>
          set({ sourceToken: token }, false, 'setSourceToken'),

        setAmount: (amount) =>
          set({ amount }, false, 'setAmount'),

        setNeedsNetworkSwitch: (needs) =>
          set({ needsNetworkSwitch: needs }, false, 'setNeedsNetworkSwitch'),

        setIsLoadingChains: (loading) =>
          set({ isLoadingChains: loading }, false, 'setIsLoadingChains'),

        setIsLoadingTokens: (loading) =>
          set({ isLoadingTokens: loading }, false, 'setIsLoadingTokens'),

        setChainsError: (error) =>
          set({ chainsError: error }, false, 'setChainsError'),

        setTokensError: (error) =>
          set({ tokensError: error }, false, 'setTokensError'),

        reset: () => set(initialState, false, 'reset'),

        clearTokenOnChainChange: () =>
          set(
            { sourceToken: null, tokensError: null },
            false,
            'clearTokenOnChainChange'
          ),
      }),
      {
        name: 'mina-bridge-store',
        partialize: (state) => ({
          // Issue 6 fix: Only persist chain ID, not full Chain object
          // This prevents hydration mismatches between server and client
          _sourceChainId: state._sourceChainId,
          amount: state.amount,
          // Persist mode preference for better UX across page refreshes
          mode: state.mode,
        }),
      }
    ),
    { name: 'BridgeStore' }
  )
);

// Selector hooks for optimized re-renders
export const useBridgeMode = () => useBridgeStore((state) => state.mode);
export const useSourceChain = () => useBridgeStore((state) => state.sourceChain);
export const useSourceToken = () => useBridgeStore((state) => state.sourceToken);
export const useBridgeAmount = () => useBridgeStore((state) => state.amount);
export const useNeedsNetworkSwitch = () => useBridgeStore((state) => state.needsNetworkSwitch);
export const useIsLoadingChains = () => useBridgeStore((state) => state.isLoadingChains);
export const useIsLoadingTokens = () => useBridgeStore((state) => state.isLoadingTokens);
