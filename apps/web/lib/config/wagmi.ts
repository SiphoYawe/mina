'use client';

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';
import {
  mainnet,
  arbitrum,
  optimism,
  polygon,
  base,
  avalanche,
  bsc,
  gnosis,
  fantom,
  celo,
  aurora,
  moonbeam,
  moonriver,
  zkSync,
  linea,
  scroll,
  mantle,
  metis,
  polygonZkEvm,
  blast,
  mode,
  zora,
  type AppKitNetwork,
} from '@reown/appkit/networks';
import { cookieStorage, createStorage } from 'wagmi';

// Get the project ID from environment variable
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

// Issue 5 Fix: Throw error in development, show console.error in production
if (!projectId) {
  const errorMessage = 'Missing NEXT_PUBLIC_REOWN_PROJECT_ID environment variable. Wallet connection will not work.';
  if (process.env.NODE_ENV === 'development') {
    throw new Error(errorMessage);
  } else {
    console.error(errorMessage);
  }
}

// Issue 2 Fix: Make chain ID configurable via env var with default 999
const hyperEvmChainId = Number(process.env.NEXT_PUBLIC_HYPEREVM_CHAIN_ID) || 999;

// Define HyperEVM custom network (Chain ID 999 for mainnet, or 998 for testnet)
export const hyperEVM: AppKitNetwork = {
  id: hyperEvmChainId,
  name: 'HyperEVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://explorer.hyperliquid.xyz',
    },
  },
};

// Supported source chains (40+ EVM chains for bridging)
export const supportedNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  arbitrum,
  optimism,
  polygon,
  base,
  avalanche,
  bsc,
  gnosis,
  fantom,
  celo,
  aurora,
  moonbeam,
  moonriver,
  zkSync,
  linea,
  scroll,
  mantle,
  metis,
  polygonZkEvm,
  blast,
  mode,
  zora,
  hyperEVM, // Destination chain
];

// Metadata for the app
const metadata = {
  name: 'Mina Bridge',
  description: 'Cross-chain bridge to Hyperliquid - Bridge from 40+ chains directly to your trading account',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://mina.bridge',
  icons: ['/mina-icon.png'],
};

// Create Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: projectId || '',
  networks: supportedNetworks,
});

// Create AppKit instance with dark theme matching our design system
let appKitInstance: ReturnType<typeof createAppKit> | null = null;

export function initializeAppKit() {
  if (appKitInstance) return appKitInstance;
  if (!projectId) return null;

  appKitInstance = createAppKit({
    adapters: [wagmiAdapter],
    networks: supportedNetworks,
    defaultNetwork: mainnet,
    metadata,
    projectId,
    themeMode: 'dark',
    themeVariables: {
      // Match Dark Luxe design system
      '--w3m-accent': '#7DD3FC', // accent-primary
      '--w3m-color-mix': '#09090B', // bg-base
      '--w3m-color-mix-strength': 40,
      '--w3m-border-radius-master': '3px', // 12px card radius
      '--w3m-font-family': 'Inter, system-ui, sans-serif',
    },
    features: {
      analytics: true,
      email: true, // Enable email/social login
      socials: ['google', 'x', 'discord', 'github'],
      emailShowWallets: true,
    },
    allWallets: 'SHOW', // Show all 500+ wallets
  });

  return appKitInstance;
}

// Export the wagmi config for providers
export const wagmiConfig = wagmiAdapter.wagmiConfig;
