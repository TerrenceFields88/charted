import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

interface MarketHeatmapProps {
  marketData: MarketData[];
}

export const MarketHeatmap = ({ marketData }: MarketHeatmapProps) => {
  const getHeatmapColor = (changePercent: number) => {
    const intensity = Math.min(Math.abs(changePercent) / 5, 1); // Max intensity at 5%
    
    if (changePercent > 0) {
      return {
        background: `rgba(34, 197, 94, ${intensity * 0.8})`, // Green with opacity
        text: changePercent > 2 ? 'text-white' : 'text-green-900'
      };
    } else {
      return {
        background: `rgba(239, 68, 68, ${intensity * 0.8})`, // Red with opacity
        text: changePercent < -2 ? 'text-white' : 'text-red-900'
      };
    }
  };

  const groupedData = marketData.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MarketData[]>);

  const typeLabels = {
    stock: 'Stocks',
    crypto: 'Crypto',
    forex: 'Forex',
    futures: 'Futures'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([type, data]) => {
        const avgChange = data.reduce((sum, item) => sum + item.changePercent, 0) / data.length;
        
        return (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{typeLabels[type as keyof typeof typeLabels]}</CardTitle>
                <Badge variant={avgChange >= 0 ? "default" : "destructive"}>
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}% avg
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.map((item) => {
                  const colors = getHeatmapColor(item.changePercent);
                  
                  return (
                    <div
                      key={item.symbol}
                      className={cn(
                        "p-3 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer",
                        colors.text
                      )}
                      style={{ backgroundColor: colors.background }}
                    >
                      <div className="font-medium text-sm truncate">
                        {item.symbol}
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        ${item.price.toFixed(2)}
                      </div>
                      <div className="font-bold text-sm mt-1">
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};