import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export function NetworkModal() {
  const { network, switchToDevnet, refreshNetwork, connected, isWrongNetwork, walletProvider } = useWallet();
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Show banner when: connected AND on mainnet AND not dismissed
  const showBanner = connected && isWrongNetwork && !dismissed;

  // Reset dismiss state when network actually changes to mainnet again
  // (so the banner reappears if they switch back)
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNetwork();
    setRefreshing(false);
    // If we're now on devnet, auto-dismiss
    if (network === 'devnet') setDismissed(true);
  };

  const handleSwitch = async () => {
    await switchToDevnet();
    await handleRefresh();
  };

  const walletSupportsProgrammaticSwitch = walletProvider === 'phantom';

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-14 left-0 right-0 z-[80]"
        >
          <div className="bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />

              <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm text-amber-300 font-medium">
                  Wallet is on <span className="font-bold">{network}</span> — ElemPerp runs on Solana Devnet.
                </span>
                <span className="text-xs text-amber-400/70">
                  You can still browse and simulate trades, but on-chain settlement requires Devnet.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {walletSupportsProgrammaticSwitch ? (
                  <Button
                    size="sm"
                    onClick={handleSwitch}
                    className="h-7 px-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    Switch to Devnet
                  </Button>
                ) : (
                  <span className="text-xs text-amber-400/80 italic hidden sm:block">
                    Switch to Devnet in your {walletProvider ?? 'wallet'} settings
                  </span>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-7 w-7 p-0 text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10"
                  title="Re-check network"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed(true)}
                  className="h-7 w-7 p-0 text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10"
                  title="Dismiss warning"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
