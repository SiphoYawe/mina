// Issue 9 fix: Removed 'use client' directive - this is pure data/config file

/**
 * Chain configurations for adding networks to wallets.
 * Used when a user's wallet doesn't have the target chain configured.
 */

export interface AddEthereumChainParameter {
  chainId: string; // Hex string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

/**
 * Chain configurations keyed by chain ID.
 * These are used when requesting wallet to add a network.
 * Issue 7 fix: Added 2-3 fallback RPC URLs for major chains
 */
export const chainConfigs: Record<number, AddEthereumChainParameter> = {
  // HyperEVM Mainnet
  999: {
    chainId: '0x3E7', // 999 in hex
    chainName: 'HyperEVM',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    rpcUrls: ['https://api.hyperliquid.xyz/evm'],
    blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
  },
  // Ethereum Mainnet - Issue 7 fix: Added fallback RPCs
  1: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  // Arbitrum One - Issue 7 fix: Added fallback RPCs
  42161: {
    chainId: '0xA4B1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://rpc.ankr.com/arbitrum',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  // Optimism - Issue 7 fix: Added fallback RPCs
  10: {
    chainId: '0xA',
    chainName: 'Optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://optimism.llamarpc.com',
      'https://rpc.ankr.com/optimism',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  // Polygon - Issue 7 fix: Added fallback RPCs
  137: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://rpc.ankr.com/polygon',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  // Base - Issue 7 fix: Added fallback RPCs
  8453: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://rpc.ankr.com/base',
    ],
    blockExplorerUrls: ['https://basescan.org'],
  },
  // BNB Smart Chain - Issue 7 fix: Added fallback RPCs
  56: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://rpc.ankr.com/bsc',
    ],
    blockExplorerUrls: ['https://bscscan.com'],
  },
  // Avalanche C-Chain - Issue 7 fix: Added fallback RPCs
  43114: {
    chainId: '0xA86A',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.drpc.org',
      'https://rpc.ankr.com/avalanche',
    ],
    blockExplorerUrls: ['https://snowtrace.io'],
  },
  // Gnosis (xDai) - Issue 7 fix: Added fallback RPCs
  100: {
    chainId: '0x64',
    chainName: 'Gnosis',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: [
      'https://rpc.gnosischain.com',
      'https://gnosis.drpc.org',
      'https://rpc.ankr.com/gnosis',
    ],
    blockExplorerUrls: ['https://gnosisscan.io'],
  },
  // Fantom - Issue 7 fix: Added fallback RPCs
  250: {
    chainId: '0xFA',
    chainName: 'Fantom',
    nativeCurrency: { name: 'FTM', symbol: 'FTM', decimals: 18 },
    rpcUrls: [
      'https://rpc.ftm.tools',
      'https://fantom.drpc.org',
      'https://rpc.ankr.com/fantom',
    ],
    blockExplorerUrls: ['https://ftmscan.com'],
  },
  // zkSync Era - Issue 7 fix: Added fallback RPCs
  324: {
    chainId: '0x144',
    chainName: 'zkSync Era',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.era.zksync.io',
      'https://zksync.drpc.org',
      'https://zksync-era.blockpi.network/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://explorer.zksync.io'],
  },
  // Linea - Issue 7 fix: Added fallback RPCs
  59144: {
    chainId: '0xE708',
    chainName: 'Linea',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.linea.build',
      'https://linea.drpc.org',
      'https://linea.blockpi.network/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://lineascan.build'],
  },
  // Scroll - Issue 7 fix: Added fallback RPCs
  534352: {
    chainId: '0x82750',
    chainName: 'Scroll',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.scroll.io',
      'https://scroll.drpc.org',
      'https://rpc.ankr.com/scroll',
    ],
    blockExplorerUrls: ['https://scrollscan.com'],
  },
  // Mantle - Issue 7 fix: Added fallback RPCs
  5000: {
    chainId: '0x1388',
    chainName: 'Mantle',
    nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
    rpcUrls: [
      'https://rpc.mantle.xyz',
      'https://mantle.drpc.org',
      'https://mantle-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://explorer.mantle.xyz'],
  },
  // Metis - Issue 7 fix: Added fallback RPCs
  1088: {
    chainId: '0x440',
    chainName: 'Metis Andromeda',
    nativeCurrency: { name: 'METIS', symbol: 'METIS', decimals: 18 },
    rpcUrls: [
      'https://andromeda.metis.io/?owner=1088',
      'https://metis-mainnet.public.blastapi.io',
      'https://metis.drpc.org',
    ],
    blockExplorerUrls: ['https://andromeda-explorer.metis.io'],
  },
  // Blast - Issue 7 fix: Added fallback RPCs
  81457: {
    chainId: '0x13E31',
    chainName: 'Blast',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.blast.io',
      'https://blast.drpc.org',
      'https://blast.blockpi.network/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://blastscan.io'],
  },
  // Mode - Issue 7 fix: Added fallback RPCs
  34443: {
    chainId: '0x868B',
    chainName: 'Mode',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.mode.network',
      'https://mode.drpc.org',
      'https://1rpc.io/mode',
    ],
    blockExplorerUrls: ['https://explorer.mode.network'],
  },
  // Zora - Issue 7 fix: Added fallback RPCs
  7777777: {
    chainId: '0x76ADF1',
    chainName: 'Zora',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.zora.energy',
      'https://zora.drpc.org',
      'https://zora-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://explorer.zora.energy'],
  },
};

/**
 * Convert a chain ID to hex format
 */
export function toHex(chainId: number): string {
  return '0x' + chainId.toString(16);
}

/**
 * Get chain config for a given chain ID
 */
export function getChainConfig(chainId: number): AddEthereumChainParameter | null {
  return chainConfigs[chainId] || null;
}
