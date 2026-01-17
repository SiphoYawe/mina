'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  /** Additional class names */
  className?: string;
}

/**
 * Offline Banner Component
 *
 * Displays a warning banner when the user goes offline.
 * Automatically shows/hides based on network connection status.
 *
 * Features:
 * - Non-intrusive fixed banner at top of viewport
 * - Smooth slide-in/slide-out animation
 * - Clear messaging about limited functionality
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
        'fixed top-0 left-0 right-0 z-50',
        'flex items-center justify-center gap-2',
        'px-4 py-2.5',
        'bg-warning/10 border-b border-warning/30',
        'text-warning text-small font-medium',
        'animate-slide-down',
        className
      )}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You are offline. Some features may not work.</span>
    </div>
  );
}

export default OfflineBanner;
