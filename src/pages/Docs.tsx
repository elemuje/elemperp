import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, ExternalLink, Code, Wallet, Droplets,
  Zap, Shield, Terminal, AlertTriangle, ChevronRight,
} from 'lucide-react';

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay },
});

export function DocsPage() {
  const quickLinks = [
    {
      href:  'https://faucet.solana.com/',
      icon:  Droplets,
      color: 'text-cyan-400',
      bg:    'bg-cyan-500/10',
      hover: 'hover:border-cyan-500/25',
      title: 'Devnet SOL Faucet',
      desc:  'Get free Devnet SOL to pay gas fees on ELEMPerp. No real funds needed.',
    },
    {
      href:  'https://arcium.com/',
      icon:  Shield,
      color: 'text-violet-400',
      bg:    'bg-violet-500/10',
      hover: 'hover:border-violet-500/25',
      title: 'Arcium Network',
      desc:  'The MPC infrastructure powering confidential computation on ELEMPerp.',
    },
    {
      href:  'https://solana.com/',
      icon:  Zap,
      color: 'text-emerald-400',
      bg:    'bg-emerald-500/10',
      hover: 'hover:border-emerald-500/25',
      title: 'Solana Docs',
      desc:  'Core Solana developer docs — accounts, programs, and transaction structure.',
    },
    {
      href:  'https://phantom.app/',
      icon:  Wallet,
      color: 'text-amber-400',
      bg:    'bg-amber-500/10',
      hover: 'hover:border-amber-500/25',
      title: 'Phantom Wallet',
      desc:  'The most popular Solana wallet. Install and set to Devnet to start.',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Install a Solana wallet',
      body: 'Download Phantom, Solflare, or Backpack from their official sites. ELEMPerp supports all three. Create a new wallet — do not use a mainnet wallet for Devnet testing.',
      tip: 'Use a fresh wallet for Devnet. Don\'t mix your real assets with test tokens.',
    },
    {
      n: '02',
      title: 'Switch to Solana Devnet',
      body: 'Open your wallet\'s settings and change the network to "Solana Devnet". In Phantom: Settings → Developer Settings → Devnet. In Solflare: click the network badge at the top of the app.',
      tip: 'ELEMPerp shows a warning bar if your wallet is on mainnet — you can still browse but cannot settle trades.',
    },
    {
      n: '03',
      title: 'Get free Devnet SOL',
      body: 'Visit faucet.solana.com and paste your wallet address. You\'ll receive 1–2 Devnet SOL — enough for hundreds of transactions. The portfolio panel also has a direct faucet link once you\'re connected.',
      tip: 'Devnet SOL has no real value. Request as much as you need for testing.',
    },
    {
      n: '04',
      title: 'Connect your wallet on ELEMPerp',
      body: 'Click "Connect Wallet" in the top-right navbar. A picker will show your installed wallets. Select one and approve the connection in your wallet. No signature is required — connection is read-only until you trade.',
      tip: 'ELEMPerp never asks you to sign a message to connect. If a site does, it may be a phishing attempt.',
    },
    {
      n: '05',
      title: 'Open your first encrypted position',
      body: 'Navigate to Trade. Choose a pair (SOL-PERP, BTC-PERP, etc.), set size and leverage, pick Long or Short, and click the order button. Arcium\'s MPC processes the order. You\'ll see your position appear in the positions panel below the chart.',
      tip: 'Start with low leverage (1–5×) to understand how P&L and liquidation prices behave before going higher.',
    },
  ];

  const concepts = [
    {
      title: 'Perpetual futures',
      desc: 'Derivatives that track an asset\'s price indefinitely with no expiry date. You gain or lose based on price movement times your leverage. Funding rates keep the perp price anchored to spot.',
    },
    {
      title: 'Leverage',
      desc: 'Multiplies your exposure. 10× leverage on $100 controls a $1,000 notional position. Profits are amplified — so are losses. Liquidation occurs when losses consume your margin.',
    },
    {
      title: 'Mark price',
      desc: 'The fair-value price used for P&L calculation and liquidation. On ELEMPerp it\'s derived from Binance\'s real-time price feed via WebSocket, preventing sudden wick liquidations.',
    },
    {
      title: 'Funding rate',
      desc: 'A periodic payment between longs and shorts that keeps the perp price aligned to the underlying. Positive funding means longs pay shorts. Resets every 8 hours.',
    },
    {
      title: 'Arcium MPC',
      desc: 'Multi-party computation. A cryptographic technique where multiple nodes jointly evaluate a function on secret inputs without any node learning the plaintext. ELEMPerp uses it for all order matching and margin logic.',
    },
    {
      title: 'FHE (Fully Homomorphic Encryption)',
      desc: 'Encryption that allows arithmetic to be performed on ciphertext. The result, when decrypted, matches what you\'d get computing on the plaintext. ELEMPerp uses FHE to encrypt your order before it leaves your browser.',
    },
    {
      title: 'ZK proof',
      desc: 'A cryptographic proof that a computation was done correctly, without revealing the inputs. Arcium generates these proofs for every trade settlement so Solana can verify honesty without seeing your trade.',
    },
    {
      title: 'Liquidation',
      desc: 'When your margin falls below the maintenance threshold, your position is automatically closed. On ELEMPerp, the liquidation threshold itself is kept private inside Arcium MPC to prevent targeted attacks.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 gap-1.5">
            <BookOpen className="w-3 h-3" /> Documentation
          </Badge>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">ELEMPerp Docs</h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Everything you need to go from zero to trading encrypted perpetuals on Solana Devnet.
            No real funds required at any step.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid md:grid-cols-2 gap-3 mb-14">
          {quickLinks.map((l, i) => (
            <motion.a key={i} {...inView(i * 0.07)}
              href={l.href} target="_blank" rel="noopener noreferrer"
              className={`bg-[#0d111e] border border-white/[0.06] rounded-2xl p-5 ${l.hover} transition-all group flex items-start gap-4`}
            >
              <div className={`w-9 h-9 rounded-xl ${l.bg} flex items-center justify-center flex-shrink-0`}>
                <l.icon className={`w-4 h-4 ${l.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{l.title}</h3>
                  <ExternalLink className={`w-3.5 h-3.5 text-slate-600 group-hover:${l.color} transition-colors`} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{l.desc}</p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Getting started */}
        <section className="mb-14">
          <motion.div {...inView()} className="flex items-center gap-2.5 mb-6">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Getting started</h2>
          </motion.div>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <motion.div key={i} {...inView(i * 0.08)}
                className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-5 flex gap-5"
              >
                <span className="text-3xl font-black text-white/[0.06] tabular-nums flex-shrink-0 leading-none mt-0.5">{s.n}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1.5">{s.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{s.body}</p>
                  <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/[0.12]">
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400/80 leading-relaxed">{s.tip}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Key concepts */}
        <section className="mb-14">
          <motion.div {...inView()} className="flex items-center gap-2.5 mb-6">
            <Terminal className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold text-white">Key concepts</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-3">
            {concepts.map((c, i) => (
              <motion.div key={i} {...inView(i * 0.06)}
                className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight className="w-3 h-3 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Source code */}
        <motion.div {...inView()} className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Code className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white mb-0.5">Open source · MIT License</h3>
            <p className="text-xs text-slate-500">
              ELEMPerp is fully open source. The entire front-end, trading context, wallet integrations,
              and Arcium MPC simulation layer are available to inspect, fork, and contribute to.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
