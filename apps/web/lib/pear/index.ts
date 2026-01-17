/**
 * Pear Protocol Integration Module
 *
 * Export all Pear-related functionality
 */

// Client
export { PearClient, getPearClient, resetPearClient, PEAR_CLIENT_ID, PEAR_API_BASE } from './client'

// Store
export { usePearStore } from './store'

// Hooks
export {
  // Auth
  usePearAuth,
  // Queries
  usePearPositions,
  usePearOrders,
  usePearTwapOrders,
  usePearPortfolio,
  usePearMarkets,
  usePearActiveMarkets,
  // Mutations
  useCreatePosition,
  useClosePosition,
  useCloseAllPositions,
  useAdjustPosition,
  useUpdateRiskParameters,
  useCancelOrder,
  useCancelTwapOrder,
  // Helper hooks
  usePairTrade,
  useBasketTrade,
  useSingleAssetTrade,
  // Query keys
  PEAR_QUERY_KEYS,
} from './hooks'

// Types
export type {
  // Auth
  EIP712Domain,
  EIP712Types,
  EIP712Message,
  EIP712Data,
  AuthTokens,
  AuthSession,
  // Assets
  AssetAllocation,
  PositionAsset,
  // Risk
  RiskParameterType,
  RiskParameter,
  // Orders
  ExecutionType,
  TriggerType,
  TriggerDirection,
  OrderStatus,
  Order,
  TwapChunk,
  TwapOrder,
  // Positions
  Position,
  // Markets
  Market,
  MarketsResponse,
  ActiveMarketsResponse,
  // Portfolio
  PortfolioPeriod,
  PortfolioOverall,
  Portfolio,
  // Requests
  CreatePositionRequest,
  ClosePositionRequest,
  AdjustPositionRequest,
  UpdateRiskParametersRequest,
  // Responses
  CreatePositionResponse,
  ClosePositionResponse,
  AdjustPositionResponse,
  // Errors
  PearApiError,
} from './types'
