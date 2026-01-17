'use client';

/**
 * Push Notification Utilities
 *
 * Provides helpers for managing push notification subscriptions.
 * Uses localStorage to persist subscription data and prompt state.
 *
 * Story 11.5 Implementation
 */

// VAPID public key for push subscriptions
// In production, this should be generated and configured properly
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Storage keys
const PUSH_SUBSCRIPTION_KEY = 'mina-push-subscription';
const NOTIFICATION_PROMPT_SHOWN_KEY = 'mina-notification-prompt-shown';
const NOTIFICATION_PROMPT_DISMISSED_KEY = 'mina-notification-prompt-dismissed';

/**
 * Push subscription data stored in localStorage
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: number;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if notification permission is already granted
 */
export function isPushPermissionGranted(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  return Notification.permission === 'granted';
}

/**
 * Check if notification permission was denied
 */
export function isPushPermissionDenied(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  return Notification.permission === 'denied';
}

/**
 * Get the current notification permission state
 */
export function getPushPermissionState(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns Promise resolving to the permission state
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications
 * @returns Promise resolving to the push subscription or null if failed
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[PushNotifications] Push not supported');
    return null;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      // Save subscription data to localStorage
      savePushSubscription(extractSubscriptionData(existingSubscription));
      return existingSubscription;
    }

    // Create new subscription
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    // Save subscription data to localStorage
    savePushSubscription(extractSubscriptionData(subscription));

    console.log('[PushNotifications] Successfully subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[PushNotifications] Failed to subscribe:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns Promise resolving to true if successfully unsubscribed
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      clearPushSubscription();
      console.log('[PushNotifications] Successfully unsubscribed from push notifications');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PushNotifications] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Extract subscription data for storage
 */
function extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
  const json = subscription.toJSON();

  return {
    endpoint: json.endpoint || '',
    keys: {
      p256dh: json.keys?.p256dh || '',
      auth: json.keys?.auth || '',
    },
    createdAt: Date.now(),
  };
}

/**
 * Save push subscription to localStorage
 */
export function savePushSubscription(subscription: PushSubscriptionData): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[PushNotifications] localStorage not available');
    return;
  }

  try {
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch (error) {
    console.error('[PushNotifications] Failed to save subscription:', error);
  }
}

/**
 * Get stored push subscription from localStorage
 */
export function getPushSubscription(): PushSubscriptionData | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const data = localStorage.getItem(PUSH_SUBSCRIPTION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[PushNotifications] Failed to get subscription:', error);
    return null;
  }
}

/**
 * Clear push subscription from localStorage
 */
export function clearPushSubscription(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
  } catch (error) {
    console.error('[PushNotifications] Failed to clear subscription:', error);
  }
}

/**
 * Check if notification prompt has been shown to user
 */
export function hasShownNotificationPrompt(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    return localStorage.getItem(NOTIFICATION_PROMPT_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark notification prompt as shown
 */
export function markNotificationPromptShown(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    localStorage.setItem(NOTIFICATION_PROMPT_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('[PushNotifications] Failed to mark prompt as shown:', error);
  }
}

/**
 * Check if notification prompt was dismissed by user (for this session)
 */
export function wasNotificationPromptDismissed(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    // Use session storage for session-based dismissal
    return sessionStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark notification prompt as dismissed (for this session)
 */
export function markNotificationPromptDismissed(): void {
  try {
    // Use session storage so it resets on new session
    sessionStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, 'true');
  } catch (error) {
    console.error('[PushNotifications] Failed to mark prompt as dismissed:', error);
  }
}

/**
 * Check if we should show the notification prompt
 * Returns true only if:
 * - Push is supported
 * - Permission hasn't been granted or denied
 * - Prompt hasn't been dismissed this session
 */
export function shouldShowNotificationPrompt(): boolean {
  if (!isPushSupported()) {
    return false;
  }

  // Already granted or denied - no need to prompt
  if (isPushPermissionGranted() || isPushPermissionDenied()) {
    return false;
  }

  // Already dismissed this session
  if (wasNotificationPromptDismissed()) {
    return false;
  }

  return true;
}

/**
 * Send a test notification (for development/demo purposes)
 */
export async function sendTestNotification(
  title: string = 'Bridge Complete!',
  body: string = 'Your tokens have arrived at their destination.'
): Promise<boolean> {
  if (!isPushPermissionGranted()) {
    console.warn('[PushNotifications] Permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: 'mina-bridge-notification',
      data: {
        url: window.location.href,
        timestamp: Date.now(),
      },
    } as NotificationOptions);
    return true;
  } catch (error) {
    console.error('[PushNotifications] Failed to send notification:', error);
    return false;
  }
}
