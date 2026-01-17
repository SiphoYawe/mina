'use client';

import { toPng } from 'html-to-image';

/**
 * Receipt data for sharing
 */
export interface ShareReceiptData {
  txHash: string;
  fromChain: { name: string; id: number };
  toChain: { name: string; id: number };
  fromToken: { symbol: string; amount: string };
  toToken: { symbol: string; amount: string };
  timestamp: number;
}

/**
 * Base URL for the app
 */
const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_APP_URL || 'https://mina.bridge';

/**
 * Build a shareable URL for a receipt
 */
export function buildShareUrl(receipt: ShareReceiptData): string {
  const params = new URLSearchParams({
    tx: receipt.txHash,
    fc: receipt.fromChain.id.toString(),
    fn: receipt.fromChain.name,
    tc: receipt.toChain.id.toString(),
    tn: receipt.toChain.name,
    ft: receipt.fromToken.symbol,
    fa: receipt.fromToken.amount,
    tt: receipt.toToken.symbol,
    ta: receipt.toToken.amount,
    ts: receipt.timestamp.toString(),
  });

  return `${BASE_URL}/receipt?${params.toString()}`;
}

/**
 * Parse receipt data from URL parameters
 */
export function parseShareUrl(searchParams: URLSearchParams): ShareReceiptData | null {
  const tx = searchParams.get('tx');
  const fc = searchParams.get('fc');
  const fn = searchParams.get('fn');
  const tc = searchParams.get('tc');
  const tn = searchParams.get('tn');
  const ft = searchParams.get('ft');
  const fa = searchParams.get('fa');
  const tt = searchParams.get('tt');
  const ta = searchParams.get('ta');
  const ts = searchParams.get('ts');

  if (!tx || !fc || !fn || !tc || !tn || !ft || !fa || !tt || !ta || !ts) {
    return null;
  }

  return {
    txHash: tx,
    fromChain: { name: fn, id: parseInt(fc, 10) },
    toChain: { name: tn, id: parseInt(tc, 10) },
    fromToken: { symbol: ft, amount: fa },
    toToken: { symbol: tt, amount: ta },
    timestamp: parseInt(ts, 10),
  };
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
 * Build tweet text for sharing
 */
export function buildTweetText(receipt: ShareReceiptData, shareUrl: string): string {
  const fromAmount = formatAmount(receipt.fromToken.amount);
  const toAmount = formatAmount(receipt.toToken.amount);

  return `Just bridged ${fromAmount} ${receipt.fromToken.symbol} from ${receipt.fromChain.name} to Hyperliquid using Mina Bridge!

${toAmount} ${receipt.toToken.symbol} received

${shareUrl}`;
}

/**
 * Create receipt HTML for image generation
 */
function createReceiptHTML(receipt: ShareReceiptData): string {
  const truncatedHash = `${receipt.txHash.slice(0, 6)}...${receipt.txHash.slice(-4)}`;
  const date = new Date(receipt.timestamp).toLocaleString();
  const fromAmount = formatAmount(receipt.fromToken.amount);
  const toAmount = formatAmount(receipt.toToken.amount);

  return `
    <div style="
      width: 400px;
      padding: 32px;
      background: linear-gradient(180deg, #111113 0%, #09090B 100%);
      border-radius: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      color: #FAFAFA;
      border: 1px solid #27272A;
    ">
      <!-- Header with Mina branding -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 32px; font-weight: 700; color: #7DD3FC; letter-spacing: -0.02em;">Mina</div>
        <div style="font-size: 13px; color: #71717A; margin-top: 4px;">Bridge Receipt</div>
      </div>

      <!-- Bridge details card -->
      <div style="
        background: #18181B;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;
        border: 1px solid #27272A;
      ">
        <!-- From section -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; color: #71717A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">From</div>
          <div style="font-size: 24px; font-weight: 600; color: #FAFAFA;">${fromAmount} ${receipt.fromToken.symbol}</div>
          <div style="font-size: 13px; color: #A1A1AA; margin-top: 2px;">${receipt.fromChain.name}</div>
        </div>

        <!-- Arrow -->
        <div style="text-align: center; color: #7DD3FC; font-size: 24px; margin: 16px 0;">↓</div>

        <!-- To section -->
        <div>
          <div style="font-size: 11px; color: #71717A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">To</div>
          <div style="font-size: 24px; font-weight: 600; color: #FAFAFA;">${toAmount} ${receipt.toToken.symbol}</div>
          <div style="font-size: 13px; color: #A1A1AA; margin-top: 2px;">${receipt.toChain.name}</div>
        </div>
      </div>

      <!-- Transaction info footer -->
      <div style="
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #71717A;
        padding-top: 12px;
        border-top: 1px solid #27272A;
      ">
        <div>TX: <span style="font-family: monospace;">${truncatedHash}</span></div>
        <div>${date}</div>
      </div>
    </div>
  `;
}

/**
 * Generate a receipt image as a blob
 */
export async function generateReceiptImage(receipt: ShareReceiptData): Promise<Blob> {
  // Create a temporary container for the receipt
  const container = document.createElement('div');
  container.innerHTML = createReceiptHTML(receipt);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const element = container.firstElementChild as HTMLElement;
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#09090B',
    });

    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    return await response.blob();
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or insecure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!success) {
      throw new Error('execCommand copy failed');
    }
    return true;
  } catch (err) {
    console.error('[share] Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Open Twitter share intent
 */
export function openTwitterShare(text: string): void {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}
