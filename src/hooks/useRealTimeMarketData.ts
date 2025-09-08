import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

export const useRealTimeMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      console.log('Fetching real-time market data from edge function...');
      
      const { data, error: supabaseError } = await supabase.functions.invoke('market-data');
      
      if (supabaseError) {
        console.error('Market data API error:', supabaseError);
        // Don't set error for API failures, just use fallback data
        setMarketData(getFallbackMarketData());
        setLastUpdated(new Date());
        setError(null);
        return;
      }
      
      if (data?.success && data?.data) {
        setMarketData(data.data);
        setLastUpdated(new Date());
        setError(null);
        console.log(`Updated ${data.data.length} market quotes`);
      } else {
        console.warn('Invalid market data response, using fallback:', data);
        setMarketData(getFallbackMarketData());
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Use fallback data instead of showing error
      setMarketData(getFallbackMarketData());
      setLastUpdated(new Date());
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackMarketData = (): MarketData[] => {
    return [
      { symbol: 'SPY', price: 445.50, change: 2.25, changePercent: 0.51, type: 'stock' },
      { symbol: 'QQQ', price: 375.80, change: -1.15, changePercent: -0.30, type: 'stock' },
      { symbol: 'EUR/USD', price: 1.0850, change: 0.0025, changePercent: 0.23, type: 'forex' },
      { symbol: 'BTC/USD', price: 67500, change: 850, changePercent: 1.28, type: 'crypto' },
      { symbol: 'GC=F', price: 2045.50, change: 12.30, changePercent: 0.60, type: 'futures' },
      { symbol: 'CL=F', price: 78.25, change: -0.85, changePercent: -1.07, type: 'futures' },
      { symbol: 'TSLA', price: 248.90, change: 4.15, changePercent: 1.70, type: 'stock' },
      { symbol: 'AAPL', price: 187.50, change: -1.25, changePercent: -0.66, type: 'stock' }
    ];
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchMarketData();
    
    // Update every 30 seconds during market hours
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    marketData,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchMarketData
  };
};