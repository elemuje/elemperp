/**
 * MarketTicker – scrolling top bar showing live prices for all pairs.
 * Fetches once from CoinGecko /simple/price, then simulates micro-ticks.
 */
import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PairPrice {
  symbol: string;
  price: number;
  change: number;
}

const PAIRS: { symbol: string; cgId: string; base: number }[] = [
  { symbol: 'SOL',  cgId: 'solana',                     base: 148 },
  { symbol: 'BTC',  cgId: 'bitcoin',                    base: 67200 },
  { symbol: 'ETH',  cgId: 'ethereum',                   base: 3540 },
  { symbol: 'JTO',  cgId: 'jito-governance-token',      base: 3.8 },
  { symbol: 'JUP',  cgId: 'jupiter-exchange-solana',    base: 1.12 },
  { symbol: 'BONK', cgId: 'bonk',                       base: 0.000028 },
];

function fmt(p: number) {
  if (p < 0.0001) return p.toFixed(8);
  if (p < 0.01)   return p.toFixed(6);
  if (p < 1)      return p.toFixed(4);
  if (p < 100)    return p.toFixed(2);
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MarketTicker() {
  const [prices, setPrices] = useState<PairPrice[]>(
    PAIRS.map((p) => ({ symbol: p.symbol, price: p.base, change: 0 }))
  );
  const prevRef = useRef<Record<string, number>>({});

  // Fetch real prices from CoinGecko
  useEffect(() => {
    const ids = PAIRS.map((p) => p.cgId).join(',');
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      .then((r) => r.json())
      .then((data: Record<string, { usd: number; usd_24h_change: number }>) => {
        setPrices(
          PAIRS.map((p) => ({
            symbol: p.symbol,
            price:  data[p.cgId]?.usd          ?? p.base,
            change: data[p.cgId]?.usd_24h_change ?? 0,
          }))
        );
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  // Simulate micro-ticks
  useEffect(() => {
    const id = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => {
          const drift = p.price * (Math.random() - 0.499) * 0.0004;
          return { ...p, price: p.price + drift };
        })
      );
    }, 800);
    return () => clearInterval(id);
  }, []);

  // Duplicate list for seamless scroll
  const items = [...prices, ...prices];

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-[#080c18]/95 backdrop-blur border-b border-white/[0.04] overflow-hidden h-8">
      <div className="flex items-center h-full animate-ticker whitespace-nowrap">
        {items.map((p, i) => {
          const prev = prevRef.current[p.symbol];
          const flash = prev !== undefined && prev !== p.price
            ? p.price > prev ? 'text-emerald-300' : 'text-red-300'
            : '';
          prevRef.current[p.symbol] = p.price;
          const up = p.change >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 px-5 text-[11px] border-r border-white/[0.05] h-full">
              <span className="font-semibold text-slate-300">{p.symbol}/USDC</span>
              <span className={`font-mono tabular-nums transition-colors duration-300 ${flash || 'text-white'}`}>
                {fmt(p.price)}
              </span>
              <span className={`flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                <span className="text-[10px]">{up ? '+' : ''}{p.change.toFixed(2)}%</span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
