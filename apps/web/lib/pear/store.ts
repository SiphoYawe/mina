/**
 * Pear Protocol Zustand Store
 *
 * Manages Pear authentication state and session
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, Position, Order, Portfolio } from './types'

interface PearState {
  // Auth state
  isAuthenticated: boolean
  isAuthenticating: boolean
  session: AuthSession | null
  authError: string | null

  // Trading state
  positions: Position[]
  orders: Order[]
  portfolio: Portfolio | null
  isLoadingPositions: boolean
  isLoadingOrders: boolean
  isLoadingPortfolio: boolean

  // Actions
  setAuthenticating: (isAuthenticating: boolean) => void
  setSession: (session: AuthSession | null) => void
  setAuthError: (error: string | null) => void
  clearAuth: () => void

  setPositions: (positions: Position[]) => void
  setOrders: (orders: Order[]) => void
  setPortfolio: (portfolio: Portfolio | null) => void
  setLoadingPositions: (loading: boolean) => void
  setLoadingOrders: (loading: boolean) => void
  setLoadingPortfolio: (loading: boolean) => void

  reset: () => void
}

const initialState = {
  isAuthenticated: false,
  isAuthenticating: false,
  session: null,
  authError: null,
  positions: [],
  orders: [],
  portfolio: null,
  isLoadingPositions: false,
  isLoadingOrders: false,
  isLoadingPortfolio: false,
}

export const usePearStore = create<PearState>()(
  persist(
    (set) => ({
      ...initialState,

      setAuthenticating: (isAuthenticating) =>
        set({ isAuthenticating, authError: null }),

      setSession: (session) =>
        set({
          session,
          isAuthenticated: session !== null,
          isAuthenticating: false,
          authError: null,
        }),

      setAuthError: (authError) =>
        set({ authError, isAuthenticating: false }),

      clearAuth: () =>
        set({
          isAuthenticated: false,
          session: null,
          authError: null,
          positions: [],
          orders: [],
          portfolio: null,
        }),

      setPositions: (positions) => set({ positions }),
      setOrders: (orders) => set({ orders }),
      setPortfolio: (portfolio) => set({ portfolio }),
      setLoadingPositions: (isLoadingPositions) => set({ isLoadingPositions }),
      setLoadingOrders: (isLoadingOrders) => set({ isLoadingOrders }),
      setLoadingPortfolio: (isLoadingPortfolio) => set({ isLoadingPortfolio }),

      reset: () => set(initialState),
    }),
    {
      name: 'pear-store',
      partialize: (state) => ({
        // Only persist auth-related state
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
