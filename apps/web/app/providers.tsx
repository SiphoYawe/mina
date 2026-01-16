'use client';

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { Mina, type MinaConfig } from '@siphoyawe/mina-sdk';
import { WalletProvider } from './providers/wallet-provider';
import type { State } from 'wagmi';

interface MinaContextValue {
  mina: Mina | null;
  isReady: boolean;
  error: Error | null;
}

const MinaContext = createContext<MinaContextValue | null>(null);

const defaultConfig: MinaConfig = {
  integrator: 'mina-bridge',
  autoDeposit: true,
  defaultSlippage: 0.005, // 0.5%
};

interface MinaProviderInnerProps {
  config?: MinaConfig;
  children: ReactNode;
}

function MinaProviderInner({
  config = defaultConfig,
  children,
}: MinaProviderInnerProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Issue 6 Fix: Use JSON.stringify for stable dependency comparison
  const configString = JSON.stringify(config);
  const mina = useMemo(() => {
    try {
      return new Mina(JSON.parse(configString) as MinaConfig);
    } catch (e) {
      setError(e as Error);
      return null;
    }
  }, [configString]);

  useEffect(() => {
    if (mina) {
      setIsReady(true);
    }
  }, [mina]);

  return (
    <MinaContext.Provider value={{ mina, isReady, error }}>
      {children}
    </MinaContext.Provider>
  );
}

interface MinaProviderProps {
  config?: MinaConfig;
  initialWagmiState?: State;
  children: ReactNode;
}

export function MinaProvider({
  config = defaultConfig,
  initialWagmiState,
  children,
}: MinaProviderProps) {
  return (
    <WalletProvider initialState={initialWagmiState}>
      <MinaProviderInner config={config}>
        {children}
      </MinaProviderInner>
    </WalletProvider>
  );
}

export function useMina() {
  const context = useContext(MinaContext);
  if (!context) {
    throw new Error('useMina must be used within a MinaProvider');
  }
  return context;
}
