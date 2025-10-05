import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeBrokerageData } from '@/hooks/useRealTimeBrokerageData';
import { useTradingPerformance } from '@/hooks/useTradingPerformance';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const PortfolioSection = () => {
  const { aggregatedData, hasConnectedAccounts, loading } = useRealTimeBrokerageData();
  const { recentTrades } = useTradingPerformance();
  const navigate = useNavigate();

  if (!hasConnectedAccounts) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Brokerage</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View your live portfolio and track real-time performance
            </p>
            <Button onClick={() => navigate('/edit-profile')}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = aggregatedData.totalEquity || 0;
  const totalPnL = aggregatedData.totalPnL || 0;
  const pnlPercentage = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;
  const isPositive = totalPnL >= 0;

  return (
    <div className="space-y-4">
      {/* Portfolio Value Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Portfolio Value
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">
                {isPositive ? '+' : ''}{totalPnL.toFixed(2)}
              </span>
              <span className="text-sm">
                ({isPositive ? '+' : ''}{pnlPercentage.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Total Balance</div>
              <div className="text-lg font-semibold">
                ${aggregatedData.totalBalance?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Positions</div>
              <div className="text-lg font-semibold">
                {aggregatedData.allPositions?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {aggregatedData.performanceMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
                <div className="text-lg font-semibold text-bullish">
                  {aggregatedData.performanceMetrics.win_rate.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Profit Factor</div>
                <div className="text-lg font-semibold">
                  {aggregatedData.performanceMetrics.profit_factor.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                <div className="text-lg font-semibold text-bullish">
                  {aggregatedData.performanceMetrics.sharpe_ratio.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Max Drawdown</div>
                <div className="text-lg font-semibold text-bearish">
                  {aggregatedData.performanceMetrics.max_drawdown.toFixed(2)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Positions */}
      {aggregatedData.allPositions && aggregatedData.allPositions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Positions ({aggregatedData.allPositions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregatedData.allPositions.slice(0, 5).map((position, index) => {
                const positionPnL = position.unrealized_pnl || 0;
                const isPositionPositive = positionPnL >= 0;
                
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold">{position.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {position.quantity} @ ${position.entry_price?.toFixed(2)}
                      </div>
                    </div>
                    <div className={`text-right ${isPositionPositive ? 'text-bullish' : 'text-bearish'}`}>
                      <div className="font-semibold">
                        {isPositionPositive ? '+' : ''}${Math.abs(positionPnL).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
