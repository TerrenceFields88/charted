import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { useBloombergNews } from '@/hooks/useBloombergNews';
import { NewsCard } from '@/components/NewsCard';
import { BloombergTVPlayer } from '@/components/BloombergTVPlayer';
import { InvestingAnalysisPage } from '@/components/InvestingAnalysisPage';
import { AIMarketAnalysis } from '@/components/AIMarketAnalysis';
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Newspaper,
  Search,
  BarChart3,
  Brain
} from 'lucide-react';

export const MarketsPage = () => {
  const { marketData, isLoading, error, lastUpdated, refetch } = useRealTimeMarketData();
  const { articles, isLoading: newsLoading, error: newsError, lastUpdated: newsLastUpdated, refetch: newsRefetch, hasApiKey } = useBloombergNews();
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');

  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toFixed(2);
  };

  const getCommodityIcon = (symbol: string) => {
    if (symbol.includes('GC')) return '🥇'; // Gold
    if (symbol.includes('SI')) return '⚪'; // Silver
    if (symbol.includes('CL')) return '🛢️'; // Crude Oil
    if (symbol.includes('NG')) return '🔥'; // Natural Gas
    if (symbol.includes('HG')) return '🔶'; // Copper
    if (symbol.includes('ZC')) return '🌽'; // Corn
    if (symbol.includes('ZS')) return '🫘'; // Soybean
    if (symbol.includes('ZW')) return '🌾'; // Wheat
    return '📈';
  };

  const getCommodityName = (symbol: string) => {
    const names: { [key: string]: string } = {
      'GC=F': 'Gold',
      'SI=F': 'Silver',
      'CL=F': 'Crude Oil WTI',
      'NG=F': 'Natural Gas',
      'HG=F': 'Copper',
      'ZC=F': 'Corn',
      'ZS=F': 'Soybean',
      'ZW=F': 'Wheat'
    };
    return names[symbol] || symbol;
  };

  const MarketDataSection = () => (
    <div className="space-y-6">
      {/* Real-time Commodities Futures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketData.map((item) => (
          <Card key={item.symbol} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{getCommodityIcon(item.symbol)}</span>
                  <div>
                    <div>{getCommodityName(item.symbol)}</div>
                    <div className="text-xs text-muted-foreground font-normal">{item.symbol}</div>
                  </div>
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  FUTURES
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  ${formatPrice(item.price)}
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
                    {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                  </span>
                  <span className="font-medium">
                    ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
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
            <h3 className="font-semibold">Real-Time Commodities Futures Data</h3>
            <p className="text-sm text-muted-foreground">
              Live commodities futures data from Yahoo Finance. Updates every 30 seconds during market hours.
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

  const NewsSection = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
      { value: 'all', label: 'All Commodities' },
      { value: 'energy', label: 'Energy' },
      { value: 'metals', label: 'Metals' },
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'markets', label: 'Market Analysis' }
    ];

    const filteredArticles = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
                             article.category?.toLowerCase().includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search commodities news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="whitespace-nowrap"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* News Articles */}
        <div className="space-y-4">
          {!hasApiKey ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Newspaper className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Setup Required</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure your Firecrawl API key to automatically fetch live commodities news
                </p>
              </CardContent>
            </Card>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Newspaper className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">
                  {newsLoading ? 'Loading Commodities News...' : 'No Articles Found'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {newsLoading ? 'Fetching the latest commodities news' : 
                   searchQuery ? `No articles match "${searchQuery}"` : 
                   newsError ? 'Failed to fetch news. Try refreshing.' :
                   'No articles available for this category'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))
          )}
        </div>

        {/* Bloomberg TV */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Commodities Market TV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BloombergTVPlayer />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Commodities Futures
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="markets" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Futures
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1">
              <Newspaper className="w-4 h-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Charts
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="markets" className="mt-6">
            <MarketDataSection />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Commodity to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="w-full p-3 rounded-lg bg-card border border-border text-foreground"
                  >
                    {marketData.map((data) => (
                      <option key={data.symbol} value={data.symbol}>
                        {getCommodityIcon(data.symbol)} {getCommodityName(data.symbol)} - ${formatPrice(data.price)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {marketData.find(m => m.symbol === selectedSymbol) && (
                <AIMarketAnalysis
                  symbol={selectedSymbol}
                  price={marketData.find(m => m.symbol === selectedSymbol)!.price}
                  change={marketData.find(m => m.symbol === selectedSymbol)!.change}
                  changePercent={marketData.find(m => m.symbol === selectedSymbol)!.changePercent}
                  marketData={marketData}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="news" className="mt-6">
            <NewsSection />
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-6">
            <InvestingAnalysisPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};