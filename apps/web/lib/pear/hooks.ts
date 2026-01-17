/**
 * Pear Protocol React Hooks
 *
 * Custom hooks for Pear authentication and trading operations
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useSignTypedData, useAccount } from 'wagmi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPearClient } from './client'
import { usePearStore } from './store'
import type {
  CreatePositionRequest,
  ClosePositionRequest,
  AdjustPositionRequest,
  UpdateRiskParametersRequest,
  Position,
  Market,
} from './types'

// Query keys
export const PEAR_QUERY_KEYS = {
  positions: ['pear', 'positions'] as const,
  orders: ['pear', 'orders'] as const,
  twapOrders: ['pear', 'twapOrders'] as const,
  portfolio: ['pear', 'portfolio'] as const,
  markets: ['pear', 'markets'] as const,
  activeMarkets: ['pear', 'activeMarkets'] as const,
}

/**
 * Hook for Pear authentication
 */
export function usePearAuth() {
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()
  const queryClient = useQueryClient()

  const {
    isAuthenticated,
    isAuthenticating,
    session,
    authError,
    setAuthenticating,
    setSession,
    setAuthError,
    clearAuth,
  } = usePearStore()

  const pearClient = getPearClient()

  // Check if already authenticated on mount
  useEffect(() => {
    if (pearClient.isAuthenticated()) {
      const existingSession = pearClient.getSession()
      if (existingSession) {
        setSession(existingSession)
      }
    }
  }, [setSession])

  // Authenticate with wallet signature
  const authenticate = useCallback(async () => {
    if (!address) {
      setAuthError('Wallet not connected')
      return false
    }

    setAuthenticating(true)

    try {
      // Get EIP-712 message
      const eip712Data = await pearClient.getEIP712Message(address)

      // Sign the message
      const signature = await signTypedDataAsync({
        domain: eip712Data.domain as unknown as Parameters<typeof signTypedDataAsync>[0]['domain'],
        types: eip712Data.types as unknown as Parameters<typeof signTypedDataAsync>[0]['types'],
        primaryType: eip712Data.primaryType,
        message: eip712Data.message as unknown as Parameters<typeof signTypedDataAsync>[0]['message'],
      })

      // Authenticate with signature
      const tokens = await pearClient.authenticate(
        address,
        signature,
        eip712Data.timestamp
      )

      setSession({
        tokens,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      setAuthError(message)
      return false
    }
  }, [address, signTypedDataAsync, setAuthenticating, setSession, setAuthError])

  // Logout
  const logout = useCallback(async () => {
    try {
      await pearClient.logout()
    } finally {
      clearAuth()
      // Clear all Pear queries
      queryClient.removeQueries({ queryKey: ['pear'] })
    }
  }, [clearAuth, queryClient])

  return {
    isAuthenticated,
    isAuthenticating,
    session,
    authError,
    authenticate,
    logout,
  }
}

/**
 * Hook for fetching positions
 */
export function usePearPositions() {
  const { isAuthenticated } = usePearStore()
  const pearClient = getPearClient()

  return useQuery({
    queryKey: PEAR_QUERY_KEYS.positions,
    queryFn: () => pearClient.getPositions(),
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 3000,
  })
}

/**
 * Hook for fetching open orders
 */
export function usePearOrders() {
  const { isAuthenticated } = usePearStore()
  const pearClient = getPearClient()

  return useQuery({
    queryKey: PEAR_QUERY_KEYS.orders,
    queryFn: () => pearClient.getOpenOrders(),
    enabled: isAuthenticated,
    refetchInterval: 5000,
    staleTime: 3000,
  })
}

/**
 * Hook for fetching TWAP orders
 */
export function usePearTwapOrders() {
  const { isAuthenticated } = usePearStore()
  const pearClient = getPearClient()

  return useQuery({
    queryKey: PEAR_QUERY_KEYS.twapOrders,
    queryFn: () => pearClient.getTwapOrders(),
    enabled: isAuthenticated,
    refetchInterval: 5000,
    staleTime: 3000,
  })
}

/**
 * Hook for fetching portfolio
 */
export function usePearPortfolio() {
  const { isAuthenticated } = usePearStore()
  const pearClient = getPearClient()

  return useQuery({
    queryKey: PEAR_QUERY_KEYS.portfolio,
    queryFn: () => pearClient.getPortfolio(),
    enabled: isAuthenticated,
    staleTime: 10000,
  })
}

/**
 * Hook for fetching markets (no auth required)
 */
export function usePearMarkets(params?: {
  page?: number
  pageSize?: number
  searchText?: string
  sort?: string
}) {
  const pearClient = getPearClient()

  return useQuery({
    queryKey: [...PEAR_QUERY_KEYS.markets, params],
    queryFn: () => pearClient.getMarkets(params),
    staleTime: 30000, // Markets don't change that frequently
  })
}

/**
 * Hook for fetching active markets (no auth required)
 */
export function usePearActiveMarkets() {
  const pearClient = getPearClient()

  return useQuery({
    queryKey: PEAR_QUERY_KEYS.activeMarkets,
    queryFn: () => pearClient.getActiveMarkets(),
    staleTime: 30000,
  })
}

/**
 * Hook for creating a position
 */
export function useCreatePosition() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: (request: CreatePositionRequest) => pearClient.createPosition(request),
    onSuccess: () => {
      // Invalidate positions and orders queries
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.positions })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.orders })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.portfolio })
    },
  })
}

/**
 * Hook for closing a position
 */
export function useClosePosition() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: ({
      positionId,
      request,
    }: {
      positionId: string
      request: ClosePositionRequest
    }) => pearClient.closePosition(positionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.positions })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.orders })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.portfolio })
    },
  })
}

/**
 * Hook for closing all positions
 */
export function useCloseAllPositions() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: (request: ClosePositionRequest) => pearClient.closeAllPositions(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.positions })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.orders })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.portfolio })
    },
  })
}

/**
 * Hook for adjusting position size
 */
export function useAdjustPosition() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: ({
      positionId,
      request,
    }: {
      positionId: string
      request: AdjustPositionRequest
    }) => pearClient.adjustPosition(positionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.positions })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.portfolio })
    },
  })
}

/**
 * Hook for updating risk parameters (TP/SL)
 */
export function useUpdateRiskParameters() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: ({
      positionId,
      request,
    }: {
      positionId: string
      request: UpdateRiskParametersRequest
    }) => pearClient.updateRiskParameters(positionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.positions })
    },
  })
}

/**
 * Hook for canceling an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: (orderId: string) => pearClient.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.orders })
    },
  })
}

/**
 * Hook for canceling a TWAP order
 */
export function useCancelTwapOrder() {
  const queryClient = useQueryClient()
  const pearClient = getPearClient()

  return useMutation({
    mutationFn: (orderId: string) => pearClient.cancelTwapOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.twapOrders })
      queryClient.invalidateQueries({ queryKey: PEAR_QUERY_KEYS.orders })
    },
  })
}

/**
 * Helper hook for creating a pair trade
 */
export function usePairTrade() {
  const createPosition = useCreatePosition()

  const executePairTrade = useCallback(
    async ({
      longAsset,
      shortAsset,
      usdValue,
      leverage = 1,
      executionType = 'MARKET',
      slippage = 0.08,
      stopLoss,
      takeProfit,
    }: {
      longAsset: string
      shortAsset: string
      usdValue: number
      leverage?: number
      executionType?: 'MARKET' | 'TWAP'
      slippage?: number
      stopLoss?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
      takeProfit?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
    }) => {
      return createPosition.mutateAsync({
        slippage,
        executionType,
        leverage,
        usdValue,
        longAssets: [{ asset: longAsset, weight: 1 }],
        shortAssets: [{ asset: shortAsset, weight: 1 }],
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
      })
    },
    [createPosition]
  )

  return {
    executePairTrade,
    isLoading: createPosition.isPending,
    error: createPosition.error,
    data: createPosition.data,
    reset: createPosition.reset,
  }
}

/**
 * Helper hook for creating a basket trade
 */
export function useBasketTrade() {
  const createPosition = useCreatePosition()

  const executeBasketTrade = useCallback(
    async ({
      longAssets,
      shortAssets,
      usdValue,
      leverage = 1,
      executionType = 'MARKET',
      slippage = 0.08,
      stopLoss,
      takeProfit,
    }: {
      longAssets: Array<{ asset: string; weight: number }>
      shortAssets: Array<{ asset: string; weight: number }>
      usdValue: number
      leverage?: number
      executionType?: 'MARKET' | 'TWAP'
      slippage?: number
      stopLoss?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
      takeProfit?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
    }) => {
      return createPosition.mutateAsync({
        slippage,
        executionType,
        leverage,
        usdValue,
        longAssets,
        shortAssets,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
      })
    },
    [createPosition]
  )

  return {
    executeBasketTrade,
    isLoading: createPosition.isPending,
    error: createPosition.error,
    data: createPosition.data,
    reset: createPosition.reset,
  }
}

/**
 * Helper hook for creating a single asset trade
 */
export function useSingleAssetTrade() {
  const createPosition = useCreatePosition()

  const executeSingleTrade = useCallback(
    async ({
      asset,
      direction,
      usdValue,
      leverage = 1,
      executionType = 'MARKET',
      slippage = 0.08,
      stopLoss,
      takeProfit,
    }: {
      asset: string
      direction: 'long' | 'short'
      usdValue: number
      leverage?: number
      executionType?: 'MARKET' | 'TWAP'
      slippage?: number
      stopLoss?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
      takeProfit?: { type: 'PERCENTAGE' | 'DOLLAR'; value: number }
    }) => {
      const assetAllocation = [{ asset, weight: 1 }]

      return createPosition.mutateAsync({
        slippage,
        executionType,
        leverage,
        usdValue,
        longAssets: direction === 'long' ? assetAllocation : [],
        shortAssets: direction === 'short' ? assetAllocation : [],
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
      })
    },
    [createPosition]
  )

  return {
    executeSingleTrade,
    isLoading: createPosition.isPending,
    error: createPosition.error,
    data: createPosition.data,
    reset: createPosition.reset,
  }
}
