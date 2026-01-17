'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowDown, ExternalLink, ArrowLeft, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { parseShareUrl, copyToClipboard, type ShareReceiptData } from '@/lib/utils/share';
import { ShareReceiptButton } from '@/components/shared/share-receipt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { chainConfigs } from '@/lib/config/chain-configs';

/**
 * Comprehensive Explorer URLs by chain ID
 * Covers 40+ EVM chains supported by the app
 * RECEIPT-001 Fix: Expanded from 13 to 40+ chains (matching execution-modal.tsx)
 */
const EXPLORER_URLS: Record<number, string> = {
  // Major L1s
  1: 'https://etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  250: 'https://ftmscan.com/tx/',
  43114: 'https://snowtrace.io/tx/',
  100: 'https://gnosisscan.io/tx/',
  42220: 'https://celoscan.io/tx/',
  1313161554: 'https://aurorascan.dev/tx/',
  1284: 'https://moonscan.io/tx/',
  1285: 'https://moonriver.moonscan.io/tx/',

  // L2s and Rollups
  10: 'https://optimistic.etherscan.io/tx/',
  42161: 'https://arbiscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  324: 'https://explorer.zksync.io/tx/',
  59144: 'https://lineascan.build/tx/',
  534352: 'https://scrollscan.com/tx/',
  5000: 'https://explorer.mantle.xyz/tx/',
  1088: 'https://andromeda-explorer.metis.io/tx/',
  1101: 'https://zkevm.polygonscan.com/tx/',
  81457: 'https://blastscan.io/tx/',
  34443: 'https://explorer.mode.network/tx/',
  7777777: 'https://explorer.zora.energy/tx/',

  // Other L2s
  169: 'https://pacific-explorer.manta.network/tx/',
  252: 'https://fraxscan.com/tx/',
  288: 'https://bobascan.com/tx/',
  1116: 'https://scan.coredao.org/tx/',
  2222: 'https://kavascan.io/tx/',
  7700: 'https://cantoscan.com/tx/',
  8217: 'https://klaytnscope.com/tx/',
  32659: 'https://fsnscan.com/tx/',
  42170: 'https://nova.arbiscan.io/tx/',
  204: 'https://opbnbscan.com/tx/',
  196: 'https://www.oklink.com/xlayer/tx/',
  1135: 'https://explorer.lisk.com/tx/',
  167000: 'https://taikoscan.io/tx/',
  4202: 'https://sepolia.lisk.com/tx/',

  // Testnets
  5: 'https://goerli.etherscan.io/tx/',
  11155111: 'https://sepolia.etherscan.io/tx/',
  421614: 'https://sepolia.arbiscan.io/tx/',
  84532: 'https://sepolia.basescan.org/tx/',
  11155420: 'https://sepolia-optimism.etherscan.io/tx/',

  // HyperEVM
  998: 'https://explorer.hyperliquid-testnet.xyz/tx/',
  999: 'https://explorer.hyperliquid.xyz/tx/',
};

/**
 * Get explorer URL for a transaction
 * RECEIPT-001 Fix: Falls back to chainConfigs if not in static map
 */
function getExplorerUrl(chainId: number, txHash: string): string | null {
  // First try the static explorer URLs
  if (EXPLORER_URLS[chainId]) {
    return `${EXPLORER_URLS[chainId]}${txHash}`;
  }

  // Fall back to chainConfigs for additional chains
  const chainConfig = chainConfigs[chainId];
  if (chainConfig?.blockExplorerUrls?.[0]) {
    const baseUrl = chainConfig.blockExplorerUrls[0];
    const explorerUrl = baseUrl.endsWith('/') ? `${baseUrl}tx/` : `${baseUrl}/tx/`;
    return `${explorerUrl}${txHash}`;
  }

  return null;
}

/**
 * Format an amount with commas
 */
function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

/**
 * Truncate a hash
 */
function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Invalid receipt display
 */
function InvalidReceipt() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">?</span>
          </div>
          <h2 className="text-h3 text-text-primary mb-2">Invalid Receipt</h2>
          <p className="text-body text-text-muted mb-6">
            This receipt link is invalid or has expired.
          </p>
          <Link href="/">
            <Button className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Mina Bridge
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Receipt card component
 */
function ReceiptCard({ receipt }: { receipt: ShareReceiptData }) {
  const [copied, setCopied] = useState(false);
  // RECEIPT-001 Fix: Use getExplorerUrl with fallback to chainConfigs
  const explorerUrl = getExplorerUrl(receipt.fromChain.id, receipt.txHash);

  const handleCopyHash = useCallback(async () => {
    const success = await copyToClipboard(receipt.txHash);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [receipt.txHash]);

  return (
    <Card className="max-w-md w-full">
      {/* Header */}
      <CardHeader className="text-center pb-2">
        <div className="text-3xl font-bold text-accent-primary mb-1">Mina</div>
        <CardTitle className="text-text-muted text-small font-normal">Bridge Receipt</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bridge details */}
        <div className="bg-bg-elevated rounded-xl p-5 space-y-4">
          {/* From */}
          <div>
            <div className="text-caption text-text-muted uppercase tracking-wide mb-1">From</div>
            <div className="text-h2 text-text-primary font-semibold">
              {formatAmount(receipt.fromToken.amount)} {receipt.fromToken.symbol}
            </div>
            <div className="text-small text-text-secondary">{receipt.fromChain.name}</div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-accent-primary" />
            </div>
          </div>

          {/* To */}
          <div>
            <div className="text-caption text-text-muted uppercase tracking-wide mb-1">To</div>
            <div className="text-h2 text-text-primary font-semibold">
              {formatAmount(receipt.toToken.amount)} {receipt.toToken.symbol}
            </div>
            <div className="text-small text-text-secondary">{receipt.toChain.name}</div>
          </div>
        </div>

        {/* Transaction info */}
        <div className="space-y-3">
          {/* Transaction hash */}
          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg">
            <div>
              <div className="text-caption text-text-muted mb-0.5">Transaction</div>
              <div className="text-small font-mono text-text-primary">
                {truncateHash(receipt.txHash)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHash}
                className="p-2 rounded-lg hover:bg-bg-surface transition-colors text-text-muted hover:text-text-primary"
                title="Copy transaction hash"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-bg-surface transition-colors text-text-muted hover:text-text-primary"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-lg">
            <div className="text-caption text-text-muted">Date</div>
            <div className="text-small text-text-primary">
              {new Date(receipt.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Bridge More
            </Button>
          </Link>
          <ShareReceiptButton receipt={receipt} variant="compact" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Receipt Display Component
 *
 * Parses URL params and displays the receipt
 */
export function ReceiptDisplay() {
  const searchParams = useSearchParams();
  const receipt = parseShareUrl(searchParams);

  if (!receipt) {
    return <InvalidReceipt />;
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <ReceiptCard receipt={receipt} />
    </div>
  );
}
