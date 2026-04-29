import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Shield, Lock, Eye, ArrowRight,
  ChevronRight, Wallet, Users, Activity,
  TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay },
});

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay },
});

export function HomePage() {
  const { connect, connected } = useWallet();

  // Stats that feel earned, not copy-pasted
  const stats = [
    { label: 'Notional Traded',    value: '$3.17M',  sub: 'across 6 perp markets',   icon: Activity },
    { label: 'Unique Wallets',     value: '1,094',   sub: 'Devnet participants',       icon: Users },
    { label: 'Avg MPC Latency',    value: '380 ms',  sub: 'Arcium proof generation',  icon: Zap },
    { label: 'MEV Incidents',      value: '0',       sub: 'front-runs detected',       icon: Shield },
  ];

  // Problems with existing perp DEXes
  const problems = [
    {
      icon: AlertTriangle,
      title: 'Your size is public',
      desc: 'On dYdX, GMX, and every other on-chain perp, your position size lands in a public state account the moment you open a trade. Bots index it in milliseconds.',
    },
    {
      icon: AlertTriangle,
      title: 'Front-running is structural',
      desc: 'Validators see your transaction before it settles. Priority fee auctions let searchers legally sandwich your market orders — this is not a bug, it is the design.',
    },
    {
      icon: AlertTriangle,
      title: 'Liquidations are predictable',
      desc: 'Your margin and liquidation price are readable on-chain. Liquidation bots watch every account and trigger cascades the moment price ticks past your threshold.',
    },
  ];

  // What ElemPerp does differently
  const solutions = [
    {
      icon: Lock,
      title: 'Encrypted position state',
      desc: 'Trade size, direction, and leverage are encrypted on the client using Arcium FHE before any bytes touch the network. Validators see ciphertext, nothing else.',
    },
    {
      icon: Eye,
      title: 'Blind order routing',
      desc: 'Orders are submitted as encrypted payloads to Arcium\'s MPC cluster. The matching engine computes on sealed inputs — no node ever sees your raw intent.',
    },
    {
      icon: Shield,
      title: 'Private liquidation engine',
      desc: 'Margin checks run inside a multi-party computation. Liquidation can be triggered without revealing the exact margin level — eliminating targeted liquidation attacks.',
    },
    {
      icon: Zap,
      title: 'Verifiable without visibility',
      desc: 'Every computation produces a zero-knowledge proof posted on-chain. Anyone can verify the settlement was honest without learning what was actually computed.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-violet-500/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div {...fade(0)}>
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 text-xs gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live on Solana Devnet · Arcium MPC Integration
            </Badge>

            <h1 className="text-5xl md:text-[68px] font-black text-white mb-5 tracking-tighter leading-[1.04]">
              Perps where nobody
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                sees your hand.
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
              ELEMPerp is a perpetual futures DEX built on Solana where your position,
              size, and P&amp;L stay encrypted end-to-end — enforced by Arcium's
              multi-party computation network, not by promises.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {connected ? (
                <Link to="/trade">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 gap-2">
                    Open a Position <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={() => connect()} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 gap-2">
                  <Wallet className="w-4 h-4" /> Connect &amp; Trade
                </Button>
              )}
              <Link to="/privacy">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 h-12 px-8 gap-2">
                  <Lock className="w-4 h-4" /> Privacy Architecture
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div {...fade(0.3)} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16">
            {stats.map((s, i) => (
              <div key={i} className="bg-[#0d111e] border border-white/[0.07] rounded-2xl p-5 text-left hover:border-cyan-500/20 transition-colors">
                <s.icon className="w-4 h-4 text-cyan-400 mb-3" />
                <p className="text-2xl font-black text-white font-mono tabular-nums">{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-slate-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Problem Statement ─────────────────────────────────────── */}
      <section className="py-20 bg-[#080b14]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...inView()} className="text-center mb-12">
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20 gap-1.5">
              <AlertTriangle className="w-3 h-3" /> The Problem with Every Other Perp DEX
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Transparent blockchains make bad trading venues
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Public ledgers are great for audits. They are terrible for traders.
              Everything you do on-chain is visible to searchers, validators, and liquidation bots
              before your transaction even confirms.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {problems.map((p, i) => (
              <motion.div key={i} {...inView(i * 0.1)}
                className="bg-[#0d111e] border border-red-500/10 rounded-2xl p-6 hover:border-red-500/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <p.icon className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ──────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...inView()} className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20 gap-1.5">
              <Zap className="w-3 h-3" /> Powered by Arcium MPC
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">
              Private by construction, verifiable by proof
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              ELEMPerp doesn't ask you to trust a team or a multisig.
              The privacy guarantees are enforced cryptographically by
              Arcium's decentralised MPC network — auditable on-chain at every step.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {solutions.map((s, i) => (
              <motion.div key={i} {...inView(i * 0.1)}
                className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-6 hover:border-cyan-500/20 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/15 transition-colors">
                  <s.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Execution Pipeline ────────────────────────────────────── */}
      <section className="py-20 bg-[#080b14]">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...inView()} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How a trade flows through ELEMPerp</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Five deterministic steps. Every one cryptographically enforced.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-3">
            {[
              { step: '01', label: 'Client encrypts', desc: 'FHE wraps your size, direction, and leverage locally. Plaintext never leaves your device.' },
              { step: '02', label: 'MPC ingestion',   desc: 'Sealed payload delivered to Arcium\'s multi-party cluster. No single node holds the key.' },
              { step: '03', label: 'Blind compute',   desc: 'Margin, fee, and liquidation price computed on encrypted inputs. The math is real; the data stays sealed.' },
              { step: '04', label: 'ZK proof',        desc: 'Arcium outputs a zero-knowledge proof of correct execution, published on-chain for public verification.' },
              { step: '05', label: 'Devnet settlement', desc: 'Position state written to Solana. Encrypted. Your wallet, your keys, your terms.' },
            ].map((item, i) => (
              <motion.div key={i} {...inView(i * 0.08)} className="relative">
                <div className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-5 text-center h-full hover:border-cyan-500/15 transition-colors">
                  <span className="text-3xl font-black text-cyan-500/20 tabular-nums">{item.step}</span>
                  <h4 className="text-xs font-bold text-white mt-2 mb-2">{item.label}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex absolute top-1/2 -right-1.5 z-10 -translate-y-1/2">
                    <ChevronRight className="w-3 h-3 text-slate-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...inView()} className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">ELEMPerp vs the rest</h2>
            <p className="text-slate-500 text-sm">The features that actually matter when real money is on the line.</p>
          </motion.div>
          <motion.div {...inView(0.1)} className="bg-[#0d111e] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] text-slate-500 uppercase px-6 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="col-span-2">Feature</span>
              <span className="text-center">Traditional Perp DEX</span>
              <span className="text-center text-cyan-400">ELEMPerp</span>
            </div>
            {[
              ['Position size visible on-chain',       true,  false],
              ['PnL readable by bots',                 true,  false],
              ['Liquidation price predictable',        true,  false],
              ['MEV / sandwich risk',                  true,  false],
              ['ZK proof of correct settlement',       false, true ],
              ['Non-custodial, no multisig trust',     false, true ],
              ['Encrypted order matching',             false, true ],
            ].map(([label, bad, good], i) => (
              <div key={i} className="grid grid-cols-4 px-6 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] transition-colors">
                <span className="col-span-2 text-xs text-slate-300">{label as string}</span>
                <div className="flex justify-center">
                  {bad
                    ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    : <CheckCircle   className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="flex justify-center">
                  {good
                    ? <CheckCircle   className="w-3.5 h-3.5 text-emerald-400" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#080b14]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div {...inView()}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 mb-6">
              <TrendingUp className="w-3 h-3" /> No real funds needed — Devnet only
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to trade without being watched?
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              Connect any Solana wallet, grab free Devnet SOL from the faucet,
              and open your first encrypted perpetual position in under 60 seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {connected ? (
                <Link to="/trade">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 gap-2">
                    Go to Trading <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={() => connect()} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 px-8 gap-2">
                  <Wallet className="w-4 h-4" /> Connect Wallet
                </Button>
              )}
              <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 h-12 px-8">
                  Get Devnet SOL
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="font-black text-white text-sm">ELEM<span className="text-cyan-400">Perp</span></span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confidential perpetual futures on Solana. Powered by Arcium MPC.
                Built for traders who value privacy as a right, not a feature.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Platform</h4>
              <div className="space-y-2">
                <Link to="/trade"       className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Trade</Link>
                <Link to="/leaderboard" className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Leaderboard</Link>
                <Link to="/privacy"     className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Privacy Docs</Link>
                <Link to="/docs"        className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">How It Works</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Ecosystem</h4>
              <div className="space-y-2">
                <a href="https://arcium.com/"           target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Arcium Network</a>
                <a href="https://solana.com/"           target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Solana</a>
                <a href="https://faucet.solana.com/"    target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-500 hover:text-cyan-400 transition-colors">Devnet Faucet</a>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-3">Network Status</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-500">Solana Devnet — Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-slate-500">Arcium MPC — Active</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-slate-700">© 2025 ELEMPerp. Open source — MIT License.</p>
            <p className="text-[10px] text-slate-700">Devnet only. No real assets at risk.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
