import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Brain, AlertCircle, Target, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  { label: '1 Min', value: '1min' },
  { label: '5 Min', value: '5min' },
  { label: '15 Min', value: '15min' },
  { label: '1 Hour', value: '1h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
  { label: 'YTD', value: 'ytd' },
];

export const AIMarketAnalysis = ({ 
  symbol, 
  price, 
  change, 
  changePercent,
  marketData 
}: AIMarketAnalysisProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: {
          symbol,
          price,
          change,
          changePercent,
          timeframe: selectedTimeframe,
          marketData
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
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

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-success text-success-foreground';
      case 'SELL': return 'bg-destructive text-destructive-foreground';
      case 'HOLD': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      case 'HOLD': return <Minus className="w-5 h-5" />;
      default: return null;
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

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold">AI Market Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Timeframe Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Timeframe
          </label>
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
        </div>

        {/* Analyze Button */}
        <Button 
          onClick={getAnalysis}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Analyzing...' : 'Get AI Analysis'}
        </Button>

        {/* Analysis Results */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {analysis && !isLoading && (
          <div className="space-y-4 animate-fade-in">
            {/* Recommendation Card */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(analysis.recommendation)}
                  <Badge className={getRecommendationColor(analysis.recommendation)}>
                    {analysis.recommendation}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-lg font-bold">{analysis.confidence}%</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-success" />
                  <div>
                    <div className="text-xs text-muted-foreground">Target</div>
                    <div className="font-semibold">${analysis.targetPrice.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-destructive" />
                  <div>
                    <div className="text-xs text-muted-foreground">Stop Loss</div>
                    <div className="font-semibold">${analysis.stopLoss.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
              <AlertCircle className={`w-5 h-5 ${getRiskColor(analysis.riskLevel)}`} />
              <div>
                <div className="text-sm font-medium">Risk Level</div>
                <div className={`text-lg font-bold ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel}
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Analysis</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.reasoning}
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Key Factors</h4>
              <ul className="space-y-1">
                {analysis.keyFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground text-right">
              Analyzed at {new Date(analysis.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
