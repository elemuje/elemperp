import { motion, AnimatePresence } from 'framer-motion';
import { useTrading } from '@/contexts/TradingContext';
import { ExternalLink, Shield } from 'lucide-react';

export function ArciumExecutionPanel() {
  const { arciumSteps, isExecuting, positions } = useTrading();

  // Find the most recent trade with an Arcium tx hash (post-execution)
  const lastTrade = [...positions].reverse().find((p) => p.arciumTxHash);
  const justFinished = !isExecuting && lastTrade && arciumSteps.every((s) => s.status === 'completed');

  if (!isExecuting && !justFinished) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="arcium-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[500px] max-w-[94vw]"
      >
        <div className="bg-[#080c18]/97 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl p-5 shadow-[0_0_60px_rgba(6,182,212,0.08)]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">Arcium MPC — Real Encryption</span>
            <span className="ml-auto text-[10px] font-mono text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded">
              @arcium-hq/client v0.9.7
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-2.5">
            {arciumSteps.map((step, i) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {step.status === 'completed' && (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {step.status === 'active' && (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {step.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-700" />
                  )}
                  {step.status === 'error' && (
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold ${
                    step.status === 'active'    ? 'text-cyan-300' :
                    step.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{step.description}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-700">0{i + 1}</span>
              </div>
            ))}
          </div>

          {/* Post-execution: show real Arcium computation details */}
          {justFinished && lastTrade?.arciumTxHash && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-white/[0.05] space-y-2"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                Arcium Computation Details
              </p>

              <div className="flex items-center justify-between gap-2 bg-white/[0.02] rounded-lg px-3 py-2">
                <span className="text-[10px] text-slate-500">Computation Offset</span>
                <span className="text-[10px] font-mono text-cyan-400 truncate max-w-[220px]">
                  {lastTrade.arciumTxHash.slice(0, 32)}…
                </span>
              </div>

              {lastTrade.arciumComputationAccount && (
                <div className="flex items-center justify-between gap-2 bg-white/[0.02] rounded-lg px-3 py-2">
                  <span className="text-[10px] text-slate-500">Computation Account</span>
                  <a
                    href={`https://explorer.solana.com/address/${lastTrade.arciumComputationAccount}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {lastTrade.arciumComputationAccount.slice(0, 8)}…{lastTrade.arciumComputationAccount.slice(-6)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.04] border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-400">
                  Trade encrypted via x25519 + RescueCipher · Arcium Program: Arcj82…TFEQ
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
