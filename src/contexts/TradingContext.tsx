import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Trade, TradeHistoryItem, OrderBookEntry, ArciumStep, WalletBalance } from '@/types';

interface TradingContextType {
  positions: Trade[];
  tradeHistory: TradeHistoryItem[];
  orderBook: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
  markPrice: number;
  walletBalance: WalletBalance;
  arciumSteps: ArciumStep[];
  isExecuting: boolean;
  openPosition: (params: {
    pair: string;
    side: 'long' | 'short';
    size: number;
    leverage: number;
    orderType: 'market' | 'limit';
    stopLoss?: number;
    takeProfit?: number;
  }) => Promise<void>;
  closePosition: (id: string, percent?: number) => Promise<void>;
  updateMarkPrice: (externalPrice?: number) => void;
  refreshBalance: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const INITIAL_STEPS: ArciumStep[] = [
  { id: 1, label: 'Encrypting trade parameters', description: 'Client-side FHE encryption of size, leverage, and side', status: 'pending' },
  { id: 2, label: 'Submitting to Arcium MPC', description: 'Encrypted payload distributed to MPC cluster nodes', status: 'pending' },
  { id: 3, label: 'Confidential computation', description: 'Margin, liquidation, and PnL calculated in encrypted domain', status: 'pending' },
  { id: 4, label: 'ZK-proof verification', description: 'Verifiable result with zero-knowledge proof', status: 'pending' },
  { id: 5, label: 'Solana Devnet settlement', description: 'Writing verifiable result to on-chain program', status: 'pending' },
];

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [positions, setPositions] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>(() => {
    const saved = localStorage.getItem('elemperp_trade_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [markPrice, setMarkPrice] = useState(142.35);
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({ sol: 12.45, token: 5000, usdc: 1250.5 });
  const [arciumSteps, setArciumSteps] = useState<ArciumStep[]>(INITIAL_STEPS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>({ bids: [], asks: [] });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist trade history
  useEffect(() => {
    localStorage.setItem('elemperp_trade_history', JSON.stringify(tradeHistory));
  }, [tradeHistory]);

  // Simulate order book
  const generateOrderBook = useCallback((price: number) => {
    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];
    let bidTotal = 0;
    let askTotal = 0;
    for (let i = 1; i <= 12; i++) {
      const bidPrice = price - i * 0.05;
      const askPrice = price + i * 0.05;
      const bidSize = Math.round((Math.random() * 200 + 50) * 10) / 10;
      const askSize = Math.round((Math.random() * 200 + 50) * 10) / 10;
      bidTotal += bidSize;
      askTotal += askSize;
      bids.push({ price: bidPrice, size: bidSize, total: bidTotal, side: 'bid' });
      asks.push({ price: askPrice, size: askSize, total: askTotal, side: 'ask' });
    }
    setOrderBook({ bids: bids.reverse(), asks });
  }, []);

  // Update mark price and order book periodically
  useEffect(() => {
    generateOrderBook(markPrice);
    intervalRef.current = setInterval(() => {
      setMarkPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.8;
        const newPrice = Math.round((prev + change) * 100) / 100;
        generateOrderBook(newPrice);
        return newPrice;
      });
    }, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [generateOrderBook]);

  // Update unrealized PnL for positions
  useEffect(() => {
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.status === 'closed') return pos;
        const priceDiff = markPrice - pos.entryPrice;
        const rawPnl = pos.side === 'long'
          ? (priceDiff / pos.entryPrice) * pos.size * pos.leverage
          : (-priceDiff / pos.entryPrice) * pos.size * pos.leverage;
        return { ...pos, markPrice, unrealizedPnl: Math.round(rawPnl * 100) / 100 };
      })
    );
  }, [markPrice]);

  const refreshBalance = useCallback(() => {
    setWalletBalance((prev) => ({
      sol: Math.round((prev.sol + (Math.random() - 0.5) * 0.01) * 100) / 100,
      token: prev.token,
      usdc: prev.usdc,
    }));
  }, []);

  const updateMarkPrice = useCallback((externalPrice?: number) => {
    if (externalPrice && externalPrice > 0) {
      setMarkPrice(Math.round(externalPrice * 100) / 100);
    } else {
      setMarkPrice((prev) => Math.round((prev + (Math.random() - 0.5) * 1.2) * 100) / 100);
    }
  }, []);

  const simulateArciumFlow = useCallback(async (): Promise<void> => {
    setIsExecuting(true);
    const steps = INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' as const }));
    setArciumSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      setArciumSteps((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx < i ? 'completed' : idx === i ? 'active' : 'pending',
        }))
      );
    }

    await new Promise((r) => setTimeout(r, 600));
    setArciumSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
    setIsExecuting(false);
  }, []);

  const openPosition = useCallback(
    async (params: {
      pair: string;
      side: 'long' | 'short';
      size: number;
      leverage: number;
      orderType: 'market' | 'limit';
      stopLoss?: number;
      takeProfit?: number;
    }) => {
      await simulateArciumFlow();

      const entryPrice = params.orderType === 'market' ? markPrice : params.side === 'long' ? markPrice - 0.5 : markPrice + 0.5;
      const margin = params.size / params.leverage;
      const liqPrice = params.side === 'long'
        ? entryPrice * (1 - 0.9 / params.leverage)
        : entryPrice * (1 + 0.9 / params.leverage);

      const newTrade: Trade = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        pair: params.pair,
        side: params.side,
        size: params.size,
        leverage: params.leverage,
        entryPrice: Math.round(entryPrice * 100) / 100,
        markPrice,
        liquidationPrice: Math.round(liqPrice * 100) / 100,
        margin: Math.round(margin * 100) / 100,
        unrealizedPnl: 0,
        status: 'open',
        timestamp: Date.now(),
        orderType: params.orderType,
        stopLoss: params.stopLoss,
        takeProfit: params.takeProfit,
      };

      setPositions((prev) => [...prev, newTrade]);
      setWalletBalance((prev) => ({ ...prev, usdc: Math.round((prev.usdc - margin) * 100) / 100 }));
    },
    [markPrice, simulateArciumFlow]
  );

  const closePosition = useCallback(
    async (id: string, percent = 100) => {
      await simulateArciumFlow();

      setPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== id) return pos;
          if (percent >= 100) {
            const pnl = pos.unrealizedPnl;
            const historyItem: TradeHistoryItem = {
              ...pos,
              status: 'closed',
              exitPrice: markPrice,
              realizedPnl: pnl,
              pnlPercent: Math.round((pnl / pos.margin) * 10000) / 100,
              closeTimestamp: Date.now(),
            };
            setTradeHistory((h) => [historyItem, ...h].slice(0, 200));
            setWalletBalance((bal) => ({ ...bal, usdc: Math.round((bal.usdc + pos.margin + pnl) * 100) / 100 }));
            return { ...pos, status: 'closed' as const, exitPrice: markPrice, realizedPnl: pnl };
          }
          // Partial close
          const closeSize = pos.size * (percent / 100);
          const pnl = pos.unrealizedPnl * (percent / 100);
          const returnedMargin = pos.margin * (percent / 100);
          const historyItem: TradeHistoryItem = {
            ...pos,
            id: `${pos.id}_partial_${Date.now()}`,
            size: closeSize,
            status: 'closed',
            exitPrice: markPrice,
            realizedPnl: pnl,
            pnlPercent: Math.round((pnl / returnedMargin) * 10000) / 100,
            closeTimestamp: Date.now(),
          };
          setTradeHistory((h) => [historyItem, ...h].slice(0, 200));
          setWalletBalance((bal) => ({ ...bal, usdc: Math.round((bal.usdc + returnedMargin + pnl) * 100) / 100 }));
          return {
            ...pos,
            size: pos.size - closeSize,
            margin: pos.margin - returnedMargin,
            unrealizedPnl: pos.unrealizedPnl - pnl,
          };
        })
      );
    },
    [markPrice, simulateArciumFlow]
  );

  return (
    <TradingContext.Provider
      value={{
        positions,
        tradeHistory,
        orderBook,
        markPrice,
        walletBalance,
        arciumSteps,
        isExecuting,
        openPosition,
        closePosition,
        updateMarkPrice,
        refreshBalance,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be used within TradingProvider');
  return context;
}
