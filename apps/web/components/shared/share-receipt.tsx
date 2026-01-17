'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Share2, Copy, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildShareUrl,
  buildTweetText,
  generateReceiptImage,
  downloadBlob,
  copyToClipboard,
  openTwitterShare,
  type ShareReceiptData,
} from '@/lib/utils/share';
import { cn } from '@/lib/utils';

/**
 * Twitter/X icon component
 */
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * Toast notification component
 */
function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        type === 'success'
          ? 'bg-success/90 text-white'
          : 'bg-error/90 text-white'
      )}
    >
      {type === 'success' ? (
        <Check className="w-4 h-4" />
      ) : (
        <X className="w-4 h-4" />
      )}
      <span className="text-small font-medium">{message}</span>
    </div>
  );
}

/**
 * Share option button
 */
function ShareOption({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        'text-text-secondary hover:text-text-primary hover:bg-bg-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-small">{label}</span>
    </button>
  );
}

export interface ShareReceiptButtonProps {
  /** Receipt data for sharing */
  receipt: ShareReceiptData;
  /** Additional CSS classes */
  className?: string;
  /** Variant style */
  variant?: 'default' | 'compact';
}

/**
 * Share Receipt Button Component
 *
 * Provides options to share a bridge receipt:
 * - Copy link to clipboard
 * - Download receipt image
 * - Share to Twitter/X
 */
export function ShareReceiptButton({
  receipt,
  className,
  variant = 'default',
}: ShareReceiptButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Build the share URL
  const shareUrl = buildShareUrl(receipt);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } else {
      setToast({ message: 'Failed to copy link', type: 'error' });
    }
    setIsOpen(false);
  }, [shareUrl]);

  // Handle download image
  const handleDownloadImage = useCallback(async () => {
    setGenerating(true);
    try {
      const imageBlob = await generateReceiptImage(receipt);
      const filename = `mina-receipt-${receipt.txHash.slice(0, 8)}.png`;
      downloadBlob(imageBlob, filename);
      setToast({ message: 'Receipt downloaded!', type: 'success' });
    } catch (error) {
      console.error('[ShareReceipt] Failed to generate image:', error);
      setToast({ message: 'Failed to generate receipt', type: 'error' });
    } finally {
      setGenerating(false);
      setIsOpen(false);
    }
  }, [receipt]);

  // Handle Twitter share
  const handleShareTwitter = useCallback(() => {
    const tweetText = buildTweetText(receipt, shareUrl);
    openTwitterShare(tweetText);
    setIsOpen(false);
  }, [receipt, shareUrl]);

  return (
    <>
      {/* Share Button */}
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="secondary"
          size={variant === 'compact' ? 'sm' : 'md'}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border-accent-primary/30',
            className
          )}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        {/* Popover */}
        {isOpen && (
          <div
            ref={popoverRef}
            className={cn(
              'absolute z-50 mt-2 w-52 p-2',
              'bg-bg-elevated border border-border-subtle rounded-xl shadow-xl',
              'animate-in fade-in slide-in-from-top-1 duration-200',
              // Position above if near bottom of screen
              'right-0 top-full'
            )}
          >
            <div className="space-y-1">
              <ShareOption
                icon={copied ? Check : Copy}
                label={copied ? 'Copied!' : 'Copy Link'}
                onClick={handleCopyLink}
              />
              <ShareOption
                icon={Download}
                label={generating ? 'Generating...' : 'Download Image'}
                onClick={handleDownloadImage}
                disabled={generating}
              />
              <ShareOption
                icon={XIcon}
                label="Share to X"
                onClick={handleShareTwitter}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default ShareReceiptButton;
