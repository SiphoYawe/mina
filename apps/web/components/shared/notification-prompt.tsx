'use client';

import { useState, useCallback } from 'react';
import { Bell, X, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  requestPushPermission,
  subscribeToPush,
  markNotificationPromptDismissed,
  markNotificationPromptShown,
} from '@/lib/notifications';

interface NotificationPromptProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Optional callback after successful subscription */
  onSubscribed?: () => void;
  /** Optional callback after dismissal */
  onDismissed?: () => void;
}

type PromptState = 'initial' | 'requesting' | 'success' | 'denied' | 'error';

/**
 * Notification Prompt Component
 *
 * Modal dialog that prompts users to enable push notifications
 * after their first successful bridge transaction.
 *
 * Features:
 * - Clean, focused UI with bell icon
 * - Clear value proposition
 * - Enable and dismiss actions
 * - Loading and result states
 *
 * Story 11.5 Implementation
 */
export function NotificationPrompt({
  open,
  onOpenChange,
  onSubscribed,
  onDismissed,
}: NotificationPromptProps) {
  const [state, setState] = useState<PromptState>('initial');

  const handleEnable = useCallback(async () => {
    setState('requesting');
    markNotificationPromptShown();

    try {
      const permission = await requestPushPermission();

      if (permission === 'granted') {
        const subscription = await subscribeToPush();

        if (subscription) {
          setState('success');
          onSubscribed?.();

          // Auto-close after success
          setTimeout(() => {
            onOpenChange(false);
            setState('initial');
          }, 2000);
        } else {
          setState('error');
        }
      } else if (permission === 'denied') {
        setState('denied');
      } else {
        // User dismissed the browser prompt
        setState('initial');
      }
    } catch (error) {
      console.error('[NotificationPrompt] Error requesting permission:', error);
      setState('error');
    }
  }, [onOpenChange, onSubscribed]);

  const handleDismiss = useCallback(() => {
    markNotificationPromptDismissed();
    onOpenChange(false);
    onDismissed?.();
    setState('initial');
  }, [onOpenChange, onDismissed]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => setState('initial'), 200);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm"
        onClose={handleClose}
        showCloseButton={state === 'initial'}
      >
        {state === 'initial' && (
          <>
            <DialogHeader className="items-center text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10 ring-1 ring-accent-primary/20">
                <Bell className="h-8 w-8 text-accent-primary" />
              </div>

              <DialogTitle className="text-center">
                Enable Bridge Notifications?
              </DialogTitle>

              <DialogDescription className="text-center">
                Get notified when your bridges complete, even if you close the app.
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="text-center">
              <ul className="space-y-2 text-small text-text-secondary">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Know instantly when tokens arrive</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Track progress in the background</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Never miss a bridge completion</span>
                </li>
              </ul>
            </DialogBody>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="secondary"
                onClick={handleDismiss}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Not Now
              </Button>
              <Button
                variant="primary"
                onClick={handleEnable}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <Bell className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            </DialogFooter>
          </>
        )}

        {state === 'requesting' && (
          <DialogBody className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-primary/10">
              <Bell className="h-8 w-8 text-accent-primary animate-pulse" />
            </div>
            <p className="text-body text-text-primary font-medium">
              Requesting Permission...
            </p>
            <p className="text-small text-text-secondary mt-2">
              Please allow notifications in your browser
            </p>
          </DialogBody>
        )}

        {state === 'success' && (
          <DialogBody className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="text-body text-text-primary font-medium">
              Notifications Enabled!
            </p>
            <p className="text-small text-text-secondary mt-2">
              You&apos;ll be notified when your bridges complete
            </p>
          </DialogBody>
        )}

        {state === 'denied' && (
          <>
            <DialogBody className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
                <XCircle className="h-8 w-8 text-warning" />
              </div>
              <p className="text-body text-text-primary font-medium">
                Notifications Blocked
              </p>
              <p className="text-small text-text-secondary mt-2">
                You can enable them later in your browser settings
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={handleClose} className="w-full">
                Got It
              </Button>
            </DialogFooter>
          </>
        )}

        {state === 'error' && (
          <>
            <DialogBody className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
                <X className="h-8 w-8 text-error" />
              </div>
              <p className="text-body text-text-primary font-medium">
                Something Went Wrong
              </p>
              <p className="text-small text-text-secondary mt-2">
                Failed to enable notifications. Please try again later.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default NotificationPrompt;
