import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  text?: string;
  confidence?: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
}

export const PostPredictionBadge = ({ text, confidence, sentiment = 'neutral' }: Props) => {
  if (!text && confidence == null) return null;

  const tone =
    sentiment === 'bullish' ? 'border-success/40 bg-success/5 text-success' :
    sentiment === 'bearish' ? 'border-destructive/40 bg-destructive/5 text-destructive' :
    'border-primary/40 bg-primary/5 text-primary';

  const Icon = sentiment === 'bullish' ? TrendingUp : sentiment === 'bearish' ? TrendingDown : Minus;

  const conf = typeof confidence === 'number' ? Math.max(0, Math.min(100, Math.round(confidence))) : null;
  const confColor =
    conf == null ? '' :
    conf >= 75 ? 'bg-success' :
    conf >= 50 ? 'bg-primary' :
    conf >= 25 ? 'bg-warning' : 'bg-destructive';
  const confLabel =
    conf == null ? '' :
    conf >= 75 ? 'High' :
    conf >= 50 ? 'Medium' :
    conf >= 25 ? 'Low' : 'Very low';

  return (
    <div className={cn('mx-3 mb-2 rounded-xl border p-2.5', tone)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">Prediction</span>
        <Icon className="w-3 h-3 ml-auto" />
      </div>
      {text && <p className="text-xs text-foreground/85 leading-snug mb-2">{text}</p>}
      {conf != null && (
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold opacity-80">Confidence · {confLabel}</span>
            <span className="font-mono font-bold">{conf}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background/60 overflow-hidden">
            <div className={cn('h-full transition-all', confColor)} style={{ width: `${conf}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};
