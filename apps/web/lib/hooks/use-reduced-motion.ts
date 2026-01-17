'use client';

import { useSyncExternalStore } from 'react';

/**
 * Get reduced motion preference from media query
 * Safe to call on server (returns false)
 */
function getReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Subscribe to reduced motion changes
 */
function subscribeToReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

/**
 * Server snapshot - always returns false to avoid hydration mismatch
 */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Hook to detect if user prefers reduced motion
 *
 * Uses useSyncExternalStore to safely handle SSR hydration.
 * Listens to the `prefers-reduced-motion` media query and returns
 * true if the user has enabled reduced motion preferences.
 *
 * @returns boolean indicating if reduced motion is preferred
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const reducedMotion = useReducedMotion();
 *
 *   if (reducedMotion) {
 *     return <StaticContent />;
 *   }
 *
 *   return <AnimatedContent />;
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerSnapshot
  );
}
