import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BrokerageAccount {
  id: string;
  user_id: string;
  broker_name: string;
  username: string;
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
    username: string;
    password: string;
    api_key?: string;
    secret_key?: string;
  }) => {
    if (!user) return null;

    try {
      // First, test the connection using the brokerage connector
      const { data: connectionResult, error: connectionError } = await supabase.functions.invoke('brokerage-connector', {
        body: {
          action: 'connect',
          credentials: {
            broker_name: accountData.broker_name,
            username: accountData.username,
            password: accountData.password,
            api_key: accountData.api_key,
            secret_key: accountData.secret_key
          }
        }
      });

      if (connectionError || !connectionResult?.success) {
        throw new Error(connectionResult?.error || 'Failed to connect to brokerage account');
      }

      // If connection is successful, store the account
      const { data, error: createError } = await supabase
        .from('brokerage_accounts')
        .insert({
          user_id: user.id,
          broker_name: accountData.broker_name,
          username: accountData.username,
          account_id: accountData.username, // Use username as account_id for now
          password_encrypted: accountData.password, // In real app, this should be encrypted
          api_key_encrypted: accountData.api_key, // In real app, this should be encrypted
          last_sync_at: new Date().toISOString(),
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
      // Call the brokerage connector to sync real data
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('brokerage-connector', {
        body: {
          action: 'sync',
          account_id: accountId
        }
      });

      if (syncError || !syncResult?.success) {
        throw new Error(syncResult?.error || 'Failed to sync account data');
      }

      // Update the last_sync_at timestamp
      const { error: updateError } = await supabase
        .from('brokerage_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', user?.id);

      if (updateError) {
        throw updateError;
      }

      await fetchAccounts();
      return syncResult;
    } catch (err) {
      console.error('Error syncing account:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync account');
      return null;
    }
  };

  const removeAccount = async (accountId: string) => {
    if (!user) return false;

    try {
      const { error: deleteError } = await supabase
        .from('brokerage_accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setAccounts(prev => prev.filter(account => account.id !== accountId));
      return true;
    } catch (err) {
      console.error('Error removing brokerage account:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove account');
      return false;
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
    removeAccount,
    refetch: fetchAccounts,
  };
};