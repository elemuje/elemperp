import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Shield, EyeOff, Users, BarChart3 } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  volume: number;
  trades: number;
  pnl: number;
  winRate: number;
  isPrivate: boolean;
}

function generateMockData(): LeaderboardEntry[] {
  const adjectives = ['Alpha', 'Crypto', 'DeFi', 'Solana', 'Arcium', 'MEV', 'Dark', 'Flash', 'Phantom', 'Ghost'];
  const nouns = ['Whale', 'Trader', 'Wizard', 'Hunter', 'Bot', 'King', 'Ninja', 'Shark', 'Bear', 'Bull'];
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < 50; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const isPrivate = Math.random() > 0.7;
    const volume = Math.random() * 5000 + 100;
    const winRate = Math.random() * 40 + 45;
    const trades = Math.floor(Math.random() * 500 + 20);
    const pnl = (Math.random() - 0.3) * volume * 0.4;
    entries.push({
      rank: i + 1,
      address: `${adj}${noun}_${Math.random().toString(36).substring(2, 6)}`,
      volume: Math.round(volume * 10) / 10,
      trades,
      pnl: Math.round(pnl * 10) / 10,
      winRate: Math.round(winRate * 10) / 10,
      isPrivate,
    });
  }
  return entries.sort((a, b) => b.pnl - a.pnl).map((e, i) => ({ ...e, rank: i + 1 }));
}

export function LeaderboardPage() {
  const [period, setPeriod] = useState('all');
  const data = useMemo(() => generateMockData(), []);

  const totalVolume = data.reduce((sum, e) => sum + e.volume, 0);
  const avgWinRate = data.reduce((sum, e) => sum + e.winRate, 0) / data.length;
  const privateCount = data.filter((e) => e.isPrivate).length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
            <Trophy className="w-3 h-3 mr-1.5" />
            Top Traders
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Rankings based on total P&L. Privacy-protected via Arcium — traders can optionally obfuscate their stats.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#131722] border border-white/5 rounded-xl p-4">
            <Users className="w-4 h-4 text-cyan-400 mb-2" />
            <p className="text-xl font-bold text-white">{data.length}</p>
            <p className="text-xs text-slate-500">Total Traders</p>
          </div>
          <div className="bg-[#131722] border border-white/5 rounded-xl p-4">
            <BarChart3 className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-xl font-bold text-white">{totalVolume.toFixed(1)}K SOL</p>
            <p className="text-xs text-slate-500">Total Volume</p>
          </div>
          <div className="bg-[#131722] border border-white/5 rounded-xl p-4">
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xl font-bold text-white">{avgWinRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Avg Win Rate</p>
          </div>
          <div className="bg-[#131722] border border-white/5 rounded-xl p-4">
            <EyeOff className="w-4 h-4 text-amber-400 mb-2" />
            <p className="text-xl font-bold text-white">{Math.round((privateCount / data.length) * 100)}%</p>
            <p className="text-xs text-slate-500">Private Trades</p>
          </div>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="mb-4">
          <TabsList className="bg-[#131722] border border-white/5">
            <TabsTrigger value="daily" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">Weekly</TabsTrigger>
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="bg-[#131722] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] text-slate-500 uppercase border-b border-white/5">
            <span className="col-span-1">Rank</span>
            <span className="col-span-3">Trader</span>
            <span className="col-span-2 text-right">Volume</span>
            <span className="col-span-2 text-right">Trades</span>
            <span className="col-span-2 text-right">PnL</span>
            <span className="col-span-2 text-right">Win Rate</span>
          </div>
          <div className="max-h-[600px] overflow-auto scrollbar-thin">
            {data.map((entry, i) => (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]"
              >
                <span className="col-span-1 text-xs font-mono text-slate-400">
                  {entry.rank <= 3 ? (
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      entry.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                      entry.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {entry.rank}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </span>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-xs font-mono text-white">
                    {entry.isPrivate ? '••••••' : entry.address}
                  </span>
                  {entry.isPrivate && (
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] px-1 py-0">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      Private
                    </Badge>
                  )}
                </div>
                <span className="col-span-2 text-right text-xs font-mono text-slate-300">{entry.volume.toFixed(1)}K</span>
                <span className="col-span-2 text-right text-xs font-mono text-slate-300">{entry.trades}</span>
                <span className={`col-span-2 text-right text-xs font-mono font-semibold ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(1)} SOL
                </span>
                <span className="col-span-2 text-right text-xs font-mono text-slate-300">{entry.winRate.toFixed(1)}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
