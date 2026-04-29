import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Lock, EyeOff, Zap, Fingerprint,
  Server, CheckCircle, AlertTriangle, ArrowRight,
  Key, Cpu, Network,
} from 'lucide-react';

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay },
});

export function PrivacyPage() {
  const principles = [
    {
      icon: Lock,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      title: 'Client-side encryption first',
      desc: 'Your trade parameters — size, direction, leverage, stop loss — are wrapped in FHE ciphertext on your device before a single byte is broadcast. Plaintext never touches the network.',
    },
    {
      icon: EyeOff,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      title: 'Positions are fully opaque on-chain',
      desc: 'Unlike GMX, dYdX, or Drift where your margin account is a public state account, ELEMPerp stores only encrypted blobs on Solana. No bot can read your liquidation price.',
    },
    {
      icon: Fingerprint,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      title: 'Confidential liquidation checks',
      desc: 'Margin health is evaluated inside Arcium\'s MPC cluster. The liquidation trigger fires based on a cryptographic condition — without revealing the exact margin level to any party.',
    },
    {
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      title: 'Zero order flow leakage',
      desc: 'Stop losses, take profits, and order sizes are all encrypted payloads. MEV searchers indexing the mempool see encrypted noise — your strategy is structurally invisible.',
    },
    {
      icon: Zap,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      title: 'MEV is structurally impossible',
      desc: 'Sandwich attacks require knowing the size and direction of an incoming order. Because both are hidden inside FHE ciphertext, there is nothing for a searcher to exploit.',
    },
    {
      icon: Server,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      title: 'On-chain verifiability without disclosure',
      desc: 'Every computation Arcium performs produces a ZK proof posted to Solana. Any observer can verify the settlement was honest — without learning what was actually computed.',
    },
  ];

  const flow = [
    {
      step: '01',
      icon: Key,
      title: 'Local encryption',
      detail: 'The browser applies Arcium\'s FHE scheme to your trade input. Size, leverage, and direction become a ciphertext. Your private key never leaves the wallet.',
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
    },
    {
      step: '02',
      icon: Network,
      title: 'MPC share distribution',
      detail: 'The encrypted payload is split into secret shares and distributed across Arcium\'s decentralised node cluster. No single node holds enough information to reconstruct the input.',
      color: 'text-violet-400',
      border: 'border-violet-500/20',
    },
    {
      step: '03',
      icon: Cpu,
      title: 'Blind computation',
      detail: 'Nodes jointly compute margin requirements, fee deductions, and liquidation thresholds directly on encrypted shares using multi-party computation. No decryption occurs at any point.',
      color: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    {
      step: '04',
      icon: Shield,
      title: 'ZK proof generation',
      detail: 'Arcium outputs a succinct zero-knowledge proof attesting that the computation followed the protocol rules exactly. This proof is the only thing that touches the public ledger.',
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    {
      step: '05',
      icon: Zap,
      title: 'Solana settlement',
      detail: 'The ZK proof is verified on-chain. The resulting encrypted position state is written to a Solana account. Validators confirm the proof is valid — they never see the trade.',
      color: 'text-rose-400',
      border: 'border-rose-500/20',
    },
  ];

  const guarantees = [
    { good: true,  text: 'Validators cannot read your position size or direction' },
    { good: true,  text: 'RPC nodes cannot see your stop loss or take profit levels' },
    { good: true,  text: 'MEV bots cannot front-run or sandwich your orders' },
    { good: true,  text: 'Block explorers cannot link your wallet to your trading strategy' },
    { good: true,  text: 'Liquidation bots cannot pre-calculate your exact threshold' },
    { good: true,  text: 'Settlement is verifiable by anyone, with zero information revealed' },
    { good: false, text: 'Privacy mode trades: stats hidden on leaderboard (you choose)' },
    { good: false, text: 'Devnet only — no mainnet assets involved at this stage' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-4 py-1.5 gap-1.5">
            <Shield className="w-3 h-3" /> Privacy Architecture
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            How your privacy is enforced
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            ELEMPerp does not ask you to trust a team, a multisig, or a centralised
            off-chain sequencer. Privacy is a cryptographic property enforced by
            Arcium's MPC network — verifiable on Solana, not dependent on anyone's good intentions.
          </p>
        </div>

        {/* Threat model strip */}
        <motion.div {...inView()} className="mb-12 bg-[#0d111e] border border-red-500/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">What attacks this eliminates</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-400">
            {[
              { attack: 'Sandwich attacks',       how: 'Order size and direction are ciphertext — nothing to exploit.' },
              { attack: 'Liquidation sniping',    how: 'Margin thresholds are computed inside MPC — bots cannot pre-calculate.' },
              { attack: 'Copy-trading via chain', how: 'Position state on-chain is encrypted — strategy is invisible.' },
            ].map((a, i) => (
              <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-red-500/[0.04] border border-red-500/[0.08]">
                <span className="font-semibold text-red-300 text-[11px]">✕ {a.attack}</span>
                <span className="text-[11px] text-slate-500 leading-relaxed">{a.how}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Principles grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-14">
          {principles.map((p, i) => (
            <motion.div key={i} {...inView(i * 0.08)}
              className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                <p.icon className={`w-4 h-4 ${p.color}`} />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{p.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Execution flow */}
        <div className="mb-14">
          <motion.div {...inView()} className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">End-to-end execution pipeline</h2>
            <p className="text-slate-500 text-xs">Five deterministic steps. Every one cryptographically enforced.</p>
          </motion.div>

          <div className="space-y-3">
            {flow.map((f, i) => (
              <motion.div key={i} {...inView(i * 0.1)}
                className={`flex items-start gap-5 bg-[#0d111e] border ${f.border} rounded-2xl p-5`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white/[0.03] border ${f.border} flex flex-col items-center justify-center flex-shrink-0`}>
                  <span className={`text-[8px] font-black ${f.color} tabular-nums`}>{f.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                    <h4 className="text-sm font-bold text-white">{f.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.detail}</p>
                </div>
                {i < flow.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-700 self-center flex-shrink-0 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <motion.div {...inView()} className="bg-[#0d111e] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Privacy guarantees & honest limitations</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-2.5">
            {guarantees.map((g, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  g.good ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                }`}>
                  <span className={`text-[9px] font-black ${g.good ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {g.good ? '✓' : '!'}
                  </span>
                </div>
                <span className={`text-xs leading-relaxed ${g.good ? 'text-slate-300' : 'text-slate-500'}`}>
                  {g.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
