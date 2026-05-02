import React, { useState, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, detectInstalledWallets } from '@/contexts/WalletContext';
import type { WalletProviderName } from '@/contexts/WalletContext';
import { useTrading } from '@/contexts/TradingContext';
import { Button } from '@/components/ui/button';
import {
  Wallet, Zap, Trophy, Shield, BookOpen,
  Droplets, ChevronDown, Lock, X,
} from 'lucide-react';

// Simple SVG wallet icons
const PhantomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 128 128" fill="none">
    <rect width="128" height="128" rx="24" fill="#AB9FF2"/>
    <path d="M110.584 64.9142C110.584 89.3784 91.1025 109.255 66.9716 109.255C46.8175 109.255 29.9173 96.243 23.8398 78.2891C22.7974 75.2356 25.7899 72.4707 28.7338 73.7156C36.3673 76.9614 45.1834 78.2891 54.2985 77.3793C63.7765 76.4347 72.4886 73.1206 79.5773 67.9891C93.5826 57.8398 102.135 41.1641 101.065 22.8989C100.874 19.6576 104.594 17.8262 106.811 20.0989C109.471 22.8285 110.584 43.5547 110.584 64.9142Z" fill="white"/>
    <path d="M45.2656 75.8135C47.4379 75.8135 49.1977 74.0537 49.1977 71.8814C49.1977 69.7091 47.4379 67.9492 45.2656 67.9492C43.0933 67.9492 41.3335 69.7091 41.3335 71.8814C41.3335 74.0537 43.0933 75.8135 45.2656 75.8135Z" fill="#AB9FF2"/>
    <path d="M62.8877 75.8135C65.06 75.8135 66.8198 74.0537 66.8198 71.8814C66.8198 69.7091 65.06 67.9492 62.8877 67.9492C60.7154 67.9492 58.9556 69.7091 58.9556 71.8814C58.9556 74.0537 60.7154 75.8135 62.8877 75.8135Z" fill="#AB9FF2"/>
  </svg>
);

const SolflareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 128 128" fill="none">
    <rect width="128" height="128" rx="24" fill="#FC7227"/>
    <path d="M64 20L100 64L64 108L28 64L64 20Z" fill="white" opacity="0.9"/>
    <path d="M64 38L86 64L64 90L42 64L64 38Z" fill="#FC7227"/>
  </svg>
);

const BackpackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 128 128" fill="none">
    <rect width="128" height="128" rx="24" fill="#E33E3F"/>
    <rect x="32" y="48" width="64" height="56" rx="8" fill="white"/>
    <path d="M48 48V40C48 31.163 55.163 24 64 24C72.837 24 80 31.163 80 40V48" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <rect x="52" y="68" width="24" height="16" rx="4" fill="#E33E3F"/>
  </svg>
);

const walletMeta: Record<string, { label: string; icon: ComponentType; installUrl: string }> = {
  phantom:  { label: 'Phantom',  icon: PhantomIcon,  installUrl: 'https://phantom.app/' },
  solflare: { label: 'Solflare', icon: SolflareIcon, installUrl: 'https://solflare.com/' },
  backpack: { label: 'Backpack', icon: BackpackIcon, installUrl: 'https://www.backpack.exchange/' },
};

const ALL_WALLETS: WalletProviderName[] = ['phantom', 'solflare', 'backpack'];

function WalletPickerModal({ onClose }: { onClose: () => void }) {
  const { connect, connecting } = useWallet();
  const installed = detectInstalledWallets();

  const handleSelect = async (w: WalletProviderName) => {
    onClose();
    await connect(w ?? undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-[#0f1219] border border-white/10 rounded-xl p-5 w-full max-w-xs shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {ALL_WALLETS.map((w) => {
            if (!w) return null;
            const meta = walletMeta[w];
            const isInstalled = installed.includes(w);
            const Icon = meta.icon;
            return (
              <button
                key={w}
                disabled={connecting}
                onClick={() =>
                  isInstalled
                    ? handleSelect(w)
                    : window.open(meta.installUrl, '_blank')
                }
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 transition-all text-left group"
              >
                <Icon />
                <span className="flex-1 text-sm font-medium text-white">{meta.label}</span>
                {isInstalled ? (
                  <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Detected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                    Install ↗
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-600 text-center mt-4">
          Only Solana Devnet is supported. No real funds required.
        </p>
      </motion.div>
    </motion.div>
  );
}

export function Navbar() {
  const { connected, publicKey, solBalance, disconnect, network, walletProvider, isWrongNetwork } = useWallet();
  const { walletBalance } = useTrading();
  const location = useLocation();
  const [showPicker, setShowPicker] = useState(false);
  const isDevnet = network === 'devnet';

  const navItems = [
    { path: '/trade',       label: 'Trade',       icon: Zap },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/privacy',     label: 'Privacy',     icon: Shield },
    { path: '/docs',        label: 'Docs',        icon: BookOpen },
  ];

  const WalletIcon = walletProvider ? walletMeta[walletProvider]?.icon : null;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">
                ELEM<span className="text-cyan-400">Perp</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                PRIVATE
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-cyan-500/10 rounded-md border border-cyan-500/20"
                        transition={{ type: 'spring', duration: 0.5 }}
                      />
                    )}
                    <item.icon className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {connected && (
              <div className="hidden lg:flex items-center gap-3 mr-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#131722] border border-white/5">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-medium">Privacy Mode Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-mono">{solBalance.toFixed(3)}</span>
                  <span>SOL</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-white font-mono">{walletBalance.usdc.toFixed(1)}</span>
                  <span>USDC</span>
                </div>
                {isWrongNetwork && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    ⚠ {network}
                  </span>
                )}
                {!isWrongNetwork && isDevnet && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Devnet ✓
                  </span>
                )}
              </div>
            )}

            {connected ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#131722] border border-white/5">
                  {WalletIcon ? <WalletIcon /> : <Wallet className="w-3.5 h-3.5 text-cyan-400" />}
                  <span className="text-xs font-mono text-white">
                    {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnect}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowPicker(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold h-8 px-4"
              >
                <Wallet className="w-3.5 h-3.5 mr-1.5" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showPicker && <WalletPickerModal onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
    </>
  );
}
