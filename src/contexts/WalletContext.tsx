import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

type NetworkType = 'devnet' | 'mainnet-beta' | 'testnet' | 'unknown';
export type WalletProviderName = 'phantom' | 'solflare' | 'backpack' | null;

interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  network: NetworkType;
  walletProvider: WalletProviderName;
  solBalance: number;
  isWrongNetwork: boolean;
  connect: (provider?: WalletProviderName) => Promise<void>;
  disconnect: () => void;
  switchToDevnet: () => Promise<void>;
  refreshNetwork: () => Promise<void>;
  connection: Connection;
}

const DEVNET_URL = clusterApiUrl('devnet');
const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166MjzqUX7ZRj4rcVhe6GJ';
const MAINNET_GENESIS = '5eykt4UsFv8P8NJdmz8pvUq27Bkq5bYpBkeGzAsPp6Ra';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function getInjectedProvider(wallet: WalletProviderName) {
  const w = window as any;
  switch (wallet) {
    case 'phantom':
      return w?.phantom?.solana ?? (w?.solana?.isPhantom ? w.solana : null);
    case 'solflare':
      return w?.solflare ?? null;
    case 'backpack':
      return w?.backpack ?? w?.xnft?.solana ?? null;
    default:
      return null;
  }
}

export function detectInstalledWallets(): WalletProviderName[] {
  const w = window as any;
  const found: WalletProviderName[] = [];
  if (w?.phantom?.solana || w?.solana?.isPhantom) found.push('phantom');
  if (w?.solflare) found.push('solflare');
  if (w?.backpack || w?.xnft?.solana) found.push('backpack');
  return found;
}

async function queryWalletNetwork(provider: any): Promise<NetworkType | null> {
  try {
    if (typeof provider?.networkVersion === 'string') {
      const v = provider.networkVersion as string;
      if (v.includes('devnet')) return 'devnet';
      if (v.includes('mainnet')) return 'mainnet-beta';
      if (v.includes('testnet')) return 'testnet';
    }
    if (typeof provider?.network === 'string') {
      const n = provider.network as string;
      if (n === 'devnet') return 'devnet';
      if (n === 'mainnet-beta' || n === 'mainnet') return 'mainnet-beta';
      if (n === 'testnet') return 'testnet';
    }
    const ep: string = provider?.connection?.rpcEndpoint ?? '';
    if (ep.includes('devnet')) return 'devnet';
    if (ep.includes('mainnet')) return 'mainnet-beta';
  } catch {
    // ignore
  }
  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [network, setNetwork] = useState<NetworkType>('unknown');
  const [walletProvider, setWalletProvider] = useState<WalletProviderName>(null);
  const [solBalance, setSolBalance] = useState(0);
  const [connection] = useState(() => new Connection(DEVNET_URL, 'confirmed'));

  // Only truly block on mainnet — devnet/testnet/unknown all allowed
  const isWrongNetwork = connected && network === 'mainnet-beta';

  const detectNetwork = useCallback(async (provider?: any) => {
    // 1. Ask the wallet extension directly
    if (provider) {
      const walletNet = await queryWalletNetwork(provider);
      if (walletNet) {
        setNetwork(walletNet);
        return;
      }
    }
    // 2. Fall back: genesis hash from our devnet RPC confirms we're devnet
    try {
      const genesis = await connection.getGenesisHash();
      if (genesis === DEVNET_GENESIS) setNetwork('devnet');
      else if (genesis === MAINNET_GENESIS) setNetwork('mainnet-beta');
      else setNetwork('devnet'); // our RPC is devnet; if reachable treat as devnet
    } catch {
      setNetwork('devnet'); // devnet RPC unreachable edge case — don't block
    }
  }, [connection]);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setSolBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(0);
    }
  }, [connection, publicKey]);

  useEffect(() => { detectNetwork(); }, [detectNetwork]);

  useEffect(() => {
    if (!publicKey) return;
    fetchBalance();
    const id = setInterval(fetchBalance, 10000);
    return () => clearInterval(id);
  }, [publicKey, fetchBalance]);

  // Listen to wallet events
  useEffect(() => {
    if (!walletProvider) return;
    const provider = getInjectedProvider(walletProvider);
    if (!provider) return;

    const onAccountChanged = (pk: PublicKey | null) => {
      if (pk) setPublicKey(new PublicKey(pk.toString()));
      else { setPublicKey(null); setConnected(false); }
    };
    const onNetworkChanged = () => detectNetwork(provider);

    provider.on?.('accountChanged', onAccountChanged);
    provider.on?.('networkChanged', onNetworkChanged);
    provider.on?.('clusterChanged', onNetworkChanged);
    return () => {
      provider.removeListener?.('accountChanged', onAccountChanged);
      provider.removeListener?.('networkChanged', onNetworkChanged);
      provider.removeListener?.('clusterChanged', onNetworkChanged);
    };
  }, [walletProvider, detectNetwork]);

  const connect = useCallback(async (providerName?: WalletProviderName) => {
    setConnecting(true);
    try {
      let chosen = providerName;
      if (!chosen) {
        const installed = detectInstalledWallets();
        chosen = installed[0] ?? null;
      }

      const installUrls: Record<string, string> = {
        phantom: 'https://phantom.app/',
        solflare: 'https://solflare.com/',
        backpack: 'https://www.backpack.exchange/',
      };

      if (!chosen) { window.open(installUrls.phantom, '_blank'); return; }

      const provider = getInjectedProvider(chosen);
      if (!provider) { window.open(installUrls[chosen] ?? installUrls.phantom, '_blank'); return; }

      const resp = await provider.connect();
      const pkStr = resp?.publicKey?.toString() ?? provider?.publicKey?.toString();
      if (!pkStr) throw new Error('No public key returned');

      setPublicKey(new PublicKey(pkStr));
      setConnected(true);
      setWalletProvider(chosen);
      await detectNetwork(provider);
    } catch (err) {
      console.error('Wallet connect error:', err);
    } finally {
      setConnecting(false);
    }
  }, [detectNetwork]);

  const disconnect = useCallback(() => {
    if (walletProvider) getInjectedProvider(walletProvider)?.disconnect?.();
    setPublicKey(null);
    setConnected(false);
    setSolBalance(0);
    setNetwork('unknown');
    setWalletProvider(null);
  }, [walletProvider]);

  const switchToDevnet = useCallback(async () => {
    const provider = walletProvider ? getInjectedProvider(walletProvider) : null;
    if (!provider) return;
    try {
      // Phantom supports programmatic cluster switch
      if (walletProvider === 'phantom') {
        await provider.request?.({
          method: 'wallet_switchSolanaCluster',
          params: [{ cluster: 'devnet' }],
        });
        setNetwork('devnet');
        return;
      }
    } catch { /* ignore */ }
    // For Solflare/Backpack: re-detect after user manually switches
    await detectNetwork(provider);
  }, [walletProvider, detectNetwork]);

  const refreshNetwork = useCallback(async () => {
    const provider = walletProvider ? getInjectedProvider(walletProvider) : null;
    await detectNetwork(provider ?? undefined);
  }, [walletProvider, detectNetwork]);

  return (
    <WalletContext.Provider value={{
      connected, connecting, publicKey, network, walletProvider,
      solBalance, isWrongNetwork, connect, disconnect,
      switchToDevnet, refreshNetwork, connection,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
}
