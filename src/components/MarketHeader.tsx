import { Activity, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const MarketHeader = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="border-b bg-gradient-to-r from-background via-background to-background/95 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Futures Market Predictions
          </h1>
          <p className="text-muted-foreground">
            Real-time algorithmic analysis of commodity futures
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono">{currentTime}</span>
          </div>
          
          <Badge variant="default" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Live
          </Badge>
          
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-bullish" />
            <span className="text-muted-foreground">6 Markets Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};