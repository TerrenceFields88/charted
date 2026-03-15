import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import {
  TrendingUp, TrendingDown, Activity, Wifi, WifiOff,
  Newspaper, Search, BarChart3, Brain
} from 'lucide-react';

const getCommodityIcon = (symbol: string) => {
  if (symbol.includes('GC')) return '🥇';
  if (symbol.includes('SI')) return '⚪';
  if (symbol.includes('CL')) return '🛢️';
  if (symbol.includes('NG')) return '🔥';
  if (symbol.includes('HG')) return '🔶';
  if (symbol.includes('ZC')) return '🌽';
  if (symbol.includes('ZS')) return '🫘';
  if (symbol.includes('ZW')) return '🌾';
  return '📈';
};

const getCommodityName = (symbol: string) => {
  const names: Record<string, string> = {
    'GC=F': 'Gold', 'SI=F': 'Silver', 'CL=F': 'Crude Oil',
    'NG=F': 'Nat Gas', 'HG=F': 'Copper', 'ZC=F': 'Corn',
    'ZS=F': 'Soybean', 'ZW=F': 'Wheat',
  };
  return names[symbol] || symbol;
};

const formatPrice = (price: number) =>
  price > 1000
    ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toFixed(2);

export const MarketsPage = () => {
  const { marketData, isLoading, error, lastUpdated, refetch } = useRealTimeMarketData();
  const { articles, isLoading: newsLoading, error: newsError, hasApiKey } = useBloombergNews();
  const [selectedSymbol, setSelectedSymbol] = useState('GC=F');

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: async () => { await refetch(); },
  });

  const selectedData = marketData.find(m => m.symbol === selectedSymbol);

  return (
    <div ref={containerRef} className="pb-20 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">Markets</h1>
            <Badge variant={error ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
              {error ? <><WifiOff className="w-2.5 h-2.5 mr-0.5" />Offline</> : <><Wifi className="w-2.5 h-2.5 mr-0.5" />Live</>}
            </Badge>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">{lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />

      <div className="px-4 pt-3 pb-4">
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="markets" className="text-xs gap-1"><Activity className="w-3.5 h-3.5" />Futures</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs gap-1"><Brain className="w-3.5 h-3.5" />AI</TabsTrigger>
            <TabsTrigger value="news" className="text-xs gap-1"><Newspaper className="w-3.5 h-3.5" />News</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="mt-3 space-y-3">
            {/* Commodity cards */}
            <div className="grid grid-cols-2 gap-2">
              {marketData.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedSymbol === item.symbol
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{getCommodityIcon(item.symbol)}</span>
                    <div>
                      <p className="text-xs font-semibold">{getCommodityName(item.symbol)}</p>
                      <p className="text-[10px] text-muted-foreground">{item.symbol}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold">${formatPrice(item.price)}</p>
                  <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${
                    item.change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-xs text-destructive text-center">{error} — Showing fallback data</p>
            )}
          </TabsContent>

          <TabsContent value="ai" className="mt-3 space-y-3">
            {/* Commodity selector pills */}
            <div className="flex gap-1.5 flex-wrap">
              {marketData.map((d) => (
                <button
                  key={d.symbol}
                  onClick={() => setSelectedSymbol(d.symbol)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedSymbol === d.symbol
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getCommodityName(d.symbol)}
                </button>
              ))}
            </div>

            {selectedData && (
              <AIMarketAnalysis
                symbol={selectedSymbol}
                price={selectedData.price}
                change={selectedData.change}
                changePercent={selectedData.changePercent}
                marketData={marketData}
              />
            )}
          </TabsContent>

          <TabsContent value="news" className="mt-3 space-y-3">
            <NewsSection articles={articles} newsLoading={newsLoading} newsError={newsError} hasApiKey={hasApiKey} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-3">
            <InvestingAnalysisPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// --- News Section ---
const NewsSection = ({ articles, newsLoading, newsError, hasApiKey }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const categories = ['all', 'energy', 'metals', 'agriculture', 'markets'];

  const filteredArticles = articles.filter((a: any) => {
    const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || a.category?.toLowerCase().includes(selectedCategory);
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
        <Input placeholder="Search news…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all ${
              selectedCategory === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {!hasApiKey ? (
        <div className="text-center py-8">
          <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Configure Firecrawl API key for live news</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{newsLoading ? 'Loading…' : 'No articles found'}</p>
        </div>
      ) : (
        filteredArticles.map((article: any) => <NewsCard key={article.id} article={article} />)
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Market TV
          </p>
          <BloombergTVPlayer />
        </CardContent>
      </Card>
    </div>
  );
};
