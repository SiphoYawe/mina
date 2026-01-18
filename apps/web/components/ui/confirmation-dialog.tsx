'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ConfirmationVariant = 'default' | 'danger' | 'warning' | 'success';

export interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Visual variant */
  variant?: ConfirmationVariant;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirm is clicked */
  onConfirm: () => void | Promise<void>;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
  /** Optional icon override */
  icon?: React.ReactNode;
  /** Additional details to show */
  details?: Array<{ label: string; value: string }>;
}

/**
 * Get icon for variant
 */
function VariantIcon({ variant, className }: { variant: ConfirmationVariant; className?: string }) {
  const iconClasses = cn('w-8 h-8', className);

  switch (variant) {
    case 'danger':
      return <AlertTriangle className={cn(iconClasses, 'text-error')} />;
    case 'warning':
      return <AlertTriangle className={cn(iconClasses, 'text-warning')} />;
    case 'success':
      return <CheckCircle2 className={cn(iconClasses, 'text-success')} />;
    default:
      return <HelpCircle className={cn(iconClasses, 'text-accent-primary')} />;
  }
}

/**
 * Get colors for variant
 */
function getVariantColors(variant: ConfirmationVariant) {
  switch (variant) {
    case 'danger':
      return {
        iconBg: 'bg-error/10',
        iconRing: 'ring-error/20',
        buttonVariant: 'destructive' as const,
        accentColor: 'text-error',
      };
    case 'warning':
      return {
        iconBg: 'bg-warning/10',
        iconRing: 'ring-warning/20',
        buttonVariant: 'primary' as const,
        accentColor: 'text-warning',
      };
    case 'success':
      return {
        iconBg: 'bg-success/10',
        iconRing: 'ring-success/20',
        buttonVariant: 'primary' as const,
        accentColor: 'text-success',
      };
    default:
      return {
        iconBg: 'bg-accent-primary/10',
        iconRing: 'ring-accent-primary/20',
        buttonVariant: 'primary' as const,
        accentColor: 'text-accent-primary',
      };
  }
}

/**
 * Confirmation Dialog Component
 *
 * A well-designed confirmation dialog for important actions like trading,
 * bridging, or any destructive operations.
 *
 * Features:
 * - Multiple visual variants (default, danger, warning, success)
 * - Loading state for async confirmations
 * - Optional details display for trade/transaction info
 * - Accessible with keyboard navigation
 * - Beautiful animations and transitions
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Confirm Trade"
 *   description="You are about to execute this trade. This action cannot be undone."
 *   variant="warning"
 *   confirmText="Execute Trade"
 *   onConfirm={handleTrade}
 *   details={[
 *     { label: 'Long', value: 'BTC' },
 *     { label: 'Short', value: 'ETH' },
 *     { label: 'Size', value: '$1,000' },
 *   ]}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
  icon,
  details,
}: ConfirmationDialogProps) {
  const colors = getVariantColors(variant);

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={isLoading ? () => {} : onOpenChange}>
      <DialogContent
        className="max-w-md"
        onClose={isLoading ? undefined : handleCancel}
        showCloseButton={!isLoading}
      >
        <DialogHeader className="items-center text-center">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1',
              colors.iconBg,
              colors.iconRing
            )}
          >
            {icon || <VariantIcon variant={variant} />}
          </motion.div>

          <DialogTitle className="text-center text-h3">
            {title}
          </DialogTitle>

          <DialogDescription className="text-center text-text-muted">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Optional Details Panel */}
        {details && details.length > 0 && (
          <DialogBody>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-bg-surface/50 border border-border-subtle p-4 space-y-3"
            >
              {details.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-small"
                >
                  <span className="text-text-muted">{detail.label}</span>
                  <span className="text-text-primary font-medium font-mono">
                    {detail.value}
                  </span>
                </div>
              ))}
            </motion.div>
          </DialogBody>
        )}

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={colors.buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmationDialog;
