import { useRealTimeData } from "@/hooks/useRealTimeData";
import { FutureCard } from "@/components/FutureCard";
import { MarketHeader } from "@/components/MarketHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";

const Index = () => {
  const { futures, isConnected } = useRealTimeData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <MarketHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Connection Status */}
        <Alert className={`mb-6 ${isConnected ? 'border-bullish/20 bg-bullish/5' : 'border-destructive/20 bg-destructive/5'}`}>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-bullish" /> : <WifiOff className="w-4 h-4 text-destructive" />}
            <AlertDescription className={isConnected ? 'text-bullish' : 'text-destructive'}>
              {isConnected ? 'Connected to real-time market data' : 'Disconnected from market data'}
            </AlertDescription>
          </div>
        </Alert>

        {/* Futures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futures.map((future) => (
            <FutureCard key={future.symbol} contract={future} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Predictions powered by AI analysis of price action, volume patterns, and market momentum
          </p>
          <p className="mt-1">
            Data updates every 3 seconds • Last update: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
