'use client'

/**
 * Globe Visualization Component
 *
 * 3D interactive globe showing bridge routes between chains.
 * Uses react-globe.gl for rendering.
 *
 * Stories: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useRef, useEffect, useMemo, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GlobeMethods } from 'react-globe.gl'
import { useGlobeState, isWebGLSupported } from '@/lib/hooks/use-globe-state'
import { getAllChainPoints, type ChainCoordinates } from '@/lib/config/chain-coordinates'
import { cn } from '@/lib/utils'

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => <GlobeSkeleton />,
})

/**
 * Chain point data for globe markers
 */
interface ChainPoint extends ChainCoordinates {
  chainId: number
  size: number
  color: string
}

/**
 * Arc data structure for bridge routes
 */
interface ArcData {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: [string, string]
}

/**
 * Ring data for token position and success animations
 */
interface RingData {
  lat: number
  lng: number
  maxR: number
  propagationSpeed: number
  repeatPeriod: number
  color: string
}

/**
 * Globe skeleton placeholder during loading
 */
function GlobeSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-base">
      <div className="relative w-32 h-32">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-accent-primary/10 animate-pulse" />
        {/* Inner circle */}
        <div className="absolute inset-4 rounded-full bg-bg-elevated border border-border-subtle" />
        {/* Loading text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-caption text-text-muted">Loading...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * WebGL not supported fallback
 */
function WebGLFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-base p-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center">
          <svg
            className="w-8 h-8 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
        </div>
        <p className="text-small text-text-muted">
          3D visualization requires WebGL support.
        </p>
      </div>
    </div>
  )
}

/**
 * Props for GlobeVisualization component
 */
export interface GlobeVisualizationProps {
  /** Additional class names */
  className?: string
  /** Globe width (default: 100%) */
  width?: number | string
  /** Globe height (default: 100%) */
  height?: number | string
}

/**
 * Design tokens
 */
const COLORS = {
  background: '#09090B',
  atmosphereColor: '#7DD3FC',
  accentPrimary: '#7DD3FC',
  accentMuted: '#0EA5E9',
  success: '#0ECC83',
  pointDefault: '#7DD3FC',
  pointDestination: '#0ECC83',
} as const

/**
 * Globe configuration
 */
const GLOBE_CONFIG = {
  // Atmosphere
  atmosphereAltitude: 0.15,
  // Points
  pointAltitude: 0.01,
  pointRadiusDefault: 0.4,
  pointRadiusDestination: 0.6,
  // Arcs
  arcStroke: 0.5,
  arcDashLength: 0.5,
  arcDashGap: 0.1,
  arcDashAnimateTime: 2000,
  arcAltitudeAutoScale: 0.3,
  // Rings
  ringMaxRadius: 2,
  ringPropagationSpeed: 2,
  ringRepeatPeriod: 700,
  successRingMaxRadius: 5,
  successRingPropagationSpeed: 3,
  successRingRepeatPeriod: 1500,
  // Camera
  cameraAltitudeIdle: 2.5,
  cameraAltitudeBridging: 2.2,
  cameraAltitudeComplete: 1.5,
  cameraTransitionDuration: 1000,
  // Auto-rotate
  autoRotateSpeed: 0.3,
} as const

/**
 * Globe Visualization Component
 *
 * Displays an interactive 3D globe with chain markers, bridge arcs,
 * and token travel animations.
 */
export function GlobeVisualization({
  className,
  width = '100%',
  height = '100%',
}: GlobeVisualizationProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredChain, setHoveredChain] = useState<string | null>(null)

  // Get globe state from transaction store
  const {
    state,
    progress,
    arc,
    tokenRing,
    successRing,
    cameraTarget,
  } = useGlobeState()

  // Check WebGL support on mount
  useEffect(() => {
    setWebGLSupported(isWebGLSupported())
  }, [])

  // Calculate dimensions from container
  // Fix: Store element reference to avoid memory leak on cleanup
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height,
      })
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  // Build chain points data
  const chainPoints: ChainPoint[] = useMemo(() => {
    const allChains = getAllChainPoints()
    return allChains.map((chain) => ({
      ...chain,
      size: chain.isDestination
        ? GLOBE_CONFIG.pointRadiusDestination
        : GLOBE_CONFIG.pointRadiusDefault,
      color: chain.isDestination ? COLORS.pointDestination : COLORS.pointDefault,
    }))
  }, [])

  // Build arc data
  const arcsData: ArcData[] = useMemo(() => {
    if (!arc) return []
    return [{
      startLat: arc.startLat,
      startLng: arc.startLng,
      endLat: arc.endLat,
      endLng: arc.endLng,
      color: [COLORS.accentPrimary, COLORS.success] as [string, string],
    }]
  }, [arc])

  // Build rings data (token position + success ring)
  const ringsData: RingData[] = useMemo(() => {
    const rings: RingData[] = []

    // Token traveling ring
    if (tokenRing) {
      rings.push({
        lat: tokenRing.lat,
        lng: tokenRing.lng,
        maxR: GLOBE_CONFIG.ringMaxRadius,
        propagationSpeed: GLOBE_CONFIG.ringPropagationSpeed,
        repeatPeriod: GLOBE_CONFIG.ringRepeatPeriod,
        color: COLORS.accentPrimary,
      })
    }

    // Success ring at destination
    if (successRing) {
      rings.push({
        lat: successRing.lat,
        lng: successRing.lng,
        maxR: GLOBE_CONFIG.successRingMaxRadius,
        propagationSpeed: GLOBE_CONFIG.successRingPropagationSpeed,
        repeatPeriod: GLOBE_CONFIG.successRingRepeatPeriod,
        color: COLORS.success,
      })
    }

    return rings
  }, [tokenRing, successRing])

  // Camera control based on state
  useEffect(() => {
    if (!globeRef.current) return

    const controls = globeRef.current.controls()
    if (!controls) return

    // Control auto-rotate based on state
    if (state === 'idle') {
      controls.autoRotate = true
      controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed
    } else {
      controls.autoRotate = false
    }

    // Move camera to target
    if (cameraTarget) {
      globeRef.current.pointOfView(
        {
          lat: cameraTarget.lat,
          lng: cameraTarget.lng,
          altitude: cameraTarget.altitude,
        },
        GLOBE_CONFIG.cameraTransitionDuration
      )
    }
  }, [state, cameraTarget])

  // Initial camera setup
  useEffect(() => {
    if (!globeRef.current) return

    // Set initial camera position
    globeRef.current.pointOfView({
      lat: 30,
      lng: 0,
      altitude: GLOBE_CONFIG.cameraAltitudeIdle,
    })

    // Enable auto-rotate
    const controls = globeRef.current.controls()
    if (controls) {
      controls.autoRotate = true
      controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed
      controls.enableZoom = true
      controls.minDistance = 150
      controls.maxDistance = 500
    }
  }, [])

  // Point hover handler
  const handlePointHover = useCallback((point: object | null) => {
    if (point && 'name' in point) {
      setHoveredChain((point as ChainPoint).name)
    } else {
      setHoveredChain(null)
    }
  }, [])

  // Point color accessor
  const pointColor = useCallback((point: object) => {
    const p = point as ChainPoint
    return p.color
  }, [])

  // Point altitude accessor
  const pointAltitude = useCallback(() => GLOBE_CONFIG.pointAltitude, [])

  // Point radius accessor
  const pointRadius = useCallback((point: object) => {
    const p = point as ChainPoint
    return p.size
  }, [])

  // Arc color accessor
  const arcColor = useCallback((arc: object) => {
    const a = arc as ArcData
    return a.color
  }, [])

  // Ring color accessor
  const ringColor = useCallback((ring: object) => {
    const r = ring as RingData
    return () => r.color
  }, [])

  // Ring max radius accessor
  const ringMaxRadius = useCallback((ring: object) => {
    const r = ring as RingData
    return r.maxR
  }, [])

  // Ring propagation speed accessor
  const ringPropagationSpeed = useCallback((ring: object) => {
    const r = ring as RingData
    return r.propagationSpeed
  }, [])

  // Ring repeat period accessor
  const ringRepeatPeriod = useCallback((ring: object) => {
    const r = ring as RingData
    return r.repeatPeriod
  }, [])

  // Calculate responsive dimensions
  const globeWidth = typeof width === 'number' ? width : dimensions.width || 300
  const globeHeight = typeof height === 'number' ? height : dimensions.height || 300

  // Show skeleton while checking WebGL
  if (webGLSupported === null) {
    return (
      <div
        ref={containerRef}
        className={cn('relative', className)}
        style={{ width, height }}
      >
        <GlobeSkeleton />
      </div>
    )
  }

  // Show fallback if WebGL not supported
  if (!webGLSupported) {
    return (
      <div
        ref={containerRef}
        className={cn('relative', className)}
        style={{ width, height }}
      >
        <WebGLFallback />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Globe */}
      <Globe
        ref={globeRef}
        width={globeWidth}
        height={globeHeight}
        globeImageUrl="/earth-dark.jpg"
        backgroundColor={COLORS.background}
        atmosphereColor={COLORS.atmosphereColor}
        atmosphereAltitude={GLOBE_CONFIG.atmosphereAltitude}
        // Points (chain markers)
        pointsData={chainPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor={pointColor}
        pointAltitude={pointAltitude}
        pointRadius={pointRadius}
        onPointHover={handlePointHover}
        // Arcs (bridge routes)
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={arcColor}
        arcStroke={GLOBE_CONFIG.arcStroke}
        arcDashLength={GLOBE_CONFIG.arcDashLength}
        arcDashGap={GLOBE_CONFIG.arcDashGap}
        arcDashAnimateTime={GLOBE_CONFIG.arcDashAnimateTime}
        arcAltitudeAutoScale={GLOBE_CONFIG.arcAltitudeAutoScale}
        // Rings (token position + success animation)
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor={ringColor}
        ringMaxRadius={ringMaxRadius}
        ringPropagationSpeed={ringPropagationSpeed}
        ringRepeatPeriod={ringRepeatPeriod}
        // Performance
        rendererConfig={{ antialias: true, alpha: true }}
      />

      {/* Chain tooltip */}
      {hoveredChain && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-bg-elevated/90 backdrop-blur-sm border border-border-subtle rounded-lg shadow-glow pointer-events-none z-10">
          <span className="text-small text-text-primary font-medium">
            {hoveredChain}
          </span>
        </div>
      )}

      {/* State indicator (for debugging, can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-bg-elevated/80 rounded text-caption text-text-muted">
          {state} {state === 'bridging' && `(${progress}%)`}
        </div>
      )}
    </div>
  )
}

export default GlobeVisualization
