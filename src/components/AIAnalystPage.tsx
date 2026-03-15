import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Search, Camera, TrendingUp, TrendingDown,
  Target, Shield, Zap, BarChart3, Upload, RefreshCw,
  X, BookmarkPlus, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  indicators: { rsi: string; macd: string; movingAverages: string };
  timestamp: string;
}

const timeframes = [
  { label: '1m', value: '1min' },
  { label: '5m', value: '5min' },
  { label: '15m', value: '15min' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

const commoditySymbols = [
  { symbol: 'GC=F', name: 'Gold', tvSymbol: 'COMEX:GC1!' },
  { symbol: 'SI=F', name: 'Silver', tvSymbol: 'COMEX:SI1!' },
  { symbol: 'CL=F', name: 'Oil', tvSymbol: 'NYMEX:CL1!' },
  { symbol: 'NG=F', name: 'Gas', tvSymbol: 'NYMEX:NG1!' },
  { symbol: 'HG=F', name: 'Copper', tvSymbol: 'COMEX:HG1!' },
  { symbol: 'ZC=F', name: 'Corn', tvSymbol: 'CBOT:ZC1!' },
  { symbol: 'ZS=F', name: 'Soybean', tvSymbol: 'CBOT:ZS1!' },
  { symbol: 'ZW=F', name: 'Wheat', tvSymbol: 'CBOT:ZW1!' },
];

const formatPrice = (price: number) => price >= 100 ? price.toFixed(2) : price.toFixed(4);

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

// --- Sub-components ---

const PriceLevels = ({ entry, target, stopLoss }: { entry: number; target: number; stopLoss: number }) => (
  <div className="grid grid-cols-3 gap-2">
    <div className="text-center p-2.5 rounded-lg bg-muted/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Entry</p>
      <p className="font-bold">${formatPrice(entry)}</p>
    </div>
    <div className="text-center p-2.5 rounded-lg bg-success/10">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target</p>
      <p className="font-bold text-success">${formatPrice(target)}</p>
    </div>
    <div className="text-center p-2.5 rounded-lg bg-destructive/10">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stop</p>
      <p className="font-bold text-destructive">${formatPrice(stopLoss)}</p>
    </div>
  </div>
);

const SignalResult = ({ signal, onSave, isSaving, canSave }: {
  signal: TradeSignal;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}) => (
  <Card className="border-primary/30 animate-fade-in">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{signal.symbol}</span>
          <Badge className={signal.direction === 'LONG' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
            {signal.direction}
          </Badge>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{signal.confidence}%</span>
      </div>

      <PriceLevels entry={signal.entry} target={signal.target} stopLoss={signal.stopLoss} />

      <div className="flex items-center gap-2 text-sm">
        <Shield className={`w-3.5 h-3.5 ${getRiskColor(signal.riskLevel)}`} />
        <span className={getRiskColor(signal.riskLevel)}>{signal.riskLevel} Risk</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{signal.reasoning}</p>

      {signal.keyFactors.length > 0 && (
        <ul className="space-y-1">
          {signal.keyFactors.map((f, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>{f}
            </li>
          ))}
        </ul>
      )}

      {canSave && (
        <Button onClick={onSave} disabled={isSaving} className="w-full" size="sm">
          <BookmarkPlus className="w-4 h-4 mr-1.5" />
          {isSaving ? 'Saving…' : 'Save to Journal'}
        </Button>
      )}
    </CardContent>
  </Card>
);

const ChartAnalysisResult = ({ analysis, onSave, isSaving, canSave }: {
  analysis: ChartAnalysis;
  onSave: () => void;
  isSaving: boolean;
  canSave: boolean;
}) => (
  <Card className="border-primary/30 animate-fade-in">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{analysis.symbol}</span>
          <Badge className={analysis.recommendation === 'BUY' ? 'bg-success text-success-foreground' : analysis.recommendation === 'SELL' ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'}>
            {analysis.recommendation}
          </Badge>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{analysis.confidence}%</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {analysis.trend === 'BULLISH' ? <TrendingUp className="w-4 h-4 text-success" /> :
         analysis.trend === 'BEARISH' ? <TrendingDown className="w-4 h-4 text-destructive" /> :
         <BarChart3 className="w-4 h-4 text-warning" />}
        <span className={getTrendColor(analysis.trend)}>{analysis.trend}</span>
      </div>

      <PriceLevels entry={analysis.entryPrice} target={analysis.targetPrice} stopLoss={analysis.stopLoss} />

      {/* Indicators row */}
      <div className="grid grid-cols-3 gap-2">
        {[['RSI', analysis.indicators.rsi], ['MACD', analysis.indicators.macd], ['MAs', analysis.indicators.movingAverages]].map(([label, val]) => (
          <div key={label} className="p-2 rounded-lg bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
            <p className="text-xs font-medium capitalize">{val}</p>
          </div>
        ))}
      </div>

      {/* Support / Resistance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Support</p>
          <div className="flex flex-wrap gap-1">
            {analysis.supportLevels.map((l, i) => (
              <Badge key={i} variant="outline" className="text-[10px] text-success border-success/40">${formatPrice(l)}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Resistance</p>
          <div className="flex flex-wrap gap-1">
            {analysis.resistanceLevels.map((l, i) => (
              <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/40">${formatPrice(l)}</Badge>
            ))}
          </div>
        </div>
      </div>

      {analysis.keyPatterns.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.keyPatterns.map((p, i) => <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>)}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Shield className={`w-3.5 h-3.5 ${getRiskColor(analysis.riskLevel)}`} />
        <span className={getRiskColor(analysis.riskLevel)}>{analysis.riskLevel} Risk</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.reasoning}</p>

      {canSave && (
        <Button onClick={onSave} disabled={isSaving} className="w-full" size="sm">
          <BookmarkPlus className="w-4 h-4 mr-1.5" />
          {isSaving ? 'Saving…' : 'Save to Journal'}
        </Button>
      )}
    </CardContent>
  </Card>
);

// --- Main Page ---

export const AIAnalystPage = () => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('live');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<TradeSignal | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState(commoditySymbols[0]);
  const [chartAnalysis, setChartAnalysis] = useState<ChartAnalysis | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false);
  const [isSavingSignal, setIsSavingSignal] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { marketData, isLoading: isMarketLoading, refetch: refetchMarket } = useRealTimeMarketData();
  const { signals, stats, saveSignal } = useAISignals();
  const { user } = useAuth();

  const getMarketPrice = (symbol: string) => {
    const data = marketData.find(m => m.symbol === symbol);
    return data ? { price: data.price, change: data.change, changePercent: data.changePercent } : null;
  };

  const currentPrice = getMarketPrice(selectedCommodity.symbol);

  const getAnalysis = async (symbolToAnalyze?: string) => {
    const symbol = symbolToAnalyze || searchSymbol.trim() || selectedCommodity.symbol;
    if (!symbol) {
      toast({ title: 'Enter a symbol', description: 'Please enter a commodity symbol to analyze', variant: 'destructive' });
      return;
    }
    const priceData = getMarketPrice(symbol);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: { symbol: symbol.toUpperCase(), price: priceData?.price || 0, change: priceData?.change || 0, changePercent: priceData?.changePercent || 0, timeframe: selectedTimeframe, marketData }
      });
      if (error) throw error;
      if (data.success && data.analysis) {
        const entryPrice = priceData?.price || data.analysis.targetPrice * (data.analysis.recommendation === 'BUY' ? 0.98 : 1.02);
        setCurrentSignal({
          symbol: data.analysis.symbol || symbol.toUpperCase(),
          direction: data.analysis.recommendation === 'BUY' ? 'LONG' : data.analysis.recommendation === 'SELL' ? 'SHORT' : 'LONG',
          entry: entryPrice, target: data.analysis.targetPrice, stopLoss: data.analysis.stopLoss,
          confidence: data.analysis.confidence, timestamp: data.analysis.timestamp, status: 'pending',
          reasoning: data.analysis.reasoning, keyFactors: data.analysis.keyFactors, riskLevel: data.analysis.riskLevel,
        });
        const commodity = commoditySymbols.find(c => c.symbol === symbol.toUpperCase());
        if (commodity) setSelectedCommodity(commodity);
      } else throw new Error(data.error || 'Analysis failed');
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast({ title: 'Analysis Failed', description: error instanceof Error ? error.message : 'Could not get AI analysis', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeChart = async () => {
    if (!uploadedImage) {
      toast({ title: 'No image', description: 'Upload a chart image first', variant: 'destructive' });
      return;
    }
    setIsAnalyzingChart(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chart-analysis', {
        body: { imageBase64: uploadedImage, timeframe: selectedTimeframe }
      });
      if (error) throw error;
      if (data.success && data.analysis) {
        setChartAnalysis(data.analysis);
        toast({ title: 'Analysis Complete', description: `${data.analysis.recommendation} signal detected` });
      } else throw new Error(data.error || 'Chart analysis failed');
    } catch (error) {
      console.error('Error analyzing chart:', error);
      toast({ title: 'Analysis Failed', description: error instanceof Error ? error.message : 'Could not analyze chart', variant: 'destructive' });
    } finally {
      setIsAnalyzingChart(false);
    }
  };

  const handleSaveLiveSignal = async () => {
    if (!currentSignal) return;
    setIsSavingSignal(true);
    await saveSignal({
      symbol: currentSignal.symbol, direction: currentSignal.direction,
      entry_price: currentSignal.entry, target_price: currentSignal.target, stop_loss: currentSignal.stopLoss,
      confidence: currentSignal.confidence, risk_level: currentSignal.riskLevel, timeframe: selectedTimeframe,
      reasoning: currentSignal.reasoning, key_factors: currentSignal.keyFactors, signal_source: 'live',
    });
    setIsSavingSignal(false);
  };

  const handleSaveChartSignal = async () => {
    if (!chartAnalysis) return;
    setIsSavingSignal(true);
    await saveSignal({
      symbol: chartAnalysis.symbol, direction: chartAnalysis.recommendation === 'BUY' ? 'LONG' : 'SHORT',
      entry_price: chartAnalysis.entryPrice, target_price: chartAnalysis.targetPrice, stop_loss: chartAnalysis.stopLoss,
      confidence: chartAnalysis.confidence, risk_level: chartAnalysis.riskLevel, timeframe: selectedTimeframe,
      reasoning: chartAnalysis.reasoning, key_factors: chartAnalysis.keyPatterns, signal_source: 'chart_upload',
    });
    setIsSavingSignal(false);
  };

  const performanceStats = stats || { winRate: 0, totalSignals: 0, wonSignals: 0, lostSignals: 0, pendingSignals: 0 };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">AI Analyst</h1>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refetchMarket} disabled={isMarketLoading}>
            <RefreshCw className={`w-4 h-4 ${isMarketLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Market Bar — scrollable chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {commoditySymbols.map((c) => {
            const p = getMarketPrice(c.symbol);
            const active = selectedCommodity.symbol === c.symbol;
            return (
              <button
                key={c.symbol}
                onClick={() => setSelectedCommodity(c)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                }`}
              >
                {c.name}
                {p && (
                  <span className={`ml-1.5 ${p.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {p.change >= 0 ? '+' : ''}{p.changePercent.toFixed(1)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-sm font-semibold">{selectedCommodity.name}</span>
            {currentPrice && (
              <div className="text-right">
                <span className="font-bold text-sm">${formatPrice(currentPrice.price)}</span>
                <span className={`ml-2 text-xs ${currentPrice.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {currentPrice.change >= 0 ? '+' : ''}{currentPrice.changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <TradingViewChart symbol={selectedCommodity.tvSymbol} height={280} theme="dark" />
        </Card>

        {/* Analysis Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="live" className="text-xs gap-1.5"><Search className="w-3.5 h-3.5" />Live</TabsTrigger>
            <TabsTrigger value="vision" className="text-xs gap-1.5"><Camera className="w-3.5 h-3.5" />Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-3 mt-3">
            {/* Search + Analyze */}
            <div className="flex gap-2">
              <Input
                placeholder="Symbol e.g. GC=F"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getAnalysis()}
                className="flex-1 h-9 text-sm"
              />
              <Button onClick={() => getAnalysis()} disabled={isLoading} size="sm">
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Analyze'}
              </Button>
            </div>

            {/* Timeframes */}
            <div className="flex gap-1.5 flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setSelectedTimeframe(tf.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedTimeframe === tf.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Quick symbols */}
            <div className="flex gap-1.5 flex-wrap">
              {commoditySymbols.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => { setSelectedCommodity(item); setSearchSymbol(item.symbol); getAnalysis(item.symbol); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    selectedCommodity.symbol === item.symbol
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vision" className="space-y-3 mt-3">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {!uploadedImage ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-muted-foreground/20 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload chart screenshot</p>
                <p className="text-[10px] text-muted-foreground">PNG, JPG · Max 5MB</p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img src={uploadedImage} alt="Chart" className="w-full rounded-lg border border-border" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => { setUploadedImage(null); setChartAnalysis(null); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {timeframes.map((tf) => (
                    <button key={tf.value} onClick={() => setSelectedTimeframe(tf.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedTimeframe === tf.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}>{tf.label}</button>
                  ))}
                </div>

                <Button onClick={analyzeChart} disabled={isAnalyzingChart} className="w-full" size="sm">
                  <Brain className="w-4 h-4 mr-1.5" />
                  {isAnalyzingChart ? 'Analyzing…' : 'Analyze Chart'}
                </Button>
              </div>
            )}

            {isAnalyzingChart && (
              <div className="space-y-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-20" />
              </div>
            )}

            {chartAnalysis && !isAnalyzingChart && (
              <ChartAnalysisResult
                analysis={chartAnalysis}
                onSave={handleSaveChartSignal}
                isSaving={isSavingSignal}
                canSave={!!user}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Technical Indicators */}
        <Collapsible open={showIndicators} onOpenChange={setShowIndicators}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Brain className="w-4 h-4 text-primary" />
                Technical Indicators
              </span>
              {showIndicators ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {[
              { name: 'Trend Analysis', desc: 'Market structure, higher highs/lows, MA positions', icon: TrendingUp },
              { name: 'Precision Levels', desc: 'Support, resistance, supply/demand zones', icon: Target },
              { name: 'Risk Management', desc: 'Stop loss, take profit, 1:2+ R:R ratios', icon: Shield },
              { name: 'Volume Analysis', desc: 'Volume patterns and institutional activity', icon: BarChart3 },
            ].map((ind) => (
              <div key={ind.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                <ind.icon className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{ind.name}</p>
                  <p className="text-xs text-muted-foreground">{ind.desc}</p>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-20" />
          </div>
        )}

        {/* Signal Result */}
        {currentSignal && !isLoading && (
          <SignalResult
            signal={currentSignal}
            onSave={handleSaveLiveSignal}
            isSaving={isSavingSignal}
            canSave={!!user}
          />
        )}

        {/* Performance Stats */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Performance
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-lg font-bold text-primary">{performanceStats.winRate.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-lg font-bold">{performanceStats.totalSignals}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10">
              <p className="text-lg font-bold text-warning">{performanceStats.pendingSignals}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </div>
        </div>

        {/* Recent Signals */}
        {signals.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent Signals</h2>
              <span className="text-xs text-muted-foreground">{signals.length} total</span>
            </div>
            {signals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{signal.symbol}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${signal.direction === 'LONG' ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                    {signal.direction}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{signal.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">${formatPrice(signal.entry_price)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(signal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
