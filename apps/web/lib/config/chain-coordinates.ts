/**
 * Chain Geographic Coordinates
 *
 * Maps chain IDs to geographic locations for 3D globe visualization.
 * Locations chosen to represent regional nodes or HQ locations.
 */

export interface ChainCoordinates {
  name: string
  lat: number
  lng: number
  color?: string
  isDestination?: boolean
}

/**
 * Predefined coordinates for supported chains
 */
export const CHAIN_COORDINATES: Record<number, ChainCoordinates> = {
  // Major L1s
  1: { name: 'Ethereum', lat: 51.5074, lng: -0.1278 },       // London
  56: { name: 'BNB Chain', lat: 22.3193, lng: 114.1694 },    // Hong Kong
  137: { name: 'Polygon', lat: 19.076, lng: 72.8777 },       // Mumbai
  250: { name: 'Fantom', lat: -33.8688, lng: 151.2093 },     // Sydney
  43114: { name: 'Avalanche', lat: 49.2827, lng: -123.1207 }, // Vancouver
  100: { name: 'Gnosis', lat: 52.52, lng: 13.405 },          // Berlin

  // L2s and Rollups
  42161: { name: 'Arbitrum', lat: 48.8566, lng: 2.3522 },    // Paris
  10: { name: 'Optimism', lat: 40.7128, lng: -74.006 },      // New York
  8453: { name: 'Base', lat: 37.7749, lng: -122.4194 },      // San Francisco
  324: { name: 'zkSync Era', lat: 50.0755, lng: 14.4378 },   // Prague
  59144: { name: 'Linea', lat: 45.4642, lng: 9.19 },         // Milan
  534352: { name: 'Scroll', lat: 31.2304, lng: 121.4737 },   // Shanghai
  5000: { name: 'Mantle', lat: 1.3521, lng: 103.8198 },      // Singapore
  1101: { name: 'Polygon zkEVM', lat: 41.3851, lng: 2.1734 }, // Barcelona
  81457: { name: 'Blast', lat: 34.0522, lng: -118.2437 },    // Los Angeles
  34443: { name: 'Mode', lat: 47.6062, lng: -122.3321 },     // Seattle

  // HyperEVM - Destination
  998: {
    name: 'Hyperliquid (Testnet)',
    lat: 35.6762,
    lng: 139.6503,
    color: '#0ECC83',
    isDestination: true,
  }, // Tokyo
  999: {
    name: 'Hyperliquid',
    lat: 35.6762,
    lng: 139.6503,
    color: '#0ECC83',
    isDestination: true,
  }, // Tokyo
}

/**
 * Get coordinates for a chain
 */
export function getChainCoordinates(chainId: number): ChainCoordinates | null {
  return CHAIN_COORDINATES[chainId] || null
}

/**
 * Get all chain coordinates as array for globe points
 */
export function getAllChainPoints(): Array<ChainCoordinates & { chainId: number }> {
  return Object.entries(CHAIN_COORDINATES).map(([id, coords]) => ({
    chainId: Number(id),
    ...coords,
  }))
}

/**
 * Interpolate a position along the arc between two points
 * @param progress - Value from 0 to 1
 */
export function interpolateArcPosition(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  progress: number
): { lat: number; lng: number } {
  // Simple linear interpolation (great circle would be more accurate but complex)
  const lat = start.lat + (end.lat - start.lat) * progress
  const lng = start.lng + (end.lng - start.lng) * progress
  return { lat, lng }
}

/**
 * Calculate midpoint for arc altitude (higher arc for longer distances)
 */
export function calculateArcAltitude(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): number {
  const latDiff = Math.abs(end.lat - start.lat)
  const lngDiff = Math.abs(end.lng - start.lng)
  const distance = Math.sqrt(latDiff ** 2 + lngDiff ** 2)

  // Scale altitude based on distance (0.1 to 0.5)
  return Math.min(0.5, Math.max(0.15, distance / 300))
}
