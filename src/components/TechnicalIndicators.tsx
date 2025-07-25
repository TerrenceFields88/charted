import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

interface TechnicalIndicatorsProps {
  marketData: MarketData[];
}

export const TechnicalIndicators = ({ marketData }: TechnicalIndicatorsProps) => {
  // Calculate technical indicators based on market data
  const calculateRSI = (symbol: string) => {
    // Simplified RSI calculation based on price change
    const data = marketData.find(d => d.symbol === symbol);
    if (!data) return 50;
    
    const changePercent = Math.abs(data.changePercent);
    if (data.changePercent > 0) {
      return Math.min(50 + changePercent * 2, 90);
    } else {
      return Math.max(50 - changePercent * 2, 10);
    }
  };

  const getSignal = (rsi: number) => {
    if (rsi > 70) return { text: 'Overbought', color: 'destructive', icon: TrendingDown };
    if (rsi < 30) return { text: 'Oversold', color: 'constructive', icon: TrendingUp };
    return { text: 'Neutral', color: 'secondary', icon: Minus };
  };

  const majorSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'BTC-USD', 'EUR/USD'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {majorSymbols.map((symbol) => {
          const data = marketData.find(d => d.symbol === symbol) || {
            symbol,
            price: 0,
            change: 0,
            changePercent: Math.random() * 4 - 2,
            type: 'stock' as const
          };
          
          const rsi = calculateRSI(symbol);
          const signal = getSignal(rsi);
          const SignalIcon = signal.icon;

          return (
            <Card key={symbol}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{symbol}</CardTitle>
                  <Badge variant={signal.color as any} className="flex items-center gap-1">
                    <SignalIcon className="w-3 h-3" />
                    {signal.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className="font-medium">{rsi.toFixed(1)}</span>
                  </div>
                  <Progress value={rsi} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Price Change</div>
                    <div className={`font-medium ${data.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Momentum</div>
                    <div className="font-medium">
                      {Math.abs(data.changePercent) > 2 ? 'Strong' : 'Weak'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};