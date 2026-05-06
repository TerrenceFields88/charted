import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';

const COMMODITY_MAP: { keywords: RegExp; symbol: string; name: string; icon: string }[] = [
  { keywords: /\b(gold|xau|\$gc|gc=f)\b/i, symbol: 'GC=F', name: 'Gold', icon: '🥇' },
  { keywords: /\b(silver|xag|\$si|si=f)\b/i, symbol: 'SI=F', name: 'Silver', icon: '⚪' },
  { keywords: /\b(crude|oil|wti|\$cl|cl=f)\b/i, symbol: 'CL=F', name: 'Crude Oil', icon: '🛢️' },
  { keywords: /\b(natgas|natural gas|\$ng|ng=f)\b/i, symbol: 'NG=F', name: 'Nat Gas', icon: '🔥' },
  { keywords: /\b(copper|\$hg|hg=f)\b/i, symbol: 'HG=F', name: 'Copper', icon: '🔶' },
  { keywords: /\b(corn|\$zc|zc=f)\b/i, symbol: 'ZC=F', name: 'Corn', icon: '🌽' },
  { keywords: /\b(soybean|soy|\$zs|zs=f)\b/i, symbol: 'ZS=F', name: 'Soybean', icon: '🫘' },
  { keywords: /\b(wheat|\$zw|zw=f)\b/i, symbol: 'ZW=F', name: 'Wheat', icon: '🌾' },
];

export const detectCommodities = (text: string): string[] => {
  const found = new Set<string>();
  for (const c of COMMODITY_MAP) if (c.keywords.test(text)) found.add(c.symbol);
  return Array.from(found);
};

interface Props {
  symbols: string[];
}

export const InlineMarketCard = ({ symbols }: Props) => {
  const { marketData } = useRealTimeMarketData();
  if (!symbols.length) return null;

  const items = symbols
    .map((s) => {
      const meta = COMMODITY_MAP.find((c) => c.symbol === s);
      const data = marketData.find((m) => m.symbol === s);
      return meta && data ? { ...meta, ...data } : null;
    })
    .filter(Boolean) as Array<{ symbol: string; name: string; icon: string; price: number; change: number; changePercent: number }>;

  if (!items.length) return null;

  return (
    <div className="mx-3 mb-2 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/30 bg-card/40">
        <Activity className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Live Quote</span>
      </div>
      <div className="divide-y divide-border/30">
        {items.map((item) => {
          const up = item.change >= 0;
          return (
            <div key={item.symbol} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight">{item.name}</p>
                  <p className="text-[9px] font-mono-num text-muted-foreground">{item.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono-num">
                  ${item.price > 1000 ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : item.price.toFixed(2)}
                </p>
                <p className={`flex items-center justify-end gap-0.5 text-[10px] font-medium font-mono-num ${up ? 'text-success' : 'text-destructive'}`}>
                  {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {up ? '+' : ''}{item.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
