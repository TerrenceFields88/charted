import { useRealTimeData } from "@/hooks/useRealTimeData";
import { FutureCard } from "./FutureCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, TrendingUp, TrendingDown, Users } from "lucide-react";

export const MarketsPage = () => {
  const { futures, isConnected } = useRealTimeData();
  
  const getMarketSentiment = () => {
    const bullishCount = futures.filter(f => f.prediction.direction === 'bullish').length;
    const bearishCount = futures.filter(f => f.prediction.direction === 'bearish').length;
    
    if (bullishCount > bearishCount) return { sentiment: 'bullish', ratio: bullishCount / futures.length };
    if (bearishCount > bullishCount) return { sentiment: 'bearish', ratio: bearishCount / futures.length };
    return { sentiment: 'neutral', ratio: 0.5 };
  };

  const marketSentiment = getMarketSentiment();

  const topMovers = [...futures]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Live Markets</h1>
          <div className="flex items-center gap-2">
            <Badge variant={marketSentiment.sentiment === 'bullish' ? 'default' : 'destructive'}>
              {marketSentiment.sentiment === 'bullish' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.round(marketSentiment.ratio * 100)}% {marketSentiment.sentiment}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Connection Status */}
        <Alert className={`mb-4 ${isConnected ? 'border-bullish/20 bg-bullish/5' : 'border-destructive/20 bg-destructive/5'}`}>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-bullish" /> : <WifiOff className="w-4 h-4 text-destructive" />}
            <AlertDescription className={isConnected ? 'text-bullish' : 'text-destructive'}>
              {isConnected ? 'Connected to real-time market data' : 'Disconnected from market data'}
            </AlertDescription>
          </div>
        </Alert>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="futures">Futures</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Top Movers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Movers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topMovers.map((future) => (
                  <div key={future.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="font-semibold">{future.symbol}</div>
                      <div className="text-sm text-muted-foreground">{future.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${future.price}</div>
                      <div className={`text-sm ${future.change >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {future.change >= 0 ? '+' : ''}{future.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="futures">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futures.map((future) => (
                <FutureCard key={future.symbol} contract={future} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center text-muted-foreground">
                    Social sentiment analysis coming soon...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};