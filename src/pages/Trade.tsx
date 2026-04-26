import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useTrading } from '@/contexts/TradingContext';
import { useToast } from '@/contexts/ToastContext';
import { LiveChart } from '@/components/LiveChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp, TrendingDown, Lock, Eye, Wallet,
  X, Clock, Shield, Activity,
} from 'lucide-react';

export function TradePage() {
  const { connected, publicKey } = useWallet();
  const {
    orderBook, markPrice, positions, tradeHistory,
    openPosition, closePosition, isExecuting, walletBalance,
    updateMarkPrice,
  } = useTrading();
  const { addToast } = useToast();

  const [orderType, setOrderType]     = useState<'market' | 'limit'>('market');
  const [side, setSide]               = useState<'long' | 'short'>('long');
  const [size, setSize]               = useState('100');
  const [leverage, setLeverage]       = useState([10]);
  const [limitPrice, setLimitPrice]   = useState(markPrice.toFixed(2));
  const [stopLoss, setStopLoss]       = useState('');
  const [takeProfit, setTakeProfit]   = useState('');
  const [selectedPair, setSelectedPair] = useState('SOL-PERP');
  const [privacyMode, setPrivacyMode] = useState(true);
  const [activeTab, setActiveTab]     = useState('positions');
  const [livePrice, setLivePrice]     = useState<number | null>(null);
  const [partialClosePercent]         = useState(100);

  const pairs = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'JTO-PERP', 'JUP-PERP', 'BONK-PERP'];

  // Use live Binance price if available, otherwise fall back to simulated
  const displayPrice = livePrice ?? markPrice;
  const margin = parseFloat(size || '0') / leverage[0];
  const fee    = parseFloat(size || '0') * 0.0008;

  const handlePriceUpdate = useCallback((price: number) => {
    setLivePrice(price);
    updateMarkPrice();           // keep TradingContext in sync
  }, [updateMarkPrice]);

  const handleSubmit = async () => {
    if (!connected || !publicKey) {
      addToast({ type: 'error', title: 'Wallet not connected', message: 'Connect your wallet to start trading' });
      return;
    }
    try {
      await openPosition({
        pair: selectedPair,
        side,
        size: parseFloat(size),
        leverage: leverage[0],
        orderType,
        stopLoss:    stopLoss    ? parseFloat(stopLoss)    : undefined,
        takeProfit:  takeProfit  ? parseFloat(takeProfit)  : undefined,
      });
      addToast({
        type: 'success',
        title: 'Position opened',
        message: `${side.toUpperCase()} ${size} ${selectedPair} @ ${leverage[0]}x`,
      });
    } catch {
      addToast({ type: 'error', title: 'Trade failed', message: 'Transaction was rejected or failed' });
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closePosition(id, partialClosePercent);
      addToast({ type: 'success', title: 'Position closed', message: `${partialClosePercent}% of position closed` });
    } catch {
      addToast({ type: 'error', title: 'Close failed', message: 'Unable to close position' });
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] pt-14 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
            <Wallet className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Connect a Solana wallet to start trading on ELEMPerp DEX. Supports Phantom, Solflare, and Backpack.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-[1440px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Left: Pair Selector + Order Book ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Pair selector */}
          <div className="bg-[#131722] rounded-lg border border-white/5 p-3">
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none cursor-pointer"
            >
              {pairs.map((p) => (
                <option key={p} value={p} className="bg-[#131722]">{p}</option>
              ))}
            </select>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-white font-mono">
                {displayPrice.toFixed(displayPrice < 1 ? 5 : 2)}
              </span>
              <span className={`text-xs ${livePrice ? 'text-emerald-400' : 'text-slate-500'}`}>
                {livePrice ? '● Live' : '○ Simulated'}
              </span>
            </div>
          </div>

          {/* Order Book */}
          <div className="bg-[#131722] rounded-lg border border-white/5 flex-1 min-h-[400px]">
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-400">Order Book</span>
              <span className="text-[10px] text-slate-500">Spread: 0.05</span>
            </div>
            <div className="grid grid-cols-3 gap-1 px-3 py-2 text-[10px] text-slate-500 uppercase">
              <span>Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total</span>
            </div>
            <ScrollArea className="h-[320px]">
              <div className="space-y-0.5 px-1">
                {orderBook.asks.slice().reverse().map((ask, i) => (
                  <div key={`ask-${i}`} className="grid grid-cols-3 gap-1 px-2 py-0.5 text-[11px] relative group cursor-pointer hover:bg-white/5">
                    <div className="absolute inset-0 bg-red-500/10" style={{ width: `${Math.min((ask.size / 200) * 100, 100)}%`, right: 0, left: 'auto' }} />
                    <span className="relative text-red-400 font-mono">{ask.price.toFixed(2)}</span>
                    <span className="relative text-right text-slate-300 font-mono">{ask.size.toFixed(1)}</span>
                    <span className="relative text-right text-slate-500 font-mono">{ask.total.toFixed(1)}</span>
                  </div>
                ))}
                <div className="py-2 text-center">
                  <span className="text-xs font-bold text-white font-mono">{displayPrice.toFixed(2)}</span>
                </div>
                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="grid grid-cols-3 gap-1 px-2 py-0.5 text-[11px] relative group cursor-pointer hover:bg-white/5">
                    <div className="absolute inset-0 bg-emerald-500/10" style={{ width: `${Math.min((bid.size / 200) * 100, 100)}%`, right: 0, left: 'auto' }} />
                    <span className="relative text-emerald-400 font-mono">{bid.price.toFixed(2)}</span>
                    <span className="relative text-right text-slate-300 font-mono">{bid.size.toFixed(1)}</span>
                    <span className="relative text-right text-slate-500 font-mono">{bid.total.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* ── Center: Live Chart + Positions ── */}
        <div className="lg:col-span-6 flex flex-col gap-4">

          {/* Chart */}
          <div className="bg-[#131722] rounded-lg border border-white/5 h-[420px] lg:h-[540px] flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
              <span className="text-sm font-semibold text-white">{selectedPair}</span>
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">PERPETUAL</Badge>
              <div className="ml-auto">
                <button
                  className={`p-1 rounded transition-colors ${privacyMode ? 'text-cyan-400' : 'text-slate-500 hover:text-white'}`}
                  onClick={() => setPrivacyMode(!privacyMode)}
                  title={privacyMode ? 'Privacy On' : 'Privacy Off'}
                >
                  {privacyMode ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <LiveChart
                pair={selectedPair}
                markPrice={markPrice}
                onPriceUpdate={handlePriceUpdate}
              />
            </div>
          </div>

          {/* Positions / History Tabs */}
          <div className="bg-[#131722] rounded-lg border border-white/5 min-h-[280px]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <TabsList className="bg-transparent h-8">
                  <TabsTrigger value="positions" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
                    Positions ({positions.filter((p) => p.status === 'open').length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
                    History ({tradeHistory.length})
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">
                    Open Orders (0)
                  </TabsTrigger>
                </TabsList>
              </div>

              {activeTab === 'positions' && (
                <div className="p-3">
                  {positions.filter((p) => p.status === 'open').length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No open positions</p>
                      <p className="text-xs text-slate-600 mt-1">Start trading to see your positions here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 uppercase px-2">
                        <span className="col-span-2">Pair</span>
                        <span className="col-span-1">Side</span>
                        <span className="col-span-2">Size</span>
                        <span className="col-span-2">Entry</span>
                        <span className="col-span-2">Mark</span>
                        <span className="col-span-2">PnL</span>
                        <span className="col-span-1" />
                      </div>
                      {positions.filter((p) => p.status === 'open').map((pos) => (
                        <motion.div key={pos.id} layout className="grid grid-cols-12 gap-2 items-center px-2 py-2.5 rounded-md bg-white/[0.02] border border-white/5">
                          <span className="col-span-2 text-xs font-medium text-white">{pos.pair}</span>
                          <Badge className={`col-span-1 w-fit text-[10px] ${pos.side === 'long' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                            {pos.side.toUpperCase()}
                          </Badge>
                          <span className="col-span-2 text-xs font-mono text-slate-300">{pos.size} USDC</span>
                          <span className="col-span-2 text-xs font-mono text-slate-400">{pos.entryPrice.toFixed(2)}</span>
                          <span className="col-span-2 text-xs font-mono text-slate-400">{pos.markPrice.toFixed(2)}</span>
                          <span className={`col-span-2 text-xs font-mono font-semibold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl.toFixed(2)} ({((pos.unrealizedPnl / pos.margin) * 100).toFixed(1)}%)
                          </span>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              size="sm" variant="ghost"
                              className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleClose(pos.id)}
                              disabled={isExecuting}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="col-span-12 flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-500">Liq: <span className="font-mono text-slate-400">{pos.liquidationPrice.toFixed(2)}</span></span>
                            <span className="text-[10px] text-slate-500">Lev: <span className="font-mono text-slate-400">{pos.leverage}x</span></span>
                            {pos.stopLoss   && <span className="text-[10px] text-slate-500">SL: <span className="font-mono text-red-400">{pos.stopLoss}</span></span>}
                            {pos.takeProfit && <span className="text-[10px] text-slate-500">TP: <span className="font-mono text-emerald-400">{pos.takeProfit}</span></span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-3">
                  {tradeHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No trade history</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto scrollbar-thin">
                      <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 uppercase px-2 sticky top-0 bg-[#131722]">
                        <span className="col-span-2">Pair</span>
                        <span className="col-span-1">Side</span>
                        <span className="col-span-2">Entry/Exit</span>
                        <span className="col-span-2">PnL</span>
                        <span className="col-span-2">Size</span>
                        <span className="col-span-3">Time</span>
                      </div>
                      {tradeHistory.map((trade) => (
                        <div key={trade.id} className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-md hover:bg-white/[0.02]">
                          <span className="col-span-2 text-xs text-white">{trade.pair}</span>
                          <Badge className={`col-span-1 w-fit text-[10px] ${trade.side === 'long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {trade.side.toUpperCase()}
                          </Badge>
                          <span className="col-span-2 text-xs font-mono text-slate-400">
                            {trade.entryPrice.toFixed(2)} → {trade.exitPrice?.toFixed(2)}
                          </span>
                          <span className={`col-span-2 text-xs font-mono font-semibold ${(trade.realizedPnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(trade.realizedPnl || 0) >= 0 ? '+' : ''}{(trade.realizedPnl || 0).toFixed(2)} ({trade.pnlPercent}%)
                          </span>
                          <span className="col-span-2 text-xs font-mono text-slate-400">{trade.size} USDC</span>
                          <span className="col-span-3 text-[10px] font-mono text-slate-500">
                            {new Date(trade.closeTimestamp || trade.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No open orders</p>
                </div>
              )}
            </Tabs>
          </div>
        </div>

        {/* ── Right: Order Panel ── */}
        <div className="lg:col-span-3">
          <div className="bg-[#131722] rounded-lg border border-white/5 p-4 sticky top-16">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400">Place Order</span>
              <div className="flex items-center gap-1">
                {privacyMode ? <Lock className="w-3 h-3 text-cyan-400" /> : <Eye className="w-3 h-3 text-slate-500" />}
                <span className="text-[10px] text-cyan-400">{privacyMode ? 'Private' : 'Public'}</span>
              </div>
            </div>

            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')} className="mb-4">
              <TabsList className="w-full grid grid-cols-2 bg-[#1a1f2e]">
                <TabsTrigger value="market" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Market</TabsTrigger>
                <TabsTrigger value="limit"  className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Limit</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setSide('long')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  side === 'long' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#1a1f2e] text-slate-400 border border-transparent'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Long
              </button>
              <button onClick={() => setSide('short')}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  side === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#1a1f2e] text-slate-400 border border-transparent'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" /> Short
              </button>
            </div>

            {orderType === 'limit' && (
              <div className="mb-3">
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Limit Price</label>
                <div className="relative">
                  <Input
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="bg-[#1a1f2e] border-white/5 text-white text-sm font-mono pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">USDC</span>
                </div>
              </div>
            )}

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-slate-500 uppercase">Size</label>
                <span className="text-[10px] text-slate-500">Avail: <span className="font-mono text-white">{walletBalance.usdc.toFixed(1)}</span> USDC</span>
              </div>
              <div className="relative">
                <Input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  type="number" min="1"
                  className="bg-[#1a1f2e] border-white/5 text-white text-sm font-mono pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">USDC</span>
              </div>
              {/* Quick size buttons */}
              <div className="flex gap-1 mt-1.5">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSize(((walletBalance.usdc * pct) / 100).toFixed(0))}
                    className="flex-1 text-[10px] py-1 rounded bg-white/5 hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-slate-500 uppercase">Leverage</label>
                <span className="text-xs font-mono text-cyan-400">{leverage[0]}x</span>
              </div>
              <Slider value={leverage} onValueChange={setLeverage} min={1} max={50} step={1} className="py-2" />
              <div className="flex justify-between mt-1">
                {[1, 5, 10, 25, 50].map((l) => (
                  <button key={l} onClick={() => setLeverage([l])} className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors">
                    {l}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Stop Loss</label>
                <Input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} type="number" placeholder="0.00"
                  className="bg-[#1a1f2e] border-white/5 text-white text-xs font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase mb-1 block">Take Profit</label>
                <Input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} type="number" placeholder="0.00"
                  className="bg-[#1a1f2e] border-white/5 text-white text-xs font-mono" />
              </div>
            </div>

            <div className="space-y-2 mb-4 py-3 border-t border-b border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Margin Required</span>
                <span className="font-mono text-white">{margin.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Trading Fee (0.08%)</span>
                <span className="font-mono text-white">{fee.toFixed(3)} USDC</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Est. Liq. Price</span>
                <span className="font-mono text-red-400">
                  {side === 'long'
                    ? (displayPrice * (1 - 0.9 / leverage[0])).toFixed(2)
                    : (displayPrice * (1 + 0.9 / leverage[0])).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Notional Value</span>
                <span className="font-mono text-white">{(parseFloat(size || '0')).toFixed(2)} USDC</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isExecuting}
              className={`w-full h-11 text-sm font-bold transition-all ${
                side === 'long'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-red-500 hover:bg-red-400 text-black'
              }`}
            >
              {isExecuting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Processing via Arcium…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {side === 'long' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {side === 'long' ? 'Buy / Long' : 'Sell / Short'} {selectedPair}
                </span>
              )}
            </Button>

            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-md bg-cyan-500/5 border border-cyan-500/10">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-400">MEV-resistant via Arcium MPC</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
