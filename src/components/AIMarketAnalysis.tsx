import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, TrendingDown, Minus, Target, Shield, AlertCircle } from 'lucide-react';

interface MarketAnalysis {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string;
  keyFactors: string[];
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

interface AIMarketAnalysisProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketData?: any;
}

const timeframes = [
  { label: '1m', value: '1min' },
  { label: '5m', value: '5min' },
  { label: '15m', value: '15min' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: 'YTD', value: 'ytd' },
];

const getRecColor = (rec: string) => {
  switch (rec) {
    case 'BUY': return 'bg-success text-success-foreground';
    case 'SELL': return 'bg-destructive text-destructive-foreground';
    case 'HOLD': return 'bg-warning text-warning-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'LOW': return 'text-success';
    case 'MEDIUM': return 'text-warning';
    case 'HIGH': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

export const AIMarketAnalysis = ({ symbol, price, change, changePercent, marketData }: AIMarketAnalysisProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: { symbol, price, change, changePercent, timeframe: selectedTimeframe, marketData }
      });
      if (error) throw error;
      if (data.success) setAnalysis(data.analysis);
      else throw new Error(data.error || 'Analysis failed');
    } catch (error) {
      console.error('Error getting AI analysis:', error);
      toast({ title: 'Analysis Failed', description: error instanceof Error ? error.message : 'Could not get AI analysis', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Analysis</h3>
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

        <Button onClick={getAnalysis} disabled={isLoading} className="w-full" size="sm">
          {isLoading ? 'Analyzing…' : 'Get AI Analysis'}
        </Button>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-14" />
            <Skeleton className="h-24" />
          </div>
        )}

        {analysis && !isLoading && (
          <div className="space-y-3 animate-fade-in">
            {/* Recommendation */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                {analysis.recommendation === 'BUY' ? <TrendingUp className="w-4 h-4 text-success" /> :
                 analysis.recommendation === 'SELL' ? <TrendingDown className="w-4 h-4 text-destructive" /> :
                 <Minus className="w-4 h-4 text-warning" />}
                <Badge className={getRecColor(analysis.recommendation)}>{analysis.recommendation}</Badge>
              </div>
              <span className="text-sm font-bold">{analysis.confidence}%</span>
            </div>

            {/* Price levels */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10">
                <Target className="w-3.5 h-3.5 text-success" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Target</p>
                  <p className="text-sm font-semibold">${analysis.targetPrice.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10">
                <Shield className="w-3.5 h-3.5 text-destructive" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Stop Loss</p>
                  <p className="text-sm font-semibold">${analysis.stopLoss.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Risk */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20">
              <AlertCircle className={`w-4 h-4 ${getRiskColor(analysis.riskLevel)}`} />
              <span className={`text-sm font-medium ${getRiskColor(analysis.riskLevel)}`}>
                {analysis.riskLevel} Risk
              </span>
            </div>

            {/* Reasoning */}
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.reasoning}</p>

            {/* Key Factors */}
            {analysis.keyFactors.length > 0 && (
              <ul className="space-y-1">
                {analysis.keyFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>{factor}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-[10px] text-muted-foreground text-right">
              {new Date(analysis.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
