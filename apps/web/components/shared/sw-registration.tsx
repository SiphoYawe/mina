'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceWorkerRegistrationProps {
  /** Additional class names */
  className?: string;
}

/**
 * Service Worker Registration Component
 *
 * Handles service worker lifecycle and updates for the PWA.
 * Shows a non-intrusive prompt when a new version is available.
 *
 * Features:
 * - Registers service worker on app load
 * - Detects when updates are available
 * - Shows update prompt to user
 * - Gracefully reloads app when user accepts update
 *
 * Story 11.2 Implementation
 */
export function ServiceWorkerRegistration({ className }: ServiceWorkerRegistrationProps) {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle update acceptance
  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      setIsUpdating(true);

      // Tell the waiting service worker to take control
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page after the new SW takes control
      waitingWorker.addEventListener('statechange', () => {
        if (waitingWorker.state === 'activated') {
          window.location.reload();
        }
      });

      // Fallback reload if statechange doesn't fire
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [waitingWorker]);

  // Dismiss update prompt
  const handleDismiss = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  useEffect(() => {
    // Only run in browser and production
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates immediately
        registration.update();

        // Check for updates every 60 seconds
        const updateInterval = setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // Handle update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // New service worker is installed and waiting
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });

        // Handle controller change (new SW took control)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

        // Check if there's already a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }

        // Cleanup on unmount
        return () => {
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    // Register when the window loads
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // Don't render if no update available
  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
        'flex items-center gap-3',
        'px-4 py-3',
        'bg-bg-elevated border border-border-default rounded-card',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]',
        'animate-slide-up',
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-accent-primary/10">
        <RefreshCw className={cn(
          'w-5 h-5 text-accent-primary',
          isUpdating && 'animate-spin'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-small font-medium text-text-primary">
          Update Available
        </p>
        <p className="text-caption text-text-secondary truncate">
          A new version of Mina Bridge is ready
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={cn(
            'px-3 py-1.5 rounded-lg',
            'text-caption font-medium',
            'bg-accent-primary text-bg-base',
            'hover:brightness-110 active:scale-95',
            'transition-all duration-standard',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUpdating ? 'Updating...' : 'Refresh'}
        </button>

        <button
          onClick={handleDismiss}
          disabled={isUpdating}
          aria-label="Dismiss update notification"
          className={cn(
            'p-1.5 rounded-lg',
            'text-text-secondary hover:text-text-primary',
            'hover:bg-bg-surface',
            'transition-all duration-standard',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ServiceWorkerRegistration;
