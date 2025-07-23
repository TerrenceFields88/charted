import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { BrokerageConnectionDialog } from '@/components/BrokerageConnectionDialog';

export const MarketsPage = () => {
  const { futures, isConnected, error } = useRealTimeData();

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Markets</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-4">
            <div>
              <p className="font-medium mb-2">No Market Data Available</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your brokerage or prop firm account to access real-time market data and trading insights.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <BrokerageConnectionDialog />
              <div className="text-xs text-muted-foreground">
                <p>• Real-time market data from your broker</p>
                <p>• Live portfolio tracking</p>
                <p>• Professional trading tools</p>
                <p>• No mock data - only real trading information</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Card className="mt-6">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Real Trading Data Only</h3>
              <p className="text-muted-foreground text-sm mb-4">
                This platform only displays real trading data from your connected accounts. 
                No simulated or mock data is shown to ensure authentic trading insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};