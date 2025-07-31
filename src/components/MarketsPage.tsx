import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { BloombergNewsPage } from '@/components/BloombergNewsPage';
import { InvestingAnalysisPage } from '@/components/InvestingAnalysisPage';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

export const MarketsPage = () => {
  const { marketData, isLoading, error, lastUpdated, refetch } = useRealTimeMarketData();

  const formatPrice = (price: number, type: string) => {
    if (type === 'forex') return price.toFixed(4);
    if (type === 'crypto' && price > 1000) return price.toLocaleString();
    return price.toFixed(2);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crypto': return '₿';
      case 'forex': return '💱';
      case 'futures': return '📈';
      default: return '📊';
    }
  };

  const LiveMarketsContent = () => (
    <div className="space-y-6">
      {/* Real-time Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketData.map((item) => (
          <Card key={item.symbol} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  {item.symbol}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {item.type.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  ${formatPrice(item.price, item.type)}
                </div>
                <div className={`flex items-center gap-2 text-sm ${
                  item.change >= 0 ? 'text-bullish' : 'text-bearish'
                }`}>
                  {item.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {item.change >= 0 ? '+' : ''}{item.change}
                  </span>
                  <span className="font-medium">
                    ({item.changePercent >= 0 ? '+' : ''}{item.changePercent}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Source Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Real-Time Market Data</h3>
            <p className="text-sm text-muted-foreground">
              Live financial data from Yahoo Finance API. Updates every 30 seconds during market hours.
            </p>
            {error && (
              <p className="text-sm text-destructive">
                {error} - Showing fallback data
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Markets & News
            <Badge variant={error ? "destructive" : "secondary"} className="ml-2">
              {error ? (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </>
              )}
            </Badge>
          </h1>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Live Markets</TabsTrigger>
            <TabsTrigger value="news">Bloomberg News</TabsTrigger>
            <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="markets" className="mt-6">
            <LiveMarketsContent />
          </TabsContent>
          
          <TabsContent value="news" className="mt-6">
            <BloombergNewsPage />
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            <InvestingAnalysisPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};