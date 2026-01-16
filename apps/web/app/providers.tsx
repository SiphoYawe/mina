'use client';

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { Mina, type MinaConfig } from '@mina-bridge/sdk';

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

export function MinaProvider({
  config = defaultConfig,
  children,
}: {
  config?: MinaConfig;
  children: ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mina = useMemo(() => {
    try {
      return new Mina(config);
    } catch (e) {
      setError(e as Error);
      return null;
    }
  }, [config]);

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

export function useMina() {
  const context = useContext(MinaContext);
  if (!context) {
    throw new Error('useMina must be used within a MinaProvider');
  }
  return context;
}
