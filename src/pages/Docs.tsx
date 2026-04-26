import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink, Code, Wallet, Droplets, Zap, Shield, Terminal } from 'lucide-react';

export function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] pt-14">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1">
            <BookOpen className="w-3 h-3 mr-1.5" />
            Documentation
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-4">ElemPerp Docs</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about trading on the first privacy-first perpetual DEX on Solana.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="bg-[#131722] border border-white/5 rounded-xl p-5 hover:border-cyan-500/20 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-400" />
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Get Devnet SOL</h3>
            <p className="text-xs text-slate-400">Use the Solana faucet to fund your devnet wallet for testing.</p>
          </a>
          <a href="https://arcium.com/" target="_blank" rel="noopener noreferrer" className="bg-[#131722] border border-white/5 rounded-xl p-5 hover:border-violet-500/20 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Arcium Docs</h3>
            <p className="text-xs text-slate-400">Learn about the confidential computation engine powering ElemPerp.</p>
          </a>
          <a href="https://solana.com/" target="_blank" rel="noopener noreferrer" className="bg-[#131722] border border-white/5 rounded-xl p-5 hover:border-emerald-500/20 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Solana Docs</h3>
            <p className="text-xs text-slate-400">Official Solana developer documentation and core concepts.</p>
          </a>
          <div className="bg-[#131722] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Code className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">GitHub Repository</h3>
            <p className="text-xs text-slate-400">Open source under MIT License. Contributions welcome.</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              Getting Started
            </h2>
            <div className="bg-[#131722] border border-white/5 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Install a Solana Wallet</h4>
                  <p className="text-xs text-slate-400 mt-1">Download Phantom, Solflare, or Backpack from their official sites.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Switch to Devnet</h4>
                  <p className="text-xs text-slate-400 mt-1">In your wallet settings, change the network to Solana Devnet.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Get Devnet SOL</h4>
                  <p className="text-xs text-slate-400 mt-1">Visit the Solana Faucet to request free devnet SOL for gas fees.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Start Trading</h4>
                  <p className="text-xs text-slate-400 mt-1">Navigate to the Trade page, connect your wallet, and place your first private trade.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-violet-400" />
              Trading Concepts
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Market Orders', desc: 'Execute immediately at the current mark price. Fastest execution, used for instant entry/exit.' },
                { title: 'Limit Orders', desc: 'Set a specific entry price. The order fills only when the market reaches your price.' },
                { title: 'Stop Loss', desc: 'An automated exit order that triggers when the price moves against you by a set amount.' },
                { title: 'Take Profit', desc: 'An automated exit order that triggers when the price moves in your favor to a target level.' },
                { title: 'Leverage', desc: 'Borrow capital to amplify position size. Up to 50x on ElemPerp. Higher leverage = higher risk.' },
                { title: 'Liquidation', desc: 'Automatic position closure when margin can no longer support the position. Protected by Arcium privacy.' },
              ].map((item, i) => (
                <div key={i} className="bg-[#131722] border border-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
