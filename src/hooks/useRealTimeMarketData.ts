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
        console.error('Supabase error:', supabaseError);
        setError(supabaseError.message);
        return;
      }
      
      if (data?.success && data?.data) {
        setMarketData(data.data);
        setLastUpdated(new Date());
        setError(null);
        console.log(`Updated ${data.data.length} market quotes`);
      } else {
        console.error('Invalid market data response:', data);
        setError('Invalid market data response');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
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