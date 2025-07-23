import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewsCard } from '@/components/NewsCard';
import { BloombergTVPlayer } from '@/components/BloombergTVPlayer';
import { CrawlForm } from '@/components/CrawlForm';
import { useBloombergNews } from '@/hooks/useBloombergNews';
import { 
  Search, 
  Newspaper, 
  TrendingUp, 
  Globe,
  RefreshCw,
  Filter,
  Wifi,
  WifiOff
} from 'lucide-react';

export const BloombergNewsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { articles, isLoading, error, lastUpdated, refetch, hasApiKey } = useBloombergNews();

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

  const handleRefresh = async () => {
    await refetch();
  };

  const marketSummary = {
    sp500: { value: '6,124.78', change: '+42.15', changePercent: '+0.69%', isPositive: true },
    nasdaq: { value: '20,845.32', change: '-67.89', changePercent: '-0.32%', isPositive: false },
    dow: { value: '44,267.91', change: '+156.23', changePercent: '+0.35%', isPositive: true },
    oil: { value: '$92.30', change: '+1.45', changePercent: '+1.59%', isPositive: true }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Bloomberg News
            {hasApiKey && (
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
            )}
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
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
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
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Market Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Market Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(marketSummary).map(([key, data]) => (
                <div key={key} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-sm text-muted-foreground uppercase">
                    {key === 'sp500' ? 'S&P 500' : key.toUpperCase()}
                  </div>
                  <div className="font-bold text-lg">{data.value}</div>
                  <div className={`text-sm ${data.isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {data.change} ({data.changePercent})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="news" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="news">Latest News</TabsTrigger>
            <TabsTrigger value="live">Bloomberg TV</TabsTrigger>
            <TabsTrigger value="scraper">News Scraper</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4">
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
                      <Globe className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Setup Required</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Configure your Firecrawl API key in the News Scraper tab to automatically fetch live Bloomberg news
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
                      {isLoading ? 'Loading News...' : 'No Articles Found'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {isLoading ? 'Fetching the latest Bloomberg news' : 
                       searchQuery ? `No articles match "${searchQuery}"` : 
                       error ? 'Failed to fetch news. Try refreshing.' :
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
          </TabsContent>

          <TabsContent value="live">
            <BloombergTVPlayer />
          </TabsContent>

          <TabsContent value="scraper">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Real-time News Scraper
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Scrape the latest Bloomberg news and financial data using Firecrawl API
                  </p>
                </CardHeader>
              </Card>
              <CrawlForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};