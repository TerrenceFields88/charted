import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBrokerageAccount } from '@/hooks/useBrokerageAccount';
import BrokerageAPIService, { BrokerageAccountData, Position, Trade, PerformanceMetrics } from '@/services/BrokerageAPIService';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeBrokerageData = () => {
  const { user } = useAuth();
  const { accounts } = useBrokerageAccount();
  const [accountsData, setAccountsData] = useState<{ [accountId: string]: BrokerageAccountData }>({});
  const [aggregatedData, setAggregatedData] = useState<{
    totalBalance: number;
    totalEquity: number;
    totalPnL: number;
    allPositions: Position[];
    recentTrades: Trade[];
    performanceMetrics: PerformanceMetrics | null;
  }>({
    totalBalance: 0,
    totalEquity: 0,
    totalPnL: 0,
    allPositions: [],
    recentTrades: [],
    performanceMetrics: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const brokerageService = BrokerageAPIService.getInstance();

  const syncAllAccounts = useCallback(async () => {
    if (!user || accounts.length === 0) {
      setAccountsData({});
      setAggregatedData({
        totalBalance: 0,
        totalEquity: 0,
        totalPnL: 0,
        allPositions: [],
        recentTrades: [],
        performanceMetrics: null
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const accountDataPromises = accounts.map(async (account) => {
        const result = await brokerageService.syncAccountData(account.id);
        return { accountId: account.id, ...result };
      });

      const results = await Promise.all(accountDataPromises);
      const newAccountsData: { [accountId: string]: BrokerageAccountData } = {};
      
      let totalBalance = 0;
      let totalEquity = 0;
      let totalPnL = 0;
      const allPositions: Position[] = [];
      const allTrades: Trade[] = [];

      results.forEach(result => {
        if (result.success && result.data) {
          newAccountsData[result.accountId] = result.data;
          totalBalance += result.data.balance || 0;
          totalEquity += result.data.equity || 0;
          totalPnL += result.data.performance_metrics?.daily_pnl || 0;
          allPositions.push(...(result.data.positions || []));
          allTrades.push(...(result.data.recent_trades || []));
        }
      });

      // Sort trades by timestamp (most recent first)
      allTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Calculate aggregated performance metrics
      const aggregatedPerformance: PerformanceMetrics = {
        total_pnl: totalPnL,
        daily_pnl: totalPnL,
        weekly_pnl: allTrades
          .filter(trade => {
            const tradeDate = new Date(trade.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return tradeDate >= weekAgo;
          })
          .reduce((sum, trade) => sum + (trade.pnl || 0), 0),
        monthly_pnl: allTrades
          .filter(trade => {
            const tradeDate = new Date(trade.timestamp);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return tradeDate >= monthAgo;
          })
          .reduce((sum, trade) => sum + (trade.pnl || 0), 0),
        win_rate: allTrades.length > 0 
          ? (allTrades.filter(trade => (trade.pnl || 0) > 0).length / allTrades.length) * 100 
          : 0,
        profit_factor: 0, // Calculate based on winning vs losing trades
        sharpe_ratio: 0, // Calculate based on returns and volatility
        max_drawdown: 0, // Calculate based on equity curve
      };

      setAccountsData(newAccountsData);
      setAggregatedData({
        totalBalance,
        totalEquity,
        totalPnL,
        allPositions,
        recentTrades: allTrades.slice(0, 20),
        performanceMetrics: aggregatedPerformance
      });

      setLastUpdate(new Date());

      // Update the profile with latest trading data
      await updateProfileTradingData({
        totalBalance,
        totalEquity,
        totalPnL,
        winRate: aggregatedPerformance.win_rate,
        totalTrades: allTrades.length
      });

    } catch (err) {
      console.error('Error syncing brokerage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync brokerage data');
    } finally {
      setLoading(false);
    }
  }, [user, accounts]);

  const updateProfileTradingData = async (data: {
    totalBalance: number;
    totalEquity: number;
    totalPnL: number;
    winRate: number;
    totalTrades: number;
  }) => {
    if (!user) return;

    try {
      // Update trading performance in the database
      await supabase.rpc('calculate_trading_performance', {
        p_user_id: user.id
      });

      // Update profile with real-time trading data
      const { error } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile trading data:', error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getAccountData = (accountId: string): BrokerageAccountData | null => {
    return accountsData[accountId] || null;
  };

  const refreshAccount = async (accountId: string) => {
    const result = await brokerageService.syncAccountData(accountId);
    if (result.success && result.data) {
      setAccountsData(prev => ({
        ...prev,
        [accountId]: result.data!
      }));
    }
    return result;
  };

  // Set up real-time updates every 30 seconds for active accounts
  useEffect(() => {
    if (accounts.length === 0) return;

    // Initial sync
    syncAllAccounts();

    // Set up periodic sync
    const interval = setInterval(syncAllAccounts, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [syncAllAccounts, accounts]);

  // Set up real-time subscription for account changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`brokerage-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brokerage_accounts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Brokerage account changed:', payload);
          // Trigger a fresh sync when accounts change
          setTimeout(syncAllAccounts, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, syncAllAccounts]);

  return {
    accountsData,
    aggregatedData,
    loading,
    error,
    lastUpdate,
    syncAllAccounts,
    getAccountData,
    refreshAccount,
    hasConnectedAccounts: accounts.length > 0
  };
};