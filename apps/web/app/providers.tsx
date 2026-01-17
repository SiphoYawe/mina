'use client';

import type { ReactNode } from 'react';
import {
  MinaProvider as SDKMinaProvider,
  useMina as useSDKMina,
  type MinaConfig,
} from '@siphoyawe/mina-sdk/react';
import { WalletProvider } from './providers/wallet-provider';
import type { State } from 'wagmi';

// Re-export useMina from SDK for components to use
export { useSDKMina as useMina };

// Re-export types for convenience
export type { MinaConfig, MinaContextValue } from '@siphoyawe/mina-sdk/react';

const defaultConfig: MinaConfig = {
  integrator: 'mina-bridge',
  autoDeposit: true,
  defaultSlippage: 0.005, // 0.5%
};

interface MinaProviderProps {
  config?: MinaConfig;
  initialWagmiState?: State;
  children: ReactNode;
}

/**
 * Application-level provider that combines Mina SDK with wallet integration
 *
 * This wraps the SDK's MinaProvider with the WalletProvider for wallet connection
 * functionality via Reown AppKit.
 */
export function MinaProvider({
  config = defaultConfig,
  initialWagmiState,
  children,
}: MinaProviderProps) {
  return (
    <WalletProvider initialState={initialWagmiState}>
      <SDKMinaProvider config={config}>
        {children}
      </SDKMinaProvider>
    </WalletProvider>
  );
}
