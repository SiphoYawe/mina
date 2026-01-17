'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * BeforeInstallPromptEvent interface
 * The browser's beforeinstallprompt event that allows programmatic PWA installation
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Storage keys
const VISIT_KEY = 'mina-visit-count';
const DISMISS_KEY = 'mina-install-dismissed-at';

// How long to hide the prompt after user dismisses (7 days)
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

// Minimum visits before showing install prompt
const MIN_VISITS = 3;

/**
 * Return type for the useInstallPrompt hook
 */
export interface UseInstallPromptReturn {
  /** Whether the browser can install the PWA */
  canInstall: boolean;
  /** Whether the app is already installed (running in standalone mode) */
  isInstalled: boolean;
  /** Whether we should show the install prompt (visits >= 3 && canInstall && !dismissed recently) */
  shouldShowPrompt: boolean;
  /** Current visit count */
  visitCount: number;
  /** Trigger the browser's install prompt */
  install: () => Promise<void>;
  /** Dismiss the prompt for 7 days */
  dismiss: () => void;
}

/**
 * Check if the app is running in standalone mode (installed)
 */
function checkIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running as installed PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone || isInWebAppiOS;
}

/**
 * Get the current visit count from localStorage
 */
function getVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(localStorage.getItem(VISIT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Increment and save the visit count
 */
function incrementVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const count = getVisitCount() + 1;
    localStorage.setItem(VISIT_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

/**
 * Check if the user dismissed the prompt within the dismiss duration
 */
function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;

    const dismissTime = parseInt(dismissedAt, 10);
    return Date.now() - dismissTime < DISMISS_DURATION;
  } catch {
    return false;
  }
}

/**
 * Save the dismiss timestamp
 */
function saveDismissTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Silently fail - not critical
  }
}

/**
 * Hook to manage PWA install prompts
 *
 * Tracks visit count, listens for browser install events,
 * and provides functions to install or dismiss the prompt.
 *
 * The prompt should show after 3+ visits, if the browser supports
 * installation, and the user hasn't dismissed it within 7 days.
 *
 * @example
 * ```tsx
 * function InstallPromptUI() {
 *   const { shouldShowPrompt, install, dismiss } = useInstallPrompt();
 *
 *   if (!shouldShowPrompt) return null;
 *
 *   return (
 *     <div>
 *       <button onClick={install}>Install App</button>
 *       <button onClick={dismiss}>Later</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Initialize on mount
  useEffect(() => {
    // Check if already installed
    const installed = checkIsInstalled();
    setIsInstalled(installed);

    // Don't track visits or setup listeners if already installed
    if (installed) return;

    // Track visit count
    const count = incrementVisitCount();
    setVisitCount(count);

    // Check if recently dismissed
    setIsDismissed(wasDismissedRecently());

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Install function
  const install = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('[useInstallPrompt] No deferred prompt available');
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[useInstallPrompt] User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('[useInstallPrompt] User dismissed the install prompt');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setCanInstall(false);
    } catch (error) {
      console.error('[useInstallPrompt] Error during install:', error);
    }
  }, [deferredPrompt]);

  // Dismiss function - hide for 7 days
  const dismiss = useCallback(() => {
    saveDismissTimestamp();
    setIsDismissed(true);
  }, []);

  // Calculate whether to show the prompt
  const shouldShowPrompt = useMemo(() => {
    return (
      canInstall &&
      !isInstalled &&
      !isDismissed &&
      visitCount >= MIN_VISITS
    );
  }, [canInstall, isInstalled, isDismissed, visitCount]);

  return {
    canInstall,
    isInstalled,
    shouldShowPrompt,
    visitCount,
    install,
    dismiss,
  };
}

export default useInstallPrompt;
