import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, BarChart3, PieChart, Loader2 } from 'lucide-react';

export const InvestingAnalysisPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Technical Analysis</h1>
          <p className="text-muted-foreground">Real-time market analysis from Investing.com</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Live
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-1">
            <PieChart className="w-4 h-4" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Technical
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <iframe
                  src="https://www.investing.com/technical-analysis/market-overview"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  onLoad={handleIframeLoad}
                  className="w-full"
                  title="Market Overview"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Heatmap</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <iframe
                  src="https://www.investing.com/markets/stock-market-movers"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  onLoad={handleIframeLoad}
                  className="w-full"
                  title="Market Heatmap"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <iframe
                  src="https://www.investing.com/technical-analysis"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  onLoad={handleIframeLoad}
                  className="w-full"
                  title="Technical Analysis"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <iframe
                  src="https://www.investing.com/technical-analysis/most-active-stocks"
                  width="100%"
                  height="600"
                  frameBorder="0"
                  onLoad={handleIframeLoad}
                  className="w-full"
                  title="Technical Indicators"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};