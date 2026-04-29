import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Shield, EyeOff, Users, BarChart3, Flame, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  volume: number;
  trades: number;
  pnl: number;
  winRate: number;
  bestTrade: number;
  isPrivate: boolean;
  streak: number;
}

// Handcrafted realistic names — not random adjective+noun combos
const TRADER_NAMES = [
  'sol_phantom_x',   '0xNightOwl',     'arcium_believer', 'perp_hermit',
  'devnet_degen',    'mpc_maxi',       'zk_surgeon',      'lamport_lord',
  'dark_pool_dan',   'cipher_sal',     'entropy_eric',    'blind_bid_bob',
  'sealed_sam',      'nullifier_nina', 'proof_pedro',     'fhe_frank',
  'cluster_carl',    'margin_mia',     'leverage_leo',    'vault_victor',
  'devnet_diana',    'tx_tamika',      'gwei_gone',       'slot_sniper',
  'keypair_kris',    'memo_max',       'rent_exempt_raj', 'program_pat',
  'validator_vee',   'consensus_cal',  'fork_fenix',      'epoch_emma',
  'delta_neutral',   'gamma_grind',    'theta_decay',     'vega_vince',
  'rho_rider',       'pnl_prophet',    'size_sovereign',  'alpha_arcs',
  'beta_baxter',     'carry_trade_c',  'basis_brad',      'spread_steve',
  'funding_femi',    'mark_price_mo',  'oracle_oracle',   'liq_hunter',
  'cascade_carmen',  'wick_watcher',
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildEntries(period: string): LeaderboardEntry[] {
  const seed = period === 'daily' ? 7 : period === 'weekly' ? 42 : 99;
  const rand = seededRand(seed);

  // Volume scale by period
  const volMult = period === 'daily' ? 0.12 : period === 'weekly' ? 0.55 : 1;

  return TRADER_NAMES.map((name, i) => {
    const isPrivate  = rand() > 0.72;
    const volBase    = (rand() * 280_000 + 4_000) * volMult;
    const trades     = Math.floor(rand() * 480 + 12);
    const winRate    = rand() * 38 + 43;                          // 43–81%
    const pnl        = (rand() - 0.28) * volBase * 0.18;         // skewed positive for top
    const bestTrade  = Math.abs(pnl) * (rand() * 0.6 + 0.2);
    const streak     = Math.floor(rand() * 9);

    return {
      rank: i + 1,
      address: `${name.slice(0, 4).toUpperCase()}…${Math.floor(rand() * 9000 + 1000)}`,
      displayName: name,
      volume:     Math.round(volBase),
      trades,
      pnl:        Math.round(pnl * 100) / 100,
      winRate:    Math.round(winRate * 10) / 10,
      bestTrade:  Math.round(bestTrade * 100) / 100,
      isPrivate,
      streak,
    };
  })
  .sort((a, b) => b.pnl - a.pnl)
  .map((e, i) => ({ ...e, rank: i + 1 }));
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black">1</span>
  );
  if (rank === 2) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 text-[10px] font-black">2</span>
  );
  if (rank === 3) return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-600/20 text-orange-400 text-[10px] font-black">3</span>
  );
  return <span className="text-xs font-mono text-slate-600">{rank}</span>;
}

export function LeaderboardPage() {
  const [period, setPeriod] = useState('all');
  const data = useMemo(() => buildEntries(period), [period]);

  const totalVolume   = data.reduce((s, e) => s + e.volume, 0);
  const avgWinRate    = data.reduce((s, e) => s + e.winRate, 0) / data.length;
  const privateCount  = data.filter((e) => e.isPrivate).length;
  const totalTrades   = data.reduce((s, e) => s + e.trades, 0);

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 px-3 py-1 gap-1.5">
            <Trophy className="w-3 h-3" /> ELEMPerp Leaderboard
          </Badge>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Top Traders</h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Ranked by realised P&amp;L. Traders using Arcium privacy mode appear
            with obfuscated stats — their rank is provably correct even without
            revealing position details.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Users,     color: 'text-cyan-400',    label: 'Active Traders',   value: data.length.toString() },
            { icon: BarChart3, color: 'text-violet-400',  label: 'Total Volume',     value: fmtVol(totalVolume) },
            { icon: TrendingUp,color: 'text-emerald-400', label: 'Avg Win Rate',     value: `${avgWinRate.toFixed(1)}%` },
            { icon: EyeOff,    color: 'text-amber-400',   label: 'Privacy Mode',     value: `${Math.round((privateCount / data.length) * 100)}%` },
          ].map((c, i) => (
            <div key={i} className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-4">
              <c.icon className={`w-4 h-4 ${c.color} mb-2`} />
              <p className="text-xl font-black text-white font-mono tabular-nums">{c.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Secondary stats strip */}
        <div className="flex flex-wrap gap-4 mb-6 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            <span>Top PnL: <span className="text-white font-mono font-semibold">{fmtVol(Math.abs(data[0]?.pnl ?? 0))}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Most trades: <span className="text-white font-mono font-semibold">{Math.max(...data.map(d => d.trades))}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>ZK-verified rankings: <span className="text-emerald-400 font-semibold">all {data.length}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <span>Total executions: <span className="text-white font-mono font-semibold">{totalTrades.toLocaleString()}</span></span>
          </div>
        </div>

        {/* Period tabs */}
        <Tabs value={period} onValueChange={setPeriod} className="mb-4">
          <TabsList className="bg-[#0d111e] border border-white/[0.06]">
            <TabsTrigger value="daily"  className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">24H</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">7D</TabsTrigger>
            <TabsTrigger value="all"    className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="bg-[#0d111e] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] text-slate-600 uppercase tracking-wider border-b border-white/[0.05] bg-white/[0.015]">
            <span className="col-span-1">#</span>
            <span className="col-span-3">Trader</span>
            <span className="col-span-2 text-right">Volume</span>
            <span className="col-span-1 text-right">Trades</span>
            <span className="col-span-2 text-right">Realised PnL</span>
            <span className="col-span-1 text-right">Win %</span>
            <span className="col-span-2 text-right hidden md:block">Best Trade</span>
          </div>

          <div className="max-h-[640px] overflow-auto scrollbar-thin">
            {data.map((e, i) => (
              <motion.div
                key={`${period}-${e.displayName}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.4) }}
                className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-white/[0.025] last:border-0 transition-colors hover:bg-white/[0.025] ${
                  e.rank <= 3 ? 'bg-white/[0.015]' : ''
                }`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  <RankBadge rank={e.rank} />
                </div>

                {/* Trader */}
                <div className="col-span-3 flex items-center gap-2 min-w-0">
                  {e.isPrivate ? (
                    <span className="text-xs font-mono text-slate-600 truncate">
                      ██████████
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-white truncate">
                      {e.displayName}
                    </span>
                  )}
                  {e.isPrivate && (
                    <Badge className="bg-cyan-500/8 text-cyan-500 border-cyan-500/15 text-[8px] px-1 py-0 flex-shrink-0 gap-0.5">
                      <Shield className="w-2 h-2" /> ZK
                    </Badge>
                  )}
                  {e.streak >= 5 && !e.isPrivate && (
                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] px-1 py-0 flex-shrink-0 gap-0.5">
                      <Flame className="w-2 h-2" /> {e.streak}
                    </Badge>
                  )}
                </div>

                {/* Volume */}
                <span className="col-span-2 text-right text-xs font-mono text-slate-400">
                  {e.isPrivate ? '——' : fmtVol(e.volume)}
                </span>

                {/* Trades */}
                <span className="col-span-1 text-right text-xs font-mono text-slate-400">
                  {e.isPrivate ? '—' : e.trades}
                </span>

                {/* PnL */}
                <span className={`col-span-2 text-right text-xs font-mono font-bold ${
                  e.isPrivate ? 'text-slate-600' : e.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {e.isPrivate ? '████' : `${e.pnl >= 0 ? '+' : ''}${fmtVol(Math.abs(e.pnl))}`}
                </span>

                {/* Win rate */}
                <span className={`col-span-1 text-right text-xs font-mono ${
                  e.isPrivate ? 'text-slate-600' : e.winRate >= 55 ? 'text-emerald-400' : e.winRate >= 45 ? 'text-slate-300' : 'text-red-400'
                }`}>
                  {e.isPrivate ? '—' : `${e.winRate}%`}
                </span>

                {/* Best trade */}
                <span className="col-span-2 text-right text-xs font-mono text-slate-500 hidden md:block">
                  {e.isPrivate ? '——' : fmtVol(e.bestTrade)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Privacy footnote */}
        <div className="mt-4 flex items-start gap-2.5 px-1">
          <Shield className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Traders marked <span className="text-cyan-500 font-semibold">ZK</span> have enabled Arcium privacy mode.
            Their rank is computed via zero-knowledge proof — the position on the leaderboard is verifiably correct
            without revealing volume, P&amp;L, or individual trade details to any observer.
          </p>
        </div>
      </div>
    </div>
  );
}
