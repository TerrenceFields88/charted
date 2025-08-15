import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TradingPerformance {
  id: string;
  user_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  portfolio_value: number | null;
  portfolio_return_percentage: number;
  win_rate_percentage: number;
  risk_reward_ratio: number;
  last_calculated_at: string;
}

interface Trade {
  id: string;
  user_id: string;
  brokerage_account_id: string | null;
  symbol: string;
  trade_type: string;
  quantity: number;
  price: number;
  trade_value: number;
  profit_loss: number | null;
  is_profitable: boolean | null;
  executed_at: string;
  created_at: string;
  updated_at: string;
}

export const useTradingPerformance = () => {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<TradingPerformance | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    if (!user) {
      setPerformance(null);
      setRecentTrades([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch trading performance
      const { data: performanceData, error: performanceError } = await supabase
        .from('trading_performance')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (performanceError) {
        throw performanceError;
      }

      setPerformance(performanceData);

      // Fetch recent trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (tradesError) {
        throw tradesError;
      }

      setRecentTrades(tradesData || []);
    } catch (err) {
      console.warn('Error fetching trading performance (non-critical):', err);
      // Don't throw - set default values to prevent app crash
      setPerformance(null);
      setRecentTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const addTrade = async (tradeData: {
    symbol: string;
    trade_type: 'buy' | 'sell';
    quantity: number;
    price: number;
    executed_at?: string;
    profit_loss?: number;
  }) => {
    if (!user) return null;

    try {
      const trade_value = tradeData.quantity * tradeData.price;
      const is_profitable = tradeData.profit_loss ? tradeData.profit_loss > 0 : null;

      const { data, error: createError } = await supabase
        .from('trades')
        .insert({
          user_id: user.id,
          symbol: tradeData.symbol,
          trade_type: tradeData.trade_type,
          quantity: tradeData.quantity,
          price: tradeData.price,
          trade_value,
          profit_loss: tradeData.profit_loss || null,
          is_profitable,
          executed_at: tradeData.executed_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Recalculate performance
      await calculatePerformance();
      await fetchPerformance();

      return data;
    } catch (err) {
      console.error('Error adding trade:', err);
      setError(err instanceof Error ? err.message : 'Failed to add trade');
      return null;
    }
  };

  const calculatePerformance = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('calculate_trading_performance', {
        p_user_id: user.id
      });

      if (error) {
        console.warn('Database function error (non-critical):', error);
        // Don't throw - just log the error and continue
        return;
      }
    } catch (err) {
      console.warn('Error calculating performance (non-critical):', err);
      // Don't throw - just log the error to prevent app crash
    }
  };

  const getFormattedPerformance = () => {
    if (!performance) {
      return {
        portfolioReturn: '+0.00%',
        winRate: '0%',
        winningTrades: 0,
        losingTrades: 0,
        riskRewardRatio: '0:1',
        totalTrades: 0,
      };
    }

    const portfolioReturn = performance.portfolio_return_percentage >= 0 
      ? `+${performance.portfolio_return_percentage.toFixed(2)}%`
      : `${performance.portfolio_return_percentage.toFixed(2)}%`;

    return {
      portfolioReturn,
      winRate: `${performance.win_rate_percentage.toFixed(0)}%`,
      winningTrades: performance.winning_trades,
      losingTrades: performance.losing_trades,
      riskRewardRatio: `${performance.risk_reward_ratio.toFixed(1)}:1`,
      totalTrades: performance.total_trades,
    };
  };

  useEffect(() => {
    fetchPerformance();
  }, [user]);

  return {
    performance,
    recentTrades,
    loading,
    error,
    fetchPerformance,
    addTrade,
    calculatePerformance,
    getFormattedPerformance,
    refetch: fetchPerformance,
  };
};