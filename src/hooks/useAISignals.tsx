import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface AISignal {
  id: string;
  user_id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  reasoning: string | null;
  key_factors: string[];
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  actual_exit_price: number | null;
  profit_loss_percent: number | null;
  notes: string | null;
  signal_source: 'live' | 'chart_upload';
  created_at: string;
  closed_at: string | null;
  updated_at: string;
}

export interface SignalStats {
  totalSignals: number;
  pendingSignals: number;
  wonSignals: number;
  lostSignals: number;
  cancelledSignals: number;
  winRate: number;
  avgProfitPercent: number;
  avgLossPercent: number;
  profitFactor: number;
}

export const useAISignals = () => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const calculateStats = useCallback((signalList: AISignal[]): SignalStats => {
    const total = signalList.length;
    const pending = signalList.filter(s => s.status === 'pending').length;
    const won = signalList.filter(s => s.status === 'won').length;
    const lost = signalList.filter(s => s.status === 'lost').length;
    const cancelled = signalList.filter(s => s.status === 'cancelled').length;
    
    const closedSignals = signalList.filter(s => s.status === 'won' || s.status === 'lost');
    const winRate = closedSignals.length > 0 ? (won / closedSignals.length) * 100 : 0;
    
    const wonSignals = signalList.filter(s => s.status === 'won' && s.profit_loss_percent !== null);
    const lostSignals = signalList.filter(s => s.status === 'lost' && s.profit_loss_percent !== null);
    
    const avgProfitPercent = wonSignals.length > 0 
      ? wonSignals.reduce((sum, s) => sum + (s.profit_loss_percent || 0), 0) / wonSignals.length 
      : 0;
    
    const avgLossPercent = lostSignals.length > 0 
      ? Math.abs(lostSignals.reduce((sum, s) => sum + (s.profit_loss_percent || 0), 0) / lostSignals.length)
      : 0;
    
    const totalProfit = wonSignals.reduce((sum, s) => sum + (s.profit_loss_percent || 0), 0);
    const totalLoss = Math.abs(lostSignals.reduce((sum, s) => sum + (s.profit_loss_percent || 0), 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    
    return {
      totalSignals: total,
      pendingSignals: pending,
      wonSignals: won,
      lostSignals: lost,
      cancelledSignals: cancelled,
      winRate,
      avgProfitPercent,
      avgLossPercent,
      profitFactor: isFinite(profitFactor) ? profitFactor : 0,
    };
  }, []);

  const fetchSignals = useCallback(async () => {
    if (!user) {
      setSignals([]);
      setStats(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ai_signals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedSignals = (data || []).map(signal => ({
        ...signal,
        key_factors: Array.isArray(signal.key_factors) ? signal.key_factors : [],
      })) as AISignal[];

      setSignals(typedSignals);
      setStats(calculateStats(typedSignals));
    } catch (error) {
      console.error('Error fetching signals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trade journal',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, calculateStats, toast]);

  const saveSignal = async (signal: Omit<AISignal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'closed_at' | 'actual_exit_price' | 'profit_loss_percent' | 'notes' | 'status'>) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save signals to your journal',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('ai_signals')
        .insert({
          user_id: user.id,
          symbol: signal.symbol,
          direction: signal.direction,
          entry_price: signal.entry_price,
          target_price: signal.target_price,
          stop_loss: signal.stop_loss,
          confidence: signal.confidence,
          risk_level: signal.risk_level,
          timeframe: signal.timeframe,
          reasoning: signal.reasoning,
          key_factors: signal.key_factors,
          signal_source: signal.signal_source,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Signal saved',
        description: 'Trade signal added to your journal',
      });

      await fetchSignals();
      return data;
    } catch (error) {
      console.error('Error saving signal:', error);
      toast({
        title: 'Error',
        description: 'Failed to save signal',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSignalOutcome = async (
    signalId: string, 
    status: 'won' | 'lost' | 'cancelled',
    actualExitPrice?: number,
    notes?: string
  ) => {
    if (!user) return false;

    try {
      const signal = signals.find(s => s.id === signalId);
      if (!signal) throw new Error('Signal not found');

      let profitLossPercent: number | null = null;
      if (actualExitPrice && status !== 'cancelled') {
        if (signal.direction === 'LONG') {
          profitLossPercent = ((actualExitPrice - signal.entry_price) / signal.entry_price) * 100;
        } else {
          profitLossPercent = ((signal.entry_price - actualExitPrice) / signal.entry_price) * 100;
        }
      }

      const { error } = await supabase
        .from('ai_signals')
        .update({
          status,
          actual_exit_price: actualExitPrice || null,
          profit_loss_percent: profitLossPercent,
          notes: notes || null,
          closed_at: new Date().toISOString(),
        })
        .eq('id', signalId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Signal updated',
        description: `Trade marked as ${status}`,
      });

      await fetchSignals();
      return true;
    } catch (error) {
      console.error('Error updating signal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update signal',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSignal = async (signalId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ai_signals')
        .delete()
        .eq('id', signalId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Signal deleted',
        description: 'Trade signal removed from journal',
      });

      await fetchSignals();
      return true;
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete signal',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return {
    signals,
    stats,
    isLoading,
    saveSignal,
    updateSignalOutcome,
    deleteSignal,
    refetch: fetchSignals,
  };
};
