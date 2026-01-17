'use client'

/**
 * Globe State Hook
 *
 * Derives globe visualization state from transaction store
 */

import { useMemo } from 'react'
import { useTransactionStore } from '@/lib/stores/transaction-store'
import { getChainCoordinates, interpolateArcPosition } from '@/lib/config/chain-coordinates'

export type GlobeState = 'idle' | 'bridging' | 'complete'

export interface GlobeArc {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
}

export interface GlobeRing {
  lat: number
  lng: number
  maxRadius: number
  propagationSpeed: number
  repeatPeriod: number
}

export interface UseGlobeStateReturn {
  /** Current globe visualization state */
  state: GlobeState
  /** Source chain ID */
  sourceChainId: number | null
  /** Destination chain ID (Hyperliquid) */
  destChainId: number | null
  /** Current bridge progress (0-100) */
  progress: number
  /** Arc data for the bridge route */
  arc: GlobeArc | null
  /** Token position ring along the arc */
  tokenRing: GlobeRing | null
  /** Success ring at destination */
  successRing: GlobeRing | null
  /** Camera target coordinates */
  cameraTarget: { lat: number; lng: number; altitude: number } | null
}

/**
 * Hook to derive globe state from transaction store
 */
export function useGlobeState(): UseGlobeStateReturn {
  const {
    status,
    fromChainId,
    toChainId,
    progress,
  } = useTransactionStore()

  return useMemo(() => {
    // Determine globe state from transaction status
    let state: GlobeState = 'idle'
    if (status === 'executing' || status === 'pending') {
      state = 'bridging'
    } else if (status === 'completed') {
      state = 'complete'
    }

    // Get coordinates
    const sourceCoords = fromChainId ? getChainCoordinates(fromChainId) : null
    const destCoords = toChainId ? getChainCoordinates(toChainId) : getChainCoordinates(999) // Default to Hyperliquid

    // Build arc data if bridging
    let arc: GlobeArc | null = null
    if (state !== 'idle' && sourceCoords && destCoords) {
      arc = {
        startLat: sourceCoords.lat,
        startLng: sourceCoords.lng,
        endLat: destCoords.lat,
        endLng: destCoords.lng,
      }
    }

    // Calculate token position along arc
    let tokenRing: GlobeRing | null = null
    if (state === 'bridging' && sourceCoords && destCoords) {
      const tokenPos = interpolateArcPosition(
        { lat: sourceCoords.lat, lng: sourceCoords.lng },
        { lat: destCoords.lat, lng: destCoords.lng },
        progress / 100
      )
      tokenRing = {
        lat: tokenPos.lat,
        lng: tokenPos.lng,
        maxRadius: 2,
        propagationSpeed: 2,
        repeatPeriod: 700,
      }
    }

    // Success ring at destination on complete
    let successRing: GlobeRing | null = null
    if (state === 'complete' && destCoords) {
      successRing = {
        lat: destCoords.lat,
        lng: destCoords.lng,
        maxRadius: 5,
        propagationSpeed: 3,
        repeatPeriod: 1500,
      }
    }

    // Camera target
    let cameraTarget: { lat: number; lng: number; altitude: number } | null = null
    if (state === 'bridging' && sourceCoords && destCoords) {
      // Focus on midpoint of the route
      const midLat = (sourceCoords.lat + destCoords.lat) / 2
      const midLng = (sourceCoords.lng + destCoords.lng) / 2
      cameraTarget = { lat: midLat, lng: midLng, altitude: 2.2 }
    } else if (state === 'complete' && destCoords) {
      // Zoom to destination
      cameraTarget = { lat: destCoords.lat, lng: destCoords.lng, altitude: 1.5 }
    }

    return {
      state,
      sourceChainId: fromChainId,
      destChainId: toChainId || 999,
      progress,
      arc,
      tokenRing,
      successRing,
      cameraTarget,
    }
  }, [status, fromChainId, toChainId, progress])
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}
