/**
 * PortfolioPanel – right-side collapsible panel showing:
 *  • Wallet balances (SOL + USDC)
 *  • Open positions PnL summary
 *  • Funding rate info
 *  • Devnet faucet link
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useTrading } from '@/contexts/TradingContext';
import { Droplets, TrendingUp, TrendingDown, ExternalLink, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useState } from 'react';

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-mono font-semibold ${accent ?? 'text-white'}`}>{value}</span>
    </div>
  );
}

export function PortfolioPanel() {
  const { solBalance, publicKey } = useWallet();
  const { positions, walletBalance, tradeHistory } = useTrading();
  const [open, setOpen] = useState(true);

  const openPositions = positions.filter((p) => p.status === 'open');
  const totalPnl = openPositions.reduce((s, p) => s + p.unrealizedPnl, 0);
  const totalMargin = openPositions.reduce((s, p) => s + p.margin, 0);
  const pnlPct = totalMargin > 0 ? (totalPnl / totalMargin) * 100 : 0;

  const totalTrades = tradeHistory.length;
  const wins = tradeHistory.filter((t) => (t.realizedPnl ?? 0) > 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(0) : '—';

  // Mock funding rates (in a real DEX these come from the protocol)
  const fundingRates: Record<string, string> = {
    'SOL-PERP': '+0.0082%', 'BTC-PERP': '+0.0100%', 'ETH-PERP': '-0.0034%',
    'JTO-PERP': '+0.0150%', 'JUP-PERP': '+0.0071%', 'BONK-PERP': '+0.0200%',
  };

  return (
    <div className="bg-[#0d111e] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" /> Portfolio
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Balances */}
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Balances</p>
                <StatRow label="SOL" value={`${solBalance.toFixed(4)} SOL`} />
                <StatRow label="USDC" value={`${walletBalance.usdc.toFixed(2)} USDC`} />
              </div>

              {/* PnL */}
              {openPositions.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Open Positions</p>
                  <StatRow label="Count" value={`${openPositions.length}`} />
                  <StatRow
                    label="Unrealised PnL"
                    value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} USDC`}
                    accent={totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}
                  />
                  <StatRow
                    label="ROE"
                    value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
                    accent={pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}
                  />
                  <StatRow label="Margin Used" value={`${totalMargin.toFixed(2)} USDC`} />
                </div>
              )}

              {/* Trade Stats */}
              {totalTrades > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Statistics</p>
                  <StatRow label="Total Trades" value={`${totalTrades}`} />
                  <StatRow label="Win Rate" value={`${winRate}%`} accent={Number(winRate) >= 50 ? 'text-emerald-400' : 'text-red-400'} />
                </div>
              )}

              {/* Funding rates */}
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Funding Rates (8H)</p>
                {Object.entries(fundingRates).map(([pair, rate]) => {
                  const isPos = rate.startsWith('+');
                  return (
                    <div key={pair} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                      <span className="text-[11px] text-slate-500">{pair}</span>
                      <span className={`text-[11px] font-mono flex items-center gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {rate}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Devnet faucet */}
              {publicKey && (
                <div className="pt-1">
                  <a
                    href={`https://faucet.solana.com?pubkey=${publicKey.toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 hover:bg-cyan-500/10 hover:border-cyan-500/25 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[11px] text-cyan-400 font-medium">Get Devnet SOL</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-cyan-500/50 group-hover:text-cyan-400 transition-colors" />
                  </a>
                  <p className="text-[10px] text-slate-600 mt-1.5 text-center">
                    {publicKey.toString().slice(0, 8)}…{publicKey.toString().slice(-6)}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
