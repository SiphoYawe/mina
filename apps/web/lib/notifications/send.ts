'use client';

/**
 * Bridge Notification Sender
 *
 * Provides utilities for sending bridge-specific notifications
 * including success, failure, and pending status updates.
 *
 * Story 11.6 Implementation
 */

import { isPushPermissionGranted } from './push';

/**
 * Bridge notification types
 */
export type BridgeNotificationType = 'success' | 'failure' | 'pending';

/**
 * Input data for creating bridge notifications
 */
export interface BridgeNotification {
  type: BridgeNotificationType;
  amount?: string;
  token?: string;
  txHash?: string;
  reason?: string;
}

/**
 * Notification payload structure matching service worker expectations
 */
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
  url?: string;
  requireInteraction?: boolean;
  tag?: string;
  type?: BridgeNotificationType;
  txHash?: string;
  renotify?: boolean;
}

/**
 * Notification action button
 */
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Creates a notification payload for successful bridge completion
 *
 * @param amount - The amount bridged (e.g., "99.45")
 * @param token - The token symbol (e.g., "USDC")
 * @param txHash - Optional transaction hash for deep linking
 * @returns NotificationPayload for the success notification
 */
export function createBridgeSuccessNotification(
  amount: string,
  token: string,
  txHash?: string
): NotificationPayload {
  return {
    title: 'Bridge Complete!',
    body: `${amount} ${token} deposited to Hyperliquid`,
    icon: '/icon-192.svg',
    badge: '/badge-72.svg',
    actions: [
      { action: 'view-details', title: 'View Details' },
      { action: 'start-trading', title: 'Start Trading' },
    ],
    url: txHash ? `/history?tx=${txHash}` : '/history',
    requireInteraction: false,
    tag: `bridge-success-${txHash || Date.now()}`,
    type: 'success',
    txHash,
    renotify: true,
  };
}

/**
 * Creates a notification payload for failed bridge operation
 *
 * @param reason - Optional reason for the failure
 * @param txHash - Optional transaction hash for deep linking
 * @returns NotificationPayload for the failure notification
 */
export function createBridgeFailureNotification(
  reason?: string,
  txHash?: string
): NotificationPayload {
  return {
    title: 'Bridge Failed',
    body: reason || 'Tap to retry or view details',
    icon: '/icon-192.svg',
    badge: '/badge-72.svg',
    actions: [
      { action: 'retry', title: 'Retry' },
      { action: 'view-details', title: 'View Details' },
    ],
    url: '/',
    requireInteraction: true,
    tag: `bridge-failure-${txHash || Date.now()}`,
    type: 'failure',
    txHash,
    renotify: true,
  };
}

/**
 * Creates a notification payload for pending bridge operation
 *
 * @param amount - The amount being bridged
 * @param token - The token symbol
 * @param txHash - Optional transaction hash
 * @returns NotificationPayload for the pending notification
 */
export function createBridgePendingNotification(
  amount: string,
  token: string,
  txHash?: string
): NotificationPayload {
  return {
    title: 'Bridge in Progress',
    body: `Bridging ${amount} ${token} to Hyperliquid...`,
    icon: '/icon-192.svg',
    badge: '/badge-72.svg',
    actions: [{ action: 'view-details', title: 'View Status' }],
    url: txHash ? `/history?tx=${txHash}` : '/history',
    requireInteraction: false,
    tag: `bridge-pending-${txHash || Date.now()}`,
    type: 'pending',
    txHash,
    renotify: false,
  };
}

/**
 * Shows a local notification using the service worker
 *
 * This uses the service worker's showNotification API to display
 * a notification even when the app is in the background.
 *
 * @param title - Notification title
 * @param options - Notification options
 * @returns Promise resolving to true if notification was shown
 */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { type?: string; txHash?: string }
): Promise<boolean> {
  // Check if permission is granted
  if (!isPushPermissionGranted()) {
    console.warn('[Notifications] Permission not granted, cannot show notification');
    return false;
  }

  // Check if service worker is available
  if (!('serviceWorker' in navigator)) {
    console.warn('[Notifications] Service worker not available');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Enhance options with default values
    const enhancedOptions: NotificationOptions = {
      icon: '/icon-192.svg',
      badge: '/badge-72.svg',
      tag: 'mina-bridge-notification',
      ...options,
      data: {
        url: '/',
        timestamp: Date.now(),
        ...options.data,
        type: options.type,
        txHash: options.txHash,
      },
    };

    await registration.showNotification(title, enhancedOptions);
    console.log('[Notifications] Local notification shown:', title);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to show local notification:', error);
    return false;
  }
}

/**
 * Sends a bridge notification based on the bridge status
 *
 * This is the main entry point for sending bridge-related notifications.
 * It creates the appropriate notification payload based on the type
 * and sends it via the service worker.
 *
 * @param data - Bridge notification data
 * @returns Promise resolving to true if notification was sent
 */
export async function sendBridgeNotification(data: BridgeNotification): Promise<boolean> {
  let payload: NotificationPayload;

  switch (data.type) {
    case 'success':
      payload = createBridgeSuccessNotification(
        data.amount || '0',
        data.token || 'tokens',
        data.txHash
      );
      break;

    case 'failure':
      payload = createBridgeFailureNotification(data.reason, data.txHash);
      break;

    case 'pending':
      payload = createBridgePendingNotification(
        data.amount || '0',
        data.token || 'tokens',
        data.txHash
      );
      break;

    default:
      console.error('[Notifications] Unknown notification type:', data.type);
      return false;
  }

  return showLocalNotification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    actions: payload.actions,
    requireInteraction: payload.requireInteraction,
    tag: payload.tag,
    data: {
      url: payload.url,
      type: payload.type,
      txHash: payload.txHash,
    },
  } as NotificationOptions);
}

/**
 * Format amount for display in notifications
 *
 * @param amount - Raw amount string
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted amount string
 */
export function formatNotificationAmount(amount: string, decimals: number = 2): string {
  try {
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return num.toFixed(decimals);
  } catch {
    return amount;
  }
}
