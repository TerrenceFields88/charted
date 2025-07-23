import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BrokerageAccount {
  id: string;
  user_id: string;
  broker_name: string;
  account_id: string;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useBrokerageAccount = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('brokerage_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching brokerage accounts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (accountData: {
    broker_name: string;
    account_id: string;
    username: string;
    password: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error: createError } = await supabase
        .from('brokerage_accounts')
        .insert({
          user_id: user.id,
          broker_name: accountData.broker_name,
          account_id: accountData.account_id,
          username: accountData.username,
          password_encrypted: accountData.password, // In real app, this should be encrypted
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setAccounts(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating brokerage account:', err);
      setError(err instanceof Error ? err.message : 'Failed to add account');
      return null;
    }
  };

  const syncAccount = async (accountId: string) => {
    try {
      // In a real implementation, this would call the brokerage API
      // For now, just update the last_sync_at timestamp
      const { error: updateError } = await supabase
        .from('brokerage_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', user?.id);

      if (updateError) {
        throw updateError;
      }

      await fetchAccounts();
    } catch (err) {
      console.error('Error syncing account:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync account');
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    syncAccount,
    refetch: fetchAccounts,
  };
};