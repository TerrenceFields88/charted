import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { FutureContract } from "@/types/futures";

interface PredictionBadgeProps {
  prediction: FutureContract['prediction'];
  size?: 'sm' | 'md' | 'lg';
}

export const PredictionBadge = ({ prediction, size = 'md' }: PredictionBadgeProps) => {
  const getIcon = () => {
    switch (prediction.direction) {
      case 'bullish':
        return <TrendingUp className="w-3 h-3" />;
      case 'bearish':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getVariant = () => {
    switch (prediction.direction) {
      case 'bullish':
        return 'default'; // Will use our green primary color
      case 'bearish':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getConfidenceColor = () => {
    if (prediction.confidence >= 70) return 'text-primary';
    if (prediction.confidence >= 50) return 'text-neutral';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getVariant()} className="flex items-center gap-1">
        {getIcon()}
        <span className="capitalize">{prediction.direction}</span>
      </Badge>
      <span className={`text-sm font-medium ${getConfidenceColor()}`}>
        {prediction.confidence}%
      </span>
    </div>
  );
};