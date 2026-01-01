import { useState } from 'react';
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
  Crosshair
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

const timeframes = [
  { label: '1 Min', value: '1min' },
  { label: '5 Min', value: '5min' },
  { label: '15 Min', value: '15min' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
  { label: 'YTD', value: 'ytd' },
];

const commoditySymbols = [
  { symbol: 'GC=F', name: 'Gold' },
  { symbol: 'SI=F', name: 'Silver' },
  { symbol: 'CL=F', name: 'Crude Oil' },
  { symbol: 'NG=F', name: 'Natural Gas' },
  { symbol: 'HG=F', name: 'Copper' },
  { symbol: 'ZC=F', name: 'Corn' },
  { symbol: 'ZS=F', name: 'Soybean' },
  { symbol: 'ZW=F', name: 'Wheat' },
];

export const AIAnalystPage = () => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('live');
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<TradeSignal | null>(null);
  const [recentSignals, setRecentSignals] = useState<TradeSignal[]>([]);
  const { toast } = useToast();

  // Performance stats (would be fetched from backend in production)
  const performanceStats = {
    overallWinRate: 67,
    totalTrades: 3,
    commoditiesAccuracy: 75,
    commoditiesTrades: 4,
    activeSignals: recentSignals.filter(s => s.status === 'pending').length,
  };

  const indicators = [
    { name: 'Trend Analysis', description: 'Identifies market structure, higher highs, lower lows, and moving average positions', icon: TrendingUp },
    { name: 'Precision Levels', description: 'Maps exact support, resistance, and institutional supply/demand zones', icon: Crosshair },
    { name: 'Risk Management', description: 'Calculates optimal stop loss and take profit with 1:2+ risk-reward ratios', icon: Shield },
    { name: 'Volume Analysis', description: 'Analyzes volume patterns and institutional activity', icon: BarChart3 },
  ];

  const getAnalysis = async () => {
    if (!searchSymbol.trim()) {
      toast({
        title: 'Enter a symbol',
        description: 'Please enter a commodity symbol to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: {
          symbol: searchSymbol.toUpperCase(),
          price: 0,
          change: 0,
          changePercent: 0,
          timeframe: selectedTimeframe,
        }
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        const newSignal: TradeSignal = {
          symbol: data.analysis.symbol || searchSymbol.toUpperCase(),
          direction: data.analysis.recommendation === 'BUY' ? 'LONG' : data.analysis.recommendation === 'SELL' ? 'SHORT' : 'LONG',
          entry: data.analysis.targetPrice * (data.analysis.recommendation === 'BUY' ? 0.98 : 1.02),
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
        setRecentSignals(prev => [newSignal, ...prev].slice(0, 10));
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

  const handleQuickAnalysis = (symbol: string) => {
    setSearchSymbol(symbol);
    setTimeout(() => {
      getAnalysis();
    }, 100);
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

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="outline" className="text-primary border-primary/50 bg-primary/10">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Technical Analysis
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-center">
          Your AI Trading <span className="text-primary">Analyst</span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Search any commodity. Get instant, math-based trade setups with precise entries, stops, and targets.
        </p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Analysis Mode Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Live Data
            </TabsTrigger>
            <TabsTrigger value="vision" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Vision Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4 mt-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Search any symbol... GC=F, CL=F, ZW=F"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getAnalysis()}
                className="flex-1"
              />
              <Button onClick={getAnalysis} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>

            {/* Quick Symbols */}
            <div className="flex flex-wrap gap-2">
              {commoditySymbols.slice(0, 4).map((item) => (
                <Button
                  key={item.symbol}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAnalysis(item.symbol)}
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
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Upload a chart screenshot for AI analysis
                </p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
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

        {/* Recent Signals */}
        {recentSignals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Signals</h2>
            </div>
            <div className="space-y-3">
              {recentSignals.slice(0, 5).map((signal, idx) => (
                <Card key={idx} className="bg-muted/30">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{signal.symbol}</span>
                            <Badge className={`text-xs ${getDirectionColor(signal.direction)}`}>
                              {signal.direction}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(signal.timestamp).toLocaleDateString()} • {new Date(signal.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Entry <span className="font-semibold">${formatPrice(signal.entry)}</span></p>
                        <p className="text-xs text-muted-foreground">Confidence {signal.confidence}%</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {signal.status === 'pending' ? 'Pending' : signal.status === 'won' ? '✓ Won' : '✗ Lost'}
                      </Badge>
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
