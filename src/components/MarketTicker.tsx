import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

export const MarketTicker = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: 'SPY', price: 445.67, change: 2.34, changePercent: 0.53, type: 'stock' },
    { symbol: 'EUR/USD', price: 1.0845, change: -0.0023, changePercent: -0.21, type: 'forex' },
    { symbol: 'BTC', price: 42350, change: 1250.50, changePercent: 3.04, type: 'crypto' },
    { symbol: 'GC', price: 2035.40, change: -12.30, changePercent: -0.60, type: 'futures' },
    { symbol: 'AAPL', price: 192.85, change: 1.45, changePercent: 0.76, type: 'stock' },
    { symbol: 'GBP/USD', price: 1.2654, change: 0.0045, changePercent: 0.36, type: 'forex' },
    { symbol: 'ETH', price: 2580.75, change: -45.20, changePercent: -1.72, type: 'crypto' },
    { symbol: 'CL', price: 78.45, change: 0.85, changePercent: 1.10, type: 'futures' },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(item => {
          const randomChange = (Math.random() - 0.5) * 0.02; // Random change ±1%
          const newPrice = item.price * (1 + randomChange);
          const priceChange = newPrice - item.price;
          const percentChange = (priceChange / item.price) * 100;
          
          return {
            ...item,
            price: Number(newPrice.toFixed(item.type === 'forex' ? 4 : 2)),
            change: Number(priceChange.toFixed(item.type === 'forex' ? 4 : 2)),
            changePercent: Number(percentChange.toFixed(2))
          };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, type: string) => {
    if (type === 'forex') return price.toFixed(4);
    if (type === 'crypto' && price > 1000) return price.toLocaleString();
    return price.toFixed(2);
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex animate-scroll whitespace-nowrap py-2">
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