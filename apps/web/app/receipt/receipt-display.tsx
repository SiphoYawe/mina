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

/**
 * Explorer URLs by chain ID
 */
const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  56: 'https://bscscan.com/tx/',
  137: 'https://polygonscan.com/tx/',
  250: 'https://ftmscan.com/tx/',
  324: 'https://explorer.zksync.io/tx/',
  8453: 'https://basescan.org/tx/',
  42161: 'https://arbiscan.io/tx/',
  43114: 'https://snowtrace.io/tx/',
  59144: 'https://lineascan.build/tx/',
  534352: 'https://scrollscan.com/tx/',
  998: 'https://explorer.hyperliquid-testnet.xyz/tx/',
  999: 'https://explorer.hyperliquid.xyz/tx/',
};

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
  const explorerUrl = EXPLORER_URLS[receipt.fromChain.id]
    ? `${EXPLORER_URLS[receipt.fromChain.id]}${receipt.txHash}`
    : null;

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
