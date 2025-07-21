import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Volume2, Target } from "lucide-react";
import { FutureContract } from "@/types/futures";
import { PredictionBadge } from "./PredictionBadge";

interface FutureCardProps {
  contract: FutureContract;
}

export const FutureCard = ({ contract }: FutureCardProps) => {
  const isPositive = contract.change >= 0;
  const momentumAbs = Math.abs(contract.momentum);
  const momentumColor = contract.momentum > 0 ? 'text-bullish' : 'text-bearish';

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return volume.toString();
  };

  return (
    <Card className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card via-card to-card/50">
      {/* Subtle gradient overlay for prediction direction */}
      <div 
        className={`absolute inset-0 opacity-5 ${
          contract.prediction.direction === 'bullish' 
            ? 'bg-gradient-to-br from-bullish to-transparent' 
            : contract.prediction.direction === 'bearish'
            ? 'bg-gradient-to-br from-bearish to-transparent'
            : 'bg-gradient-to-br from-neutral to-transparent'
        }`} 
      />
      
      <CardHeader className="relative pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{contract.symbol}</CardTitle>
            <p className="text-sm text-muted-foreground">{contract.name}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Vol: {formatVolume(contract.volume)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">${formatNumber(contract.price)}</span>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-medium">
                {isPositive ? '+' : ''}{formatNumber(contract.change)}
              </span>
              <span className="text-sm">
                ({isPositive ? '+' : ''}{formatNumber(contract.changePercent)}%)
              </span>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>24h High: ${formatNumber(contract.high24h)}</span>
            <span>24h Low: ${formatNumber(contract.low24h)}</span>
          </div>
        </div>

        {/* Momentum Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Momentum</span>
            <span className={`text-sm font-bold ${momentumColor}`}>
              {contract.momentum > 0 ? '+' : ''}{contract.momentum}
            </span>
          </div>
          <Progress 
            value={50 + (contract.momentum / 2)} 
            className="h-2"
          />
        </div>

        {/* Prediction Section */}
        <div className="space-y-3 p-3 rounded-lg bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">AI Prediction</span>
            <PredictionBadge prediction={contract.prediction} />
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium">${formatNumber(contract.prediction.targetPrice)}</span>
            <span className="text-xs text-muted-foreground">({contract.prediction.timeframe})</span>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {contract.prediction.reasoning}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">All Time High</span>
            <p className="font-medium">${formatNumber(contract.allTimeHigh)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Open Interest</span>
            <p className="font-medium">{formatVolume(contract.openInterest)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};