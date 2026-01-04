import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Search, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Zap,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Crosshair,
  Upload,
  RefreshCw,
  X,
  BookmarkPlus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRealTimeMarketData } from '@/hooks/useRealTimeMarketData';
import { TradingViewChart } from './TradingViewChart';
import { useAISignals } from '@/hooks/useAISignals';
import { useAuth } from '@/hooks/useAuth';

interface TradeSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'won' | 'lost';
  reasoning: string;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface ChartAnalysis {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  keyPatterns: string[];
  supportLevels: number[];
  resistanceLevels: number[];
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  indicators: {
    rsi: string;
    macd: string;
    movingAverages: string;
  };
  timestamp: string;
}

const timeframes = [
  { label: '1 Min', value: '1min' },
  { label: '5 Min', value: '5min' },
  { label: '15 Min', value: '15min' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
];

const commoditySymbols = [
  { symbol: 'GC=F', name: 'Gold', tvSymbol: 'COMEX:GC1!' },
  { symbol: 'SI=F', name: 'Silver', tvSymbol: 'COMEX:SI1!' },
  { symbol: 'CL=F', name: 'Crude Oil', tvSymbol: 'NYMEX:CL1!' },
  { symbol: 'NG=F', name: 'Natural Gas', tvSymbol: 'NYMEX:NG1!' },
  { symbol: 'HG=F', name: 'Copper', tvSymbol: 'COMEX:HG1!' },
  { symbol: 'ZC=F', name: 'Corn', tvSymbol: 'CBOT:ZC1!' },
  { symbol: 'ZS=F', name: 'Soybean', tvSymbol: 'CBOT:ZS1!' },
  { symbol: 'ZW=F', name: 'Wheat', tvSymbol: 'CBOT:ZW1!' },
];

export const AIAnalystPage = () => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('live');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<TradeSignal | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState(commoditySymbols[0]);
  const [chartAnalysis, setChartAnalysis] = useState<ChartAnalysis | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false);
  const [isSavingSignal, setIsSavingSignal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { marketData, isLoading: isMarketLoading, refetch: refetchMarket } = useRealTimeMarketData();
  const { signals, stats, saveSignal } = useAISignals();
  const { user } = useAuth();

  // Get real-time price for selected commodity
  const getMarketPrice = (symbol: string) => {
    const data = marketData.find(m => m.symbol === symbol);
    return data ? { price: data.price, change: data.change, changePercent: data.changePercent } : null;
  };

  const currentPrice = getMarketPrice(selectedCommodity.symbol);

  // Use real stats from the journal
  const performanceStats = stats ? {
    overallWinRate: stats.winRate,
    totalTrades: stats.totalSignals,
    commoditiesAccuracy: stats.winRate,
    commoditiesTrades: stats.wonSignals + stats.lostSignals,
    activeSignals: stats.pendingSignals,
  } : {
    overallWinRate: 0,
    totalTrades: 0,
    commoditiesAccuracy: 0,
    commoditiesTrades: 0,
    activeSignals: 0,
  };

  const indicators = [
    { name: 'Trend Analysis', description: 'Identifies market structure, higher highs, lower lows, and moving average positions', icon: TrendingUp },
    { name: 'Precision Levels', description: 'Maps exact support, resistance, and institutional supply/demand zones', icon: Crosshair },
    { name: 'Risk Management', description: 'Calculates optimal stop loss and take profit with 1:2+ risk-reward ratios', icon: Shield },
    { name: 'Volume Analysis', description: 'Analyzes volume patterns and institutional activity', icon: BarChart3 },
  ];

  const getAnalysis = async (symbolToAnalyze?: string) => {
    const symbol = symbolToAnalyze || searchSymbol.trim() || selectedCommodity.symbol;
    if (!symbol) {
      toast({
        title: 'Enter a symbol',
        description: 'Please enter a commodity symbol to analyze',
        variant: 'destructive',
      });
      return;
    }

    const priceData = getMarketPrice(symbol);
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: {
          symbol: symbol.toUpperCase(),
          price: priceData?.price || 0,
          change: priceData?.change || 0,
          changePercent: priceData?.changePercent || 0,
          timeframe: selectedTimeframe,
          marketData: marketData,
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        const entryPrice = priceData?.price || data.analysis.targetPrice * (data.analysis.recommendation === 'BUY' ? 0.98 : 1.02);
        const newSignal: TradeSignal = {
          symbol: data.analysis.symbol || symbol.toUpperCase(),
          direction: data.analysis.recommendation === 'BUY' ? 'LONG' : data.analysis.recommendation === 'SELL' ? 'SHORT' : 'LONG',
          entry: entryPrice,
          target: data.analysis.targetPrice,
          stopLoss: data.analysis.stopLoss,
          confidence: data.analysis.confidence,
          timestamp: data.analysis.timestamp,
          status: 'pending',
          reasoning: data.analysis.reasoning,
          keyFactors: data.analysis.keyFactors,
          riskLevel: data.analysis.riskLevel,
        };
        setCurrentSignal(newSignal);
        
        // Update selected commodity for chart
        const commodity = commoditySymbols.find(c => c.symbol === symbol.toUpperCase());
        if (commodity) {
          setSelectedCommodity(commodity);
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not get AI analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAnalysis = (commodity: typeof commoditySymbols[0]) => {
    setSelectedCommodity(commodity);
    setSearchSymbol(commodity.symbol);
    getAnalysis(commodity.symbol);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeChart = async () => {
    if (!uploadedImage) {
      toast({
        title: 'No image',
        description: 'Please upload a chart image first',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzingChart(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chart-analysis', {
        body: {
          imageBase64: uploadedImage,
          timeframe: selectedTimeframe,
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setChartAnalysis(data.analysis);
        toast({
          title: 'Analysis Complete',
          description: `Chart analyzed successfully - ${data.analysis.recommendation} signal detected`,
        });
      } else {
        throw new Error(data.error || 'Chart analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing chart:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Could not analyze chart',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzingChart(false);
    }
  };

  const formatPrice = (price: number) => {
    return price >= 100 ? price.toFixed(2) : price.toFixed(4);
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'LONG' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-success';
      case 'MEDIUM': return 'text-warning';
      case 'HIGH': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'BULLISH': return 'text-success';
      case 'BEARISH': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Analysis
          </Badge>
          <Button variant="ghost" size="sm" onClick={refetchMarket} disabled={isMarketLoading}>
            <RefreshCw className={`w-4 h-4 ${isMarketLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-center">
          AI Trading <span className="text-primary">Analyst</span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Real-time commodities analysis with AI-powered signals
        </p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Live Market Data Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {commoditySymbols.slice(0, 4).map((commodity) => {
            const price = getMarketPrice(commodity.symbol);
            return (
              <Card 
                key={commodity.symbol} 
                className={`flex-shrink-0 cursor-pointer transition-all ${selectedCommodity.symbol === commodity.symbol ? 'border-primary' : ''}`}
                onClick={() => setSelectedCommodity(commodity)}
              >
                <CardContent className="p-3">
                  <p className="text-xs font-medium">{commodity.name}</p>
                  {price ? (
                    <>
                      <p className="font-bold">${formatPrice(price.price)}</p>
                      <p className={`text-xs ${price.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {price.change >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <Skeleton className="h-8 w-16" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* TradingView Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedCommodity.name} Chart</CardTitle>
              {currentPrice && (
                <div className="text-right">
                  <p className="font-bold">${formatPrice(currentPrice.price)}</p>
                  <p className={`text-xs ${currentPrice.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {currentPrice.change >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TradingViewChart 
              symbol={selectedCommodity.tvSymbol} 
              height={350}
              theme="dark"
            />
          </CardContent>
        </Card>

        {/* Analysis Mode Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Live Analysis
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Chart Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4 mt-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search symbol... GC=F, CL=F, ZW=F"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getAnalysis()}
                className="flex-1"
              />
              <Button onClick={() => getAnalysis()} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {/* Quick Symbols */}
            <div className="flex flex-wrap gap-2">
              {commoditySymbols.map((item) => (
                <Button
                  key={item.symbol}
                  variant={selectedCommodity.symbol === item.symbol ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickAnalysis(item)}
                  className="text-xs"
                >
                  {item.name}
                </Button>
              ))}
            </div>

            {/* Timeframe Selection */}
            <div className="flex flex-wrap gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf.value}
                  variant={selectedTimeframe === tf.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className="text-xs"
                >
                  {tf.label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vision" className="space-y-4 mt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            
            {!uploadedImage ? (
              <Card 
                className="border-dashed border-2 border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-2">
                    Upload a chart screenshot for AI analysis
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded chart" 
                    className="w-full rounded-lg border border-border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setUploadedImage(null);
                      setChartAnalysis(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timeframe for chart analysis */}
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((tf) => (
                    <Button
                      key={tf.value}
                      variant={selectedTimeframe === tf.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(tf.value)}
                      className="text-xs"
                    >
                      {tf.label}
                    </Button>
                  ))}
                </div>

                <Button 
                  onClick={analyzeChart} 
                  disabled={isAnalyzingChart}
                  className="w-full"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isAnalyzingChart ? 'Analyzing Chart...' : 'Analyze Chart with AI'}
                </Button>
              </div>
            )}

            {/* Chart Analysis Results */}
            {isAnalyzingChart && (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {chartAnalysis && !isAnalyzingChart && (
              <Card className="border-primary/50 animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{chartAnalysis.symbol}</span>
                      <Badge className={chartAnalysis.recommendation === 'BUY' ? 'bg-success' : chartAnalysis.recommendation === 'SELL' ? 'bg-destructive' : 'bg-warning'}>
                        {chartAnalysis.recommendation}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {chartAnalysis.confidence}% Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Trend */}
                  <div className="flex items-center gap-2">
                    {chartAnalysis.trend === 'BULLISH' ? <TrendingUp className="w-5 h-5 text-success" /> : 
                     chartAnalysis.trend === 'BEARISH' ? <TrendingDown className="w-5 h-5 text-destructive" /> :
                     <BarChart3 className="w-5 h-5 text-warning" />}
                    <span className={`font-semibold ${getTrendColor(chartAnalysis.trend)}`}>
                      {chartAnalysis.trend} Trend
                    </span>
                  </div>

                  {/* Price Levels */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="font-bold text-lg">${formatPrice(chartAnalysis.entryPrice)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-success/10">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-bold text-lg text-success">${formatPrice(chartAnalysis.targetPrice)}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-destructive/10">
                      <p className="text-xs text-muted-foreground">Stop Loss</p>
                      <p className="font-bold text-lg text-destructive">${formatPrice(chartAnalysis.stopLoss)}</p>
                    </div>
                  </div>

                  {/* Support/Resistance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Support Levels</p>
                      <div className="flex flex-wrap gap-1">
                        {chartAnalysis.supportLevels.map((level, idx) => (
                          <Badge key={idx} variant="outline" className="text-success border-success/50">
                            ${formatPrice(level)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Resistance Levels</p>
                      <div className="flex flex-wrap gap-1">
                        {chartAnalysis.resistanceLevels.map((level, idx) => (
                          <Badge key={idx} variant="outline" className="text-destructive border-destructive/50">
                            ${formatPrice(level)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Technical Indicators</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">RSI</p>
                        <p className="text-sm font-medium capitalize">{chartAnalysis.indicators.rsi}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">MACD</p>
                        <p className="text-sm font-medium capitalize">{chartAnalysis.indicators.macd}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/30 text-center">
                        <p className="text-xs text-muted-foreground">MAs</p>
                        <p className="text-sm font-medium capitalize">{chartAnalysis.indicators.movingAverages}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Chart Patterns Detected</h4>
                    <div className="flex flex-wrap gap-1">
                      {chartAnalysis.keyPatterns.map((pattern, idx) => (
                        <Badge key={idx} variant="secondary">{pattern}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Risk Level */}
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${getRiskColor(chartAnalysis.riskLevel)}`} />
                    <span className="text-sm">Risk Level:</span>
                    <span className={`font-semibold ${getRiskColor(chartAnalysis.riskLevel)}`}>
                      {chartAnalysis.riskLevel}
                    </span>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Analysis</h4>
                    <p className="text-sm text-muted-foreground">{chartAnalysis.reasoning}</p>
                  </div>

                  {/* Save to Journal Button */}
                  {user && (
                    <Button 
                      onClick={async () => {
                        setIsSavingSignal(true);
                        await saveSignal({
                          symbol: chartAnalysis.symbol,
                          direction: chartAnalysis.recommendation === 'BUY' ? 'LONG' : 'SHORT',
                          entry_price: chartAnalysis.entryPrice,
                          target_price: chartAnalysis.targetPrice,
                          stop_loss: chartAnalysis.stopLoss,
                          confidence: chartAnalysis.confidence,
                          risk_level: chartAnalysis.riskLevel,
                          timeframe: selectedTimeframe,
                          reasoning: chartAnalysis.reasoning,
                          key_factors: chartAnalysis.keyPatterns,
                          signal_source: 'chart_upload',
                        });
                        setIsSavingSignal(false);
                      }}
                      disabled={isSavingSignal}
                      className="w-full"
                    >
                      <BookmarkPlus className="w-4 h-4 mr-2" />
                      {isSavingSignal ? 'Saving...' : 'Save to Trade Journal'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Technical Indicators Collapsible */}
        <Collapsible open={isIndicatorsOpen} onOpenChange={setIsIndicatorsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Technical Indicators
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{indicators.length} active</span>
                {isIndicatorsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            {indicators.map((indicator, idx) => (
              <Card key={idx} className="bg-muted/30">
                <CardContent className="flex items-start gap-3 py-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <indicator.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{indicator.name}</h4>
                    <p className="text-xs text-muted-foreground">{indicator.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Current Signal Result */}
        {currentSignal && !isLoading && (
          <Card className="border-primary/50 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{currentSignal.symbol}</span>
                  <Badge className={getDirectionColor(currentSignal.direction)}>
                    {currentSignal.direction}
                  </Badge>
                </div>
                <Badge variant="outline">
                  {currentSignal.confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Entry</p>
                  <p className="font-bold text-lg">${formatPrice(currentSignal.entry)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-bold text-lg text-success">${formatPrice(currentSignal.target)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="font-bold text-lg text-destructive">${formatPrice(currentSignal.stopLoss)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${getRiskColor(currentSignal.riskLevel)}`} />
                <span className="text-sm">Risk Level:</span>
                <span className={`font-semibold ${getRiskColor(currentSignal.riskLevel)}`}>
                  {currentSignal.riskLevel}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground">{currentSignal.reasoning}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Key Factors</h4>
                <ul className="space-y-1">
                  {currentSignal.keyFactors.map((factor, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Save to Journal Button */}
              {user && (
                <Button 
                  onClick={async () => {
                    setIsSavingSignal(true);
                    await saveSignal({
                      symbol: currentSignal.symbol,
                      direction: currentSignal.direction,
                      entry_price: currentSignal.entry,
                      target_price: currentSignal.target,
                      stop_loss: currentSignal.stopLoss,
                      confidence: currentSignal.confidence,
                      risk_level: currentSignal.riskLevel,
                      timeframe: selectedTimeframe,
                      reasoning: currentSignal.reasoning,
                      key_factors: currentSignal.keyFactors,
                      signal_source: 'live',
                    });
                    setIsSavingSignal(false);
                  }}
                  disabled={isSavingSignal}
                  className="w-full"
                >
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  {isSavingSignal ? 'Saving...' : 'Save to Trade Journal'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Performance Stats */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">AI Performance</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">{performanceStats.overallWinRate}%</p>
                <p className="text-xs text-muted-foreground">Overall Win Rate</p>
                <p className="text-xs text-muted-foreground">{performanceStats.totalTrades} trades graded</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded bg-success/10">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-success">{performanceStats.commoditiesAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Commodities Accuracy</p>
                <p className="text-xs text-muted-foreground">{performanceStats.commoditiesTrades} trades</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 col-span-2">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded bg-warning/10">
                      <BarChart3 className="w-4 h-4 text-warning" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-warning">{performanceStats.activeSignals}</p>
                  <p className="text-xs text-muted-foreground">Active Signals</p>
                </div>
                <p className="text-xs text-muted-foreground">Awaiting outcome</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Signals from Journal */}
        {signals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Signals</h2>
              <Badge variant="outline" className="text-xs">{signals.length} total</Badge>
            </div>
            <div className="space-y-3">
              {signals.slice(0, 5).map((signal) => (
                <Card key={signal.id} className="bg-muted/30">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{signal.symbol}</span>
                            <Badge className={`text-xs ${getDirectionColor(signal.direction)}`}>
                              {signal.direction}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {signal.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(signal.created_at).toLocaleDateString()} • {new Date(signal.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Entry <span className="font-semibold">${formatPrice(signal.entry_price)}</span></p>
                        <p className="text-xs text-muted-foreground">Target ${formatPrice(signal.target_price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
