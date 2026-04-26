import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Activity, Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';

const PAIR_TO_BINANCE: Record<string, string> = {
  'SOL-PERP':  'SOLUSDT',
  'BTC-PERP':  'BTCUSDT',
  'ETH-PERP':  'ETHUSDT',
  'JTO-PERP':  'JTOUSDT',
  'JUP-PERP':  'JUPUSDT',
  'BONK-PERP': 'BONKUSDT',
};

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isBullish: boolean;
}

interface Stats {
  high24: number;
  low24: number;
  vol24: number;
  changePercent24: number;
}

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const TF_LABEL: Record<TimeFrame, string> = {
  '1m': '1M', '5m': '5M', '15m': '15M', '1h': '1H', '4h': '4H', '1d': '1D',
};

function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function fmtTime(ts: number, tf: TimeFrame) {
  const d = new Date(ts);
  if (tf === '1d') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// SVG candlestick chart overlay (rendered on top of Recharts axes)
interface CandlestickOverlayProps {
  candles: Candle[];
  width: number;
  height: number;
  domainMin: number;
  domainMax: number;
  padding: { left: number; right: number; top: number; bottom: number };
}

function CandlestickOverlay({
  candles, width, height, domainMin, domainMax, padding,
}: CandlestickOverlayProps) {
  if (!candles.length || domainMax === domainMin) return null;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = candles.length;
  const candleWidth = Math.max(2, Math.min(14, (chartW / n) * 0.7));
  const gap = chartW / n;

  const toY = (price: number) =>
    padding.top + chartH - ((price - domainMin) / (domainMax - domainMin)) * chartH;

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} width={width} height={height}>
      {candles.map((c, i) => {
        const cx = padding.left + i * gap + gap / 2;
        const color = c.isBullish ? '#10b981' : '#ef4444';
        const openY   = toY(c.open);
        const closeY  = toY(c.close);
        const highY   = toY(c.high);
        const lowY    = toY(c.low);
        const bodyTop    = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(closeY - openY));
        return (
          <g key={c.time}>
            <line x1={cx} x2={cx} y1={highY} y2={lowY} stroke={color} strokeWidth={1} opacity={0.8} />
            <rect x={cx - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
}

// Tooltip component — typed explicitly to satisfy strict mode
interface TooltipPayloadItem {
  payload?: Candle;
}
interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  tf: TimeFrame;
}

function ChartTooltip({ active, payload, tf }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const color = d.isBullish ? '#10b981' : '#ef4444';
  return (
    <div className="bg-[#0a0e1a]/95 border border-white/10 rounded-lg p-3 text-xs font-mono shadow-2xl backdrop-blur">
      <p className="text-slate-400 mb-2">{fmtTime(d.time, tf)}</p>
      <div className="space-y-1">
        <div className="flex gap-4"><span className="text-slate-500 w-10">O</span><span style={{ color }}>{fmt(d.open)}</span></div>
        <div className="flex gap-4"><span className="text-slate-500 w-10">H</span><span className="text-emerald-400">{fmt(d.high)}</span></div>
        <div className="flex gap-4"><span className="text-slate-500 w-10">L</span><span className="text-red-400">{fmt(d.low)}</span></div>
        <div className="flex gap-4"><span className="text-slate-500 w-10">C</span><span style={{ color }}>{fmt(d.close)}</span></div>
        <div className="flex gap-4 mt-1 pt-1 border-t border-white/5">
          <span className="text-slate-500 w-10">Vol</span>
          <span className="text-slate-300">{fmtVol(d.volume)}</span>
        </div>
      </div>
    </div>
  );
}

interface LiveChartProps {
  pair: string;
  markPrice: number;
  onPriceUpdate?: (price: number) => void;
}

export function LiveChart({ pair, markPrice, onPriceUpdate }: LiveChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tf, setTf] = useState<TimeFrame>('5m');
  const [stats, setStats] = useState<Stats | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [chartSize, setChartSize] = useState({ w: 0, h: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const symbol = PAIR_TO_BINANCE[pair] ?? 'SOLUSDT';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setChartSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const [klinesRes, statsRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=100`),
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
      ]);

      if (klinesRes.ok) {
        const raw = await klinesRes.json() as [number, string, string, string, string, string][];
        const parsed: Candle[] = raw.map((k) => {
          const o = parseFloat(k[1]);
          const h = parseFloat(k[2]);
          const l = parseFloat(k[3]);
          const c = parseFloat(k[4]);
          return { time: k[0], open: o, high: h, low: l, close: c, volume: parseFloat(k[5]), isBullish: c >= o };
        });
        setCandles(parsed);
      }

      if (statsRes.ok) {
        const s = await statsRes.json() as {
          lastPrice: string; highPrice: string; lowPrice: string;
          volume: string; priceChangePercent: string;
        };
        const price = parseFloat(s.lastPrice);
        setStats({
          high24: parseFloat(s.highPrice),
          low24:  parseFloat(s.lowPrice),
          vol24:  parseFloat(s.volume),
          changePercent24: parseFloat(s.priceChangePercent),
        });
        onPriceUpdate?.(price);
      }
    } catch {
      setWsStatus('offline');
    }
  }, [symbol, tf, onPriceUpdate]);

  useEffect(() => {
    void fetchHistory();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsStatus('connecting');

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${symbol.toLowerCase()}@kline_${tf}/${symbol.toLowerCase()}@ticker`
    );
    wsRef.current = ws;

    ws.onopen  = () => setWsStatus('live');
    ws.onerror = () => setWsStatus('offline');
    ws.onclose = () => setWsStatus((s) => (s === 'live' ? 'offline' : s));

    ws.onmessage = (evt: MessageEvent<string>) => {
      try {
        const msg = JSON.parse(evt.data) as { stream: string; data: Record<string, unknown> };
        const streamName = msg.stream ?? '';

        if (streamName.includes('@kline')) {
          const k = msg.data.k as Record<string, string | number>;
          const o = parseFloat(String(k['o']));
          const h = parseFloat(String(k['h']));
          const l = parseFloat(String(k['l']));
          const c = parseFloat(String(k['c']));
          const newCandle: Candle = {
            time: Number(k['t']),
            open: o, high: h, low: l, close: c,
            volume: parseFloat(String(k['v'])),
            isBullish: c >= o,
          };
          setCandles((prev) => {
            if (!prev.length) return [newCandle];
            const last = prev[prev.length - 1];
            if (last?.time === newCandle.time) return [...prev.slice(0, -1), newCandle];
            return [...prev.slice(-99), newCandle];
          });
          onPriceUpdate?.(c);
        }

        if (streamName.includes('@ticker')) {
          const t = msg.data as Record<string, string>;
          setStats({
            high24: parseFloat(t['h'] ?? '0'),
            low24:  parseFloat(t['l'] ?? '0'),
            vol24:  parseFloat(t['v'] ?? '0'),
            changePercent24: parseFloat(t['P'] ?? '0'),
          });
        }
      } catch { /* ignore malformed frames */ }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [symbol, tf, fetchHistory]);

  const visibleCandles = candles.slice(-80);
  const prices = visibleCandles.flatMap((c) => [c.high, c.low]);
  const rawMin = prices.length ? Math.min(...prices) : markPrice * 0.95;
  const rawMax = prices.length ? Math.max(...prices) : markPrice * 1.05;
  const pad = (rawMax - rawMin) * 0.08;
  const domainMin = rawMin - pad;
  const domainMax = rawMax + pad;

  const currentPrice = visibleCandles[visibleCandles.length - 1]?.close ?? markPrice;
  const isUp = stats ? stats.changePercent24 >= 0 : true;

  const CHART_PAD = { left: 8, right: 56, top: 12, bottom: 32 };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 flex-shrink-0 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmt(currentPrice, currentPrice < 1 ? 6 : 2)}
          </span>
          {stats && (
            <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isUp ? '+' : ''}{stats.changePercent24.toFixed(2)}%
            </span>
          )}
        </div>

        {stats && (
          <div className="hidden sm:flex items-center gap-4 ml-2 text-xs">
            <div>
              <span className="text-slate-500 mr-1">24H H</span>
              <span className="font-mono text-slate-300">{fmt(stats.high24, stats.high24 < 1 ? 6 : 2)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">24H L</span>
              <span className="font-mono text-slate-300">{fmt(stats.low24, stats.low24 < 1 ? 6 : 2)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">Vol</span>
              <span className="font-mono text-slate-300">{fmtVol(stats.vol24)}</span>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {(Object.keys(TF_LABEL) as TimeFrame[]).map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                tf === t
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {TF_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {wsStatus === 'live' ? (
            <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-[10px] text-emerald-400">Live</span></>
          ) : wsStatus === 'connecting' ? (
            <><Activity className="w-3 h-3 text-amber-400 animate-pulse" /><span className="text-[10px] text-amber-400">Connecting</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-slate-500" /><span className="text-[10px] text-slate-500">Offline</span></>
          )}
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 relative min-h-0" ref={containerRef}>
        {visibleCandles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-8 h-8 text-cyan-500/30 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-500">Loading chart data…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Recharts layer — provides axes, grid, tooltip hitbox */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visibleCandles} margin={CHART_PAD}>
                <XAxis
                  dataKey="time"
                  tickFormatter={(t: number) => fmtTime(t, tf)}
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(visibleCandles.length / 6)}
                />
                <YAxis
                  domain={[domainMin, domainMax]}
                  orientation="right"
                  tickFormatter={(v: number) => fmt(v, v < 1 ? 5 : 1)}
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickCount={6}
                />
                <Tooltip content={<ChartTooltip tf={tf} />} />
                <ReferenceLine
                  y={currentPrice}
                  stroke={isUp ? '#10b981' : '#ef4444'}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  label={{
                    value: fmt(currentPrice, currentPrice < 1 ? 5 : 2),
                    position: 'right',
                    fill: isUp ? '#10b981' : '#ef4444',
                    fontSize: 9,
                    fontFamily: 'monospace',
                  }}
                />
                {/* Invisible line so Recharts computes the Y domain correctly */}
                <Line dataKey="close" dot={false} stroke="transparent" strokeWidth={0} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* SVG candlestick overlay */}
            {chartSize.w > 0 && chartSize.h > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <CandlestickOverlay
                  candles={visibleCandles}
                  width={chartSize.w}
                  height={chartSize.h}
                  domainMin={domainMin}
                  domainMax={domainMax}
                  padding={CHART_PAD}
                />
              </div>
            )}

            {/* Volume bars overlay */}
            {chartSize.w > 0 && chartSize.h > 0 && (() => {
              const volW = chartSize.w - CHART_PAD.left - CHART_PAD.right;
              const maxVol = Math.max(...visibleCandles.map((c) => c.volume));
              const gap = volW / visibleCandles.length;
              const bw = Math.max(1, gap * 0.7);
              return (
                <svg
                  style={{ position: 'absolute', bottom: CHART_PAD.bottom, left: CHART_PAD.left, pointerEvents: 'none' }}
                  width={volW}
                  height={40}
                >
                  {visibleCandles.map((c, i) => {
                    const bh = maxVol > 0 ? (c.volume / maxVol) * 38 : 0;
                    return (
                      <rect
                        key={c.time}
                        x={i * gap + gap / 2 - bw / 2}
                        y={40 - bh}
                        width={bw}
                        height={bh}
                        fill={c.isBullish ? '#10b981' : '#ef4444'}
                        opacity={0.25}
                      />
                    );
                  })}
                </svg>
              );
            })()}
          </>
        )}

        {wsStatus === 'offline' && visibleCandles.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-1">
            <span className="text-[10px] text-amber-400">Live feed paused — showing last data</span>
          </div>
        )}
      </div>
    </div>
  );
}
