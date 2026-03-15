import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

export const PullToRefreshIndicator = ({ pullDistance, isRefreshing, progress }: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: pullDistance }}
    >
      <div className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground transition-all",
        progress >= 1 && "text-primary"
      )}>
        <RefreshCw className={cn(
          "w-4 h-4 transition-transform duration-200",
          isRefreshing && "animate-spin",
        )} style={{ transform: `rotate(${progress * 360}deg)` }} />
        <span>{isRefreshing ? 'Refreshing…' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
    </div>
  );
};
