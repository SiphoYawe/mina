'use client';

import { WifiOff, Loader2, Check } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  /** Additional class names */
  className?: string;
}

/**
 * Offline capabilities that users can perform while disconnected
 */
const OFFLINE_CAPABILITIES = [
  'View cached chain & token lists',
  'Review transaction history',
  'Prepare a bridge',
] as const;

/**
 * Offline Banner Component
 *
 * Displays a comprehensive offline status banner when the user loses connection.
 * Shows what capabilities are available offline and indicates waiting for reconnection.
 *
 * Features:
 * - Fixed banner at top of viewport with smooth slide-in animation
 * - Clear "You're offline" header with WifiOff icon
 * - List of offline capabilities
 * - Spinner with "Waiting for connection..." indicator
 * - Auto-dismisses when connection is restored
 */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();

  // Don't render anything when online
  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        // Positioning
        'fixed top-0 left-0 right-0 z-50',
        // Layout
        'flex flex-col items-center',
        'px-4 py-4 sm:py-5',
        // Styling - using design system colors
        'bg-bg-base/95 backdrop-blur-sm',
        'border-b border-border-subtle',
        // Animation
        'animate-slide-down',
        className
      )}
    >
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-full bg-warning/10">
          <WifiOff className="w-5 h-5 text-warning" />
        </div>
        <h2 className="text-h3 text-text-primary">You&apos;re offline</h2>
      </div>

      {/* Offline Capabilities */}
      <div className="flex flex-col gap-2 mb-4">
        <p className="text-small text-text-secondary text-center mb-1">
          While offline, you can still:
        </p>
        <ul className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {OFFLINE_CAPABILITIES.map((capability) => (
            <li
              key={capability}
              className="flex items-center gap-2 text-small text-accent-primary"
            >
              <Check className="w-4 h-4 flex-shrink-0 text-success" />
              <span>{capability}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Waiting for Connection */}
      <div className="flex items-center gap-2 text-small text-text-muted">
        <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
        <span>Waiting for connection...</span>
      </div>
    </div>
  );
}

/**
 * Offline Quote Message Component
 *
 * A smaller inline component to show in the quote section when offline.
 * Use this where quotes are normally displayed.
 */
export function OfflineQuoteMessage({ className }: { className?: string }) {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2',
        'px-4 py-3',
        'rounded-card',
        'bg-bg-elevated border border-border-subtle',
        'text-small text-text-secondary',
        className
      )}
    >
      <WifiOff className="w-4 h-4 text-warning" />
      <span>Offline - connect to get quotes</span>
    </div>
  );
}

export default OfflineBanner;
