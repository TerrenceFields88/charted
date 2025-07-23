import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewsCard } from '@/components/NewsCard';
import { BloombergTVPlayer } from '@/components/BloombergTVPlayer';
import { CrawlForm } from '@/components/CrawlForm';
import { 
  Search, 
  Newspaper, 
  TrendingUp, 
  Globe,
  RefreshCw,
  Filter
} from 'lucide-react';

// Mock news data for demonstration
const mockNewsArticles = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cuts Amid Economic Uncertainty',
    description: 'Fed officials indicate they may consider reducing interest rates in response to slowing economic indicators and inflation concerns.',
    url: 'https://bloomberg.com/news/fed-rate-cuts',
    publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    source: 'Bloomberg',
    category: 'Monetary Policy',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop'
  },
  {
    id: '2',
    title: 'Tech Giants Report Mixed Earnings as AI Investments Surge',
    description: 'Major technology companies show varied quarterly results while continuing to pour billions into artificial intelligence development.',
    url: 'https://bloomberg.com/news/tech-earnings',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'Bloomberg',
    category: 'Technology',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop'
  },
  {
    id: '3',
    title: 'Oil Prices Surge on OPEC+ Production Cut Extension',
    description: 'Crude oil futures jump as OPEC+ announces plans to extend production cuts through the first quarter of next year.',
    url: 'https://bloomberg.com/news/oil-prices',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'Bloomberg',
    category: 'Energy',
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop'
  },
  {
    id: '4',
    title: 'Dollar Strengthens as Investors Seek Safe Haven Assets',
    description: 'The US dollar gains against major currencies as global economic uncertainties drive demand for safe haven investments.',
    url: 'https://bloomberg.com/news/dollar-strength',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: 'Bloomberg',
    category: 'Currency',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&h=400&fit=crop'
  }
];

export const BloombergNewsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState(mockNewsArticles);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const marketSummary = {
    sp500: { value: '4,783.45', change: '+12.34', changePercent: '+0.26%', isPositive: true },
    nasdaq: { value: '15,034.86', change: '-45.67', changePercent: '-0.30%', isPositive: false },
    dow: { value: '37,123.45', change: '+89.12', changePercent: '+0.24%', isPositive: true },
    oil: { value: '$78.45', change: '+1.23', changePercent: '+1.59%', isPositive: true }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Bloomberg News
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
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
              {filteredArticles.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Newspaper className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No Articles Found</h3>
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? `No articles match "${searchQuery}"` : 'No articles available for this category'}
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