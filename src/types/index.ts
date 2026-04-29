export interface Trade {
  id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  margin: number;
  unrealizedPnl: number;
  realizedPnl?: number;
  exitPrice?: number;
  status: 'open' | 'closed';
  timestamp: number;
  closeTimestamp?: number;
  orderType: 'market' | 'limit';
  stopLoss?: number;
  takeProfit?: number;
  arciumTxHash?: string;
  arciumComputationAccount?: string;
}

export interface TradeHistoryItem extends Trade {
  pnlPercent: number;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  side: 'bid' | 'ask';
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  volume: number;
  trades: number;
  pnl: number;
  winRate: number;
  isPrivate: boolean;
}

export interface ArciumStep {
  id: number;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration?: number;
}

export interface WalletBalance {
  sol: number;
  token: number;
  usdc: number;
}

export type OrderType = 'market' | 'limit';
export type TradeSide = 'long' | 'short';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
