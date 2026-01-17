'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  isPushPermissionGranted,
  isPushPermissionDenied,
  getPushPermissionState,
  shouldShowNotificationPrompt,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  markNotificationPromptShown,
  type PushSubscriptionData,
} from '@/lib/notifications';

/**
 * Push notification state
 */
export interface PushNotificationState {
  /** Whether push notifications are supported by the browser */
  isSupported: boolean;
  /** Whether notification permission has been granted */
  isEnabled: boolean;
  /** Whether notification permission was denied */
  isDenied: boolean;
  /** Current permission state */
  permission: NotificationPermission | null;
  /** Stored subscription data (if any) */
  subscription: PushSubscriptionData | null;
  /** Whether we should show the notification prompt */
  shouldShowPrompt: boolean;
  /** Whether we're currently loading state */
  isLoading: boolean;
}

/**
 * Push notification actions
 */
export interface PushNotificationActions {
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Mark that the prompt has been shown */
  markPromptShown: () => void;
  /** Trigger prompt to show (if conditions are met) */
  triggerPrompt: () => void;
  /** Refresh state from storage/browser */
  refresh: () => void;
}

/**
 * Return type for usePushNotifications hook
 */
export type UsePushNotificationsReturn = PushNotificationState & PushNotificationActions;

/**
 * Custom hook for managing push notifications
 *
 * Provides reactive state and actions for push notification management.
 * Tracks permission state, subscription data, and prompt visibility.
 *
 * Usage:
 * ```tsx
 * const {
 *   isSupported,
 *   isEnabled,
 *   shouldShowPrompt,
 *   subscribe,
 *   triggerPrompt,
 * } = usePushNotifications();
 *
 * // After successful bridge
 * if (shouldShowPrompt) {
 *   triggerPrompt();
 * }
 * ```
 *
 * Story 11.5 Implementation
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [promptTriggered, setPromptTriggered] = useState(false);

  /**
   * Refresh state from browser/storage
   */
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const supported = isPushSupported();
    setIsSupported(supported);

    if (supported) {
      setIsEnabled(isPushPermissionGranted());
      setIsDenied(isPushPermissionDenied());
      setPermission(getPushPermissionState());
      setSubscription(getPushSubscription());
      setShouldShowPrompt(shouldShowNotificationPrompt() && promptTriggered);
    }

    setIsLoading(false);
  }, [promptTriggered]);

  /**
   * Initialize state on mount
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[usePushNotifications] Push not supported');
      return false;
    }

    const result = await subscribeToPush();
    refresh();
    return result !== null;
  }, [isSupported, refresh]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    const result = await unsubscribeFromPush();
    refresh();
    return result;
  }, [isSupported, refresh]);

  /**
   * Mark prompt as shown
   */
  const markPromptShown = useCallback(() => {
    markNotificationPromptShown();
    setShouldShowPrompt(false);
  }, []);

  /**
   * Trigger prompt to show (if conditions are met)
   */
  const triggerPrompt = useCallback(() => {
    if (shouldShowNotificationPrompt()) {
      setPromptTriggered(true);
      setShouldShowPrompt(true);
    }
  }, []);

  return {
    // State
    isSupported,
    isEnabled,
    isDenied,
    permission,
    subscription,
    shouldShowPrompt,
    isLoading,
    // Actions
    subscribe,
    unsubscribe,
    markPromptShown,
    triggerPrompt,
    refresh,
  };
}

export default usePushNotifications;
