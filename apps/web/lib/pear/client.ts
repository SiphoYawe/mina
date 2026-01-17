/**
 * Pear Protocol API Client
 *
 * Handles authentication, trading, and position management
 * for pair trading on Hyperliquid via Pear Protocol.
 */

import type {
  EIP712Data,
  AuthTokens,
  AuthSession,
  Position,
  Order,
  TwapOrder,
  Market,
  MarketsResponse,
  ActiveMarketsResponse,
  Portfolio,
  CreatePositionRequest,
  CreatePositionResponse,
  ClosePositionRequest,
  ClosePositionResponse,
  AdjustPositionRequest,
  AdjustPositionResponse,
  UpdateRiskParametersRequest,
  PearApiError,
} from './types'

// Constants
const PEAR_API_BASE = 'https://hl-v2.pearprotocol.io'
const PEAR_CLIENT_ID = 'HLHackathon1'
const TOKEN_EXPIRY_BUFFER = 60 * 1000 // 1 minute buffer before expiry

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pear_access_token',
  REFRESH_TOKEN: 'pear_refresh_token',
  EXPIRES_AT: 'pear_expires_at',
  ADDRESS: 'pear_address',
} as const

/**
 * Pear Protocol API Client
 */
export class PearClient {
  private session: AuthSession | null = null
  private clientId: string

  constructor(clientId: string = PEAR_CLIENT_ID) {
    this.clientId = clientId
    this.loadSessionFromStorage()
  }

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * Get EIP-712 message to sign for authentication
   */
  async getEIP712Message(address: string): Promise<EIP712Data> {
    const url = new URL(`${PEAR_API_BASE}/auth/eip712-message`)
    url.searchParams.set('address', address)
    url.searchParams.set('clientId', this.clientId)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw await this.handleApiError(response)
    }

    return response.json()
  }

  /**
   * Authenticate with EIP-712 signature
   */
  async authenticate(
    address: string,
    signature: string,
    timestamp: number
  ): Promise<AuthTokens> {
    const response = await fetch(`${PEAR_API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        method: 'eip712',
        address,
        clientId: this.clientId,
        details: {
          signature,
          timestamp,
        },
      }),
    })

    if (!response.ok) {
      throw await this.handleApiError(response)
    }

    const tokens: AuthTokens = await response.json()
    this.setSession(tokens)
    return tokens
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.session?.tokens.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${PEAR_API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        refreshToken: this.session.tokens.refreshToken,
      }),
    })

    if (!response.ok) {
      this.clearSession()
      throw await this.handleApiError(response)
    }

    const tokens: AuthTokens = await response.json()
    this.setSession({
      ...tokens,
      address: this.session.tokens.address,
      clientId: this.clientId,
    })
    return tokens
  }

  /**
   * Logout and invalidate tokens
   */
  async logout(): Promise<void> {
    if (this.session?.tokens.refreshToken) {
      try {
        await fetch(`${PEAR_API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.session.tokens.refreshToken,
          }),
        })
      } catch {
        // Ignore logout errors
      }
    }
    this.clearSession()
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.session !== null && Date.now() < this.session.expiresAt
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    return this.session
  }

  // ============================================
  // Market Data Methods (No Auth Required)
  // ============================================

  /**
   * Get markets with optional filters
   */
  async getMarkets(params?: {
    page?: number
    pageSize?: number
    searchText?: string
    sort?: string
    minVolume?: string
    change24h?: string
    netFunding?: 'positive' | 'negative'
  }): Promise<MarketsResponse> {
    const url = new URL(`${PEAR_API_BASE}/markets`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw await this.handleApiError(response)
    }

    return response.json()
  }

  /**
   * Get active markets with categories
   */
  async getActiveMarkets(): Promise<ActiveMarketsResponse> {
    const response = await fetch(`${PEAR_API_BASE}/markets/active`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw await this.handleApiError(response)
    }

    return response.json()
  }

  // ============================================
  // Position Management Methods (Auth Required)
  // ============================================

  /**
   * Get all open positions
   */
  async getPositions(): Promise<Position[]> {
    return this.authenticatedRequest<Position[]>('GET', '/positions')
  }

  /**
   * Create a new position (pair trade, basket trade, or single asset)
   */
  async createPosition(request: CreatePositionRequest): Promise<CreatePositionResponse> {
    return this.authenticatedRequest<CreatePositionResponse>('POST', '/positions', request)
  }

  /**
   * Close a position
   */
  async closePosition(
    positionId: string,
    request: ClosePositionRequest
  ): Promise<ClosePositionResponse> {
    return this.authenticatedRequest<ClosePositionResponse>(
      'POST',
      `/positions/${positionId}/close`,
      request
    )
  }

  /**
   * Close all positions
   */
  async closeAllPositions(
    request: ClosePositionRequest
  ): Promise<{ results: Array<{ positionId: string; success: boolean; orderId?: string; error?: string }> }> {
    return this.authenticatedRequest('POST', '/positions/close-all', request)
  }

  /**
   * Adjust position size
   */
  async adjustPosition(
    positionId: string,
    request: AdjustPositionRequest
  ): Promise<AdjustPositionResponse> {
    return this.authenticatedRequest<AdjustPositionResponse>(
      'POST',
      `/positions/${positionId}/adjust`,
      request
    )
  }

  /**
   * Adjust position leverage
   */
  async adjustLeverage(positionId: string, leverage: number): Promise<void> {
    return this.authenticatedRequest('POST', `/positions/${positionId}/adjust-leverage`, {
      leverage,
    })
  }

  /**
   * Update stop loss and take profit
   */
  async updateRiskParameters(
    positionId: string,
    request: UpdateRiskParametersRequest
  ): Promise<Position> {
    return this.authenticatedRequest<Position>(
      'PUT',
      `/positions/${positionId}/riskParameters`,
      request
    )
  }

  // ============================================
  // Order Management Methods (Auth Required)
  // ============================================

  /**
   * Get all open orders
   */
  async getOpenOrders(): Promise<Order[]> {
    return this.authenticatedRequest<Order[]>('GET', '/orders/open')
  }

  /**
   * Get TWAP orders with monitoring data
   */
  async getTwapOrders(): Promise<TwapOrder[]> {
    return this.authenticatedRequest<TwapOrder[]>('GET', '/orders/twap')
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ orderId: string; status: string; cancelledAt: string }> {
    return this.authenticatedRequest('DELETE', `/orders/${orderId}/cancel`)
  }

  /**
   * Cancel a TWAP order
   */
  async cancelTwapOrder(orderId: string): Promise<{ orderId: string; status: string; cancelledAt: string }> {
    return this.authenticatedRequest('POST', `/orders/${orderId}/twap/cancel`)
  }

  // ============================================
  // Portfolio Methods (Auth Required)
  // ============================================

  /**
   * Get portfolio summary
   */
  async getPortfolio(): Promise<Portfolio> {
    return this.authenticatedRequest<Portfolio>('GET', '/portfolio')
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Make an authenticated API request
   */
  private async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    await this.ensureValidToken()

    if (!this.session) {
      throw new Error('Not authenticated')
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.session.tokens.accessToken}`,
      Accept: 'application/json',
    }

    if (body) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${PEAR_API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token and retry
        try {
          await this.refreshAccessToken()
          return this.authenticatedRequest(method, path, body)
        } catch {
          this.clearSession()
          throw new Error('Session expired. Please re-authenticate.')
        }
      }
      throw await this.handleApiError(response)
    }

    // Handle empty responses
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text)
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.session) {
      throw new Error('Not authenticated')
    }

    // Check if token is about to expire
    if (Date.now() >= this.session.expiresAt - TOKEN_EXPIRY_BUFFER) {
      await this.refreshAccessToken()
    }
  }

  /**
   * Handle API error responses
   */
  private async handleApiError(response: Response): Promise<Error> {
    let errorData: PearApiError
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: `API error: ${response.status} ${response.statusText}` }
    }

    const error = new Error(errorData.message || 'Unknown API error')
    ;(error as Error & { code?: string; details?: unknown }).code = errorData.code
    ;(error as Error & { code?: string; details?: unknown }).details = errorData.details
    return error
  }

  /**
   * Set session from tokens
   */
  private setSession(tokens: AuthTokens): void {
    this.session = {
      tokens,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    }
    this.saveSessionToStorage()
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    this.session = null
    this.clearSessionFromStorage()
  }

  /**
   * Save session to localStorage
   */
  private saveSessionToStorage(): void {
    if (typeof window === 'undefined' || !this.session) return

    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.session.tokens.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.session.tokens.refreshToken)
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(this.session.expiresAt))
      localStorage.setItem(STORAGE_KEYS.ADDRESS, this.session.tokens.address)
    } catch {
      // Storage might be full or unavailable
    }
  }

  /**
   * Load session from localStorage
   */
  private loadSessionFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT)
      const address = localStorage.getItem(STORAGE_KEYS.ADDRESS)

      if (accessToken && refreshToken && expiresAt && address) {
        this.session = {
          tokens: {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 900, // Default
            address,
            clientId: this.clientId,
          },
          expiresAt: parseInt(expiresAt, 10),
        }
      }
    } catch {
      // Storage might be unavailable
    }
  }

  /**
   * Clear session from localStorage
   */
  private clearSessionFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
      localStorage.removeItem(STORAGE_KEYS.ADDRESS)
    } catch {
      // Storage might be unavailable
    }
  }
}

// Singleton instance
let pearClientInstance: PearClient | null = null

/**
 * Get the Pear client singleton
 */
export function getPearClient(): PearClient {
  if (!pearClientInstance) {
    pearClientInstance = new PearClient()
  }
  return pearClientInstance
}

/**
 * Reset the Pear client singleton (useful for testing)
 */
export function resetPearClient(): void {
  pearClientInstance = null
}

export { PEAR_CLIENT_ID, PEAR_API_BASE }
