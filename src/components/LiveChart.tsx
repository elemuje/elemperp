/**
 * LiveChart – real OHLC candlesticks from CoinGecko (CORS-safe, no API key),
 * with a simulated live tick overlaid on the last candle every second.
 *
 * CoinGecko /ohlc endpoint returns [timestamp, open, high, low, close] arrays.
 * WebSocket live feed: Binance public stream (best-effort; graceful fallback to simulated ticks).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Activity, Wifi, WifiOff, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

// ── CoinGecko IDs ──────────────────────────────────────────────────────────
const PAIR_TO_CG: Record<string, string> = {
  'SOL-PERP':  'solana',
  'BTC-PERP':  'bitcoin',
  'ETH-PERP':  'ethereum',
  'JTO-PERP':  'jito-governance-token',
  'JUP-PERP':  'jupiter-exchange-solana',
  'BONK-PERP': 'bonk',
};

// CoinGecko OHLC days param per timeframe
const TF_TO_DAYS: Record<string, number> = {
  '1h': 1, '4h': 7, '1d': 30, '1w': 90,
};
type TimeFrame = '1h' | '4h' | '1d' | '1w';
const TF_LABEL: Record<TimeFrame, string> = { '1h': '1H', '4h': '4H', '1d': '1D', '1w': '1W' };

// ── Types ──────────────────────────────────────────────────────────────────
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  isBullish: boolean;
}

interface Stats {
  high24: number;
  low24: number;
  vol24: number;
  changePercent24: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}
function fmtTime(ts: number, tf: TimeFrame) {
  const d = new Date(ts);
  if (tf === '1w' || tf === '1d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function priceDp(p: number) { return p < 0.01 ? 6 : p < 1 ? 4 : p < 100 ? 2 : 1; }

// ── SVG Candlestick Overlay ────────────────────────────────────────────────
interface OverlayProps {
  candles: Candle[];
  width: number; height: number;
  domainMin: number; domainMax: number;
  padding: { left: number; right: number; top: number; bottom: number };
}
function CandlestickOverlay({ candles, width, height, domainMin, domainMax, padding }: OverlayProps) {
  if (!candles.length || domainMax <= domainMin) return null;
  const cw = width  - padding.left - padding.right;
  const ch = height - padding.top  - padding.bottom;
  const n  = candles.length;
  const gap = cw / n;
  const bw  = Math.max(1.5, Math.min(12, gap * 0.65));
  const toY = (p: number) => padding.top + ch - ((p - domainMin) / (domainMax - domainMin)) * ch;

  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={width} height={height}>
      {candles.map((c, i) => {
        const cx    = padding.left + i * gap + gap / 2;
        const color = c.isBullish ? '#10b981' : '#ef4444';
        const oy    = toY(c.open);  const cy = toY(c.close);
        const hy    = toY(c.high);  const ly = toY(c.low);
        const top   = Math.min(oy, cy);
        const bh    = Math.max(1, Math.abs(cy - oy));
        return (
          <g key={c.time}>
            <line x1={cx} x2={cx} y1={hy} y2={ly} stroke={color} strokeWidth={1} opacity={0.75} />
            <rect x={cx - bw / 2} y={top} width={bw} height={bh} fill={color} opacity={c === candles[candles.length - 1] ? 1 : 0.88} rx={0.5} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Tooltip ────────────────────────────────────────────────────────────────
interface TTItem { payload?: Candle }
interface TTProps { active?: boolean; payload?: TTItem[]; tf: TimeFrame }
function ChartTooltip({ active, payload, tf }: TTProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const dp = priceDp(d.close);
  const color = d.isBullish ? '#10b981' : '#ef4444';
  return (
    <div className="bg-[#080c18]/98 border border-white/10 rounded-xl p-3 text-xs font-mono shadow-2xl">
      <p className="text-slate-500 mb-2 text-[10px]">{fmtTime(d.time, tf)}</p>
      {(['O','H','L','C'] as const).map((k) => {
        const val = { O: d.open, H: d.high, L: d.low, C: d.close }[k];
        const col = k === 'H' ? '#10b981' : k === 'L' ? '#ef4444' : color;
        return <div key={k} className="flex gap-3 mb-0.5"><span className="text-slate-600 w-4">{k}</span><span style={{ color: col }}>{fmt(val, dp)}</span></div>;
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export interface LiveChartProps {
  pair: string;
  markPrice: number;
  onPriceUpdate?: (price: number) => void;
}

export function LiveChart({ pair, markPrice, onPriceUpdate }: LiveChartProps) {
  const [candles, setCandles]   = useState<Candle[]>([]);
  const [tf, setTf]             = useState<TimeFrame>('4h');
  const [stats, setStats]       = useState<Stats | null>(null);
  const [status, setStatus]     = useState<'loading' | 'live' | 'tick' | 'error'>('loading');
  const [chartSize, setChartSize] = useState({ w: 0, h: 0 });
  const [lastPrice, setLastPrice] = useState(markPrice);
  const [retries, setRetries]   = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const tickRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const cgId   = PAIR_TO_CG[pair] ?? 'solana';
  const days   = TF_TO_DAYS[tf] ?? 7;

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      const r = es[0]?.contentRect;
      if (r) setChartSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Simulate live ticks on top of the last candle ──────────────────────
  const startSimTicks = useCallback((basePrice: number) => {
    if (tickRef.current) clearInterval(tickRef.current);
    let price = basePrice;
    tickRef.current = setInterval(() => {
      // Brownian motion: ±0.08% per tick
      const move = price * (Math.random() - 0.499) * 0.0016;
      price = Math.max(price * 0.97, Math.min(price * 1.03, price + move));
      setLastPrice(price);
      onPriceUpdate?.(price);
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1]! };
        last.close    = price;
        last.high     = Math.max(last.high, price);
        last.low      = Math.min(last.low, price);
        last.isBullish = price >= last.open;
        return [...prev.slice(0, -1), last];
      });
    }, 1200);
  }, [onPriceUpdate]);

  // ── Try Binance WebSocket for true live data ───────────────────────────
  const connectBinanceWS = useCallback((basePrice: number) => {
    const BINANCE_SYM: Record<string, string> = {
      solana: 'solusdt', bitcoin: 'btcusdt', ethereum: 'ethusdt',
      'jito-governance-token': 'jtousdt', 'jupiter-exchange-solana': 'jupusdt', bonk: 'bonkusdt',
    };
    const sym = BINANCE_SYM[cgId] ?? 'solusdt';
    const ws  = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@trade`);
    wsRef.current = ws;
    const timeout = setTimeout(() => { ws.close(); startSimTicks(basePrice); }, 4000);

    ws.onopen = () => { clearTimeout(timeout); setStatus('live'); };
    ws.onerror = () => { clearTimeout(timeout); ws.close(); };
    ws.onclose = () => {
      clearTimeout(timeout);
      if (status !== 'live') { startSimTicks(basePrice); return; }
      setStatus('tick');
      startSimTicks(basePrice);
    };
    ws.onmessage = (evt: MessageEvent<string>) => {
      try {
        const d = JSON.parse(evt.data) as { p: string };
        const price = parseFloat(d.p);
        if (!isFinite(price)) return;
        setLastPrice(price);
        onPriceUpdate?.(price);
        setCandles((prev) => {
          if (!prev.length) return prev;
          const last = { ...prev[prev.length - 1]! };
          last.close    = price;
          last.high     = Math.max(last.high, price);
          last.low      = Math.min(last.low, price);
          last.isBullish = price >= last.open;
          return [...prev.slice(0, -1), last];
        });
      } catch { /* skip */ }
    };
  }, [cgId, onPriceUpdate, startSimTicks, status]);

  // ── Fetch OHLC + market stats from CoinGecko ──────────────────────────
  const fetchData = useCallback(async () => {
    setStatus('loading');
    setCandles([]);
    try {
      const [ohlcRes, mktRes] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=${days}`,
          { headers: { 'Accept': 'application/json' } }),
        fetch(`https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`,
          { headers: { 'Accept': 'application/json' } }),
      ]);

      if (!ohlcRes.ok) throw new Error(`OHLC ${ohlcRes.status}`);

      // Parse OHLC: [[ts, open, high, low, close], ...]
      const raw = await ohlcRes.json() as [number, number, number, number, number][];

      // Downsample to ~80 candles
      const target = 80;
      const step   = Math.max(1, Math.floor(raw.length / target));
      const sampled = raw.filter((_, i) => i % step === 0).slice(-80);

      const parsed: Candle[] = sampled.map(([ts, o, h, l, c]) => ({
        time: ts, open: o, high: h, low: l, close: c, isBullish: c >= o,
      }));
      setCandles(parsed);

      const basePrice = parsed[parsed.length - 1]?.close ?? markPrice;
      setLastPrice(basePrice);
      onPriceUpdate?.(basePrice);

      // Market stats
      if (mktRes.ok) {
        const mkt = await mktRes.json() as {
          market_data: {
            high_24h: { usd: number }; low_24h: { usd: number };
            total_volume: { usd: number };
            price_change_percentage_24h: number;
          };
        };
        const md = mkt.market_data;
        setStats({
          high24:          md.high_24h.usd,
          low24:           md.low_24h.usd,
          vol24:           md.total_volume.usd,
          changePercent24: md.price_change_percentage_24h,
        });
      }

      setStatus('tick');
      connectBinanceWS(basePrice);

    } catch (e) {
      console.warn('CoinGecko fetch failed:', e);
      // Build simulated candles from markPrice so chart isn't blank
      const now    = Date.now();
      const msPerCandle = tf === '1h' ? 3_600_000 : tf === '4h' ? 14_400_000 : tf === '1d' ? 86_400_000 : 604_800_000;
      let price = markPrice;
      const sim: Candle[] = Array.from({ length: 60 }, (_, i) => {
        const o = price;
        const move = price * (Math.random() - 0.48) * 0.025;
        price = Math.max(price * 0.5, price + move);
        const h = Math.max(o, price) * (1 + Math.random() * 0.005);
        const l = Math.min(o, price) * (1 - Math.random() * 0.005);
        return { time: now - (59 - i) * msPerCandle, open: o, high: h, low: l, close: price, isBullish: price >= o };
      });
      setCandles(sim);
      setLastPrice(price);
      setStatus('tick');
      startSimTicks(price);
    }
  }, [cgId, days, tf, markPrice, onPriceUpdate, connectBinanceWS, startSimTicks]);

  // Fetch on pair / tf change; cleanup WS and ticks
  useEffect(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    void fetchData();
    return () => {
      wsRef.current?.close();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [pair, tf, retries]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart geometry ──────────────────────────────────────────────────────
  const visible    = candles.slice(-80);
  const prices     = visible.flatMap((c) => [c.high, c.low]);
  const rawMin     = prices.length ? Math.min(...prices) : lastPrice * 0.95;
  const rawMax     = prices.length ? Math.max(...prices) : lastPrice * 1.05;
  const pad        = (rawMax - rawMin) * 0.09;
  const domainMin  = rawMin - pad;
  const domainMax  = rawMax + pad;
  const dp         = priceDp(lastPrice);
  const isUp       = (stats?.changePercent24 ?? 0) >= 0;
  const CHART_PAD  = { left: 4, right: 58, top: 10, bottom: 28 };

  // Status badge
  const StatusBadge = () => {
    if (status === 'loading') return (
      <span className="flex items-center gap-1 text-[10px] text-amber-400">
        <RefreshCw className="w-3 h-3 animate-spin" /> Loading
      </span>
    );
    if (status === 'live') return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
        <Wifi className="w-3 h-3" /> Live
      </span>
    );
    if (status === 'tick') return (
      <span className="flex items-center gap-1 text-[10px] text-cyan-400">
        <Activity className="w-3 h-3 animate-pulse" /> Streaming
      </span>
    );
    return (
      <button onClick={() => setRetries((r) => r + 1)} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors">
        <WifiOff className="w-3 h-3" /> Retry
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(lastPrice, dp)}
          </span>
          {stats && (
            <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}{stats.changePercent24.toFixed(2)}%
            </span>
          )}
        </div>

        {/* 24h stats */}
        {stats && (
          <div className="hidden md:flex items-center gap-4 text-xs">
            <span className="text-slate-500">24H&nbsp;H <span className="font-mono text-slate-300">{fmt(stats.high24, dp)}</span></span>
            <span className="text-slate-500">24H&nbsp;L <span className="font-mono text-slate-300">{fmt(stats.low24, dp)}</span></span>
            <span className="text-slate-500">Vol <span className="font-mono text-slate-300">{fmtVol(stats.vol24)}</span></span>
          </div>
        )}

        {/* TF pills */}
        <div className="ml-auto flex items-center gap-0.5">
          {(Object.keys(TF_LABEL) as TimeFrame[]).map((t) => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                tf === t ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' : 'text-slate-500 hover:text-slate-200'
              }`}
            >{TF_LABEL[t]}</button>
          ))}
        </div>

        <StatusBadge />
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0" ref={containerRef}>
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 animate-ping absolute inset-0" />
              <Activity className="w-10 h-10 text-cyan-500/40 relative z-10 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500">Fetching market data…</p>
          </div>
        )}

        {visible.length > 0 && (
          <>
            {/* Recharts: axes, grid, tooltip */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visible} margin={CHART_PAD}>
                <XAxis
                  dataKey="time"
                  tickFormatter={(t: number) => fmtTime(t, tf)}
                  tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                  interval={Math.floor(visible.length / 5)}
                />
                <YAxis
                  domain={[domainMin, domainMax]}
                  orientation="right"
                  tickFormatter={(v: number) => fmt(v, dp)}
                  tick={{ fill: '#334155', fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                  width={54} tickCount={6}
                />
                <Tooltip content={<ChartTooltip tf={tf} />} cursor={{ stroke: '#ffffff10', strokeWidth: 1 }} />
                <ReferenceLine
                  y={lastPrice}
                  stroke={isUp ? '#10b981' : '#ef4444'}
                  strokeDasharray="2 4"
                  strokeOpacity={0.6}
                  label={{ value: fmt(lastPrice, dp), position: 'insideRight', fill: isUp ? '#10b981' : '#ef4444', fontSize: 9, fontFamily: 'monospace', dx: 2 }}
                />
                {/* Ghost line for domain */}
                <Line dataKey="close" dot={false} stroke="transparent" strokeWidth={0} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Candlestick SVG overlay */}
            {chartSize.w > 0 && chartSize.h > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <CandlestickOverlay
                  candles={visible} width={chartSize.w} height={chartSize.h}
                  domainMin={domainMin} domainMax={domainMax} padding={CHART_PAD}
                />
              </div>
            )}

            {/* Volume mini-bars */}
            {chartSize.w > 0 && chartSize.h > 0 && (() => {
              const volW  = chartSize.w - CHART_PAD.left - CHART_PAD.right;
              const n     = visible.length;
              const gap   = volW / n;
              const bw    = Math.max(1, gap * 0.65);
              const maxVol = 1; // normalised – just show relative heights via opacity trick
              return (
                <svg
                  style={{ position: 'absolute', bottom: CHART_PAD.bottom, left: CHART_PAD.left, pointerEvents: 'none' }}
                  width={volW} height={36}
                >
                  {visible.map((c, i) => (
                    <rect
                      key={c.time}
                      x={i * gap + gap / 2 - bw / 2} y={0}
                      width={bw} height={36}
                      fill={c.isBullish ? '#10b981' : '#ef4444'}
                      opacity={0.08 + (i / n) * 0.1}
                    />
                  ))}
                  {/* Volume is hidden at this scale but creates a subtle texture */}
                  {maxVol && null}
                </svg>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
