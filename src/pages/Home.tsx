import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Shield,
  Lock,
  Eye,
  ArrowRight,
  BarChart3,
  Globe,
  ChevronRight,
  Wallet,
  Users,
} from 'lucide-react';

export function HomePage() {
  const { connect, connected } = useWallet();

  const stats = [
    { label: 'Total Volume', value: '$12.4M', icon: BarChart3 },
    { label: 'Active Traders', value: '2,847', icon: Users },
    { label: 'Privacy Score', value: '92/100', icon: Shield },
    { label: 'Pairs Available', value: '15+', icon: Globe },
  ];

  const features = [
    {
      icon: Lock,
      title: 'Encrypted Positions',
      desc: 'Your position sizes and PnL are hidden from MEV bots and front-runners.',
    },
    {
      icon: Eye,
      title: 'Hidden Order Flow',
      desc: 'Trade intentions are encrypted before hitting the mempool. No data leakage.',
    },
    {
      icon: Shield,
      title: 'Confidential Liquidation',
      desc: 'Liquidation math runs inside Arcium MPC — no observer can predict your margin.',
    },
    {
      icon: Zap,
      title: 'MEV-Resistant',
      desc: 'Arcium MPC execution prevents sandwich attacks and priority gas auction exploitation.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/15 px-4 py-1.5 text-xs">
              <Shield className="w-3 h-3 mr-1.5" />
              Privacy-First Perpetual DEX on Solana
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Trade Without
              <br />
              <span className="text-gradient-cyan">Compromise</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The first perpetual DEX with Arcium-powered confidential computation. 
              Trade with encrypted positions, hidden PnL, and MEV-resistant execution.
            </p>
            <div className="flex items-center justify-center gap-4">
              {connected ? (
                <Link to="/trade">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 px-8">
                    Start Trading
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={() => connect()} className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 px-8">
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
              <Link to="/privacy">
                <Button size="lg" variant="outline" className="border-white/10 text-white hover:bg-white/5 h-12 px-8">
                  <Lock className="w-4 h-4 mr-2" />
                  How Privacy Works
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#131722] border border-white/5 rounded-xl p-5 text-center">
                <stat.icon className="w-5 h-5 text-cyan-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/20">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Arcium
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-3">Confidential Computation</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Arcium enables fully homomorphic encryption for on-chain computations, 
              ensuring your trading data remains private while being verifiable.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#131722] border border-white/5 rounded-xl p-6 hover:border-cyan-500/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Execution Flow */}
      <section className="py-20 bg-[#0d111a]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Arcium Execution Flow</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Every trade follows a rigorous 5-step confidential pipeline
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Encrypt', desc: 'Client-side FHE of trade inputs' },
              { step: '02', title: 'Submit', desc: 'Payload to Arcium MPC cluster' },
              { step: '03', title: 'Compute', desc: 'Confidential margin & PnL math' },
              { step: '04', title: 'Verify', desc: 'Zero-knowledge proof generation' },
              { step: '05', title: 'Settle', desc: 'On-chain Devnet settlement' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-[#131722] border border-white/5 rounded-xl p-5 text-center h-full">
                  <span className="text-2xl font-bold text-cyan-500/30">{item.step}</span>
                  <h4 className="text-sm font-semibold text-white mt-2 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="font-bold text-white text-sm">ELEM<span className="text-cyan-400">Perp</span></span>
              </div>
              <p className="text-xs text-slate-500">
                Privacy-first perpetual DEX on Solana, powered by Arcium confidential computation.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase mb-3">Product</h4>
              <div className="space-y-2">
                <Link to="/trade" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Trading</Link>
                <Link to="/leaderboard" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Leaderboard</Link>
                <Link to="/privacy" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Privacy Architecture</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase mb-3">Resources</h4>
              <div className="space-y-2">
                <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Solana Devnet Faucet</a>
                <a href="https://arcium.com/" target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Arcium Docs</a>
                <a href="https://solana.com/" target="_blank" rel="noopener noreferrer" className="block text-xs text-slate-400 hover:text-cyan-400 transition-colors">Solana Docs</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white uppercase mb-3">Ecosystem</h4>
              <div className="space-y-2">
                <span className="block text-xs text-slate-400">Powered by Arcium</span>
                <span className="block text-xs text-slate-400">Built on Solana</span>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              &copy; 2025 ELEMPerp DEX. Open source under MIT License.
            </p>
            <p className="text-xs text-slate-600">
              Deployed on Solana Devnet with Arcium Testnet integration for confidential computation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
