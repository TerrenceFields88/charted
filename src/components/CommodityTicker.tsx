import { TrendingUp, TrendingDown } from 'lucide-react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';

const NAMES: Record<string, string> = {
  'GC=F': 'GOLD', 'SI=F': 'SILVER', 'CL=F': 'CRUDE', 'NG=F': 'NATGAS',
  'HG=F': 'COPPER', 'ZC=F': 'CORN', 'ZS=F': 'SOY', 'ZW=F': 'WHEAT',
};
const SYMBOLS = Object.keys(NAMES);

const formatPrice = (p: number) =>
  p > 1000 ? p.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.toFixed(2);

export const CommodityTicker = () => {
  const { marketData } = useRealTimeMarketData();
  const items = SYMBOLS
    .map((s) => marketData.find((m) => m.symbol === s))
    .filter(Boolean) as typeof marketData;

  if (items.length === 0) return null;

  return (
    <div className="bg-card/80 backdrop-blur-md border-b border-border/50 overflow-hidden h-7">
      <div className="flex animate-scroll whitespace-nowrap py-1.5">
        {[...items, ...items].map((item, i) => {
          const up = item.change >= 0;
          return (
            <div key={`${item.symbol}-${i}`} className="flex items-center gap-1.5 mx-4 min-w-max font-mono-num">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
                {NAMES[item.symbol]}
              </span>
              <span className="text-[10px] font-semibold text-foreground">
                ${formatPrice(item.price)}
              </span>
              <span className={`flex items-center gap-0.5 text-[10px] font-medium ${up ? 'text-success' : 'text-destructive'}`}>
                {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {up ? '+' : ''}{item.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
