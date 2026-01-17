'use client';

/**
 * Push Notifications Module
 *
 * Provides utilities for managing browser push notifications.
 *
 * Story 11.5 & 11.6 Implementation
 */

// Core push notification functions
export {
  isPushSupported,
  isPushPermissionGranted,
  isPushPermissionDenied,
  getPushPermissionState,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  savePushSubscription,
  getPushSubscription,
  clearPushSubscription,
  hasShownNotificationPrompt,
  markNotificationPromptShown,
  wasNotificationPromptDismissed,
  markNotificationPromptDismissed,
  shouldShowNotificationPrompt,
  sendTestNotification,
  type PushSubscriptionData,
} from './push';

// Bridge notification utilities (Story 11.6)
export {
  createBridgeSuccessNotification,
  createBridgeFailureNotification,
  createBridgePendingNotification,
  showLocalNotification,
  sendBridgeNotification,
  formatNotificationAmount,
  type BridgeNotification,
  type BridgeNotificationType,
  type NotificationPayload,
  type NotificationAction,
} from './send';
