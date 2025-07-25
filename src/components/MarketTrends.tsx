import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

interface MarketTrendsProps {
  marketData: MarketData[];
}

export const MarketTrends = ({ marketData }: MarketTrendsProps) => {
  // Calculate market trends
  const gainers = marketData
    .filter(item => item.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);

  const losers = marketData
    .filter(item => item.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  const mostActive = marketData
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  const marketSentiment = marketData.length > 0 
    ? (gainers.length / marketData.length) * 100 
    : 50;

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 60) return 'text-green-600';
    if (sentiment < 40) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentText = (sentiment: number) => {
    if (sentiment > 60) return 'Bullish';
    if (sentiment < 40) return 'Bearish';
    return 'Neutral';
  };

  return (
    <div className="space-y-6">
      {/* Market Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall Sentiment</span>
              <Badge variant="outline" className={getSentimentColor(marketSentiment)}>
                {getSentimentText(marketSentiment)}
              </Badge>
            </div>
            <Progress value={marketSentiment} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-medium">{gainers.length}</div>
                <div className="text-muted-foreground">Gainers</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-medium">
                  {marketData.length - gainers.length - losers.length}
                </div>
                <div className="text-muted-foreground">Unchanged</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-medium">{losers.length}</div>
                <div className="text-muted-foreground">Losers</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gainers.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{item.symbol}</div>
                  <div className="text-xs text-muted-foreground">${item.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600 text-sm">
                    +{item.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-green-600">
                    +${item.change.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="w-4 h-4" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {losers.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{item.symbol}</div>
                  <div className="text-xs text-muted-foreground">${item.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600 text-sm">
                    {item.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-red-600">
                    ${item.change.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Most Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostActive.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{item.symbol}</div>
                  <div className="text-xs text-muted-foreground">${item.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-medium text-sm ${
                    item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Activity: {Math.abs(item.changePercent).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};