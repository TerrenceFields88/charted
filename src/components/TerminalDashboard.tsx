import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { useBloombergNews } from '@/hooks/useBloombergNews';
import { TradingViewMiniChart } from '@/components/TradingViewMiniChart';
import { Badge } from '@/components/ui/badge';

const COMMODITIES = [
  { symbol: 'GC=F', tv: 'COMEX:GC1!', name: 'Gold', icon: '🥇' },
  { symbol: 'SI=F', tv: 'COMEX:SI1!', name: 'Silver', icon: '⚪' },
  { symbol: 'CL=F', tv: 'NYMEX:CL1!', name: 'Crude', icon: '🛢️' },
  { symbol: 'NG=F', tv: 'NYMEX:NG1!', name: 'NatGas', icon: '🔥' },
  { symbol: 'HG=F', tv: 'COMEX:HG1!', name: 'Copper', icon: '🔶' },
  { symbol: 'ZC=F', tv: 'CBOT:ZC1!', name: 'Corn', icon: '🌽' },
  { symbol: 'ZS=F', tv: 'CBOT:ZS1!', name: 'Soybean', icon: '🫘' },
  { symbol: 'ZW=F', tv: 'CBOT:ZW1!', name: 'Wheat', icon: '🌾' },
];

const formatPrice = (p: number) =>
  p > 1000 ? p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.toFixed(2);

export const TerminalDashboard = () => {
  const { marketData, lastUpdated } = useRealTimeMarketData();
  const { articles } = useBloombergNews();
  const [activeChart, setActiveChart] = useState(COMMODITIES[0]);

  const dataMap = new Map(marketData.map((m) => [m.symbol, m]));
  const headlines = articles.slice(0, 8);

  return (
    <div className="space-y-3 font-mono-num">
      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-card border border-border/50">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-success ember-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">TERMINAL · LIVE</span>
        </div>
        {lastUpdated && (
          <span className="text-[9px] text-muted-foreground">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Heatmap */}
      <div>
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 px-1">HEATMAP</p>
        <div className="grid grid-cols-4 gap-1">
          {COMMODITIES.map((c) => {
            const d = dataMap.get(c.symbol);
            const cp = d?.changePercent ?? 0;
            const intensity = Math.min(Math.abs(cp) / 3, 1);
            const bg = cp >= 0
              ? `hsl(var(--success) / ${0.15 + intensity * 0.55})`
              : `hsl(var(--destructive) / ${0.15 + intensity * 0.55})`;
            return (
              <button
                key={c.symbol}
                onClick={() => setActiveChart(c)}
                style={{ backgroundColor: bg }}
                className={`p-1.5 rounded-md border transition-all active:scale-95 ${
                  activeChart.symbol === c.symbol ? 'border-primary' : 'border-border/30'
                }`}
              >
                <div className="text-sm leading-none">{c.icon}</div>
                <div className="text-[9px] font-bold mt-0.5 tracking-wide">{c.name.toUpperCase()}</div>
                <div className="text-[10px] font-bold mt-0.5">{cp >= 0 ? '+' : ''}{cp.toFixed(2)}%</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-quote board */}
      <div>
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 px-1">QUOTE BOARD</p>
        <div className="rounded-md border border-border/50 bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr,auto,auto] gap-2 px-2 py-1 bg-muted/40 text-[9px] font-bold tracking-widest text-muted-foreground">
            <span>SYMBOL</span><span className="text-right">LAST</span><span className="text-right w-14">CHG%</span>
          </div>
          {COMMODITIES.map((c) => {
            const d = dataMap.get(c.symbol);
            const cp = d?.changePercent ?? 0;
            const up = cp >= 0;
            return (
              <button
                key={c.symbol}
                onClick={() => setActiveChart(c)}
                className="w-full grid grid-cols-[1fr,auto,auto] gap-2 px-2 py-1.5 border-t border-border/30 hover:bg-muted/30 active:scale-[0.98] transition-all text-left"
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <span>{c.icon}</span> {c.symbol}
                </span>
                <span className="text-right text-xs font-bold">${d ? formatPrice(d.price) : '—'}</span>
                <span className={`text-right w-14 text-xs font-bold flex items-center justify-end gap-0.5 ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {up ? '+' : ''}{cp.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active chart */}
      <div>
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 px-1 flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> CHART · {activeChart.name.toUpperCase()}
        </p>
        <div className="rounded-md border border-border/50 overflow-hidden bg-card">
          <TradingViewMiniChart symbol={activeChart.tv} height={220} theme="dark" />
        </div>
      </div>

      {/* News wire */}
      <div>
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 px-1">NEWS WIRE</p>
        <div className="rounded-md border border-border/50 bg-card divide-y divide-border/30">
          {headlines.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">Awaiting wire feed…</div>
          ) : headlines.map((a: any) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-2 py-1.5 hover:bg-muted/30 active:scale-[0.99] transition-all"
            >
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-[8px] h-4 px-1 mt-0.5 border-primary/40 text-primary shrink-0">
                  {a.category?.toUpperCase().slice(0, 6) || 'WIRE'}
                </Badge>
                <p className="text-[11px] leading-tight font-medium line-clamp-2">{a.title}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
