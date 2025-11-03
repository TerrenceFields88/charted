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

  const MarketDataSection = () => (
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

  const NewsSection = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
      { value: 'all', label: 'All News' },
      { value: 'markets', label: 'Markets' },
      { value: 'technology', label: 'Technology' },
      { value: 'energy', label: 'Energy' },
      { value: 'currency', label: 'Currency' },
      { value: 'policy', label: 'Policy' }
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
            placeholder="Search financial news..."
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
                  Configure your Firecrawl API key to automatically fetch live Bloomberg news
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
                  {newsLoading ? 'Loading News...' : 'No Articles Found'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {newsLoading ? 'Fetching the latest Bloomberg news' : 
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
              Bloomberg TV Live
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="markets" className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Markets
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              AI Predictions
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1">
              <Newspaper className="w-4 h-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="markets" className="mt-6">
            <MarketDataSection />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Asset to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    className="w-full p-3 rounded-lg bg-card border border-border text-foreground"
                  >
                    {marketData.map((data) => (
                      <option key={data.symbol} value={data.symbol}>
                        {data.symbol} - ${formatPrice(data.price, data.type)} ({data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%)
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