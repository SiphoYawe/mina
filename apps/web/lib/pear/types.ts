/**
 * Pear Protocol API Type Definitions
 */

// Authentication Types
export interface EIP712Domain {
  name: string
  version: string
  chainId: number
  verifyingContract: string
}

export interface EIP712Types {
  Authentication: Array<{ name: string; type: string }>
}

export interface EIP712Message {
  address: string
  clientId: string
  timestamp: number
  action: string
}

export interface EIP712Data {
  domain: EIP712Domain
  types: EIP712Types
  primaryType: string
  message: EIP712Message
  timestamp: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  address: string
  clientId: string
}

export interface AuthSession {
  tokens: AuthTokens
  expiresAt: number
}

// Asset Types
export interface AssetAllocation {
  asset: string
  weight: number
}

export interface PositionAsset {
  coin: string
  entryPrice: number
  actualSize: number
  leverage: number
  marginUsed: number
  positionValue: number
  unrealizedPnl: number
  entryPositionValue: number
  initialWeight: number
  fundingPaid: number
}

// Risk Parameters
export type RiskParameterType = 'PERCENTAGE' | 'DOLLAR' | 'POSITION_VALUE'

export interface RiskParameter {
  type: RiskParameterType
  value: number
  isTrailing?: boolean
  trailingDeltaValue?: number
  trailingActivationValue?: number
}

// Order Types
export type ExecutionType =
  | 'SYNC'
  | 'MARKET'
  | 'TRIGGER'
  | 'TWAP'
  | 'LADDER'
  | 'TP'
  | 'SL'
  | 'SPOT_MARKET'
  | 'SPOT_LIMIT'
  | 'SPOT_TWAP'

export type TriggerType =
  | 'PRICE'
  | 'PRICE_RATIO'
  | 'WEIGHTED_RATIO'
  | 'BTC_DOM'
  | 'CROSS_ASSET_PRICE'
  | 'PREDICTION_MARKET_OUTCOME'

export type TriggerDirection = 'MORE_THAN' | 'LESS_THAN'

export type OrderStatus = 'OPEN' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'

// Position Types
export interface Position {
  positionId: string
  address: string
  pearExecutionFlag: string
  stopLoss: RiskParameter | null
  takeProfit: RiskParameter | null
  entryRatio: number
  markRatio: number
  entryPriceRatio: number
  markPriceRatio: number
  entryPositionValue: number
  positionValue: number
  marginUsed: number
  unrealizedPnl: number
  unrealizedPnlPercentage: number
  longAssets: PositionAsset[]
  shortAssets: PositionAsset[]
  createdAt: string
  updatedAt: string
}

// Order Types
export interface Order {
  orderId: string
  address: string
  clientId: string
  positionId?: string
  parameters: {
    leverage: number
    usdValue: number
    reduceOnly: boolean
  }
  orderType: string
  status: OrderStatus
  longAssets: AssetAllocation[]
  shortAssets: AssetAllocation[]
  createdAt: string
  updatedAt: string
}

export interface TwapChunk {
  chunkId: string
  chunkIndex: number
  scheduledTime: string
  executedTime?: string
  status: string
  chunkSize: number
  fills: Array<{
    fillId: string
    assetName: string
    price: number
    size: number
    executedAt: string
  }>
  errorMessage?: string
}

export interface TwapOrder {
  orderId: string
  positionId: string
  address: string
  orderType: 'TWAP'
  longAssets: AssetAllocation[]
  shortAssets: AssetAllocation[]
  status: OrderStatus
  totalUsdValue: number
  filledUsdValue: number
  remainingUsdValue: number
  twapDuration: string
  twapIntervalSeconds: number
  twapChunkUsdValue: number
  randomizeExecution: boolean
  reduceOnly: boolean
  chunks: TwapChunk[]
  estimatedCompletionTime: string
  actualCompletionTime?: string
  remainingChunks: number
  createdAt: string
  updatedAt: string
}

// Market Types
export interface Market {
  key: string
  longAssets: AssetAllocation[]
  shortAssets: AssetAllocation[]
  openInterest: string
  volume: string
  ratio: string
  prevRatio: string
  change24h: string
  weightedRatio: string
  weightedPrevRatio: string
  weightedChange24h: string
  netFunding: string
}

export interface MarketsResponse {
  markets: Market[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ActiveMarketsResponse {
  active: Market[]
  topGainers: Market[]
  topLosers: Market[]
  highlighted: Market[]
  watchlist: Market[]
}

// Portfolio Types
export interface PortfolioPeriod {
  periodStart: string
  periodEnd: string
  volume: number
  openInterest: number
  winningTradesCount: number
  winningTradesUsd: number
  losingTradesCount: number
  losingTradesUsd: number
}

export interface PortfolioOverall {
  totalWinningTradesCount: number
  totalLosingTradesCount: number
  totalWinningUsd: number
  totalLosingUsd: number
  currentOpenInterest: number
  currentTotalVolume: number
  unrealizedPnl: number
  totalTrades: number
}

export interface Portfolio {
  intervals: {
    oneDay: PortfolioPeriod[]
    oneWeek: PortfolioPeriod[]
    oneMonth: PortfolioPeriod[]
    oneYear: PortfolioPeriod[]
    all: PortfolioPeriod[]
  }
  overall: PortfolioOverall
}

// Request Types
export interface CreatePositionRequest {
  slippage: number
  executionType: ExecutionType
  leverage: number
  usdValue: number
  longAssets?: AssetAllocation[]
  shortAssets?: AssetAllocation[]
  triggerValue?: string
  triggerType?: TriggerType
  direction?: TriggerDirection
  assetName?: string
  marketCode?: string
  twapDuration?: number
  twapIntervalSeconds?: number
  randomizeExecution?: boolean
  ladderConfig?: {
    ratioStart: number
    ratioEnd: number
    numberOfLevels: number
  }
  stopLoss?: RiskParameter | null
  takeProfit?: RiskParameter | null
  referralCode?: string
}

export interface ClosePositionRequest {
  executionType: 'MARKET' | 'TWAP'
  twapDuration?: number
  twapIntervalSeconds?: number
  randomizeExecution?: boolean
  referralCode?: string
}

export interface AdjustPositionRequest {
  adjustmentType: 'REDUCE' | 'INCREASE'
  adjustmentSize: number
  executionType: 'MARKET' | 'LIMIT'
  limitRatio?: number
  referralCode?: string
}

export interface UpdateRiskParametersRequest {
  stopLoss?: RiskParameter | null
  takeProfit?: RiskParameter | null
}

// Response Types
export interface CreatePositionResponse {
  orderId: string
  fills: Array<unknown>
}

export interface ClosePositionResponse {
  orderId: string
  executionTime: string
  chunksScheduled?: number
}

export interface AdjustPositionResponse {
  orderId: string
  status: string
  adjustmentType: string
  adjustmentSize: number
  newSize: number
  executedAt: string
}

// API Error
export interface PearApiError {
  message: string
  code?: string
  details?: unknown
}
