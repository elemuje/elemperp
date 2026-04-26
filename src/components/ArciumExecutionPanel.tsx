import { motion } from 'framer-motion';
import { useTrading } from '@/contexts/TradingContext';

export function ArciumExecutionPanel() {
  const { arciumSteps, isExecuting } = useTrading();

  if (!isExecuting) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[80] w-[480px] max-w-[90vw]"
    >
      <div className="bg-[#0a0e1a]/95 backdrop-blur-2xl border border-cyan-500/20 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold text-cyan-400">Arcium MPC Execution</span>
          <span className="text-xs text-slate-500 ml-auto font-mono">Privacy-First</span>
        </div>
        <div className="space-y-3">
          {arciumSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0">
                {step.status === 'completed' && (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.status === 'active' && (
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                )}
                {step.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                )}
                {step.status === 'error' && (
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.status === 'active' ? 'text-cyan-300' : step.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              </div>
              <span className="text-xs font-mono text-slate-600">0{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
