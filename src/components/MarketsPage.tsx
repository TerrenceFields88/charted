import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TradingViewChart, TradingViewMiniChart } from '@/components/TradingViewChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Star,
  BarChart3
} from 'lucide-react';

export const MarketsPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('NASDAQ:AAPL');
  const [watchlist, setWatchlist] = useState([
    'NASDAQ:AAPL', 'NASDAQ:GOOGL', 'NASDAQ:MSFT', 'NYSE:TSLA'
  ]);

  const marketData = [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.', 
      price: 192.85, 
      change: 1.45, 
      changePercent: 0.76, 
      volume: '52.3M',
      tvSymbol: 'NASDAQ:AAPL'
    },
    { 
      symbol: 'GOOGL', 
      name: 'Alphabet Inc.', 
      price: 142.56, 
      change: -2.34, 
      changePercent: -1.62, 
      volume: '28.7M',
      tvSymbol: 'NASDAQ:GOOGL'
    },
    { 
      symbol: 'MSFT', 
      name: 'Microsoft Corporation', 
      price: 378.85, 
      change: 3.22, 
      changePercent: 0.86, 
      volume: '31.2M',
      tvSymbol: 'NASDAQ:MSFT'
    },
    { 
      symbol: 'TSLA', 
      name: 'Tesla Inc.', 
      price: 248.50, 
      change: -5.67, 
      changePercent: -2.23, 
      volume: '89.4M',
      tvSymbol: 'NASDAQ:TSLA'
    }
  ];

  const cryptoData = [
    { symbol: 'BTC', name: 'Bitcoin', price: 42350, change: 1250.50, changePercent: 3.04 },
    { symbol: 'ETH', name: 'Ethereum', price: 2580.75, change: -45.20, changePercent: -1.72 },
    { symbol: 'ADA', name: 'Cardano', price: 0.485, change: 0.023, changePercent: 4.98 },
  ];

  const forexData = [
    { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: 1.0845, change: -0.0023, changePercent: -0.21 },
    { symbol: 'GBP/USD', name: 'British Pound/US Dollar', price: 1.2654, change: 0.0045, changePercent: 0.36 },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: 149.85, change: 0.34, changePercent: 0.23 },
  ];

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Markets</h1>
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Main Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Chart</span>
              <select 
                value={selectedSymbol} 
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="text-sm bg-background border rounded px-2 py-1"
              >
                {marketData.map(stock => (
                  <option key={stock.tvSymbol} value={stock.tvSymbol}>
                    {stock.symbol}
                  </option>
                ))}
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TradingViewChart 
              symbol={selectedSymbol}
              height={400}
              theme="dark"
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="stocks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="forex">Forex</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <div className="space-y-3">
              {marketData.map((stock) => (
                <Card key={stock.symbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="font-semibold">{stock.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{stock.name}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Volume: {stock.volume}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold">${stock.price}</div>
                        <div className={`flex items-center gap-1 text-sm ${
                          stock.change >= 0 ? 'text-bullish' : 'text-bearish'
                        }`}>
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedSymbol(stock.tvSymbol)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => addToWatchlist(stock.tvSymbol)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crypto">
            <div className="space-y-3">
              {cryptoData.map((crypto) => (
                <Card key={crypto.symbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{crypto.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{crypto.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${crypto.price.toLocaleString()}</div>
                        <div className={`flex items-center gap-1 text-sm ${
                          crypto.change >= 0 ? 'text-bullish' : 'text-bearish'
                        }`}>
                          {crypto.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{crypto.change >= 0 ? '+' : ''}{crypto.change} ({crypto.changePercent}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forex">
            <div className="space-y-3">
              {forexData.map((pair) => (
                <Card key={pair.symbol}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{pair.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{pair.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{pair.price.toFixed(4)}</div>
                        <div className={`flex items-center gap-1 text-sm ${
                          pair.change >= 0 ? 'text-bullish' : 'text-bearish'
                        }`}>
                          {pair.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{pair.change >= 0 ? '+' : ''}{pair.change.toFixed(4)} ({pair.changePercent}%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watchlist">
            <div className="space-y-3">
              {watchlist.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Your watchlist is empty</p>
                    <p className="text-sm text-muted-foreground">Add symbols to track your favorite assets</p>
                  </CardContent>
                </Card>
              ) : (
                watchlist.map((symbol) => (
                  <Card key={symbol}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <TradingViewMiniChart
                          symbol={symbol}
                          height={100}
                          width="100%"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromWatchlist(symbol)}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};