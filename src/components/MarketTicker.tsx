import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';

export const MarketTicker = () => {
  const { marketData, isLoading, error, lastUpdated } = useRealTimeMarketData();

  const formatPrice = (price: number, type: string) => {
    if (type === 'forex') return price.toFixed(4);
    if (type === 'crypto' && price > 1000) return price.toLocaleString();
    return price.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex animate-scroll whitespace-nowrap py-2">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mx-6 min-w-max">
          {error ? (
            <>
              <WifiOff className="w-3 h-3 text-destructive" />
              <span className="text-xs text-destructive">Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-xs text-muted-foreground">Live</span>
            </>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Market data */}
        {[...marketData, ...marketData].map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-2 mx-6 min-w-max">
            <span className="font-medium text-sm">{item.symbol}</span>
            <span className="font-bold text-sm">${formatPrice(item.price, item.type)}</span>
            <div className={`flex items-center gap-1 text-xs ${
              item.change >= 0 ? 'text-bullish' : 'text-bearish'
            }`}>
              {item.change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{item.change >= 0 ? '+' : ''}{item.change}</span>
              <span>({item.changePercent >= 0 ? '+' : ''}{item.changePercent}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};