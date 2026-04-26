import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, EyeOff, Zap, Fingerprint, Server, CheckCircle, ArrowRight } from 'lucide-react';

export function PrivacyPage() {
  const principles = [
    {
      icon: Lock,
      title: 'Encrypted Execution',
      desc: 'Every trade is encrypted client-side before submission. The plaintext never leaves your browser.',
    },
    {
      icon: EyeOff,
      title: 'Hidden Positions',
      desc: 'Position sizes, margin levels, and liquidation prices are never visible on-chain or to validators.',
    },
    {
      icon: Fingerprint,
      title: 'Confidential Liquidation',
      desc: 'Liquidation math runs inside the Arcium MPC cluster. No one can front-run your margin call.',
    },
    {
      icon: Shield,
      title: 'No Information Leakage',
      desc: 'Order flow, stop losses, and take profits are encrypted. MEV bots cannot read your strategy.',
    },
    {
      icon: Zap,
      title: 'MEV Resistance',
      desc: 'Because trade parameters are hidden, sandwich attacks and priority gas auction exploitation are impossible.',
    },
    {
      icon: Server,
      title: 'Verifiable Computation',
      desc: 'Arcium generates zero-knowledge proofs so the chain can verify correctness without seeing the inputs.',
    },
  ];

  const flow = [
    {
      step: '1',
      title: 'User submits trade',
      detail: 'Size, leverage, and direction are encrypted using FHE in the browser.',
    },
    {
      step: '2',
      title: 'Arcium MPC receives shares',
      detail: 'Encrypted payload is split into shares and distributed to MPC cluster nodes.',
    },
    {
      step: '3',
      title: 'Confidential computation',
      detail: 'Nodes compute margin, liquidation price, and PnL without decrypting individual shares.',
    },
    {
      step: '4',
      title: 'ZK-proof verification',
      detail: 'A verifiable proof is generated attesting that computation followed protocol rules.',
    },
    {
      step: '5',
      title: 'Solana Devnet settlement',
      detail: 'Only the proof and final state transition are posted on-chain. Inputs remain secret.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
            <Shield className="w-3 h-3 mr-1.5" />
            Privacy Architecture
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-4">How Privacy Works</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            ElemPerp DEX uses Arcium's fully homomorphic encryption (FHE) and multi-party computation (MPC) 
            to ensure your trading data remains completely confidential while still being verifiable on-chain.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-16">
          {principles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#131722] border border-white/5 rounded-xl p-6 hover:border-cyan-500/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Technical Execution Flow</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            The complete pipeline from trade submission to on-chain settlement
          </p>
          <div className="space-y-4">
            {flow.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-4 bg-[#131722] border border-white/5 rounded-xl p-5"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-cyan-400">{f.step}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">{f.title}</h4>
                  <p className="text-xs text-slate-400">{f.detail}</p>
                </div>
                {i < flow.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-600 mt-3 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Privacy Guarantees</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'No validator can read your position size',
              'No RPC provider can see your stop loss',
              'No MEV bot can front-run your trade',
              'No explorer can link your wallet to your strategy',
              'Computation remains verifiable without disclosure',
              'You control what data remains private vs. public',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
